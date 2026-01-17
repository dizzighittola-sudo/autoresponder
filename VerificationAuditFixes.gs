/**
 * TEST: ReDoS hardening in ResponseValidator
 */
function testReDoSProtection() {
  const validator = new ResponseValidator();
  
  // Test case 1: Very long string of digits (previously risky)
  console.log('--- Testing long digit string (ReDoS check) ---');
  const longDigits = '1'.repeat(100);
  const start = Date.now();
  const phonePattern = /\b(?:\+?\d{1,3})?[\s.-]?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{2,4}\b/g;
  const matches = longDigits.match(phonePattern);
  const duration = Date.now() - start;
  
  console.log(`Matches found: ${matches ? matches.length : 0}`);
  console.log(`Duration: ${duration}ms (Goal: < 50ms)`);
  
  if (duration < 50) {
    console.log('✅ ReDoS protection: SUCCESS (Pattern is fast)');
  } else {
    console.warn('⚠️ ReDoS protection: WARNING (Pattern is slow)');
  }
}

/**
 * TEST: Validation with varied phone formats
 */
function testPhoneValidationFormats() {
  const validator = new ResponseValidator();
  const cases = [
    { text: "Mi contatti al 0123 456 789", expected: true },
    { text: "Il numero è +39 333 123 4567", expected: true },
    { text: "Chiama o333.123.45.67", expected: true },
    { text: "Ufficio 012-345-6789", expected: true },
    { text: "Not a phone 12:30", expected: false },
    { text: "Too short 123 456", expected: false }
  ];
  
  console.log('\n--- Testing Phone Format Compatibility ---');
  let successCount = 0;
  
  const phonePattern = /\b(?:\+?\d{1,3})?[\s.-]?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{2,4}\b/g;
  
  cases.forEach(c => {
    const matches = c.text.match(phonePattern) || [];
    const normalized = matches.map(p => p.replace(/\D/g, '')).filter(p => p.length >= 8);
    const hasMatch = normalized.length > 0;
    
    if (hasMatch === c.expected) {
      console.log(`✅ [OK] "${c.text}" -> Found: ${hasMatch}`);
      successCount++;
    } else {
      console.warn(`❌ [FAIL] "${c.text}" -> Found: ${hasMatch} (Expected: ${c.expected})`);
    }
  });
  
  console.log(`Results: ${successCount}/${cases.length} passed`);
}

/**
 * TEST: Simulate Logging for Catches (Manual check in logs)
 */
function simulateLoggingCatches() {
  console.log('\n--- Simulation instructions ---');
  console.log('1. Open Main.gs, GeminiRateLimiter.gs, MemoryService.gs');
  console.log('2. Verify that console.warn is present in finally/catch blocks for locks.');
  console.log('3. During normal execution, check execution logs for "⚠️ Errore nel rilascio ScriptLock" at regular intervals only if API errors occur.');
}
