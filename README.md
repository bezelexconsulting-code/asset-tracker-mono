# Asset Tracker with NFC Integration

A comprehensive asset management system with NFC (Near Field Communication) capabilities for seamless asset identification and tracking. Built with React, TypeScript, Supabase, and modern web technologies.

## 🚀 Features

### Core Asset Management
- **Asset Lifecycle Management**: Create, update, track, and retire assets
- **Multi-tenant Architecture**: Organization-based data isolation with subdomains
- **Role-Based Access Control**: Granular permissions system with customizable roles
- **Check-in/Check-out System**: Track asset movements with digital signatures
- **Location Tracking**: Hierarchical location management for precise asset placement
- **Category Management**: Organize assets with custom categories and fields

### NFC Integration
- **Web NFC API**: Modern browser-based NFC scanning and programming
- **Asset Identification**: Scan NFC tags to instantly identify assets
- **Tag Programming**: Write asset information directly to NFC tags
- **Data Integrity**: Checksum validation and encryption support
- **Multiple Tag Types**: Support for NTAG213, NTAG215, NTAG216, and MIFARE tags
- **Fallback Support**: Manual entry when NFC is unavailable

### Advanced Features
- **Real-time Analytics**: Comprehensive reports and dashboards
- **Audit Logging**: Complete activity tracking with advanced filtering
- **Custom Fields**: Organization-specific data fields for assets
- **User Management**: Multi-user system with department hierarchy
- **Notifications**: Email and SMS alerts for asset events
- **API Access**: RESTful API for third-party integrations
- **Mobile Responsive**: Optimized for desktop and mobile devices

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for responsive styling
- **React Hook Form** with Zod validation
- **React Router** for navigation
- **Recharts** for data visualization
- **Lucide React** for icons

### Backend & Database
- **Supabase** (PostgreSQL) for database and authentication
- **Row Level Security** for data protection
- **Real-time subscriptions** for live updates
- **Storage** for file uploads

### NFC Technology
- **Web NFC API** for browser-based NFC operations
- **Data encryption** and integrity validation
- **Cross-browser compatibility** detection
- **Progressive enhancement** with fallbacks

## 📋 Prerequisites

- Node.js 18+ 
- Modern browser with Web NFC support (Chrome/Edge on Android)
- Supabase account and project
- NFC-enabled Android device for testing
- NFC tags (NTAG215 recommended)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd bez-asset-tracker
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup
Run the migration script to set up your database schema:
```bash
npm run db:setup
```

### 5. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🏗️ Architecture

### Database Schema

#### Core Tables
- **organizations**: Multi-tenant organization data
- **users**: User accounts with role-based permissions
- **roles**: Customizable role definitions with permissions
- **departments**: Organizational hierarchy
- **assets**: Asset master data with lifecycle tracking
- **categories**: Asset classification system
- **locations**: Hierarchical location management
- **transactions**: Check-in/check-out history
- **audit_logs**: Complete activity tracking
- **nfc_tags**: NFC tag management and programming
- **custom_fields**: Organization-specific data fields

#### Key Relationships
- Organization-based data isolation with RLS policies
- User-role permissions system
- Asset-location-category associations
- Transaction history with user tracking
- NFC tag-to-asset mapping

### Frontend Architecture

#### Component Structure
```
src/
├── components/          # Reusable UI components
├── contexts/           # React context providers
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
├── pages/              # Route components
├── services/           # Business logic and API calls
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

#### Key Services
- **Auth Service**: Authentication and authorization
- **Asset Service**: Asset management operations
- **NFC Service**: NFC scanning and programming
- **Transaction Service**: Check-in/check-out workflows
- **Audit Service**: Activity logging and reporting

## 📱 NFC Functionality

### Supported Operations
1. **Asset Scanning**: Read asset information from NFC tags
2. **Asset Programming**: Write asset data to NFC tags
3. **Tag Management**: Register, update, and manage NFC tags
4. **Data Validation**: Checksum verification and integrity checks
5. **Security**: Optional encryption for sensitive data

### Browser Compatibility
- **Chrome 89+** on Android (Full support)
- **Edge 89+** on Android (Full support)
- **Opera** on Android (Limited support)
- **Firefox**: No NFC support
- **Safari**: No NFC support

### Tag Requirements
- **NTAG213**: 144 bytes (Basic asset info)
- **NTAG215**: 924 bytes (Recommended for full asset data)
- **NTAG216**: 8KB (For complex data structures)
- **MIFARE Classic**: 1KB (Alternative option)

## 🔧 Configuration

### Environment Variables
```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Custom API endpoints
VITE_API_BASE_URL=your_api_base_url

