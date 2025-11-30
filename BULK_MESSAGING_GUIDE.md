# Bulk Messaging Feature - User Guide

## Overview

The Bulk Messaging feature allows you to safely send personalized messages to LinkedIn connections at scale. This is a **low-risk** approach that keeps you in control while streamlining your outreach process.

## How It Works

### Safety First
- Opens LinkedIn profile tabs in batches
- **You manually send each message** (no automation)
- Optional auto-click for "Message" button (still safe)
- Tracks who you've messaged
- Minimal risk of LinkedIn automation detection

### Key Features
1. **Message Templates** - Save and reuse common messages
2. **Campaigns** - Organize outreach by target audience
3. **Advanced Filtering** - Target by keywords, location, company, priority score
4. **Batch Processing** - Open 5, 10, or custom number of tabs at once
5. **Manual or Auto-click** - Choose your comfort level
6. **Status Tracking** - Know who's pending, opened, or messaged

## Getting Started

### Step 1: Create Message Templates (Optional)

1. Open the extension side panel
2. Click the **💬 Messages** tab
3. Click **Templates** button
4. Click **+ Create New Template**
5. Fill in:
   - Template Name (e.g., "Initial Outreach")
   - Message Content (your personalized message)
6. Click **Create Template**

**Tip**: Templates are optional. You can manually type each message if you prefer.

### Step 2: Create a Campaign

1. In the **Messages** tab, click **Campaigns**
2. Click **+ Create New Campaign**
3. Fill in:
   - **Campaign Name** (e.g., "Q4 Sales Outreach")
   - **Target Prospects** (New/Reviewed/All)
   - **Message Template** (optional - select a saved template)

4. **Advanced Filters** (Optional - click to expand):
   - **Keywords in Headline**: Filter by job titles (e.g., "founder, ceo, engineer")
   - **Location**: Filter by location (e.g., "san francisco, new york")
   - **Company**: Filter by company name (e.g., "google, stripe")
   - **Minimum Mutual Connections**: Only include prospects with X+ mutual connections
   - **Minimum Priority Score**: Use the same scoring system as the Prospects tab

5. Click **Create Campaign**

The campaign will include all prospects matching your filters. The filter count updates in real-time!

### Step 3: Send Messages in Batches

1. In your campaign, choose your messaging mode:

   **Manual Mode** (Safer - You click "Message"):
   - Click **Open 5**, **Open 10**, or **Custom**
   - Profile pages will open in new tabs
   - On each profile, manually click the "Message" button
   - Type/paste your message
   - Click **Send**

   **Auto-click Mode** (Faster - Button clicked automatically):
   - Click **Auto 5**, **Auto 10**, or **Custom**
   - Profile pages open AND "Message" button is auto-clicked
   - Messaging compose window opens automatically
   - Type/paste your message
   - Click **Send**

2. For each opened tab:
   - If you selected a template, copy it from the Templates section
   - Paste or type your message
   - Personalize if needed (IMPORTANT!)
   - Click **Send** manually

3. The extension automatically tracks these as "opened"

4. Repeat for the next batch when ready

## Best Practices

