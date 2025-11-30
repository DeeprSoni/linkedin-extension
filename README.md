# LinkedIn Connection Scanner

A Chrome extension that scans 2nd degree LinkedIn connections and creates a reviewable list for manual outreach.

**Works with FREE LinkedIn accounts!** See [FREE_TIER_GUIDE.md](FREE_TIER_GUIDE.md) for strategies to maximize results without Premium.

## Features

- **Automated Scanning**: Scans LinkedIn search results and "My Network" page for 2nd degree connections
- **Smart Storage**: Stores prospects with details (name, headline, company, location, mutual connections)
- **Review Interface**: Side panel UI to review, filter, and manage prospects
- **Export Functionality**: Export prospects to CSV for use in other tools
- **Status Tracking**: Mark prospects as new, reviewed, skipped, or connected
- **Search & Filter**: Find specific prospects and filter by status
- **Sorting Options**: Sort by date, name, or number of mutual connections

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Extension

```bash
npm run build
```

This will create a `dist` folder with the compiled extension.

### 3. Load in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `dist` folder from this project

## Usage

### Scanning for Prospects

**Method 1: On LinkedIn Page**
1. Navigate to LinkedIn (www.linkedin.com)
2. Go to either:
   - **People Search**: Search for people and use filters (location, company, etc.)
   - **My Network**: Navigate to linkedin.com/mynetwork/
3. Click the floating "Scan 2nd Connections" button that appears on the page
4. The extension will scroll and collect all visible 2nd degree connections

**Method 2: From Extension Popup**
1. Navigate to a LinkedIn search or network page
2. Click the extension icon in Chrome toolbar
3. Click "Start Scan" button

### Reviewing Prospects

1. Click the extension icon in Chrome toolbar
2. Click "View All Prospects" to open the side panel
3. Review each prospect:
   - Click "View Profile" to open their LinkedIn profile
   - Update status using the dropdown
   - Delete prospects you're not interested in
4. Use filters to show specific statuses
5. Use search to find prospects by name, headline, or company
6. Sort by date, name, or mutual connections

### Exporting Data

**From Popup:**
- Click extension icon → "Export to CSV"

**From Side Panel:**
- Open side panel → Click "Export CSV" button

The CSV includes all prospect information and can be opened in Excel, Google Sheets, or imported into CRM tools.

## Project Structure

```
linkedin-connection-scanner/
├── src/
│   ├── content/
│   │   └── content.ts          # Scans LinkedIn pages
│   ├── background/
│   │   └── background.ts       # Handles messaging and storage
│   ├── popup/
│   │   ├── popup.html          # Extension popup UI
│   │   └── popup.tsx           # Popup logic
│   ├── sidepanel/
│   │   ├── sidepanel.html      # Side panel UI
│   │   ├── sidepanel.tsx       # Side panel React app
│   │   └── sidepanel.css       # Styles
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   └── utils/
│       └── storage.ts          # Chrome storage utilities
├── icons/                       # Extension icons
├── manifest.json               # Chrome extension manifest
├── package.json
├── tsconfig.json
└── webpack.config.js
```

## Development

### Watch Mode

Run the build in watch mode for development:

```bash
npm run dev
```

This will automatically rebuild when you make changes to the source files.

### Type Checking

Check TypeScript types without building:

```bash
npm run type-check
```

### Reload Extension

After making changes and rebuilding:
1. Go to `chrome://extensions/`
2. Click the reload icon on your extension card

## How It Works

### Content Script (`content.ts`)
- Injects a "Scan" button into LinkedIn pages
- Extracts prospect data from DOM elements
- Scrolls pages to load more results
- Sends collected data to background script

### Background Script (`background.ts`)
- Receives prospect data from content script
- Manages Chrome storage
- Updates extension badge with prospect count

### Storage (`storage.ts`)
- Stores prospects in Chrome local storage
- Prevents duplicates by profile ID
- Tracks statistics (total scanned, last scan date)
- Exports to CSV format

### UI Components
- **Popup**: Quick stats and actions
- **Side Panel**: Full prospect management interface with React

## Data Collected

For each prospect, the extension collects:
- Name
- Profile URL
- Headline (job title/description)
- Current Company
- Location
- Number of Mutual Connections
- Scan timestamp
- Status (new/reviewed/skipped/connected)

All data is stored locally in your browser using Chrome's storage API.

## Privacy & Safety

- All data is stored locally on your machine
- No data is sent to external servers
- The extension only reads publicly visible LinkedIn data
- Manual review required before any action is taken

**Important**: This extension is for research and organization purposes. Always:
- Respect LinkedIn's terms of service
- Send personalized connection requests
- Avoid spam-like behavior
- Use reasonable daily limits (~20-50 connections/day)

## LinkedIn's ToS Considerations

This extension is designed as a **research and organization tool** that:
- Does NOT automatically send connection requests
- Does NOT automate any actions on LinkedIn
- Simply helps you organize and review prospects
- Requires manual action for all outreach

However, be aware that LinkedIn's Terms of Service prohibit automated data collection. Use this tool responsibly and at your own discretion.

## Troubleshooting

### Extension doesn't appear
- Make sure you loaded the `dist` folder, not the root project folder
- Check that Developer Mode is enabled in Chrome extensions

### Scan button doesn't appear
- Refresh the LinkedIn page
- Make sure you're on linkedin.com (not a subdomain)
- Check browser console for errors

### No prospects found
- Make sure you're on a People Search or My Network page
- Check that the results show 2nd degree connections (not 1st or 3rd)
- Try scrolling manually first to load more results

### Data not saving
- Check Chrome storage permissions in `chrome://extensions/`
- Open browser console and check for errors

## Future Enhancements

Potential features to add:
- [ ] Advanced filtering (job title keywords, company size, etc.)
- [ ] AI-powered relevance scoring
- [ ] Connection request templates
- [ ] Integration with CRM systems
- [ ] Analytics dashboard
- [ ] Duplicate detection across scans
- [ ] Notes and tags for prospects
- [ ] Scheduled scanning
- [ ] LinkedIn Sales Navigator support

## License

MIT License - Feel free to modify and use as needed.

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Disclaimer

This extension is not affiliated with, endorsed by, or connected to LinkedIn Corporation. Use at your own risk and in compliance with LinkedIn's Terms of Service.
