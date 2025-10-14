# Azure Landing Zone Assessment Tool

A modern, web-based replacement for the Excel-based Azure Landing Zone assessment spreadsheet. This tool provides an interactive interface for conducting ALZ assessments with real-time progress tracking, visual dashboards, and multiple export formats.

## Features

### 🔍 **Interactive Assessment**
- Row-by-row assessment of Azure Landing Zone recommendations
- Category and severity-based filtering
- Real-time progress tracking
- Comment and note-taking capabilities
- Status tracking (Compliant, Non-Compliant, Not Applicable, Not Reviewed)

### 📊 **Visual Dashboard**
- Real-time progress charts
- Compliance status distribution
- Severity breakdown visualization
- Category-based analysis
- Compliance scoring and grading

### 📤 **Export Capabilities**
- JSON export for data portability
- CSV export for spreadsheet analysis
- HTML reports for documentation
- Executive summary generation
- Progress save/load functionality

### 📱 **Modern Web Experience**
- Responsive design for desktop, tablet, and mobile
- Progressive Web App (PWA) capabilities
- Offline functionality (when cached)
- Auto-save progress protection

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Access to the checklist JSON files
- No additional software installation required

### Installation

1. **Clone or download** this repository to your local machine or web server
2. **Ensure checklist files** are available in the `../review-checklists/checklists/` directory
3. **Open** `index.html` in your web browser
4. **Start your assessment** by selecting language and checklist type

### Usage

1. **Choose Assessment Type**: Select the type of assessment (ALZ, AKS, etc.)
2. **Load Assessment**: Click "Load Assessment" to begin
3. **Conduct Review**: 
   - Go through each recommendation
   - Set status (Compliant/Non-Compliant/Not Applicable)
   - Add comments and notes as needed
4. **Monitor Progress**: Check the Dashboard tab for visual progress
5. **Export Results**: Use the Export tab to save your assessment

## Project Structure

```
web-assessment/
├── index.html              # Main application page
├── manifest.json           # PWA manifest
├── styles/
│   └── main.css            # Application styles
├── js/
│   ├── app.js              # Main application controller
│   ├── data-loader.js      # Data loading and management
│   ├── assessment.js       # Assessment interface logic
│   ├── dashboard.js        # Dashboard and reporting
│   └── export.js           # Export functionality
└── README.md               # This file
```

## Data Sources

The application loads checklist data from:
1. **Primary**: `../checklist.json` (most up-to-date)
2. **Fallback**: `../review-checklists/checklists/{type}_checklist.{lang}.json`
3. **Development**: Sample data for testing

## Supported Assessment Types

- **ALZ**: Azure Landing Zone
- **AI_LZ**: AI Landing Zone  
- **AKS**: Azure Kubernetes Service
- **AppSvc**: App Service
- **AVD**: Azure Virtual Desktop
- **APIM**: API Management

## Browser Compatibility

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Comparison with Excel Version

| Feature | Excel Spreadsheet | Web Application |
|---------|------------------|-----------------|
| **Accessibility** | Requires Office | Any web browser |
| **Collaboration** | Limited | Real-time sharing |
| **Version Control** | Difficult | Git-friendly JSON |
| **Mobile Support** | Limited | Full responsive |
| **Auto-save** | Manual | Automatic |
| **Progress Tracking** | Basic | Advanced visuals |
| **Export Options** | Excel only | Multiple formats |
| **Offline Use** | Full | Cache-dependent |
| **Updates** | Manual download | Dynamic loading |

## Local Development

### Running Locally

1. **Simple HTTP Server** (recommended):
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   
   # Node.js
   npx http-server
   ```

2. **Access**: Open `http://localhost:8000` in your browser

### Development Mode Features

- Sample data generation when checklists are unavailable
- Enhanced console logging
- Development-specific error handling

## Contributing

### Adding New Checklist Types

1. Add the checklist type to `DataLoader.availableChecklists`
2. Add corresponding option to the checklist selector in `index.html`
3. Ensure JSON files follow the standard structure

### Customization

- **Styling**: Modify `styles/main.css`
- **Branding**: Update colors in CSS custom properties
- **Export Formats**: Extend `ExportManager` class

## Troubleshooting

### Common Issues

**"Failed to load checklist"**
- Ensure JSON files are accessible
- Check browser console for detailed errors
- Verify file permissions if running locally

**"Progress not saving"**
- Check localStorage availability
- Ensure sufficient browser storage
- Try clearing browser cache

**Charts not displaying**
- Verify Chart.js CDN connection
- Check browser JavaScript console
- Ensure canvas elements are present

### Browser Console

Press F12 to open developer tools and check the Console tab for detailed error messages and debug information.

## Security Considerations

- **Local Storage**: Assessment progress is stored in browser localStorage
- **No Server Data**: All processing happens client-side
- **File Access**: Only reads JSON files, no write operations
- **Links**: External links open in new tabs with security attributes

## Future Enhancements

- [ ] Real-time collaboration features
- [ ] Advanced filtering and search
- [ ] Custom assessment templates
- [ ] Integration with Azure Resource Graph
- [ ] Automated compliance checking
- [ ] Team management and role-based access
- [ ] Assessment scheduling and reminders
- [ ] Historical trend analysis

## License

This project follows the same license as the Azure Review Checklists repository.

## Disclaimer

- This is not official Microsoft documentation or software
- This is not an endorsement or a sign-off of an architecture or a design
- This tool is provided "AS IS" without warranty of any kind
- Always validate recommendations against current Azure documentation

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review browser console for errors
3. Ensure you have the latest checklist files
4. Consider contributing improvements via pull requests

---

**Happy Assessing! 🚀**