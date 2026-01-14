# Setup Guide

Complete step-by-step installation and configuration guide for Parish Email Autoresponder.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Step 1: Get Gemini API Key](#step-1-get-gemini-api-key)
- [Step 2: Install Apps Script CLI](#step-2-install-apps-script-cli)
- [Step 3: Deploy Code](#step-3-deploy-code)
- [Step 4: Create Knowledge Base](#step-4-create-knowledge-base)
- [Step 5: Configure Script Properties](#step-5-configure-script-properties)
- [Step 6: Enable Gmail API](#step-6-enable-gmail-api)
- [Step 7: Create Time Trigger](#step-7-create-time-trigger)
- [Step 8: Test the System](#step-8-test-the-system)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

- ✅ Google account (Gmail or Workspace)
- ✅ Node.js installed (v14 or higher)
- ✅ Basic familiarity with command line
- ✅ 30 minutes of setup time

**Check Node.js version:**
```bash
node --version
# Should output v14.0.0 or higher
```

---

## Step 1: Get Gemini API Key

### 1.1 Create API Key

1. Visit https://ai.google.dev/
2. Click "Get API key" in top right
3. Sign in with your Google account
4. Click "Create API key"
5. Select or create a Google Cloud project
6. Copy the generated API key

**Important:** Keep this key secure! Don't share it or commit it to version control.

### 1.2 Verify API Key

Test your key works:

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

You should see a JSON response with generated text.

---

## Step 2: Install Apps Script CLI

### 2.1 Install clasp

```bash
npm install -g @google/clasp
```

### 2.2 Login to Google

```bash
clasp login
```

This opens a browser window for authentication. Grant the requested permissions.

### 2.3 Verify Installation

```bash
clasp --version
# Should output version number (e.g., 2.4.2)
```

---

## Step 3: Deploy Code

### 3.1 Clone Repository

```bash
git clone https://github.com/dizzighittola/parish-autoresponder.git
cd parish-autoresponder
```

### 3.2 Create Apps Script Project

```bash
clasp create --type standalone --title "Parish Autoresponder"
```

This creates a new Apps Script project linked to your account.

### 3.3 Push Code to Apps Script

```bash
clasp push
```

Confirm the upload when prompted.

### 3.4 Open in Browser

```bash
clasp open
```

This opens your project in the Apps Script Editor.

---

## Step 4: Create Knowledge Base

### 4.1 Create Google Sheet

1. Go to https://sheets.google.com
2. Create new spreadsheet
3. Name it "Parish Autoresponder KB"

### 4.2 Create Required Sheets

Create these tabs in your spreadsheet:

1. **Istruzioni** (Instructions)
2. **AI_CORE_LITE** (Basic pastoral principles)
3. **AI_CORE** (Extended pastoral guidance)
4. **Dottrina** (Doctrinal guidelines)
5. **Sostituzioni** (Text replacements)
6. **ConversationMemory** (Auto-created by system)

### 4.3 Fill Knowledge Base

**Istruzioni Tab Example:**

| Category | Question | Answer |
|----------|----------|--------|
| Mass Times | Weekday | Monday-Friday: 7:30 AM, 6:00 PM |
| Mass Times | Weekend | Saturday: 6:00 PM, Sunday: 9:00 AM, 11:00 AM, 6:00 PM |
| Contact | Phone | +1-555-0123 |
| Contact | Email | parish@example.com |
| Contact | Address | 123 Main St, City, State 12345 |

See [Knowledge Base Template](KNOWLEDGE_BASE_TEMPLATE.md) for complete structure.

### 4.4 Get Spreadsheet ID

From your Google Sheet URL:
```
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
```

Copy the `SPREADSHEET_ID_HERE` part (long string of letters/numbers).

---

## Step 5: Configure Script Properties

### 5.1 Open Project Settings

In Apps Script Editor:
1. Click ⚙️ (Project Settings) in left sidebar
2. Scroll to "Script Properties"
3. Click "Add script property"

### 5.2 Add Properties

Add these two properties:

| Property | Value |
|----------|-------|
| `GEMINI_API_KEY` | Your API key from Step 1 |
| `SPREADSHEET_ID` | Your sheet ID from Step 4.4 |

### 5.3 Verify Properties

Click "Save script properties" and ensure both appear in the list.

---

## Step 6: Enable Gmail API

### 6.1 Enable Advanced Service

In Apps Script Editor:
1. Click ⚙️ (Project Settings)
2. Scroll to "Google Services"
3. Find "Gmail API v1"
4. Toggle switch to **ON**

### 6.2 Enable in Google Cloud Console

1. In Project Settings, click the link under "Google Cloud Platform (GCP) Project"
2. Click "APIs & Services" → "Library"
3. Search for "Gmail API"
4. Click "Enable"

---

## Step 7: Create Time Trigger

### 7.1 Run Trigger Setup Function

In Apps Script Editor:

1. Select function: `createTimeTrigger` from dropdown
2. Click ▶️ Run
3. Grant permissions when prompted:
   - Review permissions
   - Click "Advanced"
   - Click "Go to Parish Autoresponder (unsafe)" *(this is your own script)*
   - Click "Allow"

### 7.2 Verify Trigger Created

1. Click ⏰ (Triggers) in left sidebar
2. You should see:
   - Function: `main`
   - Event source: Time-driven
   - Type: Minutes timer
   - Interval: Every 10 minutes

---

## Step 8: Test the System

### 8.1 Run Health Check

In Apps Script Editor:
1. Select function: `healthCheck`
2. Click ▶️ Run
3. Click "View" → "Logs" (Ctrl+Enter)
4. Verify all checks pass:
   ```
   Gemini API: ✓ OK
   Gmail API: ✓ OK
   Memory: ✓ OK
   Knowledge Base: ✓ OK
   ```

### 8.2 Test Gemini Connection

Select and run: `testGeminiConnection`

Expected output:
```javascript
{
  "connectionOk": true,
  "canGenerate": true,
  "isHealthy": true,
  "errors": []
}
```

### 8.3 Test Gmail Connection

Select and run: `testGmailConnection`

Expected output:
```javascript
{
  "connectionOk": true,
  "canListMessages": true,
  "canCreateLabels": true,
  "isHealthy": true,
  "errors": []
}
```

### 8.4 Dry Run Test

Select and run: `testDryRun`

This processes real emails but **doesn't send** responses. Check logs for:
```
🔴 DRY RUN MODE ACTIVE - Emails will NOT be sent!
```

---

## Troubleshooting

### "Gemini API: ❌ FAIL"

**Problem:** API key invalid or quota exceeded

**Solutions:**
1. Verify API key in Script Properties
2. Check key hasn't been deleted in Google AI Studio
3. Verify quota at https://ai.google.dev/
4. Wait for quota reset (9 AM Italian time)

### "Gmail API: ❌ FAIL"

**Problem:** Gmail API not enabled or insufficient permissions

**Solutions:**
1. Verify Gmail API enabled in Step 6
2. Re-authorize: Delete trigger, run `createTimeTrigger` again
3. Check Google Cloud Console for API status
4. Ensure account has Gmail access

### "Knowledge Base: ❌ FAIL"

**Problem:** Spreadsheet not accessible or ID wrong

**Solutions:**
1. Verify SPREADSHEET_ID in Script Properties
2. Ensure spreadsheet shared with script (or owned by same account)
3. Check sheet has required tabs (Istruzioni, AI_CORE_LITE, etc.)
4. Try opening sheet manually to verify access

### "No emails being processed"

**Problem:** System not finding unread emails or suspended

**Solutions:**
1. Check trigger is active (⏰ Triggers sidebar)
2. Verify current time is NOT during office hours:
   - Run `testHolidayLogic()` to see schedule
3. Send test email and manually run `main()`
4. Check logs for filtering reasons

### "Responses sound wrong or off-topic"

**Problem:** Knowledge base incomplete or prompt issues

**Solutions:**
1. Review and expand Istruzioni sheet content
2. Add more examples and edge cases
3. Populate AI_CORE_LITE with pastoral guidelines
4. Check response in logs before it's sent
5. Use `testDryRun()` to iterate without sending

---

## Next Steps

Once setup is complete:

1. **Monitor Performance**
   - Run `showQuotaDashboard()` daily
   - Check for `IA-Error` labeled emails
   - Review generated responses periodically

2. **Refine Knowledge Base**
   - Add frequently asked questions
   - Update seasonal information
   - Include edge cases and exceptions

3. **Customize Prompts**
   - Edit templates in `PromptEngine.gs`
   - Adjust tone in AI_CORE_LITE
   - Add parish-specific guidelines

4. **Set Up Monitoring**
   - Create weekly digest email
   - Set up alerts for quota near limits
   - Schedule monthly review

---

## Support

If you encounter issues not covered here:

- **Documentation:** [Full docs](README.md)
- **Issues:** [GitHub Issues](https://github.com/dizzighittola/parish-autoresponder/issues)
- **Community:** [Discussions](https://github.com/dizzighittola/parish-autoresponder/discussions)

---

**Congratulations! Your Parish Email Autoresponder is now active!** 🎉
