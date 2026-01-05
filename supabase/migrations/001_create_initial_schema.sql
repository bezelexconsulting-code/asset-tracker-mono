-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table with multi-tenant isolation
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role_id UUID NOT NULL,
    department_id UUID,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(org_id, email)
);

-- Roles table with organization-specific permissions
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    permissions JSONB NOT NULL DEFAULT '{}',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(org_id, name)
);

-- Departments table for organizational hierarchy
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    manager_id UUID REFERENCES users(id),
    parent_department_id UUID REFERENCES departments(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assets table with lifecycle tracking
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    asset_tag VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category_id UUID NOT NULL,
    location_id UUID,
    assigned_to_id UUID REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    purchase_price DECIMAL(10,2),
    purchase_date DATE,
    warranty_expiry DATE,
    specifications JSONB DEFAULT '{}',
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(org_id, asset_tag)
);

-- Categories table for asset classification
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    custom_field_schema JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(org_id, name)
);

-- Locations table for hierarchical asset placement
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    parent_location_id UUID REFERENCES locations(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table for check-in/out history
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id),
    user_id UUID NOT NULL REFERENCES users(id),
    assigned_to_id UUID REFERENCES users(id),
    transaction_type VARCHAR(50) NOT NULL,
    location_id UUID REFERENCES locations(id),
    expected_return_date DATE,
    actual_return_date DATE,
    condition VARCHAR(50),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    digital_signature TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table for compliance tracking
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    asset_id UUID REFERENCES assets(id),
    action VARCHAR(100) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NFC tags table for asset tagging
CREATE TABLE nfc_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    tag_id VARCHAR(100) NOT NULL UNIQUE,
    tag_type VARCHAR(50) NOT NULL DEFAULT 'NTAG215',
    tag_data JSONB NOT NULL DEFAULT '{}',
    encryption_key_hash VARCHAR(255),
    last_programmed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    programmed_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(org_id, tag_id)
);

-- Custom fields table for organization-specific data
CREATE TABLE custom_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    field_type VARCHAR(50) NOT NULL,
    validation_rules JSONB DEFAULT '{}',
    is_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(org_id, name)
);

-- Asset custom field values
CREATE TABLE asset_custom_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    custom_field_id UUID NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(asset_id, custom_field_id)
);

-- Row Level Security Policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfc_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_custom_fields ENABLE ROW LEVEL SECURITY;

-- Organization RLS: Users can only see their organization
CREATE POLICY "Users can view their organization" ON organizations
    FOR SELECT USING (id = current_setting('app.current_org_id')::UUID);

-- Users RLS: Users can only see users in their organization
CREATE POLICY "Users can view organization users" ON users
    FOR SELECT USING (org_id = current_setting('app.current_org_id')::UUID);

-- Roles RLS: Users can only see roles in their organization
CREATE POLICY "Users can view organization roles" ON roles
    FOR SELECT USING (org_id = current_setting('app.current_org_id')::UUID);

-- Departments RLS: Users can only see departments in their organization
CREATE POLICY "Users can view organization departments" ON departments
    FOR SELECT USING (org_id = current_setting('app.current_org_id')::UUID);

-- Assets RLS: Role-based asset access
CREATE POLICY "Users can view assigned assets" ON assets
    FOR SELECT USING (
        org_id = current_setting('app.current_org_id')::UUID AND
        (
            assigned_to_id = current_setting('app.current_user_id')::UUID OR
            EXISTS (
                SELECT 1 FROM users u
                WHERE u.id = current_setting('app.current_user_id')::UUID
                AND u.role_id IN (
                    SELECT id FROM roles 
                    WHERE org_id = current_setting('app.current_org_id')::UUID
                    AND permissions->>'view_all_assets' = 'true'
                )
            )
        )
    );

-- Categories RLS: Users can only see categories in their organization
CREATE POLICY "Users can view organization categories" ON categories
    FOR SELECT USING (org_id = current_setting('app.current_org_id')::UUID);

-- Locations RLS: Users can only see locations in their organization
CREATE POLICY "Users can view organization locations" ON locations
    FOR SELECT USING (org_id = current_setting('app.current_org_id')::UUID);

