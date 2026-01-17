# Configuration Reference

Complete reference for all configuration options in Parish Email Autoresponder.

## Table of Contents

- [Main Configuration (CONFIG)](#main-configuration-config)
- [Gemini API Settings](#gemini-api-settings)
- [Gmail Settings](#gmail-settings)
- [Knowledge Base Settings](#knowledge-base-settings)
- [Validation Settings](#validation-settings)
- [Scheduling Settings](#scheduling-settings)
- [Advanced Settings](#advanced-settings)

---

## Main Configuration (CONFIG)

All core settings are in `Main.gs` → `CONFIG` object.

### Structure

```javascript
const CONFIG = {
  // API Settings
  GEMINI_API_KEY: 'your-api-key',
  MODEL_NAME: 'gemini-2.5-flash',
  
  // Generation Settings
  TEMPERATURE: 0.5,
  MAX_OUTPUT_TOKENS: 6000,
  
  // Validation Settings
  VALIDATION_ENABLED: true,
  VALIDATION_MIN_SCORE: 0.6,
  VALIDATION_STRICT_MODE: false,
  
  // Gmail Settings
  LABEL_NAME: 'IA',
  ERROR_LABEL_NAME: 'IA-Error',
  VALIDATION_ERROR_LABEL: 'IA_VALIDATION_ERROR',
  MAX_EMAILS_PER_RUN: 10,
  
  // Knowledge Base Settings
  SPREADSHEET_ID: 'your-sheet-id',
  KB_SHEET_NAME: 'Istruzioni',
  AI_CORE_LITE_SHEET: 'AI_CORE_LITE',
  AI_CORE_SHEET: 'AI_CORE',
  DOCTRINE_SHEET: 'Dottrina',
  REPLACEMENTS_SHEET_NAME: 'Sostituzioni',
  MEMORY_SHEET_NAME: 'ConversationMemory',
  
  // Mode Settings
  DRY_RUN: false,
  USE_RATE_LIMITER: true,
  
  // Model Configuration
  GEMINI_MODELS: { /* ... */ },
  MODEL_STRATEGY: { /* ... */ }
};
```

---

## Gemini API Settings

### GEMINI_API_KEY

**Type:** String  
**Required:** Yes  
**Source:** Script Properties  

**Description:** Your Gemini API key from https://ai.google.dev/

**Setup:**
```javascript
// Set via Script Properties (recommended)
// Apps Script Editor → Project Settings → Script Properties
Key: GEMINI_API_KEY
Value: AIzaSy...
```

**Security:** Never commit API key to version control!

---

### MODEL_NAME

**Type:** String  
**Default:** `'gemini-2.5-flash'`  
**Options:**
- `'gemini-2.5-flash'` - Latest, most capable (recommended)
- `'gemini-2.5-flash-lite'` - Faster, cheaper, higher quotas
- `'gemini-2.0-flash'` - Legacy model

**Description:** Default model for API calls when rate limiter disabled.

**When rate limiter enabled:** Ignored (uses `GEMINI_MODELS` configuration instead).

---

### TEMPERATURE

**Type:** Number  
**Range:** 0.0 - 2.0  
**Default:** `0.5`  

**Description:** Controls response creativity/randomness.

**Guidelines:**
- **0.0-0.3:** Very focused, deterministic (good for factual responses)
- **0.4-0.7:** Balanced (recommended for parish use)
- **0.8-1.2:** More creative, varied responses
- **1.3+:** Very creative, potentially inconsistent

**Example:**
```javascript
TEMPERATURE: 0.3  // More consistent for operational info
TEMPERATURE: 0.7  // More natural for pastoral responses
```

---

### MAX_OUTPUT_TOKENS

**Type:** Integer  
**Default:** `6000`  
**Range:** 1 - 8192 (model dependent)  

**Description:** Maximum tokens in generated response.

**Guidelines:**
- **1000-2000:** Short, concise responses
- **2000-4000:** Standard responses (recommended)
- **4000-6000:** Detailed responses
- **6000+:** Risk verbose responses, slower, more quota usage

**Trade-offs:**
```javascript
MAX_OUTPUT_TOKENS: 2000
// Pros: Faster, less quota, forced conciseness
// Cons: May truncate complex answers

MAX_OUTPUT_TOKENS: 8000
// Pros: Complete detailed responses
// Cons: Slower, more quota, risk verbosity
```

---

## Gmail Settings

### LABEL_NAME

**Type:** String  
**Default:** `'IA'`  

**Description:** Label applied to processed messages.

**Purpose:**
- Prevents re-processing same message
- Allows filtering processed emails
- Tracks system activity

**Customization:**
```javascript
LABEL_NAME: 'AutoResponder'  // More descriptive
LABEL_NAME: 'AI-Handled'     // Clearer for users
```

**Note:** Change requires updating existing labeled emails or they'll be re-processed.

---

### ERROR_LABEL_NAME

**Type:** String  
**Default:** `'IA-Error'`  

**Description:** Label for emails that caused errors during processing.

**Errors caught:**
- API failures
- Processing exceptions
- Unexpected crashes

**Review these regularly** to identify system issues.

---

### VALIDATION_ERROR_LABEL

**Type:** String  
**Default:** `'IA_VALIDATION_ERROR'`  

**Description:** Label for emails where generated response failed validation.

**Validation checks:**
- Length requirements
- Language consistency
- Hallucination detection
- Grammar rules
- Required signature

**Manual review recommended** before sending these responses.

---

### MAX_EMAILS_PER_RUN

**Type:** Integer  
**Default:** `10`  
**Range:** 1 - 50  

**Description:** Maximum emails processed per trigger execution.

**Considerations:**

**Lower values (1-5):**
- Pros: Faster execution, lower quota use per run
- Cons: May lag behind high email volume

**Higher values (10-20):**
- Pros: Processes backlog faster
- Cons: Risk execution timeout, higher quota burst

**Optimization:**
```javascript
// If frequently timing out:
MAX_EMAILS_PER_RUN: 5

// If underutilizing quota:
MAX_EMAILS_PER_RUN: 15

// For high-volume parishes:
MAX_EMAILS_PER_RUN: 20  // Monitor execution time
```

---

## Knowledge Base Settings

### SPREADSHEET_ID

**Type:** String  
**Required:** Yes  
**Source:** Script Properties  

**Description:** Google Sheets ID containing knowledge base.

**How to get:**
```
From URL: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
Copy: SPREADSHEET_ID portion
```

**Setup:**
```javascript
// Set via Script Properties
Key: SPREADSHEET_ID
Value: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
```

---

### KB_SHEET_NAME

**Type:** String  
**Default:** `'Istruzioni'`  

**Description:** Sheet name containing operational information (mass times, contacts, procedures).

**Required content:** Core parish information.

---

### AI_CORE_LITE_SHEET

**Type:** String  
**Default:** `'AI_CORE_LITE'`  

**Description:** Sheet with basic pastoral principles and tone guidelines.

**When loaded:** For pastoral or doctrinal questions.

---

### AI_CORE_SHEET

**Type:** String  
**Default:** `'AI_CORE'`  

**Description:** Extended pastoral guidance for complex discernment scenarios.

**When loaded:** When `needsDiscernment` flag is true.

---

### DOCTRINE_SHEET

**Type:** String  
**Default:** `'Dottrina'`  

**Description:** Catholic doctrinal guidelines and teachings.

**When loaded:** When `needsDoctrine` flag is true.

**Structure:** Structured format with columns for different aspects (tone, pastoral criteria, limits).

---

### REPLACEMENTS_SHEET_NAME

**Type:** String  
**Default:** `'Sostituzioni'`  

**Description:** Text replacements applied to responses before sending.

**Use cases:**
- Fix common typos
- Standardize terminology
- Update deprecated terms
- Format phone numbers consistently

---

### MEMORY_SHEET_NAME

**Type:** String  
**Default:** `'ConversationMemory'`  

**Description:** Sheet storing conversation context.

**Auto-created:** System creates automatically if missing.  
**Do not edit manually.**

---

## Validation Settings

### VALIDATION_ENABLED

**Type:** Boolean  
**Default:** `true`  

**Description:** Enable/disable response validation before sending.

**Recommendation:** **Always keep enabled** except for debugging.

```javascript
VALIDATION_ENABLED: true   // Recommended (production)
VALIDATION_ENABLED: false  // Only for debugging
```

---

### VALIDATION_MIN_SCORE

**Type:** Number  
**Range:** 0.0 - 1.0  
**Default:** `0.6`  

**Description:** Minimum validation score to pass.

**Score calculation:** Weighted average of 7 validation checks.

**Guidelines:**
```javascript
VALIDATION_MIN_SCORE: 0.5  // Permissive (more responses pass)
VALIDATION_MIN_SCORE: 0.6  // Balanced (default)
VALIDATION_MIN_SCORE: 0.8  // Strict (fewer responses pass)
```

**Trade-off:**
- Lower: More emails get responses (but potentially lower quality)
- Higher: Higher quality guaranteed (but more manual review needed)

---

### VALIDATION_STRICT_MODE

**Type:** Boolean  
**Default:** `false`  

**Description:** Enable stricter validation rules.

**Changes when enabled:**
- Grammar checks more aggressive
- Hallucination detection more sensitive
- Capital-after-comma becomes BLOCKER (not just warning)

**Use when:**
- Establishing system credibility
- High-stakes communications
- Languages with strict grammar rules (Italian)

---

## Scheduling Settings

### SUSPENSION_HOURS

**Type:** Object  
**Location:** `Main.gs`  

**Description:** Office hours when system suspends (doesn't respond).

**Format:**
```javascript
const SUSPENSION_HOURS = {
  1: [[8, 20]],     // Monday: 8 AM - 8 PM
  2: [[8, 14]],     // Tuesday: 8 AM - 2 PM
  3: [[8, 17]],     // Wednesday: 8 AM - 5 PM
  4: [[8, 14]],     // Thursday: 8 AM - 2 PM
  5: [[8, 17]]      // Friday: 8 AM - 5 PM
};
```

**Day codes:** 0=Sunday, 1=Monday, ..., 6=Saturday

**Multiple windows:**
```javascript
const SUSPENSION_HOURS = {
  1: [[8, 12], [14, 20]]  // Mon: 8AM-12PM and 2PM-8PM
};
```

---

### ALWAYS_OPERATING_DAYS

**Type:** Array  
**Location:** `Main.gs`  

**Description:** Dates when system always operates (holidays, secretariat off).

**Format:**
```javascript
const ALWAYS_OPERATING_DAYS = [
  [MONTH.JAN, 1],    // January 1 (Capodanno)
  [MONTH.DEC, 25],   // December 25 (Natale)
  // ... more holidays
];
```

**IMPORTANT:** Use `MONTH` constants (0-indexed):
```javascript
const MONTH = {
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
  JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11
};
```

---

### Vacation Periods (NEW in v2.3.0)

**Type:** Array of periods (read from Sheet)  
**Location:** Sheet `Controllo`, rows 6-10  
**Loaded into:** `GLOBAL_CACHE.vacationPeriods`

**Description:** Configurable vacation periods when the system always operates (staff on vacation).

**Sheet Configuration:**

| Row | Column A | Column B (Start) | Column C (End) |
|-----|----------|------------------|----------------|
| 6 | Ferie segretario | 15/08/2026 | 31/08/2026 |
| 7 | Ferie segretario | 23/12/2026 | 06/01/2027 |
| 8 | Ferie segretario | 14/04/2027 | 21/04/2027 |
| 9 | *(empty or other data)* | | |
| 10 | *(empty or other data)* | | |

**Rules:**
- Column A must contain the word "ferie" (case-insensitive)
- Columns B and C must contain valid dates
- Empty rows are safely skipped
- Up to 5 periods supported (rows 6-10)
- Past periods are automatically ignored

**Date formats accepted:**
- `DD/MM/YYYY` (European format)
- `YYYY-MM-DD` (ISO format)
- Google Sheets Date objects (recommended)

**Benefits:**
- Configure once, apply for years
- No code changes needed for new vacation periods
- Supports multiple annual periods (summer, Christmas, Easter)

**Logs on load:**
```
✓ Vacation periods loaded: 3 period(s)
   1. 15/08/2026 - 31/08/2026
   2. 23/12/2026 - 06/01/2027
   3. 14/04/2027 - 21/04/2027
```

---

## Advanced Settings

### DRY_RUN

**Type:** Boolean  
**Default:** `false`  

**Description:** Test mode - processes emails but doesn't send responses.

**Use for:**
- Initial setup testing
- Major configuration changes
- Testing prompt modifications
- Debugging issues

**Enable:**
```javascript
DRY_RUN: true
```

**Logs show:**
```
🔴 DRY RUN MODE ACTIVE - Emails will NOT be sent!
📝 Would send: [preview of response]
```

---

### USE_RATE_LIMITER

**Type:** Boolean  
**Default:** `true`  

**Description:** Enable intelligent rate limiter with quota management.

**Benefits when enabled:**
- Automatic model fallback
- Quota tracking and alerts
- Optimal model selection per task
- Prevents quota exhaustion

**Disable only if:**
- Debugging quota issues
- Using single model exclusively
- Custom quota management implemented

---

### GEMINI_MODELS

**Type:** Object  
**Description:** Model configurations with quotas.

**Structure:**
```javascript
GEMINI_MODELS: {
  'model-key': {
    name: 'api-model-name',
    rpm: 10,        // Requests per minute
    tpm: 250000,    // Tokens per minute
    rpd: 250,       // Requests per day
    useCases: ['generation', 'fallback']
  }
}
```

**Update when Google changes quotas** or adds new models.

**Current configuration (Jan 2026):**
- See `Main.gs` → `CONFIG.GEMINI_MODELS`

---

### MODEL_STRATEGY

**Type:** Object  
**Description:** Model selection order for different tasks.

**Structure:**
```javascript
MODEL_STRATEGY: {
  'quick_check': ['flash-lite', 'flash-2.5'],     // Fast checks
  'generation': ['flash-2.5', 'flash-lite'],      // Quality first
  'fallback': ['flash-lite', 'flash-2.0']         // Emergency
}
```

**Order matters:** First available model is used.

**Optimization examples:**

**Conserve Flash-2.5 quota:**
```javascript
MODEL_STRATEGY: {
  'quick_check': ['flash-lite'],          // Use cheap model
  'generation': ['flash-2.5', 'flash-lite'],  // Quality when available
}
```

**Maximize Flash-Lite usage:**
```javascript
MODEL_STRATEGY: {
  'quick_check': ['flash-lite'],
  'generation': ['flash-lite', 'flash-2.5'],  // Try lite first
}
```

---

## Environment-Specific Settings

### Development

```javascript
const CONFIG = {
  DRY_RUN: true,               // Don't send emails
  MAX_EMAILS_PER_RUN: 3,       // Process fewer
  VALIDATION_STRICT_MODE: true, // Catch issues early
  USE_RATE_LIMITER: false      // Simpler debugging
};
```

### Production

```javascript
const CONFIG = {
  DRY_RUN: false,
  MAX_EMAILS_PER_RUN: 10,
  VALIDATION_STRICT_MODE: false,
  USE_RATE_LIMITER: true
};
```

### High-Volume Parish

```javascript
const CONFIG = {
  MAX_EMAILS_PER_RUN: 20,      // Process more per run
  VALIDATION_MIN_SCORE: 0.5,   // More permissive
  MODEL_STRATEGY: {
    'generation': ['flash-lite']  // Use high-quota model
  }
};
```

---

## Script Properties vs CONFIG

**Script Properties** (secure, persistent):
- API keys
- Spreadsheet IDs
- Sensitive credentials

**CONFIG object** (code, versioned):
- Behavior settings
- Thresholds
- Feature flags

**Migration example:**
```javascript
// Good: Secure credential
GEMINI_API_KEY: PropertiesService.getScriptProperties()
  .getProperty('GEMINI_API_KEY')

// Good: Configuration
MAX_EMAILS_PER_RUN: 10

// Bad: Sensitive in code
GEMINI_API_KEY: 'AIzaSy...'  // Never do this!
```

---

## Configuration Best Practices

### 1. Document Changes

```javascript
// ✅ Good: Explains why
// Reduced from 10 to 5 to prevent timeouts on large KB
MAX_EMAILS_PER_RUN: 5

// ❌ Bad: No context
MAX_EMAILS_PER_RUN: 5
```

### 2. Test Before Production

```javascript
// Development testing:
DRY_RUN: true
// ... test thoroughly ...

// Then production:
DRY_RUN: false
```

### 3. Version Control Excluded

```.gitignore
# Never commit:
apikeys.txt
local-config.gs
*-secret.js
```

### 4. Backup Before Changes

```bash
# Backup current config
clasp pull  # Downloads to local
git commit -m "Backup before config change"

# Make changes
# ... edit CONFIG ...

# Test
clasp push
# Run tests

# If issues, revert:
git checkout Main.gs
clasp push
```

---

## Troubleshooting Configuration

### Changes Not Taking Effect

**Problem:** Modified CONFIG but behavior unchanged.

**Solution:**
```javascript
// 1. Clear global cache
GLOBAL_CACHE = {};

// 2. Reload resources
loadResources();

// 3. Test again
testDryRun();
```

### Invalid Configuration

**Problem:** System crashes on startup.

**Check logs for:**
```
❌ GEMINI_API_KEY missing in Script Properties
❌ SPREADSHEET_ID missing in Script Properties
```

**Fix:** Set required Script Properties.

### Unexpected Behavior

**Problem:** System behaving oddly.

**Debug:**
```javascript
// Add to top of Main.gs temporarily:
Logger.log('CONFIG:', JSON.stringify(CONFIG, null, 2));

// Run main()
// Check logs for actual values
```

---

## Related Documentation

- [Setup Guide](SETUP.md) - Initial configuration
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues
- [Main README](README.md) - Overview

---

**Questions about configuration?**
- [GitHub Discussions](https://github.com/dizzighittola/parish-autoresponder/discussions)
- [GitHub Issues](https://github.com/dizzighittola/parish-autoresponder/issues)
