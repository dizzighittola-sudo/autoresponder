[![🇬🇧 English](https://img.shields.io/badge/lang-English-blue)](CONTRIBUTING.md) [![🇮🇹 Italiano](https://img.shields.io/badge/lang-Italiano-green)](CONTRIBUIRE.md)

# Contributing to Parish AI Autoresponder

First off, thank you for considering contributing to Parish AI Autoresponder! 🙏

## 🌟 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the behavior
- **Expected behavior** vs actual behavior
- **Screenshots** (if applicable)
- **Environment details** (Apps Script version, Gmail settings, etc.)
- **Logs** from the Apps Script execution

**Example bug report:**
```markdown
**Title**: NaN error in salutation computation with invalid timestamps

**Description**: When processing emails with corrupted timestamp metadata, the system crashes with NaN error.

**Steps to Reproduce**:
1. Create test email with invalid date header
2. Trigger autoRespondToEmails()
3. Check logs

**Expected**: Graceful fallback to default salutation
**Actual**: Execution fails with NaN error

**Environment**: Google Apps Script, Gmail API v1
**Logs**: [paste relevant logs]
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear use case** - What problem does this solve?
- **Proposed solution** - How would you implement it?
- **Alternatives considered** - What other approaches did you think about?
- **Impact** - Who benefits from this enhancement?

### Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **Make your changes** following our coding standards
3. **Add tests** for any new functionality
4. **Ensure tests pass** by running `runAllTests()`
5. **Update documentation** if needed
6. **Write clear commit messages**
7. **Submit the PR** with a comprehensive description

## 📋 Coding Standards

### JavaScript Style

```javascript
// ✅ GOOD: Clear function names, JSDoc, error handling
/**
 * Validates email address format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    console.warn('Invalid email input');
    return false;
  }
  
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

// ❌ BAD: No docs, no validation, unclear naming
function check(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}
```

### Documentation

- **All functions** must have JSDoc comments
- **Complex logic** should have inline comments
- **Bug fixes** must include `// FIX Bug #X: Description` comments
- **TODOs** should reference GitHub issues: `// TODO(#123): Description`

### Testing

Every new feature or bug fix must include tests:

```javascript
/**
 * Test for new email validation function
 */
function test_validateEmail_validFormat() {
  const result = validateEmail('test@example.com');
  return TestRunner.assertEqual(result, true, 'Valid email should pass');
}

function test_validateEmail_invalidFormat() {
  const result = validateEmail('invalid-email');
  return TestRunner.assertEqual(result, false, 'Invalid email should fail');
}

function test_validateEmail_nullInput() {
  const result = validateEmail(null);
  return TestRunner.assertEqual(result, false, 'Null input should fail gracefully');
}
```

### Commit Messages

Follow the Conventional Commits specification:

```
feat: Add support for Portuguese language detection
fix: Prevent NaN in salutation mode computation (#7)
docs: Update README with circuit breaker configuration
test: Add unit tests for territory validator
refactor: Extract KB selection logic to separate module
perf: Optimize memory cache lookup performance
```

## 🧪 Testing Guidelines

### Before Submitting

1. Run unit tests: `runAllTests()`
2. Run integration tests: `runIntegrationTests()`
3. Run full suite: `runFullTestSuite()`
4. Verify no new errors in logs
5. Test in dry-run mode first
6. Check performance impact

### Writing Tests

- **Test one thing** per test function
- **Use descriptive names**: `test_[module]_[scenario]_[expectedResult]`
- **Cover edge cases**: null, undefined, empty, boundary values
- **Assert clearly**: Use TestRunner.assertEqual for better error messages
- **Mock dependencies**: Use `_createMockEmail()` for realistic scenarios
- **Integration tests**: Test component interactions, not just units

### Test Types

**Unit Tests** - Test individual functions in isolation:
```javascript
function test_salutationMode_invalidTimestamp() {
  const result = computeSalutationMode({
    lastUpdated: 'invalid-date',
    now: new Date()
  });
  return TestRunner.assertEqual(result, 'none_or_continuity', 'Test name');
}
```

**Integration Tests** - Test component interactions:
```javascript
function test_integration_classifyTechnical() {
  loadResources();
  const mock = _createMockEmail('technical');
  const classifier = new EmailClassifier();
  const result = classifier.classifyEmail(mock.body, mock.subject);
  
  return TestRunner.assert(
    result.category === 'information',
    'Classification should work end-to-end'
  );
}
```

### Test Coverage Requirements

- **Bug fixes**: Must include unit test for regression
- **New features**: Must include both unit test + integration test
- **Refactoring**: Existing tests must still pass
- **Critical paths**: Must have integration test coverage

## 🏗️ Architecture Guidelines

### Module Organization

```
Main.gs              → Entry point, configuration, resource loading
EmailProcessor.gs    → Core processing pipeline
GeminiService.gs     → AI integration layer
PromptEngine.gs      → Prompt construction logic
ResponseValidator.gs → Quality assurance
MemoryService.gs     → Conversational context
TerritoryValidator.gs→ Geographic validation
CircuitBreaker.gs    → Resilience pattern
UnitTests.gs         → Test suite
```

### Adding New Modules

When creating a new module:

1. **Follow single responsibility principle**
2. **Use factory functions** for dependency injection
3. **Include comprehensive JSDoc**
4. **Add unit tests** in UnitTests.gs
5. **Update README.md** architecture diagram

Example module template:

```javascript
// ====================================================================
// MODULE_NAME - Brief description
// ====================================================================
// Detailed description of what this module does and why it exists.
// List key responsibilities and design decisions.
// ====================================================================

/**
 * Factory function to create ModuleName instance
 * @param {Object} dependencies - Injected dependencies
 * @returns {Object} ModuleName instance
 */
function createModuleName(dependencies = {}) {
  const { 
    serviceA = getDefaultServiceA(),
    serviceB = getDefaultServiceB()
  } = dependencies;
  
  return {
    /**
     * Public method description
     * @param {string} param - Parameter description
     * @returns {Object} Return value description
     */
    publicMethod: function(param) {
      // Implementation
    },
    
    // ... other public methods
  };
}

/**
 * Private helper function
 */
function _privateHelper() {
  // Implementation
}
```

## 🔍 Code Review Process

### What Reviewers Look For

1. **Correctness**: Does it solve the problem?
2. **Testing**: Are there adequate tests?
3. **Performance**: Any performance implications?
4. **Security**: Any security concerns?
5. **Maintainability**: Is it easy to understand and modify?
6. **Documentation**: Is it well-documented?

### Review Checklist

- [ ] Code follows style guidelines
- [ ] Tests added and passing
- [ ] Documentation updated
- [ ] No security vulnerabilities
- [ ] Performance impact acceptable
- [ ] Backward compatibility maintained
- [ ] Error handling appropriate

## 📚 Additional Resources

- [Google Apps Script Documentation](https://developers.google.com/apps-script)
- [Gemini AI Documentation](https://ai.google.dev/docs)
- [Gmail API Reference](https://developers.google.com/gmail/api)
- [Project Architecture](docs/ARCHITECTURE.md) *(coming soon)*

## 🤔 Questions?

- **General questions**: Open a [GitHub Discussion](https://github.com/dizzighittola/autoresponder/discussions)
- **Bug reports**: Open a [GitHub Issue](https://github.com/dizzighittola/autoresponder/issues)
- **Security concerns**: Email info@parrocchiasanteugenio.it (private disclosure)

## 💝 Recognition

Contributors will be:
- Listed in the project README
- Mentioned in release notes
- Credited in commits

Thank you for making Parish AI Autoresponder better! 🙏

---

*"Whatever you do, work at it with all your heart, as working for the Lord" - Colossians 3:23*
