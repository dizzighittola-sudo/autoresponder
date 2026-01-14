# 🤖 Parish Email Autoresponder

[![Language](https://img.shields.io/badge/🇬🇧_English-blue?style=for-the-badge)](README.md) [![Language](https://img.shields.io/badge/🇮🇹_Italiano-red?style=for-the-badge)](README_IT.md)

> **Intelligent AI-powered email autoresponder for Catholic parish offices** — Built with Google Apps Script and Google Gemini API

Transform your parish email workflow with an AI assistant that responds intelligently when your secretariat is unavailable. Perfect for nights, weekends, holidays, and vacation periods.

---

## 🌟 Why This Project?

Parish secretariats receive hundreds of emails asking about mass times, sacrament preparations, document requests, and pastoral guidance. This system provides:

- **24/7 availability** when human staff cannot respond
- **Intelligent, pastoral responses** using Google's Gemini AI
- **Multi-language support** for diverse communities
- **Context-aware replies** that remember conversation history
- **Territory validation** for baptism/wedding eligibility
- **Zero cost** using free-tier Google services

---

## 📋 Key Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI-Powered Responses** | Uses Gemini 2.5 Flash for intelligent, contextual replies |
| 📅 **Smart Scheduling** | Activates only when office is closed (nights, weekends, holidays) |
| 🌍 **Multilingual** | Auto-detects and responds in IT, EN, ES, FR, DE, PL, TR, PT... |
| 📊 **Rate Limiting** | Intelligent quota management with automatic model fallback |
| ✅ **Response Validation** | Quality checks before sending to prevent hallucinations |
| 🧠 **Conversation Memory** | Maintains context across email threads |
| 🏠 **Territory Validation** | Verifies addresses within parish boundaries |
| 📈 **Monitoring** | Built-in health checks and usage dashboards |

---

## 🎯 Real-World Impact

**Before:**
- Emails unanswered for 48+ hours
- Frustrated parishioners calling multiple times
- Staff overwhelmed on Monday mornings

**After:**
- Instant acknowledgment with helpful information
- Reduced phone call volume by 40%
- Staff focused on complex cases requiring human touch

---

## 🚀 Quick Start

### Prerequisites

- Google Workspace account (free Gmail works too)
- Google Sheets for knowledge base
- [Gemini API key](https://ai.google.dev/) (free tier: 1,500 requests/day)
- 10 minutes setup time

### Installation

```bash
# 1. Install Google Apps Script CLI
npm install -g @google/clasp

# 2. Clone this repository
git clone https://github.com/dizzighittola/parish-autoresponder.git
cd parish-autoresponder

# 3. Login to Google Apps Script
clasp login

# 4. Create new Apps Script project
clasp create --type standalone --title "Parish Autoresponder"

# 5. Push code to Apps Script
clasp push
```

### Configuration

1. **Get Gemini API Key** (free)
   - Visit https://ai.google.dev/
   - Create API key
   - Copy key for next step

2. **Set Script Properties**
   - Open Apps Script Editor
   - Project Settings → Script Properties
   - Add:
     - `GEMINI_API_KEY`: Your API key
     - `SPREADSHEET_ID`: Your knowledge base spreadsheet ID

3. **Create Knowledge Base**
   - Copy [this template](KNOWLEDGE_BASE_TEMPLATE.md)
   - Fill with your parish information
   - Save spreadsheet ID to Script Properties

4. **Create Time Trigger**
   - In Apps Script Editor, run function: `createTimeTrigger()`
   - Authorizes and sets up 10-minute interval execution

**✅ Done!** Your autoresponder is now active.

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        PROCESSING PIPELINE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 📬 FILTER    →  Should we process this email?              │
│     ├─ Domain/keyword blocklist                                │
│     ├─ Anti-loop detection                                     │
│     └─ Self-sent message filter                                │
│                                                                 │
│  2. 🔍 CLASSIFY  →  What type of request is this?              │
│     ├─ Ultra-simple acknowledgment filter                      │
│     ├─ Gemini quick check (respond: yes/no)                    │
│     └─ Technical/Pastoral/Doctrinal classification             │
│                                                                 │
│  3. 🤖 GENERATE  →  Create AI response                          │
│     ├─ Dynamic prompt composition (18 templates)               │
│     ├─ Knowledge base injection                                │
│     ├─ Conversation history context                            │
│     └─ Gemini API call with rate limiting                      │
│                                                                 │
│  4. ✅ VALIDATE  →  Quality control                             │
│     ├─ Length check (25-3000 chars)                            │
│     ├─ Language consistency                                    │
│     ├─ Hallucination detection (fake emails/phones/times)     │
│     ├─ Grammar validation (capital after comma)                │
│     └─ Signature presence                                      │
│                                                                 │
│  5. 📧 SEND      →  Reply to email                              │
│     ├─ Markdown → HTML conversion                              │
│     ├─ Text replacement safeguards                             │
│     ├─ Update conversation memory                              │
│     └─ Label message as processed                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Module Structure

| Module | Purpose | Key Classes |
|--------|---------|-------------|
| **Main.gs** | Entry point, configuration | `CONFIG`, holiday logic |
| **EmailProcessor.gs** | Pipeline orchestrator | `EmailProcessor` |
| **GeminiService.gs** | AI integration | `GeminiService` |
| **GeminiRateLimiter.gs** | Quota management | `GeminiRateLimiter` |
| **Classifier.gs** | Email filtering | `EmailClassifier` |
| **RequestTypeClassifier.gs** | Request categorization | `RequestTypeClassifier` |
| **PromptEngine.gs** | Prompt generation | `PromptEngine` |
| **ResponseValidator.gs** | Quality checks | `ResponseValidator` |
| **GmailService.gs** | Gmail operations | `GmailService` |
| **MemoryService.gs** | Conversation context | `MemoryService` |
| **TerritoryValidator.gs** | Address verification | `TerritoryValidator` |

---

## 🔧 Configuration Guide

### Activation Schedule

The system **activates** (responds) when secretariat is unavailable:

| Condition | Behavior |
|-----------|----------|
| **Weeknights** | ✅ Active (secretariat closed) |
| **Weekends** | ✅ Active (Saturday & Sunday) |
| **Holidays** | ✅ Active (Easter, Christmas, National holidays) |
| **Work Hours** | ⏸️ Suspended (secretariat working) |

**Office Hours** (system suspended):
- Monday: 8:00-20:00
- Tuesday: 8:00-14:00
- Wednesday: 8:00-17:00
- Thursday: 8:00-14:00
| Friday: 8:00-17:00

> **Note:** Customize schedule in `Main.gs` → `SUSPENSION_HOURS` and `ALWAYS_OPERATING_DAYS`

### Gemini API Quotas (January 2026)

| Model | RPM | TPM | RPD | Purpose |
|-------|-----|-----|-----|---------|
| `gemini-2.5-flash` | 10 | 250K | 250 | 🥇 Response generation |
| `gemini-2.5-flash-lite` | 15 | 250K | 1,000 | 🥈 Quick checks + fallback |
| `gemini-2.0-flash` | 5 | 250K | 100 | 🥉 Legacy backup |

⏰ **Quota resets:** 9:00 AM Italian time (midnight Pacific)

The system automatically switches between models when quotas are exhausted.

---

## 📁 Knowledge Base Structure

The system uses Google Sheets for easy content management:

| Sheet Name | Purpose | Example Content |
|------------|---------|-----------------|
| **Istruzioni** | Operational info | Mass times, contacts, procedures |
| **AI_CORE_LITE** | Basic pastoral principles | Tone guidelines, common situations |
| **AI_CORE** | Extended pastoral guidance | Complex discernment scenarios |
| **Dottrina** | Doctrinal guidelines | Catholic teaching on sacraments, marriage, etc. |
| **Sostituzioni** | Text replacements | Automatic corrections (e.g., "peregrinaggio" → "pellegrinaggio") |
| **ConversationMemory** | Thread context | Language, category, provided info |

**Pro tip:** Update your knowledge base regularly. The AI's quality depends on your content!

---

## 🛠️ Utility Functions

Run these from the Apps Script Editor:

| Function | Purpose | When to Use |
|----------|---------|-------------|
| `main()` | Manual execution | Test or trigger manually |
| `testDryRun()` | Test without sending | Safe testing environment |
| `testGeminiConnection()` | Verify API access | Troubleshoot API issues |
| `healthCheck()` | Full system status | Monitor system health |
| `showQuotaDashboard()` | View quota usage | Track API consumption |
| `cleanupMemory()` | Remove old memory | Housekeeping (auto-weekly) |
| `testHolidayLogic()` | Verify schedule | Confirm activation dates |

---

## 🔒 Security & Privacy

### Data Handling

- **Email content:** Processed by Google Gemini API (see [Google AI Terms](https://ai.google.dev/gemini-api/terms))
- **Conversation memory:** Stored in your Google Sheet (your control)
- **No external storage:** All data remains in Google ecosystem
- **API key security:** Stored in Script Properties (encrypted by Google)

### Best Practices

✅ **Do:**
- Review generated responses periodically
- Update knowledge base with accurate information
- Monitor error labels for issues
- Test changes in dry-run mode first

❌ **Don't:**
- Share your API key publicly
- Include sensitive personal data in knowledge base
- Disable validation without understanding risks
- Forget to monitor quota usage

---

## 📖 Documentation

- **[Setup Guide](SETUP.md)** — Step-by-step installation
- **[Configuration Reference](CONFIGURATION.md)** — All options explained
- **[Knowledge Base Guide](KNOWLEDGE_BASE_TEMPLATE.md)** — Creating quality content
- **[Troubleshooting](TROUBLESHOOTING.md)** — Common issues & solutions
- **[Contributing](CONTRIBUTING.md)** — How to contribute

---

## 🤝 Contributing

Contributions are welcome! Whether it's:

- 🐛 Bug reports
- 💡 Feature requests
- 📖 Documentation improvements
- 🌍 Translations
- 💻 Code contributions

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📊 Project Status

### Current Version: 2.1.0

**Stable Features:**
- ✅ Core email processing pipeline
- ✅ Multi-language detection (12 languages)
- ✅ Gemini API integration with rate limiting
- ✅ Response validation (7 checks)
- ✅ Conversation memory
- ✅ Territory validation
- ✅ Holiday scheduling

**Roadmap:**
- 🚧 Web dashboard for monitoring
- 🚧 Custom fine-tuned model support
- 🚧 Advanced analytics
- 🚧 Multi-parish deployment templates

---

## ❓ FAQ

**Q: Does this work with Microsoft 365 / Outlook?**  
A: Currently Gmail-only. Outlook integration is on roadmap.

**Q: What if Gemini makes a mistake?**  
A: Responses are validated before sending. Error cases get flagged with `IA_VALIDATION_ERROR` label for human review.

**Q: Can I customize the AI's personality?**  
A: Yes! Edit the system prompt templates in `PromptEngine.gs` and pastoral guidelines in your knowledge base.

**Q: Is this GDPR compliant?**  
A: Email processing uses Google's infrastructure (GDPR-compliant). Review [Google AI Terms](https://ai.google.dev/gemini-api/terms) for Gemini API specifics.

**Q: How much does it cost?**  
A: **Free** if you stay within Gemini's free tier (1,500 requests/day). Typical parish usage: 50-150 requests/day.

---

## 🙏 Acknowledgments

**Built with:**
- [Google Apps Script](https://developers.google.com/apps-script)
- [Google Gemini API](https://ai.google.dev/)
- [Gmail API](https://developers.google.com/gmail/api)
- [Google Sheets API](https://developers.google.com/sheets/api)

**Inspired by:**
- Real parish secretariat needs
- Desire to serve communities 24/7
- The potential of AI for good

**Special thanks to:**
- Parish staff who provided feedback
- The Google Gemini team
- Early adopters and testers

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file

Copyright (c) 2025 Parish Autoresponder Contributors

---

## 📞 Support & Community

- **Issues:** [GitHub Issues](https://github.com/dizzighittola/parish-autoresponder/issues)
- **Discussions:** [GitHub Discussions](https://github.com/dizzighittola/parish-autoresponder/discussions)
- **Email:** dizzighittola@gmail.com

---

<div align="center">

**Made with ❤️ for parish communities**

⭐ Star this repo if it helps your parish! ⭐

</div>