-- Transactions RLS: Users can only see transactions in their organization
CREATE POLICY "Users can view organization transactions" ON transactions
    FOR SELECT USING (org_id = current_setting('app.current_org_id')::UUID);

-- Audit log RLS: Only auditors and admins can view full audit logs
CREATE POLICY "Role-based audit log access" ON audit_logs
    FOR SELECT USING (
        org_id = current_setting('app.current_org_id')::UUID AND
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = current_setting('app.current_user_id')::UUID
            AND u.role_id IN (
                SELECT id FROM roles 
                WHERE org_id = current_setting('app.current_org_id')::UUID
                AND permissions->>'view_audit_logs' = 'true'
            )
        )
    );

-- NFC tags RLS: Users can view NFC tags in their organization
CREATE POLICY "Users can view organization NFC tags" ON nfc_tags
    FOR SELECT USING (org_id = current_setting('app.current_org_id')::UUID);

-- NFC tags RLS: Only admins and managers can program NFC tags
CREATE POLICY "Role-based NFC tag management" ON nfc_tags
    FOR ALL USING (
        org_id = current_setting('app.current_org_id')::UUID AND
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = current_setting('app.current_user_id')::UUID
            AND u.role_id IN (
                SELECT id FROM roles 
                WHERE org_id = current_setting('app.current_org_id')::UUID
                AND (permissions->>'manage_nfc_tags' = 'true' OR permissions->>'edit_all_assets' = 'true')
            )
        )
    );

-- Custom fields RLS: Users can only see custom fields in their organization
CREATE POLICY "Users can view organization custom fields" ON custom_fields
    FOR SELECT USING (org_id = current_setting('app.current_org_id')::UUID);

-- Asset custom fields RLS: Users can only see custom field values for their organization's assets
CREATE POLICY "Users can view organization asset custom fields" ON asset_custom_fields
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM assets a
            WHERE a.id = asset_custom_fields.asset_id
            AND a.org_id = current_setting('app.current_org_id')::UUID
        )
    );

-- Grant permissions
GRANT SELECT ON organizations TO anon;
GRANT ALL ON organizations TO authenticated;
GRANT SELECT ON users TO anon;
GRANT ALL ON users TO authenticated;
GRANT SELECT ON roles TO anon;
GRANT ALL ON roles TO authenticated;
GRANT SELECT ON departments TO anon;
GRANT ALL ON departments TO authenticated;
GRANT SELECT ON assets TO anon;
GRANT ALL ON assets TO authenticated;
GRANT SELECT ON categories TO anon;
GRANT ALL ON categories TO authenticated;
GRANT SELECT ON locations TO anon;
GRANT ALL ON locations TO authenticated;
GRANT SELECT ON transactions TO anon;
GRANT ALL ON transactions TO authenticated;
GRANT SELECT ON audit_logs TO anon;
GRANT ALL ON audit_logs TO authenticated;
GRANT SELECT ON nfc_tags TO anon;
GRANT ALL ON nfc_tags TO authenticated;
GRANT SELECT ON custom_fields TO anon;
GRANT ALL ON custom_fields TO authenticated;
GRANT SELECT ON asset_custom_fields TO anon;
GRANT ALL ON asset_custom_fields TO authenticated;

