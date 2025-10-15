# Credits & Attribution

## 📜 Primary Content Source

### Azure Review Checklists

**All assessment checklists, recommendations, and best practices** used in this tool originate from:

- **Repository**: [Azure/review-checklists](https://github.com/Azure/review-checklists)
- **Owner**: Microsoft Corporation
- **License**: MIT License
- **Maintained By**: Microsoft FastTrack for Azure (FTA) team and community contributors

### What We Use

This tool synchronizes and displays content from the Azure Review Checklists repository, including:

- ✅ All checklist items and recommendations
- ✅ Best practices for Azure services
- ✅ Well-Architected Framework (WAF) mappings
- ✅ Severity classifications
- ✅ Category and subcategory structures

## 👥 Azure Review Checklists Contributors

Special thanks to the maintainers and contributors of the Azure Review Checklists project:

### Core Teams & Maintainers

- **FTA-ALZ-vTeam** - Azure Landing Zone checklist
- **ALZ-checklist-contributors** - Azure Landing Zone community contributors

### Individual Contributors (by Checklist)

- **AI Landing Zone**: [@mbilalamjad](https://github.com/mbilalamjad), [@prwani](https://github.com/prwani)
- **AKS**: [@msftnadavbh](https://github.com/msftnadavbh), [@seenu433](https://github.com/seenu433), [@erjosito](https://github.com/erjosito)
- **ARO**: [@msftnadavbh](https://github.com/msftnadavbh), [@naioja](https://github.com/naioja), [@erjosito](https://github.com/erjosito)
- **AVD**: [@igorpag](https://github.com/igorpag), [@mikewarr](https://github.com/mikewarr), [@bagwyth](https://github.com/bagwyth)
- **Cost**: [@brmoreir](https://github.com/brmoreir), [@pea-ms](https://github.com/pea-ms)
- **Multitenancy**: [@arsenvlad](https://github.com/arsenvlad), [@cherchyk](https://github.com/cherchyk)
- **Application Delivery**: [@erjosito](https://github.com/erjosito), [@andredewes](https://github.com/andredewes)
- **AVS**: [@fskelly](https://github.com/fskelly), [@mgodfrey50](https://github.com/mgodfrey50), [@robinher](https://github.com/robinher)
- **SAP**: [@NaokiIgarashi](https://github.com/NaokiIgarashi), [@AlastairMorrison](https://github.com/AlastairMorrison), [@mottach](https://github.com/mottach)
- **API Management**: [@andredewes](https://github.com/andredewes), [@seenu433](https://github.com/seenu433)
- **Stack HCI**: [@mbrat2005](https://github.com/mbrat2005), [@steveswalwell](https://github.com/steveswalwell), [@igomaa](https://github.com/igomaa)
- **Spring Apps**: [@bappadityams](https://github.com/bappadityams), [@vermegi](https://github.com/vermegi), [@fmustaf](https://github.com/fmustaf)
- **Azure DevOps**: [@roshair](https://github.com/roshair)
- **SQL Migration**: [@karthikyella](https://github.com/karthikyella), [@dbabulldog-repo](https://github.com/dbabulldog-repo)
- **Security**: [@mgodfrey50](https://github.com/mgodfrey50), [@rudneir2](https://github.com/rudneir2)

*And many more community contributors who have submitted issues, pull requests, and improvements.*

## 🛠️ Third-Party Libraries

This assessment tool uses the following open-source libraries:

### Frontend Libraries

- **[Chart.js](https://www.chartjs.org/)** (v4.x)
  - License: MIT License
  - Purpose: Dashboard charts and visualizations
  - CDN: `https://cdn.jsdelivr.net/npm/chart.js`

- **[Font Awesome](https://fontawesome.com/)** (v6.0)
  - License: Font Awesome Free License
  - Purpose: Icons throughout the interface
  - CDN: `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css`

- **[SheetJS (xlsx)](https://sheetjs.com/)** (v0.18.5)
  - License: Apache-2.0 License
  - Purpose: Excel file import/export functionality
  - CDN: `https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js`

## 📄 License Information

### This Project

- **License**: MIT License (inherited from Azure Review Checklists)
- **Copyright**: Original content © Microsoft Corporation
- **Modifications**: Web interface and tooling © project contributors

### Usage Rights

Under the MIT License, you are free to:

- ✅ **Use** this software commercially
- ✅ **Modify** the software to fit your needs
- ✅ **Distribute** copies of the software
- ✅ **Sublicense** under compatible terms
- ✅ **Private Use** for internal purposes

### Requirements

When using or distributing this software, you must:

- 📋 **Include** the copyright notice
- 📋 **Include** the license text
- 📋 **Attribute** the Azure Review Checklists project
- 📋 **State changes** if you modify the content

## 🤝 How This Tool Relates to the Original

### What This Tool Adds

This web-based tool provides an enhanced user experience on top of the Azure Review Checklists content:

1. **Interactive Web Interface**: Modern, responsive UI for assessments
2. **Real-Time Progress Tracking**: Live charts and statistics
3. **Multiple Export Formats**: JSON, Excel, CSV, HTML reports
4. **Advanced Filtering**: Category, severity, and status-based filtering
5. **Offline Capability**: Progressive Web App (PWA) support
6. **Auto-Save**: Local storage for work-in-progress assessments
7. **Batch Upload Processing**: Efficient handling of large Excel files
8. **Text Matching**: Smart matching for items without IDs

### What Remains the Same

- ✅ **All checklist content** (recommendations, descriptions, links)
- ✅ **Assessment categories** and structure
- ✅ **Status values** (Fulfilled, Open, Not Required, Not Verified)
- ✅ **Excel file format** compatibility
- ✅ **Best practices** and guidance

### Synchronization

This tool automatically synchronizes with the Azure Review Checklists repository:

- **Frequency**: Monthly (1st day of each month at 2:00 AM UTC)
- **Method**: Direct GitHub API calls to Azure/review-checklists
- **Backup**: Automatic backups before each update
- **Manual Sync**: Available via GitHub Actions or PowerShell script

## 🙏 Acknowledgments

### Special Thanks

- **Microsoft FastTrack for Azure (FTA)** team for creating and maintaining the original checklists
- **Azure community contributors** for their expertise and contributions
- **Open source library maintainers** for the excellent tools we use
- **Early adopters and testers** who provided valuable feedback

### Microsoft Disclaimer

From the Azure Review Checklists repository:

> - This is not official Microsoft documentation or software.
> - This is not an endorsement or a sign-off of an architecture or a design.
> - This code sample is provided "AS IT IS" without warranty of any kind.
> - Microsoft further disclaims all implied warranties.
> - The entire risk arising out of the use remains with you.

## 📞 Contact & Contributions

### For Checklist Content Issues

If you find errors in the **assessment content** (recommendations, links, descriptions):

- 🐛 **Report Issues**: [Azure/review-checklists/issues](https://github.com/Azure/review-checklists/issues)
- 🔀 **Submit PRs**: Follow [Contributing Guidelines](https://github.com/Azure/review-checklists/blob/main/CONTRIBUTING.md)

### For Tool/Interface Issues

If you find issues with **this web tool** (UI, exports, functionality):

- 🐛 **Report Issues**: [This repository's issues](../../issues)
- 🔀 **Submit PRs**: Contributions welcome!

## 📅 Version History

- **October 2025**: Enhanced Excel compatibility with Azure Review Checklists macro-free format
- **October 2025**: Direct sync from Azure/review-checklists (no fork required)
- **Earlier**: Initial web-based assessment tool development

---

**Last Updated**: October 14, 2025

For the most current list of contributors to the Azure Review Checklists project, please visit:
[https://github.com/Azure/review-checklists/graphs/contributors](https://github.com/Azure/review-checklists/graphs/contributors)
