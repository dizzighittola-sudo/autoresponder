/**
 * UnitTests.gs
 * Suite di test unitari per verificare la logica core del sistema.
 * Eseguire la funzione `runAllTests()` per avviare la suite.
 */

var TEST_RESULTS = {
  passed: 0,
  failed: 0,
  errors: []
};

/**
 * Entry point per l'esecuzione di tutti i test.
 */
function runAllTests() {
  TEST_RESULTS = { passed: 0, failed: 0, errors: [] };
  console.log("🚀 AVVIO TEST SUITE...");
  
  try {
    setupTestEnvironment();
    
    testClassifier();
    testRequestTypeClassifier();
    testTerritoryValidator();
    testResponseValidator();
    // testUtils(); // Decommentare se si aggiungono test per utils
    
  } catch (e) {
    console.error("❌ ERRORE CRITICO DURANTE I TEST: " + e.toString());
    TEST_RESULTS.errors.push("CRITICAL EXCEPTION: " + e.toString());
    TEST_RESULTS.failed++; // Count the crash as a failure
  }
  
  console.log("\n📊 RIEPILOGO TEST:");
  console.log("✅ Passed: " + TEST_RESULTS.passed);
  console.log("❌ Failed: " + TEST_RESULTS.failed);
  
  if (TEST_RESULTS.failed > 0 || TEST_RESULTS.errors.length > 0) {
    console.error("❌ TEST FALLITI. Dettagli Errori:");
    TEST_RESULTS.errors.forEach(function(err) {
      console.error("- " + err);
    });
  } else {
    console.log("🎉 TUTTI I TEST PASSATI CON SUCCESSO!");
  }
}

/**
 * Mocking e preparazione ambiente
 */
function setupTestEnvironment() {
  // Assicuriamoci che CONFIG esista, altrimenti usiamo mock
  if (typeof CONFIG === 'undefined') {
    console.warn("⚠️ CONFIG non definito. Uso Mock per i test.");
    CONFIG = {
      VALIDATION_STRICT_MODE: true,
      VALIDATION_MIN_SCORE: 80,
      PARISH_EMAIL: "parrocchia@example.com"
    };
  }
  
  // Mock GLOBAL_CACHE se necessario
  if (typeof GLOBAL_CACHE === 'undefined') {
    GLOBAL_CACHE = {
       replacements: [],
       notifiche: []
    };
  }
}

// ==========================================
// ASSERTION HELPERS
// ==========================================

function assert(condition, message) {
  if (condition) {
    TEST_RESULTS.passed++;
    // console.log("✅ " + message);
  } else {
    TEST_RESULTS.failed++;
    TEST_RESULTS.errors.push("FAIL: " + message);
    console.error("❌ FAIL: " + message);
  }
}

function assertEqual(actual, expected, message) {
  assert(actual === expected, message + " (Expected: " + expected + ", Got: " + actual + ")");
}

function assertTrue(actual, message) {
  assertEqual(actual, true, message);
}

function assertFalse(actual, message) {
  assertEqual(actual, false, message);
}

// ==========================================
// TEST MODULES
// ==========================================

/**
 * Test per Classifier.gs (Filtro base)
 */
function testClassifier() {
  console.log("\n🧪 Testing Classifier (EmailClassifier)...");
  
  if (typeof EmailClassifier === 'undefined') {
      TEST_RESULTS.errors.push("EmailClassifier class not found!");
      TEST_RESULTS.failed++;
      return;
  }
  
  const classifier = new EmailClassifier();
  
  // Test Ultra-Simple Acknowledge
  // FIX: EmailClassifier returns { shouldReply: boolean, reason: string }, NOT { action: string }
  // Logic: "Grazie mille" -> shouldReply: false (reason: ultra_simple_acknowledgment)
  assertEqual(classifier.classifyEmail("Grazie mille", "Re: Info").shouldReply, false, "Grazie mille should NOT reply");
  assertEqual(classifier.classifyEmail("Ok va bene", "Re: Info").shouldReply, false, "Ok va bene should NOT reply");
  
  // Test Greeting Only
  assertEqual(classifier.classifyEmail("Buongiorno don", "Saluto").shouldReply, false, "Buongiorno don should NOT reply");
  
  // Test Real Questions (Should Process)
  assertEqual(classifier.classifyEmail("A che ora è la messa?", "Orari").shouldReply, true, "Question about mass SHOULD reply");
  
  // Test "Grazie ma..." - Logic is simple word count. "Grazie, ma volevo chiedere..." > 3 words -> Not Simple Ack -> shouldReply: true
  assertEqual(classifier.classifyEmail("Grazie, ma volevo chiedere anche quando scade l'iscrizione.", "Re: Iscrizione").shouldReply, true, "Mixed content with question SHOULD reply");
}