-- Create indexes for performance
CREATE INDEX idx_users_org_id ON users(org_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_roles_org_id ON roles(org_id);
CREATE INDEX idx_departments_org_id ON departments(org_id);
CREATE INDEX idx_assets_org_id ON assets(org_id);
CREATE INDEX idx_assets_tag ON assets(org_id, asset_tag);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_assigned_to ON assets(assigned_to_id);
CREATE INDEX idx_categories_org_id ON categories(org_id);
CREATE INDEX idx_locations_org_id ON locations(org_id);
CREATE INDEX idx_transactions_org_id ON transactions(org_id);
CREATE INDEX idx_transactions_asset_id ON transactions(asset_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_audit_logs_org_id ON audit_logs(org_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_nfc_tags_org_id ON nfc_tags(org_id);
CREATE INDEX idx_nfc_tags_asset_id ON nfc_tags(asset_id);
CREATE INDEX idx_nfc_tags_tag_id ON nfc_tags(tag_id);
CREATE INDEX idx_custom_fields_org_id ON custom_fields(org_id);
CREATE INDEX idx_asset_custom_fields_asset_id ON asset_custom_fields(asset_id);
CREATE INDEX idx_asset_custom_fields_custom_field_id ON asset_custom_fields(custom_field_id);

-- Create function for NFC statistics
CREATE OR REPLACE FUNCTION get_nfc_stats(org_id_param UUID)
RETURNS TABLE (
  total_tags BIGINT,
  active_tags BIGINT,
  tags_with_assets BIGINT,
  recently_programmed BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_tags,
    COUNT(*) FILTER (WHERE is_active = true) AS active_tags,
    COUNT(*) FILTER (WHERE asset_id IS NOT NULL) AS tags_with_assets,
    COUNT(*) FILTER (WHERE last_programmed > NOW() - INTERVAL '30 days') AS recently_programmed
  FROM nfc_tags
  WHERE org_id = org_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for asset statistics
CREATE OR REPLACE FUNCTION get_asset_stats(org_id_param UUID)
RETURNS TABLE (
  total_assets BIGINT,
  checked_out_assets BIGINT,
  overdue_assets BIGINT,
  maintenance_assets BIGINT,
  active_assets BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_assets,
    COUNT(*) FILTER (WHERE status = 'checked_out') AS checked_out_assets,
    COUNT(*) FILTER (WHERE status = 'overdue') AS overdue_assets,
    COUNT(*) FILTER (WHERE status = 'maintenance') AS maintenance_assets,
    COUNT(*) FILTER (WHERE status = 'active') AS active_assets
  FROM assets
  WHERE org_id = org_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default roles for system initialization
INSERT INTO roles (org_id, name, permissions, description) VALUES
('00000000-0000-0000-0000-000000000000', 'Super Admin', '{"view_all_assets": true, "edit_all_assets": true, "delete_assets": true, "view_all_users": true, "manage_users": true, "view_audit_logs": true, "manage_organization": true, "manage_nfc_tags": true, "program_nfc_tags": true}', 'Full system access'),
('00000000-0000-0000-0000-000000000000', 'Organization Admin', '{"view_all_assets": true, "edit_all_assets": true, "delete_assets": true, "view_all_users": true, "manage_users": true, "view_audit_logs": true, "manage_organization": true, "manage_nfc_tags": true, "program_nfc_tags": true}', 'Organization management access'),
('00000000-0000-0000-0000-000000000000', 'Manager', '{"view_all_assets": true, "edit_all_assets": true, "view_all_users": true, "manage_department_users": true, "view_audit_logs": true, "manage_nfc_tags": true, "program_nfc_tags": true}', 'Department management access'),
('00000000-0000-0000-0000-000000000000', 'Standard User', '{"view_assigned_assets": true, "request_assets": true, "update_asset_status": true, "scan_nfc_tags": true}', 'Basic asset access'),
('00000000-0000-0000-0000-000000000000', 'Auditor', '{"view_all_assets": true, "view_audit_logs": true, "generate_reports": true, "view_nfc_tags": true}', 'Read-only audit access');

-- Insert default categories
INSERT INTO categories (org_id, name, description, custom_field_schema) VALUES
('00000000-0000-0000-0000-000000000000', 'IT Equipment', 'Computers, laptops, tablets, and peripherals', '[]'),
('00000000-0000-0000-0000-000000000000', 'Office Equipment', 'Printers, scanners, phones, and office supplies', '[]'),
('00000000-0000-0000-0000-000000000000', 'Tools', 'Hand tools, power tools, and equipment', '[]'),
('00000000-0000-0000-0000-000000000000', 'Vehicles', 'Company cars, trucks, and fleet vehicles', '[]'),
('00000000-0000-0000-0000-000000000000', 'Furniture', 'Desks, chairs, tables, and storage units', '[]'),
('00000000-0000-0000-0000-000000000000', 'Safety Equipment', 'Safety gear, PPE, and emergency equipment', '[]');

-- Insert default locations
INSERT INTO locations (org_id, name, address, is_active) VALUES
('00000000-0000-0000-0000-000000000000', 'Main Office', '123 Business St, City, State 12345', true),
('00000000-0000-0000-0000-000000000000', 'Warehouse', '456 Industrial Ave, City, State 12345', true),
('00000000-0000-0000-0000-000000000000', 'Remote/Field', 'Various field locations', true);