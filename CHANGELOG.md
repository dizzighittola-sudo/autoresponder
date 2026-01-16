# Changelog

All notable changes to Parish Email Autoresponder will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Web dashboard for monitoring and analytics
- Multi-parish support (multi-tenant)
- Custom fine-tuned model support
- Voice integration (phone call handling)
- Advanced analytics and reporting

---

## [2.1.1] - 2026-01-16

### Fixed
- **Critical Fix (BUG-2)**: Implemented Thread-Based Lock (via CacheService) in `EmailProcessor` to fix global blocking issue, allowing parallel processing of different threads.
- **Stability Fix (BUG-6)**: Added validation for invalid/null `lastUpdated` timestamps in `PromptContext` to prevent runtime crashes.
- **Documentation (IMP-2)**: Added clarification for Cache TTL rationale in `GmailService`.

---

## [2.1.0] - 2025-01-13

### Added
- **Comprehensive Documentation Package**
  - Enhanced README with feature matrix and real-world impact
  - Detailed setup guide with step-by-step instructions
  - Knowledge base template and best practices
  - Complete troubleshooting guide
  - Configuration reference documentation
  - Architecture documentation
  - Contributing guidelines
  - MIT License

- **Bilingual Documentation**
  - Full English documentation suite
  - Complete Italian translations
  - Language switcher badges in README

### Changed
- Improved README structure with clearer navigation
- Enhanced troubleshooting section with common issues
- Updated configuration examples with best practices
- Refined architecture diagrams and explanations

### Documentation
- Added SETUP.md with detailed installation steps
- Added KNOWLEDGE_BASE_TEMPLATE.md with content guidelines
- Added TROUBLESHOOTING.md with diagnostic procedures
- Added CONFIGURATION.md with all config options
- Added ARCHITECTURE.md with technical deep-dive
- Added CONTRIBUTING.md with development guidelines

---

## [2.0.0] - 2025-01-10

### Added
- **Rate Limiter System** (`GeminiRateLimiter.gs`)
  - Intelligent quota management
  - Automatic model fallback
  - RPM, TPM, RPD tracking
  - Usage dashboard (`showQuotaDashboard()`)

- **Enhanced Validation** (`ResponseValidator.gs`)
  - 7-point quality checks
  - Hallucination detection (fake emails, phones, times)
  - Grammar validation (capital after comma)
  - Language consistency verification
  - Signature presence check

- **Conversation Memory** (`MemoryService.gs`)
  - Thread-level context tracking
  - Anti-repetition logic
  - Atomic updates with optimistic locking
  - Automatic weekly cleanup

- **Request Type Classification**
  - Technical/Pastoral/Doctrinal/Mixed detection
  - Hybrid Gemini + regex approach
  - Conditional KB loading (performance optimization)

- **Dynamic Prompt Engineering**
  - 18 modular templates
  - Profile-based focusing (lite/standard/heavy)
  - Token budget management
  - Smart RAG from structured doctrine

- **Territory Validation** (`TerritoryValidator.gs`)
  - Address extraction from email
  - Verification against parish boundaries
  - Support for complex rules (odd/even numbers, ranges)

### Changed
- **Gemini Service** complete rewrite
  - Multi-language detection (12 languages)
  - Adaptive greeting based on time and holidays
  - Quick check for respond/no-respond decision
  - Exponential backoff retry logic

- **Email Processor** architecture overhaul
  - Lock-based race condition prevention
  - Message-level labeling (not thread-level)
  - Optimized batch processing
  - Enhanced error handling

- **Prompt Engine** major refactor
  - Modular template system
  - Dynamic template selection
  - Temporal awareness for dates/events
  - Salutation mode (full/soft/none) for continuity

### Fixed
- Bug #1: MONTH constant indexing (0-based)
- Bug #2: Invalid JSON parsing in quick check
- Bug #3: XSS in markdown links
- Bug #5: Time regex breaking filenames
- Bug #6: Timestamp validation in memory
- Bug #7: Timezone handling (Pacific vs Italian)
- Bug #10: Input validation in PromptContext
- Bug #11: Updated RPD quotas to current values
- Bug #12: MemoryService timestamp validation
- Bug #13: Retry backoff optimization
- Bug #14: Confidence threshold adjustment
- Bug #15: Lock service for memory updates
- Bug #16: Optimistic locking in memory service
- Bug #17: Prompt token limit enforcement
- Bug #18: ReDoS in territory validator
- Bug #19: Header injection prevention
- Bug #20: SSRF prevention in markdown links

### Security
- XSS prevention in markdown-to-HTML conversion
- SSRF protection (internal IP blocking)
- Header injection sanitization
- URL scheme validation

---

## [1.5.0] - 2024-12-15

### Added
- Basic holiday scheduling logic
- Ferragosto period handling (August 15-31)
- Easter-based holiday calculation
- Special mass time rules for holidays

### Changed
- Improved language detection accuracy
- Enhanced classifier for acknowledgments

### Fixed
- False positive filtering on "Grazie, ma..." emails
- Language detection for emails with mixed content

---

## [1.0.0] - 2024-11-20

### Added
- Initial release
- Basic email processing pipeline
- Gemini integration
- Knowledge base support (Google Sheets)
- Simple validation
- Gmail API integration
- Time-based triggers

### Features
- Filter, Classify, Generate, Validate, Send pipeline
- Italian language support
- Basic acknowledgment filtering
- Office hours suspension
- Dry-run mode

---

## Version Numbering

This project uses [Semantic Versioning](https://semver.org/):

- **MAJOR version** (X.0.0): Incompatible API changes or major architecture changes
- **MINOR version** (0.X.0): Add functionality in a backwards compatible manner
- **PATCH version** (0.0.X): Backwards compatible bug fixes

---

## Migration Guides

### Migrating from 1.x to 2.x

**Breaking Changes:**
- Rate limiter requires new configuration in `CONFIG.GEMINI_MODELS`
- Memory service requires new sheet: `ConversationMemory`
- Updated Gemini model names (flash-2.5, flash-lite)

**Steps:**
1. Update `Main.gs` with new CONFIG structure
2. Create `ConversationMemory` sheet (or let system auto-create)
3. Update Script Properties with new quotas
4. Test with `testDryRun()` before production
5. Monitor `showQuotaDashboard()` for quota usage

**Recommended:** Review [Setup Guide](docs/SETUP.md) for full 2.x setup.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to propose changes to this project.

---

## Support

- **Documentation:** [Complete docs](README.md)
- **Issues:** [GitHub Issues](https://github.com/YOUR_USERNAME/parish-autoresponder/issues)
- **Discussions:** [GitHub Discussions](https://github.com/YOUR_USERNAME/parish-autoresponder/discussions)
