# Contributing to Parish Email Autoresponder

Thank you for your interest in contributing! This project helps parish communities worldwide, and your contribution makes a real difference.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Translation](#translation)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive experience for everyone, regardless of:
- Level of experience
- Gender identity and expression
- Sexual orientation
- Disability
- Personal appearance
- Body size
- Race or ethnicity
- Age
- Religion or lack thereof
- Nationality

### Our Standards

**Examples of behavior that contributes to a positive environment:**

✅ Using welcoming and inclusive language  
✅ Being respectful of differing viewpoints  
✅ Gracefully accepting constructive criticism  
✅ Focusing on what is best for the community  
✅ Showing empathy towards other community members  

**Examples of unacceptable behavior:**

❌ Trolling, insulting/derogatory comments  
❌ Public or private harassment  
❌ Publishing others' private information  
❌ Other conduct inappropriate in a professional setting  

### Enforcement

Violations may result in:
1. Warning
2. Temporary ban
3. Permanent ban

Report violations to: [your-email@example.com]

---

## How Can I Contribute?

### 🐛 Reporting Bugs

**Before submitting:**
1. Check [existing issues](https://github.com/YOUR_USERNAME/parish-autoresponder/issues)
2. Run `healthCheck()` to verify system status
3. Review [troubleshooting guide](docs/TROUBLESHOOTING.md)

**When reporting:**
- Use bug report template
- Include steps to reproduce
- Provide execution logs (anonymize personal data)
- Specify your environment (GAS version, quotas, etc.)

### 💡 Suggesting Enhancements

**Feature requests should:**
- Solve a real parish need
- Be technically feasible in Google Apps Script
- Not significantly increase quota usage
- Include use case description

**Use the feature request template** and describe:
- Problem it solves
- Proposed solution
- Alternative solutions considered
- Impact on existing features

### 🌍 Translating

Help make this available to more communities!

**Priority languages:**
- Spanish (partial support exists)
- French
- German
- Polish
- Portuguese

See [Translation Guide](#translation) below.

### 📖 Improving Documentation

Documentation improvements are always welcome:
- Fix typos or unclear instructions
- Add examples for common scenarios
- Translate docs to other languages
- Create video tutorials
- Write blog posts about your experience

### 💻 Contributing Code

See [Development Setup](#development-setup) below.

---

## Development Setup

### Prerequisites

- Node.js 14+
- Git
- Google account
- Gemini API key
- Google Apps Script CLI (clasp)

### Fork and Clone

```bash
# Fork repository on GitHub first, then:
git clone https://github.com/YOUR_USERNAME/parish-autoresponder.git
cd parish-autoresponder

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/parish-autoresponder.git
```

### Set Up Development Environment

```bash
# Install clasp if not already installed
npm install -g @google/clasp

# Login to Google
clasp login

# Create development project
clasp create --type standalone --title "Parish Autoresponder Dev"

# Push code
clasp push
```

### Configure for Testing

1. Create test Google Sheet for KB
2. Set Script Properties (dev API key, sheet ID)
3. Enable Gmail API
4. Configure test email account

**Use dry-run mode for testing:**
```javascript
// In Main.gs CONFIG:
DRY_RUN: true  // Prevents sending real emails
```

### Create Feature Branch

```bash
git checkout -b feature/your-feature-name
```

---

## Pull Request Process

### Before Submitting

- [ ] Code follows [Coding Standards](#coding-standards)
- [ ] All tests pass (run `runAllTests()`)
- [ ] No console.log (use Logger.log or appropriate logging)
- [ ] Documentation updated if needed
- [ ] Commit messages are clear and descriptive
- [ ] PR description explains changes and motivation

### PR Guidelines

**Title Format:**
```
[Type] Short description

Examples:
[Feature] Add Portuguese language support
[Fix] Correct territory validation regex
[Docs] Update knowledge base template
[Refactor] Simplify prompt engine logic
```

**Description Should Include:**
1. What problem does this solve?
2. How does it solve it?
3. Any breaking changes?
4. Testing performed
5. Screenshots/logs if relevant

### Review Process

1. Automated checks run (if configured)
2. Maintainer reviews code
3. Feedback may be provided
4. Make requested changes
5. Once approved, maintainer merges

**Expected timeline:**
- Initial response: 48-72 hours
- Full review: 5-7 days
- May be longer for large PRs

---

## Coding Standards

### General Principles

1. **Readability over cleverness**
2. **Comments explain "why", not "what"**
3. **Functions do one thing well**
4. **Minimize side effects**
5. **Defensive programming** (validate inputs)

### Style Guide

#### Naming Conventions

```javascript
// Classes: PascalCase
class EmailProcessor { }

// Functions: camelCase
function processEmail() { }

// Constants: UPPER_SNAKE_CASE
const MAX_EMAILS_PER_RUN = 10;

// Private methods: _leadingUnderscore
_validateInput() { }
```

#### Code Structure

```javascript
// Good: Clear structure
class MyService {
  constructor() {
    // Initialize
  }
  
  // Public methods first
  publicMethod() { }
  
  // Private methods after
  _privateHelper() { }
}

// Bad: Mixed public/private
class MyService {
  _privateHelper() { }
  publicMethod() { }
  constructor() { }
}
```

#### Error Handling

```javascript
// Good: Specific error messages
if (!apiKey) {
  throw new Error('GEMINI_API_KEY not configured in Script Properties');
}

// Bad: Vague error
if (!apiKey) {
  throw new Error('Configuration error');
}
```

#### Comments

```javascript
// Good: Explains why
// FIX Bug #15: Rate limiter must use Pacific timezone
// because Google's quota resets at midnight Pacific
const resetTime = getPacificMidnight();

// Bad: States the obvious
// Set the reset time
const resetTime = getPacificMidnight();
```

### Google Apps Script Specifics

#### Avoid Async/Await

GAS doesn't fully support modern async patterns. Use callbacks or synchronous code.

```javascript
// Good:
function callApi() {
  const response = UrlFetchApp.fetch(url);
  return JSON.parse(response.getContentText());
}

// Bad (won't work):
async function callApi() {
  const response = await fetch(url);
  return await response.json();
}
```

#### Quota Awareness

```javascript
// Good: Batch operations
const data = sheet.getDataRange().getValues();
// Process in memory
sheet.getRange(1, 1, data.length, data[0].length).setValues(data);

// Bad: Multiple calls
for (let i = 0; i < 100; i++) {
  const value = sheet.getRange(i, 1).getValue();  // 100 API calls!
  sheet.getRange(i, 2).setValue(value);
}
```

#### Lock Service Usage

```javascript
// Good: Always release lock
const lock = LockService.getScriptLock();
try {
  lock.waitLock(30000);
  // Critical section
} finally {
  lock.releaseLock();
}

// Bad: Lock not released on error
const lock = LockService.getScriptLock();
lock.waitLock(30000);
// Critical section
lock.releaseLock();
```

---

## Testing Guidelines

### Unit Tests

Run test suite:
```javascript
runAllTests()
```

**Required tests for:**
- New validation rules
- Classification logic changes
- Territory validation updates
- Utility functions

**Test format:**
```javascript
function testMyFeature() {
  const input = 'test input';
  const expected = 'expected output';
  const actual = myFunction(input);
  
  assertEqual(actual, expected, 'Feature should work correctly');
}
```

### Integration Tests

Test with real Gmail API:
```javascript
testGeminiConnection()
testGmailConnection()
```

### Manual Testing Checklist

- [ ] Test with Italian email
- [ ] Test with English email
- [ ] Test with Spanish email (if applicable)
- [ ] Test acknowledgment filtering
- [ ] Test validation catches errors
- [ ] Test territory validation (if modified)
- [ ] Test in dry-run mode first
- [ ] Test with real email after dry-run passes

---

## Documentation

### When Documentation is Required

**Always document:**
- New features
- Breaking changes
- Configuration options
- API changes
- Complex algorithms

**Update affected files:**
- README.md (if user-facing change)
- SETUP.md (if setup changes)
- TROUBLESHOOTING.md (if adds new failure mode)
- Code comments (for complex logic)

### Documentation Style

**Be specific:**
```markdown
✅ Good:
Run `createTimeTrigger()` to set up a trigger that executes 
`main()` every 10 minutes.

❌ Bad:
Create a trigger to run the main function.
```

**Include examples:**
```markdown
Example:
```javascript
CONFIG.MAX_EMAILS_PER_RUN = 5;
```

Processes maximum 5 emails per execution, preventing timeout issues.
```

---

## Translation

### Adding a New Language

#### 1. Language Detection

Update `LANGUAGE_MARKERS` in `Main.gs`:

```javascript
const LANGUAGE_MARKERS = {
  'it': ['grazie', 'cordiali', ...],
  'en': ['thank', 'regards', ...],
  'fr': ['merci', 'cordialement', ...]  // Add new
};
```

#### 2. Adaptive Greeting

Update `getAdaptiveGreeting()` in `GeminiService.gs`:

```javascript
else if (language === 'fr') {
  if (hour >= 5 && hour < 12) {
    greeting = 'Bonjour,';
  } else {
    greeting = 'Bonsoir,';
  }
  closing = 'Cordialement,';
}
```

#### 3. Prompt Templates

Update `PromptEngine.gs` with language-specific instructions.

#### 4. Documentation

Translate:
- [ ] README.md → README_[LANG].md
- [ ] SETUP.md → docs/SETUP_[LANG].md
- [ ] TROUBLESHOOTING.md → docs/TROUBLESHOOTING_[LANG].md

#### 5. Test

Create test knowledge base in new language and verify:
- Language detection works
- Appropriate greeting used
- Responses in correct language
- Grammar validation appropriate

---

## Recognition

Contributors are recognized in:
- README.md acknowledgments section
- CONTRIBUTORS.md file (if substantial contribution)
- Release notes (for major features)

---

## Questions?

- **Documentation:** [Main README](../README.md)
- **Discussions:** [GitHub Discussions](https://github.com/YOUR_USERNAME/parish-autoresponder/discussions)
- **Email:** your-email@example.com

Thank you for contributing to this project! 🙏
