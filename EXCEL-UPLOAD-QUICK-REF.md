# Excel Upload - Quick Troubleshooting Reference

## 🚀 Quick Start

**If upload is taking too long:**

1. Press `F12` to open Browser Console
2. Watch for progress logs with emojis (📊 🔍 ⏳ ✅)
3. Click "Show Diagnostic Logs" button in upload dialog
4. Look for bottlenecks or error messages

---

## 📊 What to Look For in Console

### ✅ Good Signs (Normal Progress)
```
📊 Starting Excel file parsing
✅ Sheet parsed: 500 rows in 234ms
📊 Total rows: 500
✅ Header row found at index 6
✅ Parsed 250 items from Excel
🎯 Detected assessment type: alz
🎉 Excel parsing complete: totalTime: "5234ms"
```

### ⚠️ Warning Signs (May be slow but okay)
```
⚠️ Could not match item (score threshold not met)
⏳ Processing batch 15/20 (75%)
🔍 Matching 100 items to checklist...
```

### ❌ Error Signs (Problems!)
```
❌ Header row not found
❌ Excel parsing error
❌ No valid items found
⏱️ Excel parsing timeout after 60 seconds
```

---

## ⏱️ Expected Upload Times

| Rows | Items | Time |
|------|-------|------|
| <100 | <50 | 1-3 sec |
| 100-500 | 50-250 | 3-10 sec |
| 500-2000 | 250-1000 | 10-30 sec |
| >2000 | >1000 | 30-60 sec |

**If taking >2x expected time:** Check console for bottlenecks

---

## 🔧 Quick Fixes

### Upload Stuck or Taking Forever

**Try this:**
1. Refresh page (Ctrl+R)
2. Close other browser tabs
3. Check file size (should be <5MB)
4. Try Chrome or Edge browser
5. Check console for error messages

### "Could not find header row"

**Fix:**
- Check first row in console output
- Ensure columns like: id, category, text, status, severity
- Headers must be in first 15 rows

### Many Items Not Matching

**Fix:**
- Add ID column to Excel file (e.g., A01.01, A01.02)
- Ensure recommendation text is detailed (>20 words)
- Check similarity scores in console

### Timeout After 60 Seconds

**Fix:**
- File too large (>5MB)
- Split into multiple files
- Check if file is corrupted (try opening in Excel)

---

## 🐛 Using Diagnostic Panel

**Enable diagnostics:**
1. Upload file
2. Click "Show Diagnostic Logs" button
3. Watch real-time progress
4. Copy logs if needed

**What you'll see:**
- [HH:MM:SS] INFO: Operation details
- [HH:MM:SS] WARN: Potential issues
- [HH:MM:SS] ERROR: Problems

---

## 📈 Performance Tips

**Make uploads faster:**

✅ Include ID column in Excel (skips slow matching)
✅ Use .xlsx format (not .xls)
✅ Close other browser tabs
✅ Use standard column names
✅ Remove extra worksheets

❌ Don't upload .csv (slower than .xlsx)
❌ Don't include images in Excel
❌ Don't have >5000 rows

---

## 🆘 Still Having Issues?

**Collect this information:**

1. **Browser Console Logs** (copy all)
2. **File size** and **number of rows**
3. **Browser type** and version
4. **Error messages** (exact text)
5. **Time taken** before failure

**Save console logs:**
```javascript
// In console (F12):
copy(JSON.stringify(window.app.diagnosticLogs, null, 2))
```

---

## 📞 Common Questions

**Q: Why first upload slower?**
A: Loading checklist for matching. Next uploads faster.

**Q: Can I cancel?**
A: Refresh page (Ctrl+R). Data lost if not complete.

**Q: Is data sent to server?**
A: No. All processing happens locally in browser.

**Q: Why some items skip?**
A: Text similarity <30%. Add IDs or more detail.

---

## 🎯 Key Metrics to Monitor

Watch console for these timing metrics:

- **Read time**: Should be <1 second
- **Parse time**: ~100-500ms for 500 rows
- **Conversion time**: ~1-5 seconds
- **Matching time**: ~5-30 seconds (if no IDs)
- **Total time**: Sum of all above

**If any metric is 10x expected:** Check that operation's logs for issues

---

Last Updated: October 15, 2025