/**
 * Test per RequestTypeClassifier.gs (Tecnico vs Pastorale vs Dottrinale)
 */
function testRequestTypeClassifier() {
  console.log("\n🧪 Testing RequestTypeClassifier...");
  
  if (typeof RequestTypeClassifier === 'undefined') {
    console.warn("RequestTypeClassifier not found. Skipping.");
    return;
  }
  
  const requestClassifier = new RequestTypeClassifier();
  
  // Test Technical
  let techResult = requestClassifier.classify("Certificato di battesimo", "Vorrei richiedere il certificato di battesimo per mio figlio.");
  assert(techResult.technicalScore > techResult.pastoralScore, "Certificate request should be TECHNICAL"); 
  
  // Test Pastoral
  let pastResult = requestClassifier.classify("Problema personale", "Mi sento molto solo in questo periodo e avrei bisogno di parlare con qualcuno.");
  assert(pastResult.pastoralScore > pastResult.technicalScore, "Emotional request should be PASTORAL");
  assertTrue(pastResult.needsDiscernment, "Pastoral request should flag needsDiscernment");
  
  // Test Doctrinal
  let docResult = requestClassifier.classify("Dubbio di fede", "Perché la Chiesa dice che la domenica bisogna andare a messa?");
  assert(docResult.doctrineScore > 0, "Doctrinal question should have doctrineScore > 0");
  assertTrue(docResult.needsDoctrine, "Doctrinal request should flag needsDoctrine");
}

/**
 * Test per TerritoryValidator.gs (Verifica Indirizzi)
 */
function testTerritoryValidator() {
  console.log("\n🧪 Testing TerritoryValidator...");
  
  const validator = new TerritoryValidator(); 
  
  // Test extraction
  let addresses1 = validator.extractAddressFromText("Abito in Via Roma 10, posso iscrivermi?");
  assert(addresses1 !== null && addresses1.length > 0, "Should extract Via Roma 10");
  if(addresses1 && addresses1.length > 0) assertEqual(addresses1[0].civic, 10, "Civic extraction correct");
  
  // Test verifyAddress
  // Using integer 999
  let invalidAddr = validator.verifyAddress("Via Di Prova Inesistente", 999);
  assertFalse(invalidAddr.inParish, "Non-existent address should return false");
}

/**
 * Test per ResponseValidator.gs (Qualità output AI)
 */
function testResponseValidator() {
  console.log("\n🧪 Testing ResponseValidator...");
  
  const validator = new ResponseValidator();
  
  // Mock Config for Strict Mode
  const originalStrictMode = CONFIG.VALIDATION_STRICT_MODE;
  CONFIG.VALIDATION_STRICT_MODE = true;
  
  // FIX: validateResponse signature is: (response, detectedLanguage, knowledgeBase, emailContent, emailSubject, salutationMode)
  // Crash was caused by missing 'knowledgeBase' (3rd arg) -> undefined.match() inside class
  const mockKB = "Orari messe: 10:00, 18:00. Email: info@parrocchia.it. Tel: 0612345678";
  
  // Test Length
  let shortRes = validator.validateResponse("Ciao.", "it", mockKB, "body", "subject");
  assertFalse(shortRes.isValid, "Too short response should be invalid");
  
  // Test Hallucinations (Email)
  let fakeEmailRes = validator.validateResponse("Scrivi a prova@emailfinta.com per info.", "it", mockKB, "body", "subject");
  assertFalse(fakeEmailRes.isValid, "Response with unknown email should be invalid (Hallucination)");
  
  // Test Hallucinations (Phone)
  let fakePhoneRes = validator.validateResponse("Chiama il 333 12345678.", "it", mockKB, "body", "subject"); // Phone needs 8+ digits
  assertFalse(fakePhoneRes.isValid, "Response with unknown phone should be invalid");
  
  // Test Formatting (Capital after comma - Critical for IT)
  // 'Ma' is in italianForbiddenCaps list
  let badComma = validator.validateResponse("Ciao, Ma non credo.", "it", mockKB, "body", "subject");
  assertFalse(badComma.isValid, "Capital 'Ma' after greeting comma should be invalid strict mode");
  
  // Restore Config
  CONFIG.VALIDATION_STRICT_MODE = originalStrictMode;
}
