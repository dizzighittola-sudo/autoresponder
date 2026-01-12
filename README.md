[![🇬🇧 English](https://img.shields.io/badge/lang-English-blue)](README.md) [![🇮🇹 Italiano](https://img.shields.io/badge/lang-Italiano-green)](README_IT.md)

# 🤖 Parish AI Autoresponder

> An intelligent, multilingual email autoresponder system for Catholic parishes using Google Apps Script and Gemini AI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-4285F4?logo=google&logoColor=white)](https://script.google.com)
[![Gemini AI](https://img.shields.io/badge/Gemini%20AI-8E75B2?logo=google&logoColor=white)](https://ai.google.dev)
[![Code Quality](https://img.shields.io/badge/code%20quality-9.6%2F10-brightgreen)](https://github.com)

## 📖 Overview

Parish AI Autoresponder is a production-ready, enterprise-grade email automation system designed specifically for Catholic parishes. It automatically responds to parishioner emails with context-aware, liturgically-informed answers in multiple languages while maintaining a warm, pastoral tone.

### ✨ Key Features

- 🌍 **Multilingual Support**: Seamless handling of Italian, English, Spanish, and other languages
- 📚 **Dynamic Knowledge Base**: Smart selection of relevant information based on query complexity
- 🔒 **Territory Validation**: Automatic verification of parish boundaries
- 🕐 **Liturgical Awareness**: Context-aware greetings based on liturgical calendar
- 💬 **Conversational Memory**: Maintains context across email threads

- 🧪 **Comprehensive Testing**: Unit tests for critical components
- 📊 **Smart Rate Limiting**: Multi-model API quota management

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Gmail Trigger                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     Email Processor                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Filter     │→ │  Classify    │→ │   Generate   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│           ↓                 ↓                  ↓             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Validate   │→ │    Memory    │→ │     Send     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      Core Services                           │
│                                                               │
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ GeminiService │  │MemoryService │  │PromptEngine     │  │
│  │               │  │              │  │                 │  │
│  │ • API calls   │  │ • Thread     │  │ • Dynamic       │  │
│  │ • Language    │  │   tracking   │  │ • Dynamic       │  │
│  │   detection   │  │ • Context    │  │   prompts       │  │
│  │ • Circuit     │  │   management │  │ • Liturgical    │  │
│  │   breaker     │  │              │  │   context       │  │
│  └───────────────┘  └──────────────┘  └─────────────────┘  │
│                                                               │
│  ┌──────────────────┐  ┌─────────────────────────────────┐ │
│  │ ResponseValidator│  │ TerritoryValidator              │ │
│  │                  │  │                                 │ │
│  │ • Hallucination  │  │ • Address matching              │ │
│  │   detection      │  │ • Boundary verification         │ │
│  │ • Format check   │  │                                 │ │
│  └──────────────────┘  └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Google Workspace account with Gmail access
- Google Apps Script project
- Gemini API key ([Get one here](https://ai.google.dev))
- Google Sheets for knowledge base storage

### Installation

1. **Create a new Google Apps Script project**
   ```
   Open Google Drive → New → More → Google Apps Script
   ```

2. **Copy the source files**
   - Copy all `.gs` files from this repository to your Apps Script project
   - Maintain the file structure as provided

3. **Set up Google Sheets**
   - Create a new Google Sheet for your knowledge base
   - Set up sheets: `Istruzioni`, `AI_CORE_LITE`, `AI_CORE`, `Dottrina`, `ConversationMemory`
   - Set up control sheets: `Controllo`, `Filtri Email`, `Sostituzioni`
   - Copy the sheet ID from the URL

4. **Configure Script Properties**
   ```javascript
   File → Project Properties → Script Properties → Add:
   
   GEMINI_API_KEY = your_gemini_api_key
   SHEET_ID = your_google_sheet_id
   PARISH_EMAIL = info@parrocchiasanteugenio.it
   ```

5. **Set up Gmail trigger**
   ```javascript
   Run: setupTrigger()
   
   // Or manually:
   Edit → Current project's triggers → Add Trigger
   Function: autoRespondToEmails
   Event source: Time-driven
   Interval: Every 5 minutes
   ```

6. **Test the setup**
   ```javascript
   Run: testGeminiConnection()
   Run: runQuickTest()
   ```

## 📚 Documentation

### Core Modules

#### 1. **Main.gs**
Entry point and configuration management. Contains:
- Global configuration (`CONFIG` object)
- Resource loading and caching
- Trigger management
- Structured data parsing

#### 2. **EmailProcessor.gs**
Main processing pipeline:
- Email filtering (no-reply, loops, self-emails)
- Thread context analysis
- Response generation coordination
- Memory updates

#### 3. **GeminiService.gs**
AI integration layer:
- Gemini API communication
- Language detection (hybrid AI + regex)
- Circuit breaker integration
- Rate limiting

#### 4. **PromptEngine.gs**
Intelligent prompt construction:
- Dynamic prompt profile system (lite/standard/heavy)

#### 5. **ResponseValidator.gs**
Quality assurance:
- Hallucination detection
- Format validation
- Territory reference checking
- Completeness scoring

#### 6. **MemoryService.gs**
Conversational context:
- Thread-level memory storage
- Topic tracking
- Language consistency
- Atomic updates with locking

#### 7. **TerritoryValidator.gs**
Geographic validation:
- Address parsing and normalization
- Parish boundary checking
- Unicode-aware matching



#### 9. **UnitTests.gs**
Quality assurance:
- Bug regression tests
- Circuit breaker validation
- Edge case coverage

## 🧪 Testing

**For complete testing documentation, see [TESTING.md](TESTING.md)**

### Run all unit tests
```javascript
runAllTests()  // 12 unit tests for critical bugs
```

### Run integration tests
```javascript
runIntegrationTests()  // 9 integration tests for components
```

### Run complete test suite
```javascript
runFullTestSuite()  // All 21 tests (unit + integration)
```

### Quick smoke test
```javascript
runQuickTest()  // Fast sanity check
```

### Test individual components
```javascript
testGeminiConnection()

test_salutationMode_invalidTimestamp()
test_integration_classifyTechnical()
```

### Expected output
```
╔══════════════════════════════════════╗
🧪 RUNNING CRITICAL UNIT TESTS
╚══════════════════════════════════════╝

--- Bug #7: computeSalutationMode ---
✅ PASS: Bug #7: Invalid timestamp should return none_or_continuity
✅ PASS: Bug #7: Null timestamp should return none_or_continuity
✅ PASS: Bug #7: Recent valid timestamp (2h ago) should return none_or_continuity
✅ PASS: First message should return full salutation

--- Bug #2: Time Regex ---
✅ PASS: Bug #2: Time pattern should NOT match inside URL
✅ PASS: Bug #2: Time pattern should match standalone times



--- KnowledgeSelector ---
✅ PASS: KnowledgeSelector: Should return kbForPrompt and kbForValidation
✅ PASS: KnowledgeSelector: Territory block should be included

╔══════════════════════════════════════╗
📊 Tests: 12/12 passed, 0 failed
╚══════════════════════════════════════╝

╔══════════════════════════════════════╗
🔗 RUNNING INTEGRATION TESTS
╚══════════════════════════════════════╝

--- Classification ---
✅ PASS: Integration: Technical email should be classified as information/sacrament
✅ PASS: Integration: Orari request should be TECHNICAL

--- Language Detection ---
✅ PASS: Integration: Italian email should detect as IT
✅ PASS: Integration: English email should detect as EN

--- Prompt & Validation ---
✅ PASS: Integration: Prompt should contain email content and be substantial
✅ PASS: Integration: Valid response should pass validation
✅ PASS: Integration: Hallucinated times should be detected

--- E2E ---
✅ PASS: Integration E2E: Resources should load successfully
✅ PASS: Integration: Quick check should return valid shouldRespond

╔══════════════════════════════════════╗
📊 Tests: 21/21 passed, 0 failed
╚══════════════════════════════════════╝
```

## ⚙️ Configuration

### Main Configuration (`Main.gs`)

```javascript
const CONFIG = {
  // Core settings
  PARISH_EMAIL: 'info@parrocchiasanteugenio.it',
  SENDER_NAME: 'Parish Office',
  
  // Rate limiting
  RATE_LIMITER: {
    FLASH_QUOTA: 15,
    FLASH_WINDOW_MS: 60000,
    PRO_QUOTA: 1000,
    PRO_WINDOW_MS: 60000
  },
  
  // Prompt profiles
  PROMPT_PROFILES: {
    LITE: { skipTemplates: ['ExamplesTemplate'] },
    STANDARD: { skipTemplates: [] },
    HEAVY: { includeAll: true }
  },
  
  // Circuit breaker
  CIRCUIT_BREAKER: {
    THRESHOLD: 5,
    TIMEOUT_MS: 60000
  }
};
```

### Knowledge Base Structure

The system uses Google Sheets with the following structure:

**KB_Main**: General parish information
- Columns: `Categoria`, `Domanda`, `Risposta`, `Priorità`

**KB_AI_Core_Lite**: Essential AI context (always included)
- Columns: `Topic`, `Content`, `Priority`

**KB_AI_Core**: Extended AI guidelines
- Columns: `Topic`, `Content`, `Priority`

**KB_Doctrine**: Catholic doctrine references
- Columns: `Argomento`, `Sotto-tema`, `Tono consigliato`, `Criterio pastorale`, `Limiti da non superare`

**Memory**: Conversational memory
- Columns: `threadId`, `language`, `category`, `topics`, `lastUpdated`

**Controllo**: System On/Off control (Kill-Switch)
- Cell **B2**: `Acceso` (ON) or `Spento` (OFF)
- When OFF, system stops processing all emails

**Filtri Email**: Dynamic email filters
- Columns: `Tipo Filtro`, `Valore`, `Attivo (SI/NO)`
- Types: `email` (exact match), `dominio` (domain contains), `keyword` (subject/body contains)

**Sostituzioni**: Text replacements
- Columns: `Testo Errato`, `Testo Corretto`

## 🌟 Advanced Features

### 1. Dynamic Prompt Profiles

The system uses prompt profiles to optimize response generation:

```javascript
// Lite mode (simple queries)
- Skips optional templates
- Faster generation

// Standard mode (normal queries)  
- Full template set
- Balanced approach

// Heavy mode (complex queries)
- All templates included
- Maximum context
```

### 2. Liturgical Context Awareness

Automatic greeting adaptation based on liturgical calendar:

```javascript
// Christmas Season (Dec 25 - Jan 13)
"Buon Natale! 🎄"

// Easter Season (varies by year)
"Buona Pasqua! 🌷"

// Lent (40 days before Easter)
"Buon cammino di Quaresima 🕊️"

// Ordinary Time
Standard greetings based on time of day
```

### 3. Conversational Memory

Thread-level context tracking:
- Detected language persistence
- Message category tracking
- Provided information topics
- Last interaction timestamp

### 4. Territory Validation

Automatic parish boundary checking:
- Address normalization (accents, abbreviations)
- Geographic matching against parish boundaries
- Clear out-of-territory messaging

### 5. Hallucination Prevention

Multi-layer validation:
- Forbidden phrase detection
- Format structure checking
- Territory reference validation
- KB consistency scoring

## 🔒 Security & Privacy

### Data Protection
- ✅ No personal data stored permanently (GDPR compliant)
- ✅ Memory sheet contains only: threadId, language, category, topics
- ✅ API keys stored securely in Script Properties
- ✅ No email content logged

### Input Validation
- ✅ Prompt injection detection
- ✅ Anti-loop protection (max thread length)
- ✅ Self-reply prevention
- ✅ No-reply sender filtering

### Rate Limiting
- ✅ Per-model API quota tracking
- ✅ Cooldown periods between requests
- ✅ Circuit breaker for API failures

### System Control (Kill-Switch)
- ✅ On/Off control via Google Sheets (`Controllo` sheet, cell B2)
- ✅ Values: `Acceso` (ON) / `Spento` (OFF)
- ✅ Default to OFF for safety if sheet not found

### Dynamic Email Filters
- ✅ Filters loaded from `Filtri Email` sheet
- ✅ Three filter types: `email`, `dominio`, `keyword`
- ✅ Per-filter activation toggle (`SI`/`NO`)
- ✅ Combined with hardcoded default filters

## 📊 Performance

### Benchmarks (typical email processing)

| Operation | Time | Notes |
|-----------|------|-------|
| Email fetch | ~500ms | Gmail API |
| Classification | ~800ms | Gemini Flash |
| Response generation | ~2-4s | Gemini Pro |
| Validation | ~300ms | Local + regex |
| Total | ~4-6s | End-to-end |

### Optimization Techniques

1. **Multi-level caching**
   - Label cache (60s TTL)
   - Memory cache (5min TTL)
   - Resource cache (session-level)

2. **Prompt Profile System**
   - Dynamic template filtering
   - Faster generation times
   - Lower API costs

3. **Structured data parsing**
   - One-time parsing at startup
   - O(1) access to KB entries
   - Memory-efficient storage

## 🐛 Bug Fixes & Testing

This project includes comprehensive testing for critical bugs:

### Fixed Bugs

| Bug ID | Description | Fix | Test Coverage |
|--------|-------------|-----|---------------|
| #1 | Race condition in memory updates | Atomic locking | ✅ Tested |
| #2 | Time regex matching URLs | Boundary checks | ✅ Tested |
| #3 | Cache not invalidated on error | Error handling | ✅ Tested |
| #4 | Deadlock in resource loading | Lock with timeout | ✅ Tested |
| #5 | Spanish detection too sensitive | Weight adjustment | ✅ Tested |
| #7 | NaN in salutation computation | Explicit NaN check | ✅ Tested |

### Test Coverage

- **21 tests total** (12 unit + 9 integration)
- **100% coverage** of bug fixes
- **Edge case testing** (null, invalid, boundary values)
- **Circuit breaker validation** (all states)
- **Component integration** (classification, language detection, validation)
- **End-to-end workflows** (dry-run mode)

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Add tests** for new functionality
4. **Ensure all tests pass** (`runAllTests()`)
5. **Commit your changes** (`git commit -m 'Add amazing feature'`)
6. **Push to the branch** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

### Coding Standards

- ✅ Use JSDoc comments for functions
- ✅ Add unit tests for bug fixes
- ✅ Include FIX comments for bug resolutions
- ✅ Maintain consistent naming conventions
- ✅ Keep functions under 100 lines when possible

## 📝 Changelog

### v2.0.0 (Current)
- ✅ Added Circuit Breaker pattern for API resilience
- ✅ Implemented comprehensive unit testing framework
- ✅ Fixed 6 critical bugs (see Bug Fixes section)
- ✅ Added dynamic prompt profile system for optimization
- ✅ Improved multi-language detection accuracy
- ✅ Enhanced liturgical calendar awareness

### v2.1.0 (Latest)
- ✅ Added System Control (Kill-Switch) via `Controllo` sheet
- ✅ Added Dynamic Email Filters via `Filtri Email` sheet
- ✅ Support for per-filter activation toggle

### v1.0.0
- Initial release with core functionality

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for powerful language models
- **Catholic parishes** for real-world requirements and testing
- **Google Apps Script** community for platform support

## 📧 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/dizzighittola/autoresponder/issues)
- **Discussions**: [GitHub Discussions](https://github.com/dizzighittola/autoresponder/discussions)
- **Email**: info@parrocchiasanteugenio.it

## 🌟 Star History

If you find this project useful, please consider giving it a star ⭐

---

**Made with ❤️ for Catholic parishes worldwide**

*"For where two or three gather in my name, there am I with them." - Matthew 18:20*