### Message Personalization
- Always personalize messages with the recipient's name
- Reference their profile, company, or recent posts
- Keep it concise and relevant
- Add value (don't just pitch)

### Pacing Strategy
- **Start slow**: 10-20 messages per day
- **Spread throughout the day**: Don't send all at once
- **Monitor response rate**: Adjust your message if low
- **Respect limits**: LinkedIn allows ~100 connection requests/week

### Campaign Organization
- Create separate campaigns for different audiences
- Use descriptive names (e.g., "Tech Founders - SF", "Marketing Directors")
- Use advanced filters to precisely target your audience
- Track results by campaign

### Advanced Filtering Strategy
- **Keywords**: Target specific roles (e.g., "founder, ceo" for decision-makers)
- **Location**: Focus on geographic regions for your market
- **Company**: Target employees from specific companies or competitors
- **Mutual Connections**: Higher mutual = warmer intro
- **Priority Score**: Leverage the scoring system to target best prospects first

Example filters for a B2B SaaS campaign:
- Keywords: "founder, cto, vp engineering"
- Location: "san francisco, new york, austin"
- Minimum Mutual Connections: 3
- Minimum Priority Score: 20

### Template Tips
- Create 3-5 templates for different scenarios
- Test different approaches
- Update based on what gets responses
- Keep them short (2-3 sentences max)

## Safety & Compliance

### Why This Approach Is Safe
- **No automated sending**: You manually send each message
- **Uses native LinkedIn interface**: Opens profiles normally
- **Auto-click is optional**: Choose manual mode if preferred
- **User-controlled pacing**: You decide when to send
- **No mass actions**: Opens tabs one batch at a time
- **Low detection risk**: Behaves like normal browsing with button clicks

### LinkedIn Terms of Service
While this tool doesn't automate sending, remember:
- Don't send spam or unsolicited messages
- Personalize your outreach
- Respect people who don't respond
- Follow LinkedIn's messaging guidelines

### Account Safety Tips
1. **Warm up slowly** - Start with 10-15 messages/day
2. **Be human** - Vary your message timing
3. **Quality over quantity** - Better to send 20 good messages than 100 generic ones
4. **Monitor your account** - Watch for any LinkedIn warnings

## Workflow Example

### Daily Outreach Routine

**Morning (9-10am)**
1. Open extension side panel
2. Go to Messages tab
3. Select your active campaign
4. Click "Open 10 Tabs"
5. Send 10 personalized messages
6. Take a break

**Afternoon (2-3pm)**
1. Return to the campaign
2. Click "Open 10 Tabs" again
3. Send another 10 messages
4. Done for the day!

**Total**: 20 messages/day = 100-140/week (safe rate)

## Campaign Stats

Each campaign shows:
- **Total**: Total contacts in campaign
- **Pending**: Not yet opened
- **Opened**: Messaging tabs opened (you need to send)
- **Messaged**: Successfully sent (manual tracking)

**Note**: The extension tracks "opened" automatically. You can manually mark as "messaged" if you want (feature can be added).

## Troubleshooting

### Message button not found (Auto-click mode)
- Some profiles don't have a visible Message button (Premium only, blocked, etc.)
- Auto-click will show a notification if button not found
- Solution: Switch to Manual mode or click the button yourself

### Too many tabs opening
- Start with smaller batches (5 tabs)
- Close tabs as you send each message
- Use the "Custom" option for precise control

### Advanced filters showing 0 prospects
- Filters are cumulative (AND logic, not OR)
- Try relaxing some filters
- Check if you have prospects with that status (New/Reviewed)
- Verify spelling of keywords, locations, companies

### Lost track of who I messaged
- Check campaign stats
- Use "Opened" status as a guide
- Add notes in the Prospects tab

### Auto-click not working
- Wait for page to fully load (2+ seconds)
- LinkedIn may have changed their button selectors
- Fallback to Manual mode
- Check browser console (F12) for debug messages

## Pro Tips

1. **Copy template before opening tabs**: Have your message ready to paste
2. **Use keyboard shortcuts**: Ctrl+V to paste, Tab to navigate
3. **Close tabs as you go**: Keeps browser manageable
4. **Mark prospects as "Connected"**: After messaging, update status in Prospects tab
5. **Track responses**: Use the CRM Pipeline tab to manage conversations

## Future Enhancements

Potential features (not yet implemented):
- Auto-populate message field (browser extension)
- A/B testing different templates
- Response rate tracking
- Follow-up campaign automation
- Integration with CRM pipeline

## Support

For issues or feature requests:
1. Check this guide first
2. Review the main README.md
3. Open an issue on GitHub (if applicable)

---

**Remember**: Quality outreach beats quantity. Take time to personalize, be genuine, and provide value. Happy networking!
