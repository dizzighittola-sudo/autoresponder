# Troubleshooting Guide

Common issues and their solutions for Parish Email Autoresponder.

## Table of Contents

- [System Not Processing Emails](#system-not-processing-emails)
- [API Quota Issues](#api-quota-issues)
- [Response Quality Problems](#response-quality-problems)
- [Gmail Integration Issues](#gmail-integration-issues)
- [Knowledge Base Issues](#knowledge-base-issues)
- [Performance Issues](#performance-issues)
- [Validation Failures](#validation-failures)
- [Memory & Storage Issues](#memory--storage-issues)

---

## System Not Processing Emails

### Issue: No emails being processed at all

**Symptoms:**
- Trigger runs but logs show "0 emails processed"
- Unread emails remain unread
- No labels being added

**Diagnosis:**

Run health check:
```javascript
healthCheck()
```

**Common Causes & Solutions:**

#### 1. System Suspended (Office Hours)

**Problem:** System only runs outside office hours

**Check:**
```javascript
testHolidayLogic()
```

**Solution:**
- Verify current time is NOT during office hours (see `Main.gs` → `SUSPENSION_HOURS`)
- For testing, temporarily comment out `isInSuspensionTime()` check in `main()`
- Or wait for evening/weekend to test naturally

#### 2. Trigger Not Active

**Check:**
- Apps Script Editor → ⏰ Triggers sidebar
- Should see `main` function, Time-driven, Every 10 minutes

**Solution:**
```javascript
// Delete old triggers first
removeTriggers()

// Create new trigger
createTimeTrigger()
```

#### 3. Gmail Search Query Wrong

**Problem:** Search query too restrictive

**Check logs for:**
```
Found 0 threads with query: is:unread -from:me
```

**Solution:**
- Temporarily broaden search in `EmailProcessor.gs`:
```javascript
// Change from:
const threads = GmailApp.search('in:inbox is:unread -from:me', 0, 10);

// To (for testing):
const threads = GmailApp.search('is:unread', 0, 10);
```

---

### Issue: Specific emails not being processed

**Symptoms:**
- Some emails get responses, others don't
- Certain senders always filtered

**Diagnosis:**

Enable debug logging in email:
1. Send test email
2. Manually run `main()`
3. Check execution logs (Ctrl+Enter)

**Look for:**
```
⊘ Filtered: [reason]
⊘ Skipped: [reason]
```

**Common Reasons:**

#### 1. Domain Blocklist

**Check:** `CONFIG.IGNORE_DOMAINS` in `Main.gs`

**Solution:**
```javascript
// Temporarily disable domain filtering for testing
CONFIG.IGNORE_DOMAINS = []
```

#### 2. Self-Sent Email

**Problem:** Email from same account being skipped

**Log shows:**
```
⊘ Skipped: self-sent message
```

**This is correct behavior** - system shouldn't reply to itself.

**For testing:** Send from different email account.

#### 3. Already Processed

**Problem:** Email has "IA" label already

**Solution:**
- Remove "IA" label from email
- Or change `CONFIG.LABEL_NAME` to test with different label

#### 4. Gemini Quick Check Said "No Reply"

**Log shows:**
```
⊘ Gemini quick check: no response needed
```

**Possible causes:**
- Email is acknowledgment ("Thanks!", "Got it")
- Email is newsletter/automated
- Email is quotation/invoice

**Solution:**
- Review quick check logic in `GeminiService.gs` → `shouldRespondToEmail()`
- For persistent false negatives, adjust quick check prompt

---

## API Quota Issues

### Issue: "Quota Exhausted" errors

**Symptoms:**
- Logs show: `❌ QUOTA_EXHAUSTED`
- Responses stop being generated
- System switches to fallback models

**Check Current Usage:**

```javascript
showQuotaDashboard()
```

Output shows:
```
📊 GEMINI QUOTA USAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FLASH-2.5:
  RPD: 245/250 (98.0%)  ← CRITICAL
  RPM: 8/10 (80.0%)
  Tokens today: 185,432

Next reset: 2025-01-14T09:00:00Z
```

**Solutions:**

#### 1. Wait for Reset

Quotas reset at **9:00 AM Italian time** (midnight Pacific).

**Temporary workaround:**
```javascript
// In Main.gs CONFIG, temporarily use only lite model:
MODEL_STRATEGY: {
  'quick_check': ['flash-lite'],
  'generation': ['flash-lite'],
  'fallback': ['flash-lite']
}
```

#### 2. Reduce Request Volume

**Optimize knowledge base:**
- Trim KB to most essential information
- Reduce Istruzioni sheet to <50K chars
- Use Smart RAG (system loads only relevant sections)

**Throttle processing:**
```javascript
// In Main.gs CONFIG:
MAX_EMAILS_PER_RUN: 5  // Reduce from 10
```

#### 3. Upgrade to Paid Tier

**Free tier limits:**
- 1,500 requests/day total
- 15 RPM (flash-lite), 10 RPM (flash-2.5)

**Consider paid tier if:**
- Processing >100 emails/day consistently
- Need higher RPM for burst traffic
- Free tier consistently exhausted

---

### Issue: Rate limit hits but quota shows available

**Symptoms:**
- 429 errors in logs
- `rpm_exhausted` or `tpm_exhausted` messages
- But RPD shows plenty left

**Problem:** RPM (requests per minute) or TPM (tokens per minute) limit hit

**Solution:**

The rate limiter automatically retries with exponential backoff. No action needed.

**To reduce RPM pressure:**
```javascript
// In GeminiRateLimiter.gs:
this.maxRetries = 5  // Increase retries (default: 3)
this.backoffBase = 3000  // Longer backoff (default: 2000ms)
```

---

## Response Quality Problems

### Issue: AI responses are off-topic or incorrect

**Symptoms:**
- Responses don't answer the question
- Information contradicts knowledge base
- Tone inappropriate for context

**Diagnosis:**

Check validation errors:
1. Look for `IA_VALIDATION_ERROR` labeled emails
2. Review validation details in logs

**Solutions:**

#### 1. Knowledge Base Incomplete

**Problem:** AI doesn't have info to answer

**Check:** Does KB contain answer to question asked?

**Solution:**
- Add missing info to Istruzioni sheet
- Expand relevant sections
- Include more examples

#### 2. Hallucination (Making Up Info)

**Validation catches:**
- Fake emails not in KB
- Phone numbers not in KB
- Times not in KB

**If validation missed it:**

Enable strict validation:
```javascript
// In Main.gs CONFIG:
VALIDATION_STRICT_MODE: true
VALIDATION_MIN_SCORE: 0.8  // Increase from 0.6
```

#### 3. Wrong Language

**Problem:** Responds in Italian when email was English

**Check logs for:**
```
🌍 Language: IT
```

**If wrong:**

Improve language detection in `GeminiService.gs`:
- Add more markers to `LANGUAGE_MARKERS` constant
- Increase language marker weights

#### 4. Inappropriate Tone

**Problem:** Too formal, too casual, or judgmental

**Solution:**

Update pastoral guidelines in knowledge base:
- Review AI_CORE_LITE sheet
- Add tone examples for different scenarios
- Specify what to avoid

---

### Issue: Responses too short or too long

**Symptoms:**
- Validation warnings: "Response quite short"
- Or: "Response very long (may be verbose)"

**Adjust Thresholds:**

```javascript
// In ResponseValidator.gs:
this.MIN_LENGTH_CHARS = 25      // Minimum acceptable
this.OPTIMAL_MIN_LENGTH = 100   // Ideal minimum
this.WARNING_MAX_LENGTH = 3000  // When to warn
```

**For longer responses:**

```javascript
// In Main.gs CONFIG:
MAX_OUTPUT_TOKENS: 8000  // Increase from 6000
```

---

## Gmail Integration Issues

### Issue: "Gmail API: ❌ FAIL" in health check

**Symptoms:**
- Can't send replies
- Can't read emails
- Can't create labels

**Solutions:**

#### 1. Gmail API Not Enabled

**Enable in Apps Script:**
1. ⚙️ Project Settings
2. Scroll to "Google Services"
3. Gmail API v1 → Toggle ON

**Enable in Google Cloud Console:**
1. Project Settings → GCP Project link
2. APIs & Services → Library
3. Search "Gmail API" → Enable

#### 2. Insufficient Permissions

**Re-authorize:**
```javascript
// Delete all triggers first
removeTriggers()

// Then recreate (will trigger new auth)
createTimeTrigger()
```

Grant all requested permissions when prompted.

#### 3. Account Access Issues

**For Workspace accounts:**
- Verify Gmail enabled for account
- Check admin hasn't restricted API access
- Ensure account has inbox access (not suspended)

---

### Issue: Emails sent but not appearing as replies

**Problem:** Emails don't thread correctly in Gmail

**Cause:** Missing or incorrect In-Reply-To header

**Solution:**

In `GmailService.gs`, ensure using message-level reply:
```javascript
// Correct (reply to specific message):
mailEntity.reply('', { htmlBody: htmlBody });

// Wrong (creates new thread):
GmailApp.sendEmail(recipient, subject, '', { htmlBody: htmlBody });
```

**System already does this correctly** - if still happening:
- Check your Gmail thread settings
- Some email clients break threading

---

## Knowledge Base Issues

### Issue: "Knowledge Base: ❌ FAIL"

**Symptoms:**
- `GLOBAL_CACHE.knowledgeBase` empty
- Logs show load errors

**Solutions:**

#### 1. Wrong Spreadsheet ID

**Verify:**
```javascript
// In Apps Script Editor:
Logger.log(CONFIG.SPREADSHEET_ID);
```

**Should match** the ID in your Google Sheet URL:
```
docs.google.com/spreadsheets/d/[THIS_PART]/edit
```

**Fix:**
- Get correct ID from Sheet URL
- Update Script Properties → `SPREADSHEET_ID`

#### 2. Sheet Not Accessible

**Check sharing:**
- Sheet must be owned by same account
- Or shared with script account
- Or set to "Anyone with link can view"

**Test access:**
```javascript
function testSheetAccess() {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    Logger.log('✓ Can access: ' + sheet.getName());
  } catch (e) {
    Logger.log('❌ Cannot access: ' + e.message);
  }
}
```

#### 3. Missing Required Sheets

**Error:** `Sheet 'Istruzioni' not found`

**Solution:**
- Create missing sheet in spreadsheet
- Use exact names: `Istruzioni`, `AI_CORE_LITE`, etc.
- Check for typos or extra spaces in names

---

## Performance Issues

### Issue: Script execution time limits exceeded

**Symptoms:**
- Error: "Maximum execution time exceeded"
- Logs show incomplete processing

**Google Limits:**
- **6 minutes** per execution (free accounts)
- **30 minutes** per execution (Workspace accounts)

**Solutions:**

#### 1. Reduce Emails Per Run

```javascript
// In Main.gs CONFIG:
MAX_EMAILS_PER_RUN: 3  // Reduce from 10
```

System will process fewer emails per trigger, but trigger runs every 10 minutes.

#### 2. Optimize Knowledge Base Size

**Current size check:**
```javascript
loadResources()
// Check logs for:
✓ Knowledge Base loaded: XXXXX chars
```

**If >100K chars:**
- Trim unnecessary content
- Remove duplicate information
- Use structured sheets effectively

#### 3. Reduce Conversation History

```javascript
// In EmailProcessor.gs, buildConversationHistory():
maxMessages = 5  // Reduce from 10
```

---

## Validation Failures

### Issue: Many emails labeled "IA_VALIDATION_ERROR"

**Check what's failing:**

```javascript
// In ResponseValidator.gs, add more logging:
console.log('Validation Details:', JSON.stringify(validation.details, null, 2));
```

**Common Failures:**

#### 1. Capital After Comma

**Italian grammar rule:** No capital after comma

**Error:** "Buongiorno, Siamo..." (wrong)  
**Correct:** "Buongiorno, siamo..." (right)

**If system generates errors persistently:**

Strengthen safeguard in `GmailService.gs`:
```javascript
fixPunctuation(text, senderName)  // Already exists
```

Or adjust validation:
```javascript
// In ResponseValidator.gs:
VALIDATION_STRICT_MODE: false  // More lenient
```

#### 2. Missing Signature

**Required:** Every first-contact email should have signature

**Check** prompt includes signature in `PromptEngine.gs`

#### 3. Language Mismatch

**Error:** "Expected IT, detected EN"

**If legitimate multilingual response:**

Adjust tolerance:
```javascript
// In ResponseValidator.gs, _checkLanguage():
if (markerScores[detectedLang] >= 4) {  // Increase threshold
  // ...
}
```

---

## Memory & Storage Issues

### Issue: ConversationMemory sheet growing too large

**Symptoms:**
- Sheet has thousands of rows
- Slow performance
- Quota warnings

**Solution:**

Run cleanup:
```javascript
cleanupMemory()  // Removes entries >30 days old
```

**Automate cleanup:**

Already set up if you ran `setupWeeklyCleanupTrigger()`:
- Runs every Sunday 3 AM
- Removes old entries automatically

**Adjust retention:**
```javascript
// In MemoryService.gs, cleanOldEntries():
daysOld = 14  // Reduce from 30 days
```

---

## Still Having Issues?

### Get Support

1. **Enable Debug Logging**
   ```javascript
   // Add at top of Main.gs:
   const DEBUG_MODE = true;
   ```

2. **Collect Information**
   - Full execution logs
   - Validation error details
   - Health check results
   - Sample problematic email (anonymized)

3. **Report Issue**
   - [GitHub Issues](https://github.com/YOUR_USERNAME/parish-autoresponder/issues)
   - Include all debug information
   - Describe expected vs actual behavior
   - Steps to reproduce

4. **Community Help**
   - [GitHub Discussions](https://github.com/YOUR_USERNAME/parish-autoresponder/discussions)
   - Search existing discussions
   - Share your use case

---

## Prevention Checklist

**Weekly:**
- [ ] Run `showQuotaDashboard()` - check quota usage
- [ ] Review `IA-Error` labeled emails
- [ ] Check execution logs for warnings

**Monthly:**
- [ ] Run `healthCheck()` - verify all systems
- [ ] Update knowledge base with new FAQs
- [ ] Review validation failure patterns
- [ ] Run `cleanupMemory()` if auto-cleanup not set

**Quarterly:**
- [ ] Full system review
- [ ] Update dependencies if needed
- [ ] Review and optimize KB size
- [ ] Test disaster recovery (backup KB)

---

**Documentation:**
- [Main README](../README.md)
- [Setup Guide](SETUP.md)
- [Configuration Reference](CONFIGURATION.md)
