# Extension Updates Guide

Comprehensive guide for releasing updates to the LinkedIn Connection Scanner extension on Chrome Web Store.

---

## When to Release an Update

Release updates for:
- **Bug fixes** (any severity)
- **Security vulnerabilities** (URGENT - release immediately)
- **New features** (planned and tested)
- **Performance improvements**
- **LinkedIn layout changes** (when LinkedIn updates break functionality)
- **Chrome API changes** (when Chrome deprecates features)

---

## Version Numbering Policy

Use semantic versioning: `MAJOR.MINOR.PATCH`

**Format:** `X.Y.Z`

**Examples:**
- `1.0.0` - Initial release
- `1.0.1` - Bug fix (patch)
- `1.1.0` - New feature (minor)
- `2.0.0` - Breaking change or major rewrite (major)

### Guidelines

**PATCH (1.0.X)** - Increment for:
- Bug fixes
- Security patches
- Minor text/UI tweaks
- Performance improvements
- No new features

**MINOR (1.X.0)** - Increment for:
- New features
- Non-breaking enhancements
- New settings or options
- Additional export formats
- Backwards compatible changes

**MAJOR (X.0.0)** - Increment for:
- Breaking changes (data structure changes)
- Complete UI redesign
- Removal of features
- Incompatible API changes
- Requires data migration

---

## Update Development Process

### Step 1: Plan the Update

1. **Identify changes needed**
   - Bug reports from users
   - Feature requests
   - Technical debt
   - LinkedIn changes

2. **Create change list**
   ```
   Version 1.0.1 Changes:
   - Fix: Pagination not working on certain search pages
   - Fix: Export CSV missing some character encodings
   - Improve: Scan button positioning on mobile LinkedIn
   ```

3. **Determine version number**
   - Based on changes: 1.0.1 (bug fixes only)

---

### Step 2: Development

1. **Create branch (if using git)**
   ```bash
   git checkout -b release-1.0.1
   ```

2. **Update version in manifest.json**
   ```json
   {
     "version": "1.0.1",
     ...
   }
   ```

3. **Update version in package.json**
   ```json
   {
     "version": "1.0.1",
     ...
   }
   ```

4. **Make code changes**
   - Fix bugs
   - Add features
   - Test thoroughly

5. **Run type checking**
   ```bash
   npm run type-check
   ```

---

### Step 3: Testing

**Critical: Test updates more thoroughly than initial release**

1. **Run regression tests**
   - Re-run critical tests from QA test plan (see qa-test-plan.md)
   - Focus on:
     - Core scanning functionality
     - Data storage and retrieval
     - Export functionality
     - Any area touched by your changes

2. **Test upgrade path**
   - Install previous version (1.0.0)
   - Scan some prospects, add notes
   - Load unpacked version of new update (1.0.1)
   - Verify data persists correctly
   - Verify all features still work
   - Check for migration issues

3. **Test clean install**
   - Fresh Chrome profile
   - Install new version directly
   - Verify works correctly

4. **Browser testing**
   - Chrome (latest)
   - Edge (if applicable)
   - Test on Windows and Mac if possible

---

### Step 4: Prepare Release Materials

#### A. Update Changelog

Create or update `CHANGELOG.md` in project root:

```markdown
# Changelog

## [1.0.1] - 2024-01-15

### Fixed
- Pagination button detection on search results pages
- CSV export now handles special characters correctly
- Scan button positioning on narrow browser windows

### Improved
- Faster profile extraction (30% performance improvement)
- Better error messages when LinkedIn is rate limiting

## [1.0.0] - 2024-01-01

### Added
- Initial release
- Scan 2nd degree connections from LinkedIn
- Local storage of prospect data
- Export to CSV
- Notes and tags functionality
```

#### B. Write Release Notes

Create: `notes/release-notes-v1.0.1.txt`

**Format for Chrome Web Store "What's new" field:**

```
Version 1.0.1 - Bug Fixes & Improvements

FIXED:
• Pagination now works correctly on all LinkedIn search layouts
• CSV export properly handles special characters and international names
• Scan button positioning improved for narrow browser windows

IMPROVED:
• 30% faster profile scanning
• Better error messages during rate limiting
• More reliable detection of LinkedIn's page structure

Thank you for using LinkedIn Connection Scanner! Report issues to: deep@deepsoni.com
```

**Length limit:** 500 characters for "What's new" field

#### C. Build Production Package

```bash
# Clean previous build
rm -rf dist/

# Build production version
npm run build

# Verify dist/ folder
ls dist/
```

#### D. Create ZIP Package

```bash
cd dist
zip -r ../linkedin-connection-scanner-v1.0.1.zip .
```

Or Windows:
- Go to dist/ folder
- Select all files
- Right-click → Send to → Compressed folder
- Rename to: `linkedin-connection-scanner-v1.0.1.zip`

**Verify ZIP:**
- Open ZIP
- Should see manifest.json at root (not in subfolder)
- Version in manifest should be 1.0.1

