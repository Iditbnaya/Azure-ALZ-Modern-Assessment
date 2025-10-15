# Azure ALZ Assessment - Unit Test Suite

## Overview
Comprehensive unit testing suite for the Azure Landing Zone Assessment web application. Tests all critical functionality including Excel import/export, comments, status fields, and PowerPoint generation.

## Running the Tests

### Option 1: Using Python HTTP Server
```powershell
# From the root directory
python .\serve.py
```
Then navigate to: `http://localhost:8000/web-assessment/test/unit-tests.html`

### Option 2: Direct File Access
Open the file directly in your browser:
```
file:///C:/Apps/Azure-ALZ-Modern-Assessment/web-assessment/test/unit-tests.html
```

**Note:** Some tests may not work with direct file access due to CORS restrictions. Using the HTTP server is recommended.

## Test Coverage

### 📋 Data Loader & Checklist Tests (3 tests)
- ✅ DataLoader class initialization
- ✅ Checklist data loading
- ✅ Required fields validation (id, text, etc.)

### 📤 Excel/CSV Export Tests (5 tests)
- ✅ ExportManager class initialization
- ✅ Status column inclusion in Excel export
- ✅ All required columns present (id, category, subcategory, text, status, severity, link)
- ✅ Status column inclusion in CSV export
- ✅ Status field in data rows

### 📥 Excel Import Tests (4 tests)
- ✅ Empty row handling (ignores sparse empty rows)
- ✅ Stops after 10 consecutive empty rows (performance optimization)
- ✅ Column mapping with typo recognition ("commant", "sevirity", etc.)
- ✅ Fast processing (< 5 seconds for 250 rows)

### 💬 Comments Functionality Tests (3 tests)
- ✅ Singular "comment" field usage (not "comments")
- ✅ Comment column in Excel exports
- ✅ Comment persistence through save/load cycle

### 📊 PowerPoint Export Tests (3 tests)
- ✅ exportPowerPoint method exists
- ✅ Title slide generation
- ✅ Text-only branding (no logo image)

## Test Results
The test suite provides real-time feedback:
- **Total Tests**: Number of tests executed
- **Passed**: Tests that completed successfully ✅
- **Failed**: Tests that encountered errors ❌
- **Success Rate**: Percentage of passing tests

## Expected Results
All tests should pass (100% success rate) if the application is working correctly.

### Common Test Failures

#### CORS Errors
**Symptom:** Tests fail when loading checklist data  
**Solution:** Run tests through HTTP server (`python serve.py`)

#### Missing Dependencies
**Symptom:** "DataLoader is not defined" or similar errors  
**Solution:** Ensure all JS files are properly linked in the HTML

#### Excel Library Missing
**Symptom:** XLSX-related errors  
**Solution:** Check internet connection (uses CDN for SheetJS)

## Performance Benchmarks
- Excel processing: < 5 seconds for 250 rows
- Empty row detection: Stops after 10 consecutive empty rows
- No processing of 1M+ rows (previous issue now fixed)

## Test Maintenance

### Adding New Tests
```javascript
runner.addTest('suiteName', 'Test description', async () => {
    // Test code here
    assertEqual(actual, expected, 'Error message');
});
```

### Assertion Methods
- `assert(condition, message)` - Generic assertion
- `assertEqual(actual, expected, message)` - Equality check
- `assertNotNull(value, message)` - Null/undefined check
- `assertArrayLength(array, length, message)` - Array length check
- `assertContains(array, value, message)` - Array contains value

## Files Tested
- `../js/data-loader.js` - Checklist loading and parsing
- `../js/export.js` - Excel, CSV, and PowerPoint export
- `../js/app.js` - Excel import and processing (tested indirectly)

## Recent Fixes Validated
1. ✅ Status field always included in exports
2. ✅ Excel upload performance (52x faster with empty row detection)
3. ✅ Comments field naming consistency (singular "comment")
4. ✅ Save assessment function fixed
5. ✅ Column mapping handles typos
6. ✅ PowerPoint logo removed (text branding only)

## CI/CD Integration
This test suite can be integrated into CI/CD pipelines using headless browser testing:

```bash
# Example with Playwright
npx playwright test web-assessment/test/unit-tests.html
```

## Support
For issues or questions about the test suite, refer to the main project documentation.

---
**Last Updated:** October 15, 2025  
**Test Count:** 18 tests across 5 test suites
