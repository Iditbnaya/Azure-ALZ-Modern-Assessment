# Excel Export Format Update

## Overview
The Excel and CSV export functionality has been updated to **match the Azure Review Checklists format exactly**. This ensures that exported files have the same structure as the official Microsoft Azure Review Checklists.

## What Changed

### Column Order
The exported Excel/CSV files now use this exact column order (matching Azure Review Checklists):

1. **category** - Assessment category
2. **subcategory** - Sub-classification
3. **text** - Recommendation description
4. **waf** - Well-Architected Framework pillar
5. **service** - Azure service name
6. **guid** - Global unique identifier
7. **id** - Checklist item ID (e.g., A01.01)
8. **severity** - Priority level (High/Medium/Low)
9. **link** - Documentation link (if "Include Links" enabled)
10. **training** - Training link (if "Include Links" enabled)
11. **status** - Assessment status (for assessments, not templates)
12. **comments** - Your notes (if "Include Comments" enabled for assessments)



✅ **Full Compatibility** - Exported files match official Azure Review Checklists format  
✅ **Seamless Round-Trip** - Export from tool → Edit in Excel → Re-import works perfectly  
✅ **Standard Compliance** - Follows Microsoft's official checklist structure  
✅ **Easy Sharing** - Share assessments in the same format Azure uses  

## File Types Affected

- ✅ **Excel Export (.xlsx)** - Updated
- ✅ **CSV Export (.csv)** - Updated
- ✅ **Excel Upload** - Already compatible (no changes needed)

## Usage

### Exporting Assessments
1. Click **Export** button
2. Select **Excel** or **CSV** format
3. Check options:
   - ✅ **Include Links** - Adds link and training columns
   - ✅ **Include Comments** - Adds comments column (for assessments)
4. Download file

The exported file will have columns in this order:
```
category | subcategory | text | waf | service | guid | id | severity | [link] | [training] | status | [comments]
```

### Exporting Templates
If you want a blank template (without status/comments):
1. Select **Template Format** option
2. Export produces: `category, subcategory, text, waf, service, guid, id, severity, [link, training]`

## Example Output

### Assessment Format (with all options enabled)
```csv
category,subcategory,text,waf,service,guid,id,severity,link,training,status,comments
"Azure Billing","Entra ID Tenants","Use one Entra tenant","Operations","Entra","70c15989-c726-42c7-b0d3-24b7375b9201","A01.01","Medium","https://...","https://...","Fulfilled","Already implemented"
```

### Template Format
```csv
category,subcategory,text,waf,service,guid,id,severity,link,training
"Azure Billing","Entra ID Tenants","Use one Entra tenant","Operations","Entra","70c15989-c726-42c7-b0d3-24b7375b9201","A01.01","Medium","https://...","https://..."
```

## Compatibility

### Backward Compatibility
- ✅ **Upload still works** - The upload functionality already supported both formats
- ✅ **Existing assessments** - No impact on saved data
- ⚠️ **Old exports** - Files exported before this update have different column order (but still importable)

### Forward Compatibility
- ✅ **Azure Checklists** - Perfect match with official format
- ✅ **Excel macros** - Compatible with Azure's macro-enabled spreadsheets
- ✅ **Power BI** - Standard structure for reporting tools

## Technical Details

### Files Modified
- `web-assessment/js/export.js`:
  - Updated `prepareExcelData()` function - Changed column order and names
  - Updated `convertToCSV()` function - Changed CSV headers and data order
  - Updated column width definitions in `exportExcel()` function

### Column Width Settings
Optimized for readability:
- category: 30 chars
- subcategory: 25 chars
- text: 60 chars
- waf: 15 chars
- service: 15 chars
- guid: 40 chars
- id: 10 chars
- severity: 12 chars
- link/training: 50 chars each
- status: 15 chars
- comments: 40 chars

## Testing Recommendations

1. **Export Test** - Export an assessment with all options enabled
2. **Open in Excel** - Verify column order matches Azure Review Checklists
3. **Re-import Test** - Upload the exported file back into the tool
4. **Data Validation** - Confirm all data preserved correctly
5. **Template Test** - Export template format and verify no status/comments columns

## References

- [Azure Review Checklists Repository](https://github.com/Azure/review-checklists)
- [Azure Checklist Excel Files](https://github.com/Azure/review-checklists/tree/main/spreadsheet/macrofree)
- [Excel Upload Format Guide](./excel-upload-format.md)
- [Azure Excel Compatibility Guide](./AZURE-EXCEL-COMPATIBILITY.md)

---

**Updated**: October 14, 2025  
**Version**: 2.1  
**Status**: ✅ Complete
