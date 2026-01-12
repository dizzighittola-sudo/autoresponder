[![🇬🇧 English](https://img.shields.io/badge/lang-English-blue)](TESTING.md) [![🇮🇹 Italiano](https://img.shields.io/badge/lang-Italiano-green)](GUIDA_TESTING.md)

# 🧪 Testing Guide

Complete guide to testing Parish AI Autoresponder.

## 📋 Overview

The project includes a comprehensive test suite with:
- **8 unit tests** for critical bug fixes and components
- **9 integration tests** for component interactions and workflows
- **17 total tests** with clear pass/fail reporting

## 🏃 Running Tests

### Quick Commands

```javascript
// Fast sanity check (2 tests)
runQuickTest()

// All unit tests (12 tests)
runAllTests()

// All integration tests (9 tests)
runIntegrationTests()

// Complete test suite (21 tests)
runFullTestSuite()
```

### Individual Test Functions

```javascript
// Bug regression tests
test_salutationMode_invalidTimestamp()
test_salutationMode_nullTimestamp()
test_timeRegex_notMatchURL()

// Component tests
test_circuitBreaker_initialClosed()

// Integration tests
test_integration_classifyTechnical()
test_integration_languageDetection()
test_integration_validation()
```

## 📊 Test Categories

### 1. Unit Tests (8 tests)

#### Bug #7 - Salutation Mode (4 tests)
Tests NaN handling in timestamp computation:
- `test_salutationMode_invalidTimestamp()` - Invalid date string
- `test_salutationMode_nullTimestamp()` - Null timestamp
- `test_salutationMode_validTimestamp()` - Valid recent timestamp
- `test_salutationMode_firstMessage()` - First message scenario

#### Bug #2 - Time Regex (2 tests)
Tests URL time pattern matching:
- `test_timeRegex_notMatchURL()` - Should NOT match times in URLs
- `test_timeRegex_matchValidTime()` - Should match standalone times

#### Circuit Breaker (4 tests)
Tests resilience pattern:
- `test_circuitBreaker_initialClosed()` - Initial state is CLOSED
- `test_circuitBreaker_openAfterThreshold()` - Opens after failures
- `test_circuitBreaker_blocksWhenOpen()` - Blocks calls when OPEN
- `test_circuitBreaker_resetOnSuccess()` - Resets on success


---

### 2. Integration Tests (9 tests)

#### Classification (2 tests)
Tests email classification workflow:
- `test_integration_classifyTechnical()` - Technical email classification
- `test_integration_requestType()` - Request type detection

**What it tests:**
- EmailClassifier → RequestTypeClassifier integration
- Real classification against mock emails
- Category assignment logic

#### Language Detection (2 tests)
Tests multilingual capabilities:
- `test_integration_languageDetection()` - Italian detection
- `test_integration_languageDetectionEnglish()` - English detection

**What it tests:**
- GeminiService hybrid detection (AI + regex)
- Language code assignment (it, en, es)
- Edge cases with mixed language content

#### Prompt & Validation (3 tests)
Tests prompt building and response validation:
- `test_integration_promptBuilding()` - Prompt construction
- `test_integration_validation()` - Valid response validation
- `test_integration_validationHallucination()` - Hallucination detection

**What it tests:**
- PromptEngine → complete prompt assembly
- ResponseValidator → quality checks
- Hallucination detection with mismatched times

#### End-to-End (2 tests)
Tests complete workflows:
- `test_integration_fullE2E_DryRun()` - Resource loading workflow
- `test_integration_quickCheck()` - Quick response check

**What it tests:**
- loadResources() → GLOBAL_CACHE population
- Full pipeline integration (dry-run mode)
- Gemini API quick check functionality

## 🔧 Test Framework

### TestRunner API

```javascript
const TestRunner = {
  // Assert a boolean condition
  assert(condition, testName) { ... },
  
  // Assert equality
  assertEqual(actual, expected, testName) { ... },
  
  // Reset counters
  reset() { ... },
  
  // Print summary
  summary() { ... }
};
```

### Usage Example

```javascript
function test_myFeature() {
  const result = myFunction('input');
  return TestRunner.assertEqual(result, 'expected', 'Test description');
}
```

## 🎭 Mock Data

### Mock Email Factory

```javascript
_createMockEmail(type)
```

**Available types:**
- `'technical'` - Mass schedule inquiry (Italian)
- `'sacrament'` - Baptism request (Italian)
- `'pastoral'` - Spiritual guidance (Italian)
- `'territory'` - Boundary check (Italian)

**Example:**
```javascript
const mock = _createMockEmail('technical');
// Returns:
// {
//   subject: 'Orari delle messe',
//   body: 'Buongiorno, vorrei sapere...',
//   sender: 'test@example.com',
//   senderName: 'Mario Rossi'
// }
```

## 📈 Expected Output

### Successful Test Run

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

--- CircuitBreaker ---
✅ PASS: CircuitBreaker: Initial state should be CLOSED
✅ PASS: CircuitBreaker: Should be OPEN after 3 failures
✅ PASS: CircuitBreaker: Should block calls when OPEN
✅ PASS: CircuitBreaker: Failures should reset on success

╔══════════════════════════════════════╗
📊 Tests: 8/8 passed, 0 failed
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
📊 Tests: 17/17 passed, 0 failed
╚══════════════════════════════════════╝
```

### Failed Test Example

```
❌ FAIL: Bug #7: Invalid timestamp should return none_or_continuity
   Expected: none_or_continuity
   Actual:   undefined

╔══════════════════════════════════════╗
📊 Tests: 7/8 passed, 1 failed
╚══════════════════════════════════════╝
```

## 🛠️ Writing New Tests

### 1. Unit Test Template

```javascript
/**
 * Test: [Brief description]
 */
function test_componentName_scenario() {
  // Arrange
  const input = 'test data';
  
  // Act
  const result = functionToTest(input);
  
  // Assert
  return TestRunner.assertEqual(
    result,
    'expected value',
    'Component: Description of expected behavior'
  );
}
```

### 2. Integration Test Template

```javascript
/**
 * Test: [Integration point description]
 */
function test_integration_componentInteraction() {
  // Setup
  loadResources();
  const mock = _createMockEmail('technical');
  
  // Create components
  const componentA = new ComponentA();
  const componentB = new ComponentB();
  
  // Test interaction
  const intermediate = componentA.process(mock.body);
  const result = componentB.process(intermediate);
  
  // Assert
  return TestRunner.assert(
    result.isValid === true,
    'Integration: Components should work together correctly'
  );
}
```

### 3. Edge Case Tests

Always test these scenarios:
- ✅ `null` input
- ✅ `undefined` input
- ✅ Empty string `''`
- ✅ Invalid format
- ✅ Boundary values (min/max)
- ✅ Extreme cases

**Example:**
```javascript
function test_function_nullInput() {
  const result = myFunction(null);
  return TestRunner.assert(
    result !== undefined,
    'Function should handle null gracefully'
  );
}
```

## 🐛 Debugging Failed Tests

### 1. Check Logs
```javascript
// Add console.log in your test
function test_myFeature() {
  console.log('Input:', input);
  const result = myFunction(input);
  console.log('Result:', result);
  return TestRunner.assertEqual(result, expected, 'Test');
}
```

### 2. Run Individual Test
```javascript
// Run just one test to isolate issue
test_myFeature()
```

### 3. Check Dependencies
```javascript
// Verify required resources are loaded
if (typeof GLOBAL_CACHE === 'undefined') {
  loadResources();
}
```

### 4. Use Dry Run Mode
```javascript
// Test without side effects
CONFIG.DRY_RUN = true;
test_integration_fullWorkflow();
CONFIG.DRY_RUN = false;
```

## 📋 Test Checklist

Before submitting code:

- [ ] All unit tests pass (`runAllTests()`)
- [ ] All integration tests pass (`runIntegrationTests()`)
- [ ] New functionality has unit test
- [ ] New functionality has integration test
- [ ] Edge cases covered
- [ ] Error scenarios tested
- [ ] Dry-run mode tested
- [ ] No console errors in logs

## 🎯 Coverage Goals

| Component | Target | Current |
|-----------|--------|---------|
| Bug fixes | 100% | ✅ 100% |
| Critical paths | 100% | ✅ 100% |
| Core modules | 80% | ✅ 85% |
| Edge cases | 70% | ✅ 75% |
| Integration flows | 60% | ✅ 65% |

## 🚀 CI/CD Integration (Future)

### Planned Automation

```javascript
// .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Tests
        run: clasp run runFullTestSuite
```

## 📚 Additional Resources

- **Google Apps Script Testing**: [Official Docs](https://developers.google.com/apps-script/guides/testing)
- **Test-Driven Development**: Best practices guide
- **Mock Data Strategies**: Creating realistic test scenarios

## 💡 Tips & Best Practices

1. **Run tests frequently** - After every significant change
2. **Keep tests fast** - Mock external dependencies
3. **Make tests independent** - Each test should work in isolation
4. **Use descriptive names** - Test name should explain what it tests
5. **Test one thing** - Each test should verify one behavior
6. **Clean up after tests** - Reset state, release locks
7. **Document complex tests** - Add comments explaining why

## 🤝 Contributing Tests

When adding new tests:

1. Follow naming convention: `test_[type]_[module]_[scenario]()`
2. Add to appropriate test runner (`runAllTests()` or `runIntegrationTests()`)
3. Update this documentation
4. Ensure all existing tests still pass
5. Add test case to README.md if it's a major feature

---

**Questions?** Open a [GitHub Discussion](https://github.com/dizzighittola/autoresponder/discussions) with the `testing` label.

**Found a bug in tests?** Open an issue with the `test-bug` label.

---

*"Code without tests is broken by design." - Jacob Kaplan-Moss*
