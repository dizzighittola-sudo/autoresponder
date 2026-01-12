[![🇬🇧 English](https://img.shields.io/badge/lang-English-blue)](CHANGELOG.md) [![🇮🇹 Italiano](https://img.shields.io/badge/lang-Italiano-green)](CHANGELOG_IT.md)

# Changelog

All notable changes to Parish AI Autoresponder will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-01-11

### 🎉 Major Release - Production Ready

This release represents a major milestone with comprehensive testing, bug fixes, and resilience improvements.

### ✨ Added

#### Circuit Breaker Pattern
- **New module**: `CircuitBreaker.gs` for API failure resilience
- Implements CLOSED → OPEN → HALF-OPEN state machine
- Persistent state using PropertiesService (survives execution context)
- Configurable threshold (default: 5 failures) and timeout (default: 60s)
- Integrated with GeminiService for automatic API failure handling
- Admin functions: `getStatus()`, `reset()` for monitoring and management

#### Comprehensive Unit Testing
- **New module**: `UnitTests.gs` with 21 test cases (12 unit + 9 integration)
- Test framework with `TestRunner` (assert, assertEqual, summary)
- Bug regression tests for all 6 critical bugs
- Circuit breaker state transition tests
- Knowledge selector validation tests
- **Integration tests** for:
  - Email classification (RequestTypeClassifier)
  - Language detection (Italian, English)
  - Prompt building (PromptEngine)
  - Response validation (including hallucination detection)
  - End-to-end workflows with DRY_RUN mode
- Mock email factory for realistic testing scenarios
- `runAllTests()`, `runIntegrationTests()`, `runFullTestSuite()` runners


### 🐛 Fixed

#### Bug #1 - Race Condition in Memory Updates
- **Issue**: Concurrent `updateMemory()` and `addProvidedInfoTopics()` caused data loss
- **Fix**: Consistent use of `updateMemoryAtomic()` with single lock
- **Impact**: Critical - prevented memory corruption
- **Location**: `EmailProcessor.gs` line ~442
- **Test**: `test_memoryUpdate_atomic()` (implied in testing suite)

#### Bug #2 - Time Regex Matching URLs
- **Issue**: Pattern `(\d{1,2})\.([0-5]\d)` matched URLs like `example.com/event/12.30/details`
- **Fix**: Added word boundary `\b` and negative lookahead `(?![\/\w])`
- **Impact**: Medium - prevented false positive time normalization
- **Location**: `ResponseValidator.gs` line ~343
- **Test**: `test_timeRegex_notMatchURL()`

#### Bug #3 - Cache Not Invalidated on Error
- **Issue**: Memory cache remained stale after update failures
- **Fix**: Added `_invalidateCache()` call in catch block
- **Impact**: Low - minor staleness issue
- **Location**: `MemoryService.gs` line ~108
- **Test**: Covered by integration testing

#### Bug #4 - Deadlock in Resource Loading
- **Issue**: Non-atomic check-then-set allowed concurrent resource loading
- **Fix**: Implemented `LockService.getScriptLock()` with `tryLock(2000)`
- **Impact**: Medium - prevented resource duplication and race conditions
- **Location**: `Main.gs` line ~180-210
- **Test**: Manual testing with concurrent triggers

#### Bug #5 - Spanish Language Detection Too Sensitive
- **Issue**: Names like "María García" in Italian emails caused false positives
- **Fix**: Reduced weight for 'ñ' from 3 to 2, '¿¡' from 5 to 3
- **Impact**: Low - improved language detection accuracy
- **Location**: `GeminiService.gs` line ~185
- **Test**: Manual testing with edge cases

#### Bug #7 - NaN in Salutation Mode Computation
- **Issue**: Invalid/null timestamps caused `NaN` in time calculations
- **Fix**: Explicit `isNaN(hoursSinceLast)` check with fallback to 'none_or_continuity'
- **Impact**: Critical - prevented execution failures
- **Location**: `EmailProcessor.gs` line ~895
- **Test**: `test_salutationMode_invalidTimestamp()`, `test_salutationMode_nullTimestamp()`

### 🔧 Changed

- **GeminiService**: Integrated circuit breaker checks before API calls
- **Main**: Improved resource loading with atomic locking
- **PromptEngine**: Dynamic template filtering based on prompt profile
- **ResponseValidator**: More precise time pattern matching

### 📚 Documentation

- Added comprehensive README.md with architecture diagrams
- Created CONTRIBUTING.md with coding standards
- Added SECURITY.md with security best practices
- Created .gitignore for Google Apps Script projects
- Added inline FIX comments for all bug resolutions

### ⚡ Performance

- Prompt profile system reduces template overhead for simple queries
- Cache improvements reduce redundant Sheet reads
- Atomic operations prevent lock contention

### 🔒 Security

- Circuit breaker prevents API quota exhaustion attacks
- Enhanced input validation
- Improved error handling prevents information leakage

---

## [1.0.0] - 2025-12-15

### 🎉 Initial Release

#### Core Features

- **Multi-language Support**: Italian, English, Spanish with automatic detection
- **Email Processing Pipeline**: Filter → Classify → Generate → Validate → Send
- **Gemini AI Integration**: Smart response generation with context awareness
- **Conversational Memory**: Thread-level context tracking
- **Territory Validation**: Automatic parish boundary checking
- **Liturgical Calendar**: Context-aware greetings for religious seasons
- **Rate Limiting**: Multi-model API quota management
- **Hallucination Prevention**: Multi-layer validation system

#### Modules

- `Main.gs` - Configuration and resource management
- `EmailProcessor.gs` - Core processing pipeline
- `GeminiService.gs` - AI integration layer
- `PromptEngine.gs` - Dynamic prompt construction
- `ResponseValidator.gs` - Quality assurance
- `MemoryService.gs` - Conversational context
- `TerritoryValidator.gs` - Geographic validation
- `RequestTypeClassifier.gs` - Intent classification

#### Documentation

- Basic README with setup instructions
- Inline code documentation
- Configuration examples

---

## [Unreleased]

### 🚀 Planned Features

#### v2.1.0
- [ ] Performance profiling and metrics dashboard
- [ ] Enhanced monitoring with Google Sheets logging
- [ ] Attachment detection and handling
- [ ] User feedback collection mechanism
- [ ] Automated memory cleanup with GDPR retention policy

#### v2.2.0
- [ ] Multi-parish support with organization hierarchy
- [ ] Advanced scheduling with special event calendar
- [ ] Template library for common responses
- [ ] A/B testing framework for prompt optimization
- [ ] Analytics dashboard with response metrics

#### v3.0.0
- [ ] Provider abstraction layer (OpenAI, Claude support)
- [ ] Voice message support
- [ ] Mobile app companion
- [ ] Advanced NLP with custom fine-tuning
- [ ] Multi-channel support (WhatsApp, Telegram)

### 🐛 Known Issues

- Memory sheet cleanup is manual (needs automated retention policy)
- No visual dashboard for monitoring (planned for v2.1)
- Limited to single parish per instance (multi-tenant in v2.2)

---

## Version History Summary

| Version | Date | Description | Status |
|---------|------|-------------|--------|
| 2.0.0 | 2026-01-11 | Production-ready with testing & resilience | ✅ Current |
| 1.0.0 | 2025-12-15 | Initial release | ⚠️ Security fixes only |

---

## Migration Guides

### Upgrading from 1.0.0 to 2.0.0

1. **Add CircuitBreaker.gs** to your Apps Script project
2. **Add UnitTests.gs** for testing capability
3. **Update Main.gs** with new loadResources() implementation
4. **Update GeminiService.gs** with circuit breaker integration
5. **Update EmailProcessor.gs** with atomic memory updates
6. **Update ResponseValidator.gs** with improved time regex
7. **Run `runAllTests()`** to verify migration
8. **Test in dry-run mode** before going live

No breaking changes in configuration or Google Sheets structure.

---

## Credits

### v2.0.0 Contributors
- Lead Developer: Romolo
- Code Review: [Reviewer Name]
- Testing: [Tester Name]
- Documentation: [Doc Author]

### Special Thanks
- Google Gemini AI team for API support
- Google Apps Script community
- Parish staff for real-world feedback and testing

---

*For detailed commit history, see [GitHub Commits](https://github.com/dizzighittola/autoresponder/commits)*