---

### Step 5: Review Checklist

Before submitting update:

**Code Quality:**
- [ ] Version number updated in manifest.json
- [ ] Version number updated in package.json
- [ ] Code changes completed and tested
- [ ] No console errors or warnings
- [ ] TypeScript type-check passes

**Testing:**
- [ ] Regression tests passed (no existing features broken)
- [ ] New features tested thoroughly
- [ ] Upgrade path tested (old version → new version)
- [ ] Clean install tested
- [ ] Tested on Windows/Mac if applicable

**Documentation:**
- [ ] CHANGELOG.md updated
- [ ] Release notes written
- [ ] Any new permissions documented
- [ ] Privacy policy updated (if data handling changed)

**Package:**
- [ ] Production build created
- [ ] ZIP package created correctly
- [ ] ZIP tested (load unpacked and verify)

---

## Submission Process

### Step 1: Access Developer Dashboard

1. Go to: https://chrome.google.com/webstore/devconsole
2. Sign in
3. Find "LinkedIn Connection Scanner" in your items list
4. Click on it to open item details

---

### Step 2: Upload New Version

1. Click "Package" tab on the left sidebar
2. Click "Upload new package" button
3. Select your new ZIP file (linkedin-connection-scanner-v1.0.1.zip)
4. Wait for upload and validation
5. Verify version number shown is correct (1.0.1)

**If upload fails:**
- Check ZIP structure
- Verify manifest.json is valid
- Ensure version number increased from previous version

---

### Step 3: Update Store Listing (If Needed)

**Only update if:**
- Description needs changes (new features to describe)
- Screenshots need updating
- Privacy practices changed (new data collected)

**Usually for bug fixes, you can skip this step**

If updating:
1. Click "Store Listing" tab
2. Update relevant fields
3. Save changes

---

### Step 4: Update Privacy Practices (If Needed)

**Update Privacy tab if:**
- You collect new types of data
- You change how data is stored or transmitted
- You add new permissions
- You integrate third-party services

**For most bug fix updates, you can skip this step**

If updating:
1. Click "Privacy" tab
2. Update data disclosures
3. Add justification for any new permissions
4. Save changes

---

### Step 5: Add Release Notes

1. Still in item details, look for "What's new" section (usually in Package or Store Listing tab)
2. Paste your release notes (max 500 characters)
3. Example:
   ```
   v1.0.1 - Bug Fixes
   • Fixed pagination on search pages
   • Improved CSV export character handling
   • Better scan button positioning
   • 30% faster scanning performance
   ```

---

### Step 6: Submit for Review

1. Click "Submit for review" button
2. Review summary of changes
3. Confirm submission
4. You'll receive confirmation email

---

### Step 7: Monitor Review Process

**Timeline:**
- Automated checks: Minutes to hours
- Manual review: 1-3 business days (usually faster for updates than initial submission)

**Check dashboard daily for:**
- Review status
- Any messages from Chrome team
- Approval or rejection notices

---

## Update Rollout Strategies

### Option A: Immediate Rollout (Default)

- Update goes live to all users as soon as approved
- Chrome auto-updates extensions in background
- Users get update within 24-48 hours
- **Use for:** Bug fixes, security patches, minor improvements

### Option B: Staged Rollout (Advanced)

Chrome Web Store supports percentage-based rollouts:

1. In Developer Dashboard → click your extension
2. Look for "Distribution" or "Rollout" settings
3. Set percentage (e.g., 10% of users first)
4. Monitor for issues
5. Increase percentage gradually (50%, 100%)

**Use for:**
- Major updates with risk of issues
- Significant UI changes
- First time releasing major features

**Staged Rollout Schedule Example:**
- Day 1: 10% of users
- Day 3: 25% of users (if no issues)
- Day 5: 50% of users (if no issues)
- Day 7: 100% of users

---

## After Update is Approved

### Step 1: Verify Update is Live

1. Check extension listing URL
2. Verify version number shows correctly
3. Test installing update in clean profile
4. Verify "What's new" shows correctly

---

### Step 2: Monitor User Feedback

**First 48 Hours Critical:**

Monitor:
- User reviews on Chrome Web Store
- Support email for bug reports
- Error reports in dashboard (if available)

**Respond to:**
- Negative reviews (within 24 hours)
- Bug reports (acknowledge within 24 hours)
- Common questions

---

### Step 3: Track Metrics

Dashboard shows:
- Update adoption rate (how many users on new version)
- Crash rate (any increase?)
- Uninstall rate (any spike?)
- New reviews and ratings

**Warning Signs:**
- Crash rate increases significantly
- Uninstall rate spikes
- Multiple similar bug reports
- Rating drops sharply

**If issues detected:**
- Prepare hotfix immediately
- Consider rollback if critical

---

## Rollback Procedure (Emergency)

If update causes critical issues:

