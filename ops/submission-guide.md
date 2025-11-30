# Chrome Web Store Submission Guide

Step-by-step guide for submitting the LinkedIn Connection Scanner extension to the Chrome Web Store.

---

## Pre-Submission Requirements

### 1. Chrome Web Store Developer Account

**Status Check:**
- [ ] Have a Google account
- [ ] Registered as Chrome Web Store developer at: https://chrome.google.com/webstore/devconsole
- [ ] Paid one-time $5 developer registration fee
- [ ] Account is active and in good standing

**If NOT registered yet:**
1. Go to: https://chrome.google.com/webstore/devconsole
2. Sign in with Google account
3. Pay $5 registration fee (one-time)
4. Accept Developer Agreement
5. Wait for account approval (usually instant)

---

### 2. Privacy Policy Hosted

**Status Check:**
- [ ] Privacy policy HTML file ready (legal/privacy-policy.html)
- [ ] Policy hosted on publicly accessible URL
- [ ] URL is stable and won't change

**Hosting Options:**

**Option A: GitHub Pages (Free)**
1. Create GitHub repository (can be private)
2. Enable GitHub Pages in repository settings
3. Upload privacy-policy.html
4. Access at: https://[username].github.io/[repo-name]/privacy-policy.html

**Option B: Your Domain**
1. Upload privacy-policy.html to your website
2. URL example: https://yourdomain.com/privacy-policy.html
3. Ensure HTTPS enabled

**Option C: Google Sites (Free)**
1. Create page on sites.google.com
2. Paste privacy policy content
3. Publish and get URL

**Privacy Policy URL:** _________________________________

---

### 3. Extension Package Preparation

**Steps:**

1. **Verify Code is Production-Ready**
   ```bash
   # Check for TypeScript errors
   npm run type-check

   # Build production version
   npm run build
   ```

2. **Review dist/ Folder**
   - [ ] manifest.json present
   - [ ] background.js present
   - [ ] content.js present
   - [ ] popup.html, sidepanel.html present
   - [ ] icons/ folder with 16px, 48px, 128px icons
   - [ ] All required assets included
   - [ ] NO source TypeScript files (*.ts)
   - [ ] NO node_modules folder
   - [ ] NO unnecessary files (.env, .git, etc.)

3. **Create ZIP Package**

   **Windows:**
   - Navigate to dist/ folder
   - Select all files inside dist/
   - Right-click → Send to → Compressed (zipped) folder
   - Rename to: linkedin-connection-scanner-v1.0.0.zip

   **macOS/Linux:**
   ```bash
   cd dist
   zip -r ../linkedin-connection-scanner-v1.0.0.zip .
   ```

   **Important:**
   - ZIP contents should be the files directly, NOT a folder containing files
   - When you open the ZIP, you should see manifest.json immediately, not a dist/ folder
   - File size should be under 10MB (likely much smaller)

4. **Test ZIP Package**
   - Go to chrome://extensions/
   - Remove any existing test version
   - Enable Developer mode
   - Click "Load unpacked"
   - Extract ZIP to temp folder and load that folder
   - Run quick smoke test (scan a few profiles)
   - If works correctly, package is ready

---

## Submission Process

### Step 1: Access Developer Dashboard

1. Go to: https://chrome.google.com/webstore/devconsole
2. Sign in with your developer account
3. Click "New Item" button (top right)

---

### Step 2: Upload Package

1. Click "Choose file" or drag-and-drop
2. Upload your ZIP file: linkedin-connection-scanner-v1.0.0.zip
3. Wait for upload to complete (usually seconds)
4. Chrome will automatically extract and validate manifest

**If Upload Fails:**
- Check ZIP structure (files should be at root, not in subfolder)
- Verify manifest.json is valid JSON
- Ensure file size under 50MB
- Try re-zipping with different tool

---

### Step 3: Store Listing Tab

Fill out the store listing information:

#### Product Details

**Item Name (Required):**
```
LinkedIn Connection Scanner
```
- Max 75 characters
- Must match or be close to manifest name
- No "official" or misleading language

**Summary (Required):**
```
Scan and organize your 2nd degree LinkedIn connections for networking and outreach management.
```
- Max 132 characters
- Clear, concise description of functionality
- No marketing fluff, just what it does

**Description (Required):**
```
LinkedIn Connection Scanner helps you efficiently scan and organize your 2nd degree LinkedIn connections for professional networking and outreach.

FEATURES:
• Scan 2nd degree connections from LinkedIn search results
• Organize prospects with notes, tags, and status tracking
• Filter and search your prospect list
• Export data to CSV for external use
• All data stored locally on your device (complete privacy)
• No data transmitted to external servers

HOW TO USE:
1. Navigate to LinkedIn People Search or My Network page
2. Click the "Scan 2nd Connections" button that appears on the page
3. Choose how many prospects to scan (10-1000)
4. View and manage scanned prospects in the side panel
5. Add notes, tags, and track outreach status
6. Export to CSV when needed

PRIVACY & SECURITY:
✓ All data stored locally on your device
✓ No external data transmission
✓ No credential capture
✓ You have complete control over your data
✓ Delete data anytime through settings

NOT AFFILIATED WITH LINKEDIN:
This extension is an independent tool and is NOT affiliated with, endorsed by, or connected to LinkedIn Corporation or Microsoft Corporation.

SUPPORT:
For questions or issues, contact: deep@deepsoni.com

This tool is designed for legitimate networking and relationship building. Please use responsibly and in accordance with LinkedIn's Terms of Service.
```
- Max 16,000 characters (you have plenty of room)
- Use clear formatting with bullet points
- Emphasize privacy and data handling
- Include disclaimer about LinkedIn affiliation
- Provide support contact

**Category (Required):**
- Select: **Productivity** (or "Social & Communication" if that fits better)

**Language (Required):**
- Select: **English (United States)**

---

#### Graphic Assets

**NOTE:** The user said to skip screenshots and promo images, but Chrome Web Store may require at least one screenshot. If absolutely required:

**Screenshots (May be Required):**
- Minimum: 1 screenshot
- Size: 1280x800 or 640x400
- Format: PNG or JPG
- Content: Show extension in use (side panel with prospect list)

**If you need to create a quick screenshot:**
1. Open extension with some test data
2. Take screenshot of Chrome window
3. Crop to show extension UI clearly
4. Upload

**Promotional Images (Optional - SKIP per user request):**
- Small tile (440x280) - Skip
- Marquee (1400x560) - Skip

**Icon (Auto-populated from manifest):**
- 128x128 icon from your manifest will be used
- Verify it looks good in dashboard preview

---

#### Additional Fields

**Official URL (Optional but Recommended):**
- Your website or GitHub repository
- Example: https://github.com/[username]/linkedin-agent
- Leave blank if none

**Homepage URL (Optional):**
- Same as above or dedicated landing page
- Leave blank if none

---

### Step 4: Privacy Tab

This is critical and will be reviewed carefully by Chrome team.

#### Privacy Practices

**Does this item use permissions for:**

**Personally Identifiable Information:**
- Answer: **YES**
- Justification: Collects names and LinkedIn profile information from public profiles

**Browsing History:**
- Answer: **NO**

**User Activity:**
- Answer: **YES**
- Justification: Tracks which profiles user scans and user's interaction with prospects (notes, tags, status)

**Web Content:**
- Answer: **YES**
- Justification: Reads content from LinkedIn pages to extract profile information

**Do you sell or share user data with third parties?**
- Answer: **NO**

**Is data being handled:**
- [ ] Transmitted encrypted
  - Check: **NO** (not transmitted at all)
