# Architecture Documentation

Technical architecture overview of Parish Email Autoresponder.

## Table of Contents

- [System Overview](#system-overview)
- [Core Components](#core-components)
- [Data Flow](#data-flow)
- [Processing Pipeline](#processing-pipeline)
- [Storage Architecture](#storage-architecture)
- [AI Integration](#ai-integration)
- [Design Decisions](#design-decisions)
- [Scalability Considerations](#scalability-considerations)

---

## System Overview

### High-Level Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                         GMAIL                                 │
│                    (Email Source)                             │
└────────────────────┬──────────────────────────────────────────┘
                     │
                     │ Unread emails
                     ↓
┌───────────────────────────────────────────────────────────────┐
│              GOOGLE APPS SCRIPT TRIGGER                       │
│              (Every 10 minutes)                               │
└────────────────────┬──────────────────────────────────────────┘
                     │
                     │ Execution context
                     ↓
┌───────────────────────────────────────────────────────────────┐
│                   EMAIL PROCESSOR                             │
│         (Orchestrates entire pipeline)                        │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  1. Filter     → Should we process?                 │    │
│  │  2. Classify   → What type of request?              │    │
│  │  3. Generate   → Create AI response                 │    │
│  │  4. Validate   → Check quality                      │    │
│  │  5. Send       → Reply to email                     │    │
│  └─────────────────────────────────────────────────────┘    │
└────────┬─────────────────┬──────────────────┬────────────────┘
         │                 │                  │
         │                 │                  │
         ↓                 ↓                  ↓
┌──────────────┐  ┌────────────────┐  ┌──────────────┐
│ GEMINI API   │  │ GOOGLE SHEETS  │  │ GMAIL API    │
│ (AI Model)   │  │ (Knowledge DB) │  │ (Send Reply) │
└──────────────┘  └────────────────┘  └──────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Runtime** | Google Apps Script (V8) | JavaScript execution environment |
| **AI Model** | Google Gemini 2.5 Flash | Natural language understanding & generation |
| **Storage** | Google Sheets | Knowledge base & conversation memory |
| **Email** | Gmail API | Email reading & sending |
| **Triggers** | Apps Script Time-driven | Scheduled execution every 10 min |
| **Deployment** | clasp (CLI) | Code deployment & version control |

---

## Core Components

### 1. Main.gs - Configuration & Entry Point

**Responsibilities:**
- Global configuration (`CONFIG` object)
- Holiday scheduling logic
- Resource loading (Knowledge Base)
- Trigger management
- Health checks

**Key Functions:**
```javascript
main()                    // Entry point (called by trigger)
loadResources()           // Load KB from Google Sheets
isInSuspensionTime()      // Check if office hours
testHolidayLogic()        // Verify holiday schedule
```

---

### 2. EmailProcessor.gs - Pipeline Orchestrator

**Responsibilities:**
- Orchestrates 5-step processing pipeline
- Thread-level email processing
- Lock management (prevents race conditions - 30s TTL in cache)
- Error handling & labeling
- Batch processing of unread emails

**Key Classes:**
```javascript
class EmailProcessor {
  processThread(thread, knowledgeBase)   // Process single thread
  processUnreadEmails(kb)                // Batch process
  _shouldIgnoreEmail(details)            // Domain/keyword filter
  _detectProvidedTopics(response)        // Extract topics for memory
}
```

**Design Pattern:** Pipeline pattern with dependency injection

---

### 3. GeminiService.gs - AI Integration

**Responsibilities:**
- Gemini API communication
- Language detection (12 languages)
- Adaptive greeting generation
- Quick check (respond: yes/no)
- Retry logic with exponential backoff
- Rate limiter integration

**Key Classes:**
```javascript
class GeminiService {
  detectEmailLanguage(content)           // Multi-language detection
  shouldRespondToEmail(content)          // Quick check
  generateResponse(prompt)               // Main generation
  getAdaptiveGreeting(name, lang)        // Contextual greeting
}
```

**API Integration:**
- Uses `UrlFetchApp` (GAS HTTP client)
- JSON payload construction
- Error handling for 429, 503, 500 status codes
- Exponential backoff on retryable errors

---

### 4. GeminiRateLimiter.gs - Quota Management

**Responsibilities:**
- Track RPM, TPM, RPD usage
- Automatic model selection & fallback
- Quota prediction & throttling
- Reset timing (9 AM Italian / midnight Pacific)

**Key Classes:**
```javascript
class GeminiRateLimiter {
  selectModel(taskType, options)         // Choose best available model
  executeRequest(taskType, requestFn)    // Execute with rate limiting
  _trackRequest(modelKey, tokens)        // Update usage counters
  getUsageStats()                        // Dashboard data
}
```

**Algorithms:**
- Time-windowed rate limiting (sliding window)
- Quota-aware model selection
- Exponential backoff on rate limit hits
- Batch write optimization (reduces PropertiesService I/O)

---

### 5. Classifier.gs - Email Filtering

**Responsibilities:**
- Ultra-simple acknowledgment detection (≤3 words)
- Greeting-only filter
- Minimal false negatives (Gemini decides)

**Key Classes:**
```javascript
class EmailClassifier {
  classifyEmail(subject, body, isReply)  // Returns shouldReply decision
  _isUltraSimpleAcknowledgment(text)    // "Grazie!" filter
  _isGreetingOnly(text)                 // "Buongiorno" filter
  _categorizeContent(text)              // Category hint for Gemini
}
```

**Philosophy:** Minimal filtering (avoid false negatives), delegate to Gemini

---

### 6. RequestTypeClassifier.gs - Request Categorization

**Responsibilities:**
- Classify: Technical / Pastoral / Doctrinal / Mixed
- Determine KB loading strategy (lite/standard/heavy)
- Hybrid approach: Gemini classification + regex validation

**Key Classes:**
```javascript
class RequestTypeClassifier {
  classify(subject, body, externalHint)  // Returns requestType
  getRequestTypeHint(requestType)        // Prompt injection
  _calculateScore(text, indicators)      // Weighted scoring
}
```

**Indicators:**
- Technical: "si può", "quando", "documenti", "orari"
- Pastoral: "mi sento", "soffrire", "non capisco"
- Doctrinal: "perché la chiesa", "dottrina", "catechismo"

---

### 7. PromptEngine.gs - Prompt Composition

**Responsibilities:**
- Dynamic prompt generation (18 templates)
- Contextual template selection
- Token budget management
- Profile-based focusing (lite/standard/heavy)

**Key Classes:**
```javascript
class PromptEngine {
  buildPrompt(options)                   // Main composition
  _renderCriticalErrors()                // Error prevention template
  _renderFormattingGuidelines()          // Style guide
  _renderResponseStructure(category)     // Category-specific hints
  _shouldIncludeTemplate(name, profile)  // Dynamic filtering
}
```

**Templates (18 total):**
1. Critical Errors (grammar, links)
2. System Role
3. Language Instruction
4. Memory Context
5. Knowledge Base
6. Territory Verification
7. Seasonal Context
8. Temporal Awareness
9. Category Hint
10. Dynamic Directives (Smart RAG)
11. Formatting Guidelines
12. Response Structure
13. Conversation History
14. Email Content
15. No Reply Rules
16. Human Tone Guidelines
17. Examples
18. Final Checklist

**Optimization:** Profile-based template filtering reduces token usage for simple requests.

---

### 8. ResponseValidator.gs - Quality Control

**Responsibilities:**
- 7-point validation before sending
- Hallucination detection (fake data)
- Grammar validation (language-specific)
- Length & completeness checks

**Key Classes:**
```javascript
class ResponseValidator {
  validateResponse(response, lang, kb)   // Main validation
  _checkLength(response)                 // 25-3000 chars
  _checkLanguage(response, expected)     // Language consistency
  _checkSignature(response, mode)        // Signature presence
  _checkHallucinations(response, kb)     // Fake emails/phones/times
  _checkCapitalAfterComma(response)      // Italian grammar rule
}
```

**Validation Scoring:**
```
score = lengthScore × languageScore × signatureScore × 
        contentScore × hallucinationScore × grammarScore
        
Pass threshold: score ≥ 0.6 (configurable)
```

---

### 9. GmailService.gs - Gmail Integration

**Responsibilities:**
- Email reading & parsing
- HTML email sending (Markdown→HTML)
- Label management (with cache)
- Reply threading
- Header sanitization

**Key Classes:**
```javascript
class GmailService {
  extractMessageDetails(message)         // Parse email
  sendHtmlReply(resource, text, details) // Send formatted reply
  buildConversationHistory(messages)     // Thread context
  getOrCreateLabel(name)                 // Label cache
  addLabelToMessage(messageId, label)    // Message-level labeling
}
```

**Markdown Conversion:**
- Headers, bold, italic, links, lists
- Code blocks with syntax highlighting
- XSS prevention (URL sanitization)
- SSRF protection (internal IP blocking)
- Emoji → HTML entity conversion

---

### 10. MemoryService.gs - Conversation Context

**Responsibilities:**
- Store conversation state (language, category, topics)
- Anti-repetition (remember what was provided)
- Thread-level context tracking
- Atomic updates (lock-based)
- Auto-cleanup (weekly)

**Key Classes:**
```javascript
class MemoryService {
  getMemory(threadId)                    // Retrieve context
  updateMemory(threadId, newData)        // Update atomically
  updateMemoryAtomic(threadId, data, topics) // All-in-one update
  cleanOldEntries(daysOld)               // Housekeeping
}
```

**Storage:** Google Sheet (ConversationMemory tab)

**Schema:**
| threadId | language | category | tone | providedInfo | lastUpdated | messageCount | version |
|----------|----------|----------|------|--------------|-------------|--------------|---------|

**Optimistic Locking:** Version field prevents race conditions on concurrent updates.

---

### 11. TerritoryValidator.gs - Address Verification

**Responsibilities:**
- Extract addresses from email text
- Verify if address in parish territory
- Database of streets & civic numbers

**Key Classes:**
```javascript
class TerritoryValidator {
  analyzeEmailForAddress(content)        // Find & verify
  extractAddressFromText(text)           // Regex extraction
  verifyAddress(street, civic)           // Check rules
}
```

**Territory Rules:**
```javascript
territory = {
  'via roma': {tutti: true},                 // All numbers
  'via dante': {dispari: [1,50], pari: [2,48]}, // Odd 1-50, Even 2-48
  'piazza garibaldi': {tutti: [1,20]}        // Numbers 1-20 only
}
```

---

## Data Flow

### Request Processing Flow

```
1. Trigger Execution (every 10 min)
   ↓
2. Check Suspension Time
   │ If office hours → Exit
   │ If after hours → Continue
   ↓
3. Load Resources (Knowledge Base)
   ↓
4. Search Unread Emails
   │ Query: is:unread
   │ Limit: MAX_EMAILS_PER_RUN (default: 10)
   ↓
5. For Each Thread:
   │
   ├─> Filter Stage
   │   ├─ Self-sent? → Skip
   │   ├─ Already labeled? → Skip
   │   ├─ Domain blocklist? → Skip
   │   └─ Pass → Continue
   │
   ├─> Classify Stage
   │   ├─ Ultra-simple ack? → Skip
   │   ├─ Greeting only? → Skip
   │   ├─ Gemini quick check → shouldRespond?
   │   │   If No → Skip
   │   └─ Pass → Continue
   │
   ├─> Request Type Classification
   │   ├─ Gemini categorization (hybrid)
   │   ├─ Determine: Technical/Pastoral/Doctrinal
   │   └─ Set KB loading flags
   │
   ├─> Context Building
   │   ├─ Get conversation memory (if exists)
   │   ├─ Build conversation history
   │   ├─ Check territory (if address mentioned)
   │   ├─ Compute salutation mode (full/soft/none)
   │   └─ Load appropriate KB sections (conditional)
   │
   ├─> Prompt Composition
   │   ├─ Select prompt profile (lite/standard/heavy)
   │   ├─ Compose from 18 templates (dynamic filtering)
   │   ├─ Inject knowledge base
   │   ├─ Add conversation context
   │   └─ Estimate tokens (~100K limit)
   │
   ├─> Generation Stage
   │   ├─ Rate limiter selects model
   │   ├─ Call Gemini API
   │   ├─ Retry on transient failures (exponential backoff)
   │   └─ Receive response text
   │
   ├─> Validation Stage
   │   ├─ Check length (25-3000 chars)
   │   ├─ Verify language consistency
   │   ├─ Detect hallucinations (fake data)
   │   ├─ Grammar check (capital after comma)
   │   ├─ Verify signature present
   │   ├─ Compute validation score
   │   └─ Pass? → Continue | Fail? → Label IA_VALIDATION_ERROR
   │
   ├─> Send Stage
   │   ├─ Apply text replacements (Sostituzioni)
   │   ├─ Apply formatting safeguards
   │   ├─ Convert Markdown → HTML
   │   ├─ Send email reply
   │   └─ Label message as processed (IA)
   │
   └─> Memory Update
       ├─ Detect provided topics
       ├─ Update conversation memory atomically
       └─ Increment message count
```

---

## Storage Architecture

### 1. Script Properties (Encrypted by Google)

```
Key-Value store for sensitive data:
- GEMINI_API_KEY: API authentication
- SPREADSHEET_ID: Knowledge base location
```

**Access:** `PropertiesService.getScriptProperties()`

---

### 2. Google Sheets (Knowledge Base)

**Sheet: Istruzioni**
```
Category | Subcategory | Question | Answer | Notes
---------|-------------|----------|--------|------
Text     | Text        | Text     | Text   | Text
```

**Sheet: AI_CORE_LITE**
```
Free-form text: Pastoral principles
```

**Sheet: Dottrina**
```
Tema | Sotto-tema | Tono | Criterio | Limiti | Indicazioni
-----|------------|------|----------|--------|-------------
Text | Text       | Text | Text     | Text   | Text
```

**Sheet: Sostituzioni**
```
BrokenText | FixedText
-----------|----------
Text       | Text
```

**Sheet: ConversationMemory** (auto-created)
```
threadId | language | category | tone | providedInfo | lastUpdated | messageCount | version
---------|----------|----------|------|--------------|-------------|--------------|--------
Text     | Text     | Text     | Text | JSON Array   | ISO Date    | Integer      | Integer
```

---

### 3. In-Memory Cache (GLOBAL_CACHE)

```javascript
GLOBAL_CACHE = {
  knowledgeBase: "...",          // Flattened text from Istruzioni
  knowledgeStructured: [...],    // Parsed array of objects
  aiCoreLite: "...",
  aiCore: "...",
  doctrineBase: "...",
  doctrineStructured: [...],     // For Smart RAG
  replacements: {},
  loaded: true
}
```

**Lifetime:** Per execution (reloaded every trigger run)

**Purpose:** Avoid repeated Sheets API calls within same execution

---

### 4. PropertiesService (Rate Limiter State)

```
Key: rpd_flash-2.5      Value: "245"  // Requests today
Key: rpm_window         Value: "[{...}]"  // Last minute requests (JSON)
Key: tpm_window         Value: "[{...}]"  // Last minute tokens (JSON)
Key: rate_limit_date    Value: "2025-01-13"  // For daily reset
```

**Reset:** 9 AM Italian time (midnight Pacific)

---

## AI Integration

### Gemini API Communication

**HTTP Request Structure:**
```javascript
POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}

Body:
{
  "contents": [{
    "parts": [{"text": "Your prompt here"}]
  }],
  "generationConfig": {
    "temperature": 0.5,
    "maxOutputTokens": 6000
  }
}
```

**Response Structure:**
```javascript
{
  "candidates": [{
    "content": {
      "parts": [{"text": "Generated response"}]
    },
    "finishReason": "STOP"
  }]
}
```

---

### Rate Limiting Architecture

**Three-tier tracking:**

1. **RPM (Requests Per Minute)**
   - Sliding window of last 60 seconds
   - Stored as JSON array in PropertiesService
   - Each entry: `{timestamp, modelKey}`

2. **TPM (Tokens Per Minute)**
   - Sliding window of last 60 seconds
   - Each entry: `{timestamp, modelKey, tokens}`
   - Estimated: ~4 chars = 1 token

3. **RPD (Requests Per Day)**
   - Simple counter reset at 9 AM Italian
   - Separate counter per model

**Model Selection Algorithm:**
```
For each model in strategy priority order:
  1. Check RPD available
  2. Check RPM available
  3. Check TPM available
  4. If all available → Select model
  5. Else → Try next model

If no model available → Return error
```

---

## Design Decisions

### 1. Why Google Apps Script?

**Pros:**
- ✅ Serverless (no infrastructure)
- ✅ Integrated with Gmail/Sheets
- ✅ Free tier generous (6 min/execution)
- ✅ Built-in scheduler (triggers)
- ✅ Zero devops

**Cons:**
- ❌ No async/await (V8 runtime limitations)
- ❌ Execution time limits (6-30 min)
- ❌ No external libraries (limited npm)
- ❌ PropertiesService I/O slow

**Verdict:** Pros outweigh cons for parish use case

---

### 2. Why Google Sheets for KB?

**Alternatives Considered:**
- Firestore (requires separate setup)
- JSON files (no non-technical editing)
- Apps Script Web App (complex UI)

**Why Sheets:**
- ✅ Non-technical staff can edit
- ✅ Familiar interface
- ✅ Revision history built-in
- ✅ Real-time collaboration
- ✅ No additional services

---

### 3. Why Validation Before Send?

**Risk Without Validation:**
- Hallucinated information (fake emails, phone numbers)
- Wrong language
- Grammar errors damage credibility
- Incomplete responses

**Cost of Validation:**
- ~500ms added latency
- Some false positives (human review needed)

**Decision:** Benefits >> Costs → Always validate

---

### 4. Why Memory Service?

**Problem:** AI repeats same info in follow-ups

**Example:**
```
User: "What are mass times?"
AI: "Mass times: Monday-Friday 7:30, 18:00..."

User: "Thanks! And what's the phone?"
AI: "Phone: 06 123456. By the way, mass times are..."  ← Repetitive!
```

**Solution:** Memory tracks what was already provided

---

### 5. Why Rate Limiter?

**Problem:** Gemini free tier quotas exhausted mid-day

**Without Rate Limiter:**
- System fails silently
- All afternoon emails unanswered
- No model fallback

**With Rate Limiter:**
- Tracks usage in real-time
- Switches to fallback models
- Predicts quota exhaustion
- Provides usage dashboard

---

## Scalability Considerations

### Current Limits

| Resource | Limit | Impact |
|----------|-------|--------|
| **Execution time** | 6 min (free) / 30 min (Workspace) | Max ~10-20 emails per run |
| **Trigger frequency** | Every 1 minute minimum | Max 1,440 runs/day |
| **Gemini RPD** | 250 (flash-2.5) | Max ~200 useful replies/day |
| **PropertiesService** | 9 KB per property | Rate limiter state fits easily |
| **Sheets API** | 100 reads/100 sec | KB loading fine, memory service OK |

---

### Scaling Strategies

#### For 50-100 emails/day (current capacity)

✅ **No changes needed** - System handles comfortably

---

#### For 100-300 emails/day

**Optimizations:**
1. Increase `MAX_EMAILS_PER_RUN` to 15-20
2. Use flash-lite model primarily
3. Reduce validation strictness slightly
4. Optimize KB size (<50K chars)

**Expected:** Handles ~250 emails/day within free quotas

---

#### For 300-1000 emails/day

**Required:**
1. ✅ Upgrade to Gemini paid tier
2. ✅ Implement smarter filtering (more ML-based)
3. ✅ Use Document AI for KB (reduce prompt size)
4. ✅ Consider splitting parishes (separate instances)

**Cost:** ~$20-50/month Gemini API

---

#### For 1000+ emails/day (Enterprise)

**Architecture Changes:**
1. ✅ Migrate to Cloud Functions (Node.js)
2. ✅ Use Firestore for KB (faster than Sheets)
3. ✅ Implement webhook-based triggers (real-time)
4. ✅ Add Redis cache layer
5. ✅ Fine-tune custom Gemini model

**Cost:** ~$100-300/month (compute + AI)

---

### Bottlenecks

**Current bottlenecks ranked:**

1. **Gemini RPD quota** (250/day) - Hardest limit
2. **Execution time** (6 min) - Can optimize
3. **PropertiesService I/O** (rate limiter) - Acceptable
4. **Sheets API reads** (KB loading) - Cached well

---

## Future Architecture Improvements

### Near-term (v2.2)

- [ ] Implement webhook triggers (real-time)
- [ ] Add response caching for identical questions
- [ ] Optimize prompt size (smart template selection)
- [ ] Add Firestore option for memory (faster than Sheets)

### Mid-term (v3.0)

- [ ] Support multiple parishes (multi-tenant)
- [ ] Web dashboard for monitoring
- [ ] Fine-tuned model option
- [ ] Advanced analytics

### Long-term (v4.0)

- [ ] Voice integration (phone calls)
- [ ] Proactive notifications (event reminders)
- [ ] Sentiment analysis (urgent cases priority)
- [ ] Integration with parish management software

---

## Testing Architecture

### Test Levels

1. **Unit Tests** (`UnitTests.gs`)
   - Classifier logic
   - Prompt Context logic
   - Territory validation
   - Response validator
   - Regression tests for recent bug fixes
   - Utility functions

2. **Integration Tests**
   - Gmail API connectivity
   - Gemini API connectivity
   - Sheets API access
   - End-to-end dry run

3. **Manual Tests**
   - Send real test emails
   - Verify responses quality
   - Check validation catches errors
   - Monitor quota usage

---

## Security Considerations

### 1. API Key Protection

✅ **Current:** Stored in Script Properties (encrypted by Google)  
✅ **Never** in code or version control

### 2. Email Content

⚠️ **Privacy:** Email content sent to Gemini API  
ℹ️ **Review:** [Google AI Terms](https://ai.google.dev/gemini-api/terms)

### 3. XSS Prevention

✅ **Markdown Conversion:** All user input sanitized before HTML generation  
✅ **URL Validation:** Blocks javascript:, data:, file: schemes

### 4. SSRF Prevention

✅ **Internal IP Blocking:** Prevents requests to 127.0.0.1, 192.168.x.x, 10.x.x.x  
✅ **Localhost Blocking:** Prevents localhost, 169.254.x.x

### 5. Header Injection

✅ **Header Sanitization:** Escapes To:, Cc:, Bcc:, From: in email body

---

## Performance Metrics

**Typical execution times:**

| Stage | Duration | Notes |
|-------|----------|-------|
| Load resources | 1-2s | First run only (cached) |
| Gmail search | 0.5-1s | Per 10 emails |
| Classification | 0.5-1s | Per email (with quick check) |
| Prompt building | 0.1s | Cached templates |
| Gemini API call | 2-4s | Depends on prompt size |
| Validation | 0.3s | 7 checks |
| Send reply | 0.5-1s | HTML conversion + send |

**Total per email:** ~4-8 seconds  
**10 emails/run:** ~45-90 seconds execution

---

## Related Documentation

- [Main README](../README.md) - Overview
- [Setup Guide](SETUP.md) - Installation
- [Configuration Reference](CONFIGURATION.md) - All settings
- [Contributing](CONTRIBUTING.md) - Development guide

---

**Questions about architecture?**
- [GitHub Discussions](https://github.com/YOUR_USERNAME/parish-autoresponder/discussions)
- [GitHub Issues](https://github.com/YOUR_USERNAME/parish-autoresponder/issues)
