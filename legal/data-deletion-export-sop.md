# Data Deletion & Export SOP

Standard Operating Procedure for handling user data deletion and export requests.

## Overview

Since all data is stored locally on users' devices, most deletion/export requests can be handled by directing users to built-in extension features. This SOP covers both self-service instructions and rare cases requiring support.

---

## Self-Service Data Export

Users can export their data independently without contacting support.

### Instructions to Provide Users:

1. Click the extension icon in Chrome toolbar
2. Open the side panel
3. Click the "Export to CSV" button
4. Choose save location
5. CSV file will contain: Name, Headline, Company, Location, Mutual Connections, Profile URL, Status, Notes, Tags

**Response Time:** Immediate (self-service)

---

## Self-Service Data Deletion

Users can delete their data independently without contacting support.

### Instructions for Deleting Individual Prospects:

1. Open the extension side panel
2. Find the prospect you want to delete
3. Click the delete/trash icon next to the prospect
4. Confirm deletion when prompted

### Instructions for Deleting All Data:

1. Open the extension side panel
2. Click Settings or Options (gear icon)
3. Click "Clear All Data" button
4. Confirm action when prompted
5. All prospects, notes, tags, templates, and campaigns will be permanently deleted

### Instructions for Complete Removal:

1. Right-click extension icon in Chrome toolbar
2. Select "Remove from Chrome"
3. Confirm removal
4. All extension data is automatically deleted when extension is uninstalled

**Response Time:** Immediate (self-service)

---

## Handling Data Deletion Requests via Email

Even though data is stored locally, users may email requesting assistance with data deletion.

### Step 1: Acknowledge Request (Within 24 hours)

**Email Template:**

```
Subject: Re: Data Deletion Request - LinkedIn Connection Scanner

Hello [User Name],

Thank you for contacting us regarding data deletion for the LinkedIn Connection Scanner extension.

Since all data from our extension is stored locally on your device (not on our servers), you have complete control to delete it immediately. Here's how:

TO DELETE ALL DATA:
1. Open the extension side panel
2. Click the Settings icon
3. Click "Clear All Data"
4. Confirm the action

TO COMPLETELY REMOVE THE EXTENSION AND ALL DATA:
1. Right-click the extension icon in Chrome
2. Select "Remove from Chrome"
3. Confirm removal

This will permanently delete all stored prospects, notes, tags, and settings from your device.

If you need further assistance or have questions, please let me know.

Best regards,
Deep Soni
deep@deepsoni.com
```

### Step 2: Follow-Up (If User Replies with Issues)

If user reports difficulty deleting data:

1. Request Chrome version and OS
2. Provide step-by-step instructions with screenshots (prepare these in advance)
3. Offer to create a video walkthrough if needed
4. Confirm when user reports successful deletion

### Step 3: Document Resolution

- Log request in support system
- Record resolution method
- Track time to resolution
- Note any common issues for FAQ updates

**SLA:** Acknowledge within 24 hours, resolve within 48 hours

---

## Handling Data Export Requests via Email

### Step 1: Acknowledge Request (Within 24 hours)

**Email Template:**

```
Subject: Re: Data Export Request - LinkedIn Connection Scanner

Hello [User Name],

Thank you for contacting us regarding data export for the LinkedIn Connection Scanner extension.

All your data is stored locally on your device, and you can export it immediately:

TO EXPORT YOUR DATA:
1. Click the extension icon in your Chrome toolbar
2. Open the side panel
3. Click the "Export to CSV" button (usually near the top)
4. Choose where to save the file
5. Your CSV file will contain all your scanned prospects and notes

The exported CSV includes: Name, Headline, Company, Location, Mutual Connections, Profile URL, Status, Notes, and Tags.

If you need assistance or have questions, please let me know.

Best regards,
Deep Soni
deep@deepsoni.com
```

### Step 2: Troubleshooting Failed Exports

If user reports export doesn't work:

1. Verify browser version (Chrome, Edge, Brave, etc.)
2. Check if browser blocks downloads (permissions issue)
3. Ask user to try different save location
4. Verify extension is up to date
5. Check browser console for errors (provide instructions)

**SLA:** Acknowledge within 24 hours, resolve within 48 hours

---

## GDPR / CCPA Compliance Notes

### Right to Access
Users have immediate access to all their data through the extension interface. No waiting period required.

### Right to Deletion
Users can delete data immediately through extension settings. No developer intervention required.

### Right to Portability
Users can export data in CSV format (machine-readable, standard format) at any time.

### Data Breach Notification
Since no data is stored on our servers, traditional data breach scenarios don't apply. However:
- Users should be advised to keep Chrome updated
- Users should be advised to secure exported CSV files
- If extension has security vulnerability discovered, notify users via Chrome Web Store update notes

---

## Special Cases

### User Claims Data Still Present After Deletion

**Response:**

"If data appears to still be present after deletion:

1. Close and reopen the extension
2. Restart Chrome browser
3. Check if Chrome Sync is enabled - if yes, sign out and back in to sync deletion
4. Verify deletion in Chrome DevTools:
   - Press F12 to open DevTools
   - Go to Application tab
   - Click Local Storage → chrome-extension://[extension-id]
   - Verify no data keys present

If data persists, please uninstall and reinstall the extension (this will definitely clear all data)."

### User Requests Developer Delete Their Data

**Response:**

"I understand your concern. However, all data from the LinkedIn Connection Scanner extension is stored exclusively on your device, not on any servers we control. We literally do not have access to your data and cannot delete it remotely.

The only way to delete the data is through the steps outlined above, which you control completely. This architecture was intentionally chosen to give you complete privacy and control over your information.

If you need assistance with the deletion process, I'm happy to guide you through it."

---

## FAQ Additions Based on Common Requests

Maintain a public FAQ with these items:

**Q: How do I delete my data?**
A: [Link to self-service instructions]

**Q: How do I export my data?**
A: [Link to self-service instructions]

**Q: Do you store my data on your servers?**
A: No, all data is stored locally on your device only.

**Q: What happens to my data when I uninstall the extension?**
A: All data is automatically deleted when you uninstall the extension.

---

## Escalation Path

Most data deletion/export requests should be resolved at Tier 1 support level.

**Escalate to Developer if:**
- Technical bug prevents data deletion
- Extension appears to be storing data externally (would indicate serious bug)
- Data corruption prevents normal deletion process
- User reports security concern related to data storage

**Response Time for Escalations:** 48-72 hours

---

## Metrics to Track

1. Number of data deletion requests per month
2. Number of data export requests per month
3. Average time to resolution
4. Number of users who successfully self-serve vs. need help
5. Common issues preventing successful self-service

Use metrics to improve in-app instructions and reduce support burden.

---

## Quarterly Review

Every quarter, review:
1. Support ticket patterns
2. Common user confusion points
3. Whether in-app deletion/export UI can be improved
4. Whether documentation is clear and accessible
5. Compliance with any new data protection regulations
