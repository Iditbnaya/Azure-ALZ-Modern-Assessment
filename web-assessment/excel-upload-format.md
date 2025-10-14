# Sample Excel Upload Format

This document describes the expected format for Excel files that can be uploaded to the Azure Landing Zone Assessment Tool.

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

The following status values are recognized (case-insensitive):

- **Compliant**: compliant, yes, passed, pass, completed, done, green, ✓
- **Non-Compliant**: non-compliant, non compliant, not compliant, no, failed, fail, red, ✗
- **Not Applicable**: not applicable, n/a, na, skip, skipped, grey, gray
- **Not Reviewed**: not reviewed, pending, todo, unknown, (empty)

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