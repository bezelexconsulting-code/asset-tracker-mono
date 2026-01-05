# NFC Testing Guide

## Overview
This guide provides comprehensive instructions for testing the NFC functionality in the Asset Tracker application.

## Browser Compatibility

### Supported Browsers
- **Chrome/Edge**: Full NFC support (Android only)
- **Opera**: NFC support (Android only)
- **Firefox**: Limited support
- **Safari**: No NFC support

### Platform Requirements
- **Android**: Chrome 89+ with Web NFC API enabled
- **iOS**: No NFC support for web applications
- **Desktop**: No NFC support

## Testing Prerequisites

### 1. Enable Web NFC API
1. Open Chrome/Edge on Android
2. Navigate to `chrome://flags` or `edge://flags`
3. Search for "Web NFC"
4. Enable the flag and restart browser

### 2. HTTPS Requirement
- NFC only works on HTTPS connections
- Use localhost for development (exempt from HTTPS requirement)
- Production deployments must use valid SSL certificates

### 3. NFC Hardware
- Android device with NFC capability
- NFC tags (NTAG215 recommended for optimal performance)
- Test with different tag types: NTAG213, NTAG215, NTAG216

## Test Scenarios

### 1. NFC Tag Scanning

#### Basic Scanning
1. Navigate to NFC Management page
2. Click "Scan NFC Tag" button
3. Hold NFC tag near device
4. Verify tag information displays correctly

#### Asset Association
1. Create test asset in system
2. Navigate to NFC Programming tab
3. Select asset from dropdown
4. Program tag with asset data
5. Scan tag to verify association

#### Error Handling
1. Test with invalid/corrupted tags
2. Test with insufficient tag memory
3. Test with unsupported tag types
4. Verify appropriate error messages display

### 2. NFC Tag Programming

#### Asset Programming
1. Select existing asset
2. Click "Program NFC Tag"
3. Hold tag near device when prompted
4. Verify success message appears
5. Scan programmed tag to confirm data

#### Custom Data Programming
1. Navigate to custom programming section
2. Enter custom JSON data
3. Program tag with custom data
4. Verify data integrity after programming

#### Security Features
1. Test encrypted data programming
2. Verify checksum validation
3. Test data integrity verification
4. Test tamper detection

### 3. Check-in/Check-out with NFC

#### Asset Check-out
1. Navigate to Check-out page
2. Click "Scan NFC Tag" button
3. Hold asset tag near device
4. Verify asset details populate
5. Complete check-out process

#### Asset Check-in
1. Navigate to Check-in page
2. Scan asset tag
3. Verify asset status updates
4. Confirm location and condition tracking

#### Batch Operations
1. Test multiple consecutive scans
2. Verify system handles rapid scanning
3. Test memory management during batch operations

## Test Data

### Sample Asset Data
```json
{
  "asset_id": "550e8400-e29b-41d4-a716-446655440000",
  "asset_tag": "AST-2024-001",
  "name": "Laptop Dell XPS 15",
  "category": "Electronics",
  "location": "Office-101",
  "assigned_to": "John Doe",
  "purchase_date": "2024-01-15",
  "warranty_expiry": "2027-01-15",
  "checksum": "a1b2c3d4e5f6"
}
```

### Sample Custom Data
```json
{
  "custom_field_1": "Custom Value 1",
  "custom_field_2": 12345,
  "metadata": {
    "version": "1.0",
    "last_updated": "2024-01-15T10:30:00Z"
  }
}
```

## Debugging Steps

### 1. Browser Console Errors
Check browser console for:
- Web NFC API errors
- Permission denied messages
- Tag reading errors
- Data parsing errors

### 2. Device Permissions
Verify NFC permissions:
- Check Android Settings > Apps > Chrome > Permissions
- Ensure NFC permission is granted
- Check if NFC is enabled in device settings

### 3. Tag Compatibility
Test with different tag types:
- NTAG213 (144 bytes)
- NTAG215 (924 bytes) - Recommended
- NTAG216 (8KB)
- MIFARE Classic (1KB)

### 4. Network Issues
- Verify HTTPS connection
- Check CORS headers for API calls
- Test with offline/online scenarios

## Performance Testing

### 1. Scan Speed
- Measure time from tag contact to data display
- Test with different tag sizes
- Test with varying data complexity

### 2. Programming Speed
- Measure programming time for different data sizes
- Test with encrypted vs plain data
- Test with different tag types

### 3. Memory Usage
- Monitor memory usage during batch operations
- Test with large datasets
- Verify garbage collection

## Security Testing

### 1. Data Encryption
- Test encrypted data programming
- Verify decryption on scan
- Test with different encryption keys

### 2. Data Integrity
- Test checksum validation
- Test tamper detection
- Verify corruption handling

### 3. Access Control
- Test role-based permissions
- Verify unauthorized access prevention
- Test session management

## Automated Testing

### Unit Tests
```javascript
// Test NFC service functions
describe('NFCService', () => {
  test('should detect NFC support', () => {
    expect(nfcService.isSupported()).toBe(true);
  });

  test('should validate tag data', () => {
    const validData = { asset_id: '123', checksum: 'abc' };
    expect(nfcService.verifyDataIntegrity(validData)).toBe(true);
  });
});
```

### Integration Tests
```javascript
// Test NFC hook functionality
describe('useNFC hook', () => {
  test('should handle scanning errors', async () => {
    const { result } = renderHook(() => useNFC());
    await act(async () => {
      await result.current.scanNFC();
    });
    expect(result.current.error).toBeDefined();
  });
});
```

## Troubleshooting Common Issues

### Issue: "NFC is not supported"
**Solution**: 
- Verify browser is Chrome/Edge on Android
- Check Web NFC flag is enabled
- Ensure HTTPS connection

### Issue: "No NFC tag detected"
**Solution**:
- Ensure NFC is enabled on device
- Check tag is NFC-compatible
- Try different tag orientation
- Verify tag is not damaged

### Issue: "Insufficient memory"
**Solution**:
- Use NTAG215 or larger tags
- Reduce data size
- Use compression if available

### Issue: "Data corruption detected"
**Solution**:
- Re-program the tag
- Check for interference during programming
- Verify tag is not write-protected

## Test Checklist

- [ ] NFC support detection works
- [ ] Tag scanning functions properly
- [ ] Asset association works
- [ ] Custom data programming works
- [ ] Check-in/out with NFC works
- [ ] Error handling displays correctly
- [ ] Security features function
- [ ] Performance meets requirements
- [ ] Browser compatibility verified
- [ ] Mobile device testing completed

## Reporting Issues

When reporting NFC issues, include:
1. Device model and Android version
2. Browser type and version
3. Tag type and size
4. Error messages from console
5. Steps to reproduce
6. Expected vs actual behavior

## Performance Benchmarks

- Tag scan time: < 2 seconds
- Programming time: < 5 seconds
- Data validation: < 1 second
- Error recovery: < 3 seconds
- Memory usage: < 50MB for batch operations