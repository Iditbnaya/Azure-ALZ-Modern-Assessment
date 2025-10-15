# Excel Upload Format Guide

This document describes the expected format for Excel files that can be uploaded to the Azure Landing Zone Assessment Tool.

## Using Azure Review Checklists Excel Files

### Recommended Approach
The easiest way to get started is to use the **macro-free Excel templates** directly from the Azure/review-checklists repository:

**Download macro-free templates:**
- [Azure Landing Zone (ALZ)](https://github.com/Azure/review-checklists/raw/main/spreadsheet/macrofree/alz_checklist.en.xlsx)
- [Azure Kubernetes Service (AKS)](https://github.com/Azure/review-checklists/raw/main/spreadsheet/macrofree/aks_checklist.en.xlsx)
- [App Service](https://github.com/Azure/review-checklists/raw/main/spreadsheet/macrofree/appsvc_checklist.en.xlsx)
- [See all templates](https://github.com/Azure/review-checklists/tree/main/spreadsheet/macrofree)

These templates are:
- ✅ **Pre-formatted** with all the correct columns
- ✅ **Ready to use** - no macros to enable
- ✅ **Fully compatible** with this assessment tool
- ✅ **Always up-to-date** with the latest Azure best practices

### How to Use
1. Download the appropriate macro-free Excel template from Azure/review-checklists
2. Fill in the **Status** column (Fulfilled, Open, Not Required, Not Verified)
3. Add your **Comments** in the Comments column
4. Upload the completed Excel file to this tool using the "Upload Assessment" button

## Required Columns

The Excel file should contain the following columns (column names are case-insensitive):

### Essential Columns:
- **ID** (or GUID, Reference): The unique identifier for each assessment item (e.g., A01.01, A02.03)
- **Status** (or Compliance, Result): The compliance status of the item

### Optional Columns:
- **Comments** (or Notes, Remarks, Description): Additional notes or comments
- **Category** (or Domain, Area): The category or domain of the assessment item
- **Recommendation** (or Title, Check, Text): The recommendation text

## Status Values

The tool recognizes the following status values from Azure Review Checklists (case-insensitive):

### Azure Review Checklists Format:
- **Fulfilled** → Maps to "Fulfilled" (Compliant)
- **Open** → Maps to "Open" (Non-Compliant)
- **Not Required** → Maps to "Not Required" (Not Applicable)
- **Not Verified** → Maps to "Not Verified" (Not Reviewed)

### Alternative Status Values:
The following alternative status values are also recognized (case-insensitive):

- **Compliant**: fulfilled, compliant, yes, passed, pass, completed, done, green, ✓
- **Non-Compliant**: open, non-compliant, non compliant, not compliant, no, failed, fail, red, ✗
- **Not Applicable**: not required, not applicable, n/a, na, skip, skipped, grey, gray
- **Not Reviewed**: not verified, not reviewed, pending, todo, unknown, (empty)

## Example Format:

| ID     | Recommendation                           | Status      | Comments                    | Category |
|--------|------------------------------------------|-------------|-----------------------------|----------|
| A01.01 | Use one Entra tenant for Azure resources| Compliant   | Already implemented         | Identity |
| A02.03 | Setup Cost Reporting with Cost Management| Non-Compliant| Need to configure          | Cost     |
| A03.01 | Set up Notification Contact email       | Not Applicable| Using different system    | Cost     |

## File Types Supported:
- Excel files (.xlsx, .xls)
- CSV files (.csv)
- JSON files (.json)

The tool will automatically detect the assessment type based on the content and structure of your data.