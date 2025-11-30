# QA Test Plan for Chrome Web Store Submission

Comprehensive pre-submission testing checklist to ensure extension works correctly and meets Chrome Web Store requirements.

---

## Prerequisites

### Test Environment Setup

1. **Fresh Chrome Profile**
   - Create new Chrome user profile (Settings → Add Person)
   - Use clean profile with no other extensions
   - Ensures no conflicts or interference
   - Command: `chrome.exe --user-data-dir="C:\ChromeTest" --profile-directory="Default"`

2. **LinkedIn Account**
   - Use real LinkedIn account (test account if available)
   - Ensure account has connections and 2nd degree connections visible
   - Verify account is in good standing

3. **Extension Package**
   - Build production version: `npm run build`
   - Verify dist/ folder contains all required files
   - Do NOT test with development build

4. **Load Extension**
   - Go to chrome://extensions/
   - Enable "Developer mode" (toggle top right)
   - Click "Load unpacked"
   - Select the dist/ folder
   - Verify extension appears with correct icon and name

---

## Phase 1: Installation & Permissions

### Test 1.1: Clean Install

**Steps:**
1. Load unpacked extension in clean Chrome profile
2. Observe permissions prompt (if any)
3. Click extension icon in toolbar

**Expected Results:**
- ✓ Extension installs without errors
- ✓ Icon appears in Chrome toolbar
- ✓ No console errors in chrome://extensions/ (click "Errors" button)
- ✓ Permissions prompt (if shown) clearly lists: storage, activeTab, sidePanel, scripting, and linkedin.com access

**Pass/Fail:** ___________

**Notes:** ___________________________________________


### Test 1.2: Permissions Clarity

**Steps:**
1. Right-click extension icon → "This can read and change site data"
2. Review permissions list

**Expected Results:**
- ✓ Shows "On linkedin.com"
- ✓ Does NOT show "On all sites"
- ✓ Permissions match manifest.json

**Pass/Fail:** ___________


### Test 1.3: Manifest Validation

**Steps:**
1. Open dist/manifest.json
2. Verify all required fields present
3. Check for any manifest errors in chrome://extensions/

**Expected Results:**
- ✓ manifest_version: 3
- ✓ name: "LinkedIn Connection Scanner"
- ✓ version: "1.0.0"
- ✓ description present and clear (max 132 characters)
- ✓ icons: 16, 48, 128 present and valid
- ✓ No manifest errors shown in Chrome

**Pass/Fail:** ___________

---

## Phase 2: First-Run Experience

### Test 2.1: Initial Extension Click

**Steps:**
1. Click extension icon in toolbar
2. Observe popup/side panel appearance

**Expected Results:**
- ✓ Extension UI opens (popup or side panel)
- ✓ UI displays correctly (no broken layout)
- ✓ Empty state shown (no prospects yet)
- ✓ Clear instructions on how to use extension
- ✓ No console errors (F12 → Console tab)

**Pass/Fail:** ___________


### Test 2.2: LinkedIn Page Visit (No Scan)

**Steps:**
1. Navigate to https://www.linkedin.com/
2. Log in to LinkedIn
3. Browse to any profile or search page
4. Do NOT trigger scan yet

**Expected Results:**
- ✓ Extension icon remains visible
- ✓ No errors in console
- ✓ Page loads normally (extension doesn't break LinkedIn)
- ✓ Scan button may appear on page (verify styling is appropriate)

**Pass/Fail:** ___________

---

## Phase 3: Core Scanning Functionality

### Test 3.1: Scan from LinkedIn Search Results

**Steps:**
1. Go to LinkedIn People Search: https://www.linkedin.com/search/results/people/
2. Add filters to show 2nd degree connections (if available)
3. Click "Scan 2nd Connections" button (or trigger via extension popup)
4. When prompted, enter "20" as target count
5. Wait for scan to complete

**Expected Results:**
- ✓ Scan dialog appears with input for target count
- ✓ Scan button shows progress: "Scanning X/20..."
- ✓ Extension scans current page without errors
- ✓ Progress updates during scan
- ✓ Scan completes successfully
- ✓ Notification shows: "Successfully scanned X prospects"
- ✓ No console errors during scan
- ✓ LinkedIn page still functional after scan

**Pass/Fail:** ___________

**Prospects Found:** ___________


### Test 3.2: Scan Pagination

**Steps:**
1. Start scan with target count of 50 (requires multiple pages)
2. Observe extension navigating to next page
3. Wait for full scan completion

**Expected Results:**
- ✓ Extension automatically goes to next page after scanning current page
- ✓ Progress indicator updates correctly
- ✓ Scans stop when target reached or no more pages
- ✓ Final notification shows correct total count
- ✓ No duplicate profiles scanned

**Pass/Fail:** ___________


### Test 3.3: Scan from My Network Page

**Steps:**
1. Navigate to: https://www.linkedin.com/mynetwork/
2. Trigger scan
3. Enter target count of 10
4. Wait for completion

**Expected Results:**
- ✓ Scan works on My Network page
- ✓ Prospects extracted correctly
- ✓ Scan completes successfully

**Pass/Fail:** ___________


### Test 3.4: Stop Scan Mid-Process

**Steps:**
1. Start scan with large target (e.g., 100)
2. Click stop/cancel during scan
3. Verify scan stops

**Expected Results:**
- ✓ Scan stops immediately
- ✓ Partial results saved
- ✓ UI returns to normal state
- ✓ Can start new scan after stopping

**Pass/Fail:** ___________

---

## Phase 4: Data Storage & Display

### Test 4.1: View Scanned Prospects

**Steps:**
1. After successful scan, open extension side panel/popup
2. View list of prospects

**Expected Results:**
- ✓ All scanned prospects appear in list
- ✓ Each prospect shows: name, headline, company, location, mutual connections
- ✓ Profile URLs are correct and clickable
- ✓ Data formatting is clean (no "undefined" or "null" text)
- ✓ List is scrollable if many prospects

**Pass/Fail:** ___________


### Test 4.2: Data Persistence

**Steps:**
1. Scan some prospects
2. Close extension UI
3. Close and reopen Chrome browser
4. Open extension UI again

**Expected Results:**
- ✓ Previously scanned prospects still appear
- ✓ No data loss after browser restart
- ✓ Counts and statistics maintained

**Pass/Fail:** ___________


### Test 4.3: Storage Inspection

**Steps:**
1. Open Chrome DevTools (F12)
2. Go to Application tab → Local Storage
3. Find extension storage
4. Inspect stored data

**Expected Results:**
- ✓ Data stored in chrome.storage.local
- ✓ Keys: linkedin_prospects, scan_stats, etc.
- ✓ Data structure looks correct (valid JSON)
- ✓ No sensitive credentials stored
- ✓ No LinkedIn password/tokens visible

**Pass/Fail:** ___________

---

## Phase 5: User Interactions

### Test 5.1: Add Notes to Prospect

**Steps:**
1. Open extension UI
2. Select a prospect
3. Add notes in notes field
4. Save notes

**Expected Results:**
- ✓ Notes field accessible
- ✓ Can type and save notes
- ✓ Notes persist after closing and reopening
- ✓ Notes display correctly

**Pass/Fail:** ___________


### Test 5.2: Add Tags to Prospect

**Steps:**
1. Select a prospect
2. Add tags (e.g., "hot lead", "follow-up")
3. Save changes

**Expected Results:**
- ✓ Can create and assign tags
- ✓ Tags appear on prospect card
- ✓ Tags persist across sessions

**Pass/Fail:** ___________


### Test 5.3: Change Prospect Status

**Steps:**
1. Select a prospect
2. Change status from "new" to "contacted"
3. Verify change

**Expected Results:**
- ✓ Status dropdown works
- ✓ Status updates correctly
- ✓ Status persists

**Pass/Fail:** ___________


### Test 5.4: Delete Single Prospect

**Steps:**
1. Select a prospect
2. Click delete/trash icon
3. Confirm deletion

**Expected Results:**
- ✓ Confirmation dialog appears
- ✓ Prospect removed from list after confirmation
- ✓ Prospect stays if deletion cancelled
- ✓ Stats update (total count decreases)

**Pass/Fail:** ___________


### Test 5.5: Search/Filter Prospects

**Steps:**
1. Ensure you have multiple prospects scanned
2. Use search/filter feature
3. Try filtering by status, tags, or keywords

**Expected Results:**
- ✓ Search/filter works correctly
- ✓ Results update in real-time
- ✓ Can clear filter to show all
- ✓ No errors during filtering

**Pass/Fail:** ___________

---

## Phase 6: Export Functionality

### Test 6.1: Export to CSV

**Steps:**
1. Scan at least 10 prospects
2. Click "Export to CSV" button
3. Save file
4. Open CSV in Excel/Sheets

**Expected Results:**
- ✓ CSV download triggered
- ✓ File downloads successfully
- ✓ CSV contains correct headers: Name, Headline, Company, Location, Mutual Connections, Profile URL, Status, Notes, Tags
- ✓ All prospect data present and correctly formatted
- ✓ Special characters (commas, quotes) handled correctly
- ✓ URLs are clickable in spreadsheet applications

**Pass/Fail:** ___________


### Test 6.2: Export Empty List

**Steps:**
1. Clear all data
2. Try to export with no prospects

**Expected Results:**
- ✓ Either exports CSV with headers only, OR shows message "No data to export"
- ✓ No errors thrown

**Pass/Fail:** ___________

---

## Phase 7: Data Deletion

### Test 7.1: Clear All Data

**Steps:**
1. Scan multiple prospects (at least 10)
2. Go to Settings
3. Click "Clear All Data"
4. Confirm action

**Expected Results:**
- ✓ Confirmation dialog shown
- ✓ All prospects deleted after confirmation
- ✓ Stats reset to zero
- ✓ Empty state shown in UI
- ✓ Can start fresh scan after clearing

**Pass/Fail:** ___________


### Test 7.2: Uninstall Extension

**Steps:**
1. Scan some prospects
2. Right-click extension icon → Remove from Chrome
3. Confirm removal
4. Reinstall extension
5. Check if data persists

**Expected Results:**
- ✓ Extension uninstalls cleanly
- ✓ After reinstall, no old data present (fresh start)
- ✓ Extension reinstalls and works normally

**Pass/Fail:** ___________

---

## Phase 8: Error Handling & Edge Cases

### Test 8.1: Rate Limiting / LinkedIn Blocks

**Steps:**
1. Perform rapid consecutive scans
2. Scan large numbers (e.g., 500)
3. Observe behavior

**Expected Results:**
- ✓ Extension handles rate limits gracefully
- ✓ Clear error message if LinkedIn blocks/throttles
- ✓ Extension doesn't crash
- ✓ User can retry after waiting

**Pass/Fail:** ___________


### Test 8.2: Network Interruption

**Steps:**
1. Start a scan
2. Disconnect internet mid-scan
3. Observe behavior

**Expected Results:**
- ✓ Extension handles network failure gracefully
- ✓ Error message displayed
- ✓ Partial data saved (if any)
- ✓ Can retry after reconnecting

**Pass/Fail:** ___________


### Test 8.3: LinkedIn Layout Changes

**Steps:**
1. Test on different LinkedIn page layouts (if possible)
2. Try on profiles with missing information (no company, no location, etc.)

**Expected Results:**
- ✓ Extension handles missing fields gracefully
- ✓ Shows "Unknown" or blank for missing data (not "undefined" or "null")
- ✓ Doesn't crash on unexpected DOM structure

**Pass/Fail:** ___________


### Test 8.4: Invalid Input

**Steps:**
1. Start scan
2. Enter invalid target count (e.g., -5, 10000, "abc")
3. Observe validation

**Expected Results:**
- ✓ Validation prevents invalid input
- ✓ Clear error message shown
- ✓ Scan doesn't start with invalid input
- ✓ Reasonable limits enforced (10-1000 as per code)

**Pass/Fail:** ___________


### Test 8.5: Multiple Tabs

**Steps:**
1. Open LinkedIn in multiple tabs
2. Try scanning from different tabs
3. Check data consistency

**Expected Results:**
- ✓ Extension works in multiple tabs
- ✓ No duplicate data created
- ✓ Data synced across tabs (if applicable)
- ✓ No conflicts or race conditions

**Pass/Fail:** ___________

---

## Phase 9: Performance & Resource Usage

### Test 9.1: Memory Usage

**Steps:**
1. Open Chrome Task Manager (Shift+Esc)
2. Scan 100+ prospects
3. Monitor extension memory usage

**Expected Results:**
- ✓ Memory usage reasonable (<100MB for typical usage)
- ✓ No memory leaks (usage doesn't keep growing)
- ✓ Memory released after clearing data

**Pass/Fail:** ___________

**Memory Usage:** ___________


### Test 9.2: CPU Usage

**Steps:**
1. Monitor CPU during scan
2. Monitor CPU while browsing with extension idle

**Expected Results:**
- ✓ CPU usage reasonable during scan (spikes are OK)
- ✓ Near-zero CPU when idle
- ✓ LinkedIn browsing not noticeably slower

**Pass/Fail:** ___________


### Test 9.3: Large Dataset

**Steps:**
1. Scan 500+ prospects
2. Test UI responsiveness
3. Test search/filter performance
4. Test export performance

**Expected Results:**
- ✓ UI remains responsive with large dataset
- ✓ Search/filter still fast
- ✓ Export completes successfully
- ✓ No browser freezing

**Pass/Fail:** ___________

---

## Phase 10: Compatibility Testing

### Test 10.1: Browser Compatibility

Test on these browsers (all Chromium-based):

**Chrome (latest stable):**
- Version: ___________
- Pass/Fail: ___________

**Microsoft Edge (latest stable):**
- Version: ___________
- Pass/Fail: ___________

**Brave (if applicable):**
- Version: ___________
- Pass/Fail: ___________

**Expected Results:**
- ✓ Works on all Chromium browsers
- ✓ No browser-specific bugs


### Test 10.2: Operating System Compatibility

**Windows 10/11:**
- Pass/Fail: ___________

**macOS:**
- Pass/Fail: ___________

**Linux (optional):**
- Pass/Fail: ___________

**Expected Results:**
- ✓ Extension works on all major OS platforms
- ✓ File paths handled correctly (CSV export)


### Test 10.3: LinkedIn Interface Variations

**LinkedIn Free Account:**
- Pass/Fail: ___________

**LinkedIn Premium (if available):**
- Pass/Fail: ___________

**Different Languages (optional):**
- Pass/Fail: ___________

**Expected Results:**
- ✓ Works with different LinkedIn account types
- ✓ Handles different LinkedIn UI variations

---

## Phase 11: Security & Privacy Checks

### Test 11.1: No Credential Capture

**Steps:**
1. Open Chrome DevTools → Network tab
2. Log into LinkedIn
3. Trigger extension actions
4. Review network requests

**Expected Results:**
- ✓ NO requests to external servers from extension
- ✓ NO LinkedIn credentials captured or logged
- ✓ NO authentication tokens stored or transmitted
- ✓ All network activity is to LinkedIn.com only (initiated by user)

**Pass/Fail:** ___________


### Test 11.2: No External Data Transmission

**Steps:**
1. Open DevTools → Network tab
2. Perform all extension actions (scan, export, etc.)
3. Filter for requests from extension

**Expected Results:**
- ✓ ZERO network requests to external domains
- ✓ No analytics pings
- ✓ No tracking requests
- ✓ No data sent to developer servers

**Pass/Fail:** ___________


### Test 11.3: Console Errors & Warnings

**Steps:**
1. Open DevTools → Console
2. Use all extension features
3. Check for errors or warnings

**Expected Results:**
- ✓ No JavaScript errors (red messages)
- ✓ Minimal warnings (yellow messages)
- ✓ Any warnings are non-critical and documented

**Pass/Fail:** ___________

**Notes on any warnings:** ___________________________________________

---

## Phase 12: User Experience & Polish

### Test 12.1: Visual Design

**Steps:**
1. Review all UI screens
2. Check responsive design
3. Verify icon quality

**Expected Results:**
- ✓ UI is clean and professional
- ✓ Consistent styling throughout
- ✓ Icons clear at all sizes (16px, 48px, 128px)
- ✓ No broken layouts or overlapping text
- ✓ Readable fonts and appropriate font sizes

**Pass/Fail:** ___________


### Test 12.2: User Guidance

**Steps:**
1. Use extension as first-time user
2. Check for help text, tooltips, instructions

**Expected Results:**
- ✓ Clear instructions on how to start scanning
- ✓ Helpful error messages (not just "Error")
- ✓ Empty states provide guidance
- ✓ Button labels are clear and descriptive

**Pass/Fail:** ___________


### Test 12.3: Feedback & Notifications

**Steps:**
1. Trigger various actions
2. Observe notifications/feedback

**Expected Results:**
- ✓ Success notifications shown when appropriate
- ✓ Error messages clear and actionable
- ✓ Loading indicators during operations
- ✓ Notifications auto-dismiss after reasonable time

**Pass/Fail:** ___________

---

## Phase 13: Chrome Web Store Requirements

### Test 13.1: Required Assets Present

**Checklist:**
- ✓ Icons (16x16, 48x48, 128x128) present in dist/icons/
- ✓ Icons are clear, recognizable, not pixelated
- ✓ manifest.json complete and valid
- ✓ Description is clear and under 132 characters
- ✓ No copyrighted material in icons/name (besides acceptable LinkedIn reference)

**Pass/Fail:** ___________


### Test 13.2: Policy Compliance

**Review manifest and code for:**
- ✓ No obfuscated code
- ✓ No remote code execution
- ✓ No cryptocurrency mining
- ✓ Minimal permissions (only what's needed)
- ✓ Clear single purpose (networking/CRM tool)
- ✓ No deceptive behavior

**Pass/Fail:** ___________


### Test 13.3: Privacy Policy Available

**Checklist:**
- ✓ Privacy policy written and reviewed
- ✓ Privacy policy hosted on public URL
- ✓ URL accessible and stable
- ✓ Policy accurate and complete

**Pass/Fail:** ___________

**Privacy Policy URL:** ___________________________________________

---

## Final Checklist Before Submission

### Code Quality
- ✓ Run `npm run build` successfully
- ✓ No TypeScript errors: `npm run type-check`
- ✓ Code reviewed for security issues
- ✓ Console.log statements removed or minimal

### Package Preparation
- ✓ Create ZIP of dist/ folder
- ✓ ZIP file under 50MB (should be much smaller)
- ✓ All required files included
- ✓ No source code files (*.ts) in dist/

### Documentation Ready
- ✓ Privacy policy uploaded and URL obtained
- ✓ Data disclosure answers prepared
- ✓ Screenshots prepared (even though not required by user, good to have)
- ✓ Support email set up and monitored

### Final Testing
- ✓ All critical tests passed
- ✓ No blockers remaining
- ✓ Edge cases handled gracefully
- ✓ User experience polished

---

## Test Summary

**Date of Testing:** ___________

**Tester:** ___________

**Chrome Version:** ___________

**Extension Version:** 1.0.0

**Total Tests:** 56

**Tests Passed:** ___________

**Tests Failed:** ___________

**Critical Issues:** ___________

**Non-Critical Issues:** ___________

**Ready for Submission:** YES / NO

**Notes:**
___________________________________________
___________________________________________
___________________________________________

---

## Issue Tracking

If tests fail, document issues here:

| Test # | Issue Description | Severity (High/Med/Low) | Status | Resolution |
|--------|-------------------|-------------------------|--------|------------|
|        |                   |                         |        |            |
|        |                   |                         |        |            |
|        |                   |                         |        |            |

---

## Regression Testing (For Updates)

When submitting updates, re-run these critical tests:
- Phase 3: Core Scanning Functionality
- Phase 4: Data Storage & Display
- Phase 6: Export Functionality
- Phase 11: Security & Privacy Checks

Plus any tests related to changed features.
