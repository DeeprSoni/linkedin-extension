# Setup Checklist

Use this checklist to get your LinkedIn Connection Scanner running.

## ✅ Installation Checklist

### Prerequisites
- [ ] Chrome browser installed (version 88 or higher)
- [ ] Node.js installed (already done - you've built the project)
- [ ] LinkedIn account

### Build Verification
- [x] Dependencies installed (`npm install`)
- [x] Project built successfully (`npm run build`)
- [x] `dist/` folder exists with compiled files

### Chrome Extension Setup
- [ ] Opened `chrome://extensions/` in Chrome
- [ ] Enabled "Developer mode" toggle (top-right)
- [ ] Clicked "Load unpacked"
- [ ] Selected the `dist/` folder from this project
- [ ] Extension appears in extensions list
- [ ] No error messages shown
- [ ] (Optional) Pinned extension to toolbar for easy access

## ✅ First Use Checklist

### Initial Test
- [ ] Opened LinkedIn.com in Chrome
- [ ] Navigated to a LinkedIn search page or My Network
- [ ] Saw the blue "Scan 2nd Connections" button appear (bottom-right)
- [ ] Clicked the extension icon - popup opened
- [ ] Stats show 0 prospects initially

### First Scan
- [ ] Performed a LinkedIn people search with filters
- [ ] Made sure results show 2nd degree connections
- [ ] Clicked "Scan 2nd Connections" button
- [ ] Watched page scroll automatically
- [ ] Saw notification when scan completed
- [ ] Extension badge shows number of prospects found

### Review Prospects
- [ ] Clicked extension icon
- [ ] Clicked "View All Prospects"
- [ ] Side panel opened showing scanned prospects
- [ ] Clicked "View Profile" on a prospect (opens LinkedIn profile)
- [ ] Changed status of a prospect (dropdown menu)
- [ ] Tested search functionality
- [ ] Tested filter dropdown
- [ ] Tested sort options

### Export Test
- [ ] Clicked "Export CSV" from popup or side panel
- [ ] CSV file downloaded
- [ ] Opened CSV in Excel/Google Sheets
- [ ] Verified all prospect data is present

## ✅ Workflow Setup

### Define Your Target Audience
- [ ] Identified job titles you want to connect with
- [ ] Identified companies/industries to target
- [ ] Identified locations (if relevant)
- [ ] Set up LinkedIn search filters accordingly

### Establish Your Process
- [ ] Decided on daily connection limit (recommend 20-50/day)
- [ ] Created connection request template (personalize for each)
- [ ] Set up schedule for scanning (e.g., Monday mornings)
- [ ] Set up schedule for reviewing prospects (e.g., daily 15 min)

### Best Practices Reminder
- [ ] Read the QUICK_START.md guide
- [ ] Understand LinkedIn's rate limits
- [ ] Committed to personalizing each connection request
- [ ] Plan to track acceptance rates

## 🔧 Troubleshooting Checklist

If something doesn't work, verify:

### Extension Not Loading
- [ ] `dist/` folder contains manifest.json
- [ ] Developer mode is enabled
- [ ] No error messages in chrome://extensions/
- [ ] Try removing and re-adding the extension

### Scan Button Not Appearing
- [ ] On linkedin.com domain (not a subdomain)
- [ ] Refreshed the page after installing extension
- [ ] Checked browser console (F12) for errors
- [ ] Content script loaded (check in DevTools)

### No Prospects Found
- [ ] Search results show 2nd degree connections (not 1st or 3rd)
- [ ] Results are visible on page (scrolled down)
- [ ] LinkedIn page fully loaded before scanning
- [ ] Check console for JavaScript errors

### Data Not Saving
- [ ] Extension has storage permission (check manifest)
- [ ] Chrome storage not full (unlikely, check chrome://quota-internals/)
- [ ] No errors in background script console

### Side Panel Not Opening
- [ ] Using Chrome 114+ (side panel API requirement)
- [ ] Clicked from extension popup, not directly
- [ ] Try closing and reopening

## 📋 Maintenance Checklist

### Weekly
- [ ] Review new prospects
- [ ] Export data for backup
- [ ] Update prospect statuses

### Monthly
- [ ] Clear out old/irrelevant prospects
- [ ] Review acceptance rates
- [ ] Adjust search criteria if needed

### When LinkedIn Updates
- [ ] Test if scanning still works
- [ ] Check for console errors
- [ ] Update DOM selectors if needed (contact developer)

## 🎯 Success Metrics to Track

Consider tracking these metrics:
- [ ] Number of prospects scanned per week
- [ ] Connection acceptance rate
- [ ] Time saved vs manual browsing
- [ ] Quality conversations started
- [ ] Opportunities generated

## 📚 Resources

Reference these files:
- **QUICK_START.md** - Quick reference guide
- **README.md** - Full documentation
- **PROJECT_SUMMARY.md** - Technical overview

## ✨ You're All Set!

Once all checkboxes above are complete, you're ready to:
1. Start scanning LinkedIn for valuable connections
2. Build a high-quality prospect list
3. Send thoughtful, personalized connection requests
4. Grow your professional network strategically

---

**Need Help?** Check the README.md troubleshooting section or review console errors in DevTools.