### Option 1: Quick Hotfix (Preferred)

1. Fix critical bug immediately
2. Bump to 1.0.2
3. Submit as urgent update
4. Include "[URGENT]" in release notes
5. Request expedited review (mention in submission notes)

### Option 2: Rollback to Previous Version

Chrome Web Store doesn't support direct rollback, but you can:

1. Re-upload previous version ZIP (change version to 1.0.2 in manifest)
2. Submit with explanation: "Reverting to stable version 1.0.0 due to critical issue"
3. Once approved, prepare proper fix for 1.0.3

**Note:** You cannot re-upload same version number. Must increment version even for rollback.

---

## Update Communication

### Notify Users of Updates

**In-Extension Notification (Optional Enhancement):**
- Show "What's new" dialog after update
- Highlight new features
- Link to changelog

**External Communication:**
- Post update on GitHub releases (if applicable)
- Tweet/share on social media (if you have presence)
- Email notification list (if you have one)

**Example Email:**
```
Subject: LinkedIn Connection Scanner v1.0.1 - Bug Fixes & Performance Improvements

Hi [User],

We've released version 1.0.1 of LinkedIn Connection Scanner with important bug fixes and performance improvements:

✓ Fixed pagination on search results
✓ Improved CSV export character handling
✓ 30% faster scanning performance

Chrome will auto-update your extension within 24 hours. You can also update manually by going to chrome://extensions and clicking "Update".

Thanks for using LinkedIn Connection Scanner!

Questions? Reply to this email or visit deep@deepsoni.com
```

---

## Update Frequency Guidelines

**Bug Fixes:**
- Release as soon as tested
- Don't wait to batch with other fixes (unless very minor)

**Security Issues:**
- URGENT - Release immediately (same day)
- Skip staging, go straight to 100% rollout

**New Features:**
- Monthly or quarterly release cycle
- Batch related features together
- More thorough testing required

**LinkedIn Changes:**
- Monitor LinkedIn for layout/structure changes
- Release breaking-change fixes within 1 week
- Proactive updates when LinkedIn announces changes

---

## Long-Term Update Strategy

### Maintenance Schedule

**Monthly:**
- Check for LinkedIn layout changes
- Review bug reports and fix queue
- Consider minor feature additions
- Release update if needed

**Quarterly:**
- Major feature additions
- Performance optimization
- Code refactoring
- Dependency updates

**As Needed:**
- Chrome API deprecations
- Security vulnerabilities
- Critical bugs

---

## Version Planning Template

Use this template for planning updates:

```
VERSION: 1.X.X
TARGET DATE: [Date]
TYPE: [ ] Bug Fix  [ ] Feature  [ ] Security  [ ] Breaking Change

CHANGES:
- [Change 1]
- [Change 2]
- [Change 3]

TESTING REQUIREMENTS:
- [ ] Regression tests
- [ ] New feature tests
- [ ] Upgrade path tested
- [ ] Performance benchmarking

DOCUMENTATION UPDATES:
- [ ] Changelog
- [ ] Release notes
- [ ] README (if applicable)
- [ ] Privacy policy (if applicable)

ROLLOUT PLAN:
- [ ] Immediate 100%
- [ ] Staged (10% → 50% → 100%)

COMMUNICATION:
- [ ] Update "What's new"
- [ ] Notify users (if applicable)
- [ ] Social media post (if applicable)

MONITORING:
- [ ] Watch reviews (3 days)
- [ ] Check error reports
- [ ] Monitor uninstall rate
```

---

## Checklist: Quick Update Reference

For a typical bug fix update:

1. [ ] Update version in manifest.json and package.json
2. [ ] Make code changes
3. [ ] Run `npm run type-check`
4. [ ] Test thoroughly (regression tests)
5. [ ] Test upgrade path
6. [ ] Update CHANGELOG.md
7. [ ] Write release notes (500 char max)
8. [ ] Run `npm run build`
9. [ ] Create ZIP package
10. [ ] Test ZIP (load unpacked)
11. [ ] Upload to Chrome Web Store
12. [ ] Add "What's new" text
13. [ ] Submit for review
14. [ ] Monitor review status
15. [ ] After approval: verify live, monitor feedback

---

## Useful Commands

```bash
# Check version before update
grep '"version"' manifest.json

# Type check
npm run type-check

# Build production
npm run build

# Create ZIP (Linux/Mac)
cd dist && zip -r ../linkedin-connection-scanner-v$(grep -o '"version": "[^"]*' ../manifest.json | cut -d'"' -f4).zip .

# Load extension for testing
# chrome://extensions → Load unpacked → select dist/
```

---

## Notes

Track your updates here:

| Version | Date | Type | Changes Summary | Status |
|---------|------|------|-----------------|--------|
| 1.0.0 | [Date] | Initial | Initial release | ✓ Live |
| 1.0.1 | [Date] | Patch | Bug fixes | [ ] Planned |
|  |  |  |  |  |
