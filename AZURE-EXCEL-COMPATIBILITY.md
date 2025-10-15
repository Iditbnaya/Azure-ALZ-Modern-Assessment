# Azure Review Checklists Excel Compatibility

## 📜 Attribution

**Azure Review Checklists** is an official Microsoft project:
- **Repository**: [Azure/review-checklists](https://github.com/Azure/review-checklists)
- **Copyright**: © Microsoft Corporation
- **License**: MIT License
- **Maintained By**: Microsoft FTA (FastTrack for Azure) team and community

This compatibility guide documents how to use Excel files from the Azure Review Checklists repository with this assessment tool.

---

## ✅ Full Compatibility Confirmed

This assessment tool is **fully compatible** with Azure Review Checklists macro-free Excel files!

## 📥 How to Use Azure Excel Files

### Step 1: Download Macro-Free Template
Visit the Azure Review Checklists repository and download a macro-free Excel template:

**Direct Links:**
- [Azure Landing Zone (ALZ)](https://github.com/Azure/review-checklists/raw/main/spreadsheet/macrofree/alz_checklist.en.xlsx)
- [Azure Kubernetes Service (AKS)](https://github.com/Azure/review-checklists/raw/main/spreadsheet/macrofree/aks_checklist.en.xlsx)
- [App Service](https://github.com/Azure/review-checklists/raw/main/spreadsheet/macrofree/appsvc_checklist.en.xlsx)
- [All Templates](https://github.com/Azure/review-checklists/tree/main/spreadsheet/macrofree)

### Step 2: Fill In Your Assessment
Open the downloaded Excel file and complete your assessment:

1. **Status Column**: Set the compliance status
   - `Fulfilled` - Requirement is met ✅
   - `Open` - Needs attention ❌
   - `Not Required` - Not applicable ➖
   - `Not Verified` - Needs review ⚠️

2. **Comments Column**: Add your notes and implementation details

### Step 3: Upload to Assessment Tool
1. Open this assessment tool in your browser
2. Click **"Upload Assessment"** button in the header
3. Select your completed Excel file
4. The tool automatically imports your data and continues tracking

## 🔄 Supported Excel Formats

### Azure Review Checklists Format
The tool automatically recognizes these columns:
- **id** - Unique identifier (e.g., A01.01)
- **category** - Assessment category
- **subcategory** - Sub-classification
- **text** - Recommendation description
- **waf** - Well-Architected Framework pillar
- **service** - Azure service name
- **guid** - Global unique identifier
- **severity** - Priority level
- **status** - Compliance status (Fulfilled/Open/Not Required/Not Verified)
- **comments** - Your notes and remarks

### Alternative Column Names
The tool also recognizes common variations:
- **ID**: id, guid, reference, identifier
- **Status**: status, compliance, result
- **Comments**: comments, notes, remarks
- **Category**: category, domain, area
- **Recommendation**: text, recommendation, title, check, description

## 🎯 Status Mapping

Azure Review Checklists statuses are automatically converted:

| Azure Format | Tool Format | Meaning |
|---|---|---|
| Fulfilled | Fulfilled | Compliant ✅ |
| Open | Open | Non-Compliant ❌ |
| Not Required | Not Required | Not Applicable ➖ |
| Not Verified | Not Verified | Not Reviewed ⚠️ |

## ⚡ Performance Features

The upload system includes:
- ✅ **Batch Processing**: Handles large files (100 rows per batch)
- ✅ **Non-Blocking UI**: 10ms delays prevent browser freezing
- ✅ **Smart Matching**: Text similarity matching for items without IDs
- ✅ **Auto-Detection**: Automatically identifies assessment type
- ✅ **Format Flexibility**: Supports up to 10 header row positions

## 🛠️ Technical Details

### Column Detection
The tool scans the first 10 rows to find headers containing:
- id, guid, category, subcategory, text, description
- status, check, waf, severity, recommendation

### Header Row Search

The tool intelligently scans **the first 15 rows** to find headers:

- Looks for rows with at least **5 columns**
- Requires at least **3 matching header terms**
- Works with Azure Review Checklists format (headers typically on row 6-8)
- Skips metadata/title rows at the top

Header terms recognized:
```javascript
id | guid | category | subcategory | text | description |
status | waf | severity | service | recommendation | check
```

### Data Extraction
Extracts all Azure Review Checklists fields:
- Core fields: id, status, comments
- Azure-specific: category, subcategory, waf, severity, service
- Flexible: text/recommendation, various status formats

## 📝 Troubleshooting

### "Could not find header row" Error

**Cause:** The tool scans the first 15 rows for header columns but couldn't find a valid header row.

**Solution:** Ensure your Excel file has column headers within the first 15 rows with at least 3 of these terms:
- id, category, text, status, subcategory, waf, severity, recommendation

**Note:** Azure Review Checklists Excel files typically have headers around row 6-8, which is fully supported. The tool automatically skips metadata/title rows at the top.

### Missing Data After Upload

**Possible Causes:**
1. Empty Status column - items with no status are imported as "Not Verified"
2. Missing ID column - tool will attempt text matching
3. Excel formulas - save as values before uploading

### Status Not Recognized
**Solution:** Use standard Azure format:
- Fulfilled, Open, Not Required, Not Verified

Alternative formats also work:
- Compliant/Non-Compliant, Yes/No, Pass/Fail, etc.

## 🎓 Best Practices

1. **Use Official Templates**: Download macro-free templates from Azure/review-checklists
2. **Fill Status First**: Ensure all items have a status before uploading
3. **Add Comments**: Include implementation notes for context
4. **Save As Values**: If using formulas, save as values before upload
5. **Test Small First**: Upload a small sample first to verify format

## 🔗 Resources

- [Azure Review Checklists Repository](https://github.com/Azure/review-checklists)
- [Macro-Free Excel Templates](https://github.com/Azure/review-checklists/tree/main/spreadsheet/macrofree)
- [Excel Upload Format Guide](./excel-upload-format.md)
- [Assessment Tool README](./README.md)

---

**Last Updated**: October 2025
**Compatibility Version**: v2.0+