- [ ] Stored encrypted
  - Check: **NO** (stored in Chrome's standard local storage, which Chrome handles)

**Data handling disclosure:**

Copy from: ops/cws-data-disclosure.txt

Key points to include:
- What data: Names, headlines, companies, locations, mutual connections, profile URLs, user notes/tags
- Why collected: Display and organize prospects for user's networking efforts
- How used: Stored locally, displayed in extension UI, exportable to CSV
- Where stored: Chrome local storage on user's device only
- Not transmitted externally
- Not shared with third parties
- User can delete anytime

---

#### Permissions Justification

For each permission in your manifest, explain why it's needed:

**"storage" permission:**
```
Required to store scanned prospect data, user notes, tags, and settings locally on the user's device.
```

**"activeTab" permission:**
```
Required to read publicly visible profile information from the LinkedIn page the user is currently viewing.
```

**"scripting" permission:**
```
Required to inject the scan button and profile extraction functionality into LinkedIn pages.
```

**"sidePanel" permission:**
```
Required to display the prospect list and management interface in Chrome's side panel.
```

**"https://www.linkedin.com/*" host permission:**
```
Required to access LinkedIn pages to read publicly visible profile information. Extension only works on LinkedIn.com and requires access to extract profile data from the page DOM. Does not access LinkedIn's API or capture credentials.
```

---

#### Remote Code

**Does your extension execute remote code?**
- Answer: **NO**

(Remote code means fetching JavaScript from external servers and executing it. You do not do this.)

---

#### Privacy Policy

**Privacy Policy URL (Required):**
```
[Your hosted privacy policy URL from earlier]
```

Make sure URL is:
- Publicly accessible
- HTTPS (secure)
- Stable (won't change)

---

### Step 5: Distribution Tab

#### Visibility

**Initial Recommendation: Start with "Unlisted"**

Options:
1. **Unlisted** (Recommended for first submission)
   - Extension is published but not searchable
   - Only accessible via direct link
   - You can test with real users before going fully public
   - Good for soft launch

2. **Public**
   - Visible in Chrome Web Store search
   - Anyone can find and install
   - Use after you're confident extension is stable

**Selected:** [ ] Unlisted  [ ] Public

#### Regions

**Distribution regions:**
- Select: **All regions** (or specific regions if you prefer)
- Most extensions use "All regions"

---

### Step 6: Payment Tab

**Is this extension free?**
- Answer: **YES**

(You're not charging for the extension, so select free)

---

### Step 7: Review & Submit

1. **Review all tabs for completeness:**
   - [ ] Store Listing: Name, description, category filled
   - [ ] Privacy: All questions answered, privacy policy URL provided
   - [ ] Distribution: Visibility and regions set
   - [ ] Payment: Marked as free

2. **Save Draft:**
   - Click "Save draft" before submitting
   - Review everything one more time

3. **Submit for Review:**
   - Click "Submit for review" button
   - Confirm submission in popup dialog
   - You'll receive confirmation email

---

## After Submission

### What Happens Next

1. **Automated Checks (Immediate):**
   - Chrome runs automated security and policy scans
   - Usually completes in minutes to hours

2. **Manual Review (If Required):**
   - Google team reviews extension manually
   - Can take anywhere from a few hours to several days
   - Average: 1-3 business days
   - First-time submissions may take longer

3. **Review Outcome:**
   - **Approved:** Extension goes live immediately (or on schedule you set)
   - **Rejected:** You'll receive email with specific reasons and required changes

### If Approved

**Congratulations!** Your extension is live.

**Next Steps:**
1. Check extension listing: https://chrome.google.com/webstore/detail/[your-extension-id]
2. Share link with initial users (if Unlisted)
3. Monitor for early feedback
4. Watch for support emails
5. Consider switching to Public visibility after soft launch period

**Extension URL:**
```
https://chrome.google.com/webstore/detail/[extension-id-from-dashboard]
```

### If Rejected

**Don't panic** - rejections are common and fixable.

**Common Rejection Reasons:**

1. **Insufficient Privacy Disclosure**
   - Solution: Review privacy tab, add more detail about data handling
   - Emphasize local storage only, no transmission

2. **Permissions Too Broad**
   - Solution: Review if any permissions can be removed
   - Provide clearer justifications

3. **Misleading Listing**
   - Solution: Ensure description doesn't over-promise
   - Don't claim affiliation with LinkedIn

4. **Missing Privacy Policy**
   - Solution: Ensure URL is accessible and complete
   - Make sure it loads on HTTPS

5. **Functionality Issues**
   - Solution: Fix reported bugs, re-test thoroughly
   - Submit updated version

**How to Respond to Rejection:**

1. Read rejection email carefully
2. Address ALL points mentioned
3. Fix issues in code or listing
4. If code changes: bump version to 1.0.1, rebuild, create new ZIP
5. Update store listing if needed
6. Resubmit with explanation of changes made
7. If unclear, reply to rejection email asking for clarification

---

## Post-Launch Monitoring

### Week 1 After Launch

- [ ] Check for user reviews daily
- [ ] Respond to any reviews (especially negative ones)
- [ ] Monitor support email for bug reports
- [ ] Check Chrome Web Store dashboard for metrics

### Metrics to Track

Dashboard shows:
- Impressions (how many see your listing)
- Installs
- Uninstalls
- Weekly active users
- Crashes (if any)

### Handling Early Issues

If users report bugs:
1. Acknowledge quickly (within 24 hours)
2. Reproduce bug in test environment
3. Fix and prepare update
4. Follow update submission process (see updates-guide.md)

---

## Useful Links

- **Developer Dashboard:** https://chrome.google.com/webstore/devconsole
- **Chrome Web Store Policies:** https://developer.chrome.com/docs/webstore/program-policies/
- **Extension Review Process:** https://developer.chrome.com/docs/webstore/review-process/
- **Extension Best Practices:** https://developer.chrome.com/docs/webstore/best_practices/

---

## Checklist Summary

Before clicking "Submit for review":

- [ ] Developer account active and paid
- [ ] Privacy policy hosted at stable URL
- [ ] ZIP package created and tested
- [ ] All store listing fields filled accurately
- [ ] Privacy tab completed thoroughly
- [ ] Permissions justified clearly
- [ ] Distribution settings configured (Unlisted or Public)
- [ ] Screenshots uploaded (if required)
- [ ] Support email set up and monitored
- [ ] QA test plan completed with no critical failures
- [ ] Draft saved and reviewed one final time

**Ready to submit:** YES / NO

**Submission Date:** _______________

**Expected Review Completion:** _______________ (add 3 business days)

---

## Notes

Use this space for submission notes, reviewer messages, or tracking:

_______________________________________________
_______________________________________________
_______________________________________________