# Optional: NFC-specific settings
VITE_NFC_ENCRYPTION_KEY=your_encryption_key
VITE_NFC_DATA_FORMAT=json
```

### Organization Settings
Configure organization-specific settings through the Settings page:
- **General**: Organization info, timezone, language
- **Notifications**: Email/SMS alerts and frequency
- **Security**: 2FA, session timeout, password policies
- **Customization**: Custom fields, branding, integrations
- **NFC**: Tag programming options, encryption settings

## 📊 Reports & Analytics

### Available Reports
- **Asset Overview**: Total assets, utilization, status breakdown
- **Transaction History**: Check-in/out trends and patterns
- **User Activity**: Most active users and departments
- **Location Analysis**: Asset distribution by location
- **Category Insights**: Asset breakdown by category
- **Audit Trail**: Complete activity log with filtering

### Export Options
- **CSV Export**: Raw data for spreadsheet analysis
- **PDF Reports**: Formatted reports for presentations
- **API Access**: Programmatic data access
- **Real-time Dashboards**: Live metrics and KPIs

## 🔒 Security Features

### Authentication
- **Supabase Auth**: Secure user authentication
- **Multi-factor Authentication**: Optional 2FA support
- **Session Management**: Configurable timeout policies
- **Password Policies**: Customizable complexity requirements

### Authorization
- **Role-Based Access Control**: Granular permissions
- **Organization Isolation**: Multi-tenant security
- **Row Level Security**: Database-level protection
- **API Rate Limiting**: Prevent abuse

### Data Protection
- **Encryption**: Data encryption at rest and in transit
- **Audit Logging**: Complete activity tracking
- **Data Validation**: Input sanitization and validation
- **Secure File Upload**: Safe file handling and storage

## 🧪 Testing

### Unit Testing
```bash
npm run test
```

### Integration Testing
```bash
npm run test:integration
```

### NFC Testing
See [NFC_TESTING_GUIDE.md](NFC_TESTING_GUIDE.md) for comprehensive NFC testing instructions.

### Browser Testing
Test on multiple browsers and devices:
- Chrome/Edge on Android (NFC support)
- Firefox (No NFC support)
- Safari (No NFC support)
- Mobile responsiveness testing

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
npm run deploy:vercel
```

### Deploy to Netlify
```bash
npm run deploy:netlify
```

### Docker Deployment
```bash
docker build -t asset-tracker .
docker run -p 3000:3000 asset-tracker
```

## 📚 API Documentation

### RESTful Endpoints
- `GET /api/assets` - List assets
- `POST /api/assets` - Create asset
- `GET /api/assets/:id` - Get asset details
- `PUT /api/assets/:id` - Update asset
- `DELETE /api/assets/:id` - Delete asset
- `POST /api/assets/:id/checkout` - Check out asset
- `POST /api/assets/:id/checkin` - Check in asset
- `POST /api/nfc/scan` - Scan NFC tag
- `POST /api/nfc/program` - Program NFC tag

### WebSocket Events
- `asset:created` - New asset created
- `asset:updated` - Asset updated
- `asset:checked_out` - Asset checked out
- `asset:checked_in` - Asset checked in
- `nfc:scanned` - NFC tag scanned

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Code linting with custom rules
- **Prettier**: Code formatting
- **Conventional Commits**: Commit message format

### Testing Requirements
- Unit tests for new features
- Integration tests for API endpoints
- NFC functionality testing
- Cross-browser compatibility testing

## 📞 Support

### Documentation
- [API Documentation](docs/api.md)
- [NFC Testing Guide](NFC_TESTING_GUIDE.md)
- [Deployment Guide](docs/deployment.md)

### Community
- [GitHub Discussions](https://github.com/your-repo/discussions)
- [Issue Tracker](https://github.com/your-repo/issues)

### Commercial Support
For enterprise support and custom development:
- Email: support@yourcompany.com
- Phone: +1-xxx-xxx-xxxx

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** for the excellent backend platform
- **Web NFC Community** for NFC API development
- **Tailwind CSS** for the styling framework
- **React Team** for the amazing frontend library

## 📈 Roadmap

### Upcoming Features
- [ ] **Mobile App**: Native iOS/Android applications
- [ ] **Advanced Analytics**: Machine learning insights
- [ ] **IoT Integration**: Sensor data collection
- [ ] **Blockchain**: Asset provenance tracking
- [ ] **AI Features**: Predictive maintenance
- [ ] **Multi-language**: Internationalization support

### Performance Improvements
- [ ] **Caching**: Redis integration for faster queries
- [ ] **CDN**: Global content delivery
- [ ] **Database Optimization**: Query performance tuning
- [ ] **Lazy Loading**: Component-level code splitting

---

**Built with ❤️ by the Asset Tracker Team**