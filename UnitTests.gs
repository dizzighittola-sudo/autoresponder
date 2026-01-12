// ====================================================================
// UNIT TESTS - Test critici per bug fix verification
// ====================================================================
// Esegui runAllTests() per verificare i fix dei bug critici.
// Ogni test ritorna true/false e logga il risultato.
// ====================================================================

/**
 * Framework test minimale per GAS
 */
const TestRunner = {
  passed: 0,
  failed: 0,
  
  reset() {
    this.passed = 0;
    this.failed = 0;
  },
  
  assert(condition, testName) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      this.passed++;
    } else {
      console.log(`❌ FAIL: ${testName}`);
      this.failed++;
    }
    return condition;
  },
  
  assertEqual(actual, expected, testName) {
    const condition = actual === expected;
    if (!condition) {
      console.log(`   Expected: ${expected}`);
      console.log(`   Actual:   ${actual}`);
    }
    return this.assert(condition, testName);
  },
  
  summary() {
    const total = this.passed + this.failed;
    console.log('\n' + '═'.repeat(50));
    console.log(`📊 Tests: ${this.passed}/${total} passed, ${this.failed} failed`);
    console.log('═'.repeat(50));
    return this.failed === 0;
  }
};

// ====================================================================
// TEST: Bug #7 - NaN in computeSalutationMode
// ====================================================================

function test_salutationMode_invalidTimestamp() {
  const result = computeSalutationMode({
    isReply: true,
    messageCount: 2,
    memoryExists: true,
    lastUpdated: 'invalid-date',
    now: new Date()
  });
  
  return TestRunner.assertEqual(
    result, 
    'none_or_continuity', 
    'Bug #7: Invalid timestamp should return none_or_continuity'
  );
}

function test_salutationMode_nullTimestamp() {
  const result = computeSalutationMode({
    isReply: true,
    messageCount: 2,
    memoryExists: true,
    lastUpdated: null,
    now: new Date()
  });
  
  return TestRunner.assertEqual(
    result, 
    'none_or_continuity', 
    'Bug #7: Null timestamp should return none_or_continuity'
  );
}

function test_salutationMode_validTimestamp() {
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  
  const result = computeSalutationMode({
    isReply: true,
    messageCount: 2,
    memoryExists: true,
    lastUpdated: twoHoursAgo.toISOString(),
    now: now
  });
  
  return TestRunner.assertEqual(
    result, 
    'none_or_continuity', 
    'Bug #7: Recent valid timestamp (2h ago) should return none_or_continuity'
  );
}

function test_salutationMode_firstMessage() {
  const result = computeSalutationMode({
    isReply: false,
    messageCount: 1,
    memoryExists: false,
    lastUpdated: null,
    now: new Date()
  });
  
  return TestRunner.assertEqual(
    result, 
    'full', 
    'First message should return full salutation'
  );
}

// ====================================================================
// TEST: Bug #2 - URL time matching (simulato)
// ====================================================================

function test_timeRegex_notMatchURL() {
  // Simula il pattern migliorato
  const pattern = /\b(\d{1,2})\.([0-5]\d)\b(?![\/\w])/g;
  const url = "https://example.com/event/12.30/details";
  
  const matches = url.match(pattern);
  
  return TestRunner.assert(
    matches === null || matches.length === 0,
    'Bug #2: Time pattern should NOT match inside URL'
  );
}

function test_timeRegex_matchValidTime() {
  const pattern = /\b(\d{1,2})\.([0-5]\d)\b(?![\/\w])/g;
  const text = "La messa è alle 10.30 in basilica";
  
  const matches = text.match(pattern);
  
  return TestRunner.assert(
    matches !== null && matches.length === 1,
    'Bug #2: Time pattern should match standalone times'
  );
}



// ====================================================================
// TEST: KnowledgeSelector (se disponibile)
// ====================================================================

function test_knowledgeSelector_basicPayload() {
  if (typeof buildKnowledgePayload === 'undefined') {
    console.log('⏭️ SKIP: buildKnowledgePayload not available');
    return true;
  }
  
  const result = buildKnowledgePayload({
    subject: 'Test',
    body: 'Test body',
    topic: '',
    classification: { category: 'information' },
    requestType: { type: 'technical' },
    promptProfile: 'standard',
    activeConcerns: [],
    territoryBlock: '',
    fullEnrichedKB: 'Full KB content here',
    knowledgeRows: []
  });
  
  return TestRunner.assert(
    result.kbForPrompt !== undefined && result.kbForValidation !== undefined,
    'KnowledgeSelector: Should return kbForPrompt and kbForValidation'
  );
}

function test_knowledgeSelector_territoryIncluded() {
  if (typeof buildKnowledgePayload === 'undefined') {
    console.log('⏭️ SKIP: buildKnowledgePayload not available');
    return true;
  }
  
  const result = buildKnowledgePayload({
    subject: 'Test',
    body: 'Test body',
    territoryBlock: 'TERRITORIO: Via Roma 15 - RIENTRA',
    fullEnrichedKB: 'Full KB',
    knowledgeRows: []
  });
  
  return TestRunner.assert(
    result.debug.mandatoryTerritoryIncluded === true,
    'KnowledgeSelector: Territory block should be included'
  );
}

/**
 * Test: Critical category auto-include for "domenica" → "Orari Messe"
 * Verifica che quando email contiene "domenica", TUTTE le righe "Orari Messe" vengono incluse
 */
function test_knowledgeSelector_criticalCategoryAutoInclude() {
  if (typeof buildKnowledgePayload === 'undefined') {
    console.log('⏭️ SKIP: buildKnowledgePayload not available');
    return true;
  }
  
  // Mock KB rows simulating actual "Orari Messe" structure
  const mockRows = [
    { 'Categoria': 'Orari Messe', 'Chiave di ricerca': 'Orari Messe sabato invernali', 'Risposta': '8:00, 19:00' },
    { 'Categoria': 'Orari Messe', 'Chiave di ricerca': 'Orari Messe feriali invernali', 'Risposta': '7:25, 13:15, 19:00' },
    { 'Categoria': 'Orari Messe', 'Chiave di ricerca': 'Orari Messe festive invernali', 'Risposta': '9:30, 11:00, 12:15, 13:15, 17:30, 19:00' },
    { 'Categoria': 'Contatti', 'Chiave di ricerca': 'Telefono', 'Risposta': '06 320 19 23' }
  ];
  
  const result = buildKnowledgePayload({
    subject: 'Messe',
    body: 'A che ora saranno le Messe domenica prossima?',
    topic: '',
    classification: { category: 'information' },
    requestType: { type: 'technical' },
    promptProfile: 'standard',
    activeConcerns: [],
    territoryBlock: '',
    fullEnrichedKB: 'Full KB',
    knowledgeRows: mockRows
  });
  
  // Verify: criticalCategoriesIncluded should contain "Orari Messe"
  const hasCriticalCategory = result.debug.criticalCategoriesIncluded && 
                              result.debug.criticalCategoriesIncluded.includes('Orari Messe');
  
  // Verify: kbForPrompt should contain "festive" (the Sunday schedule)
  const containsFestive = result.kbForPrompt.toLowerCase().includes('festive');
  
  TestRunner.assert(
    hasCriticalCategory,
    'KnowledgeSelector: "domenica" should trigger "Orari Messe" critical category'
  );
  
  return TestRunner.assert(
    containsFestive,
    'KnowledgeSelector: Critical category should include "festive" (Sunday) schedule'
  );
}

// ====================================================================
// TEST: RPD Saver - Skip Gemini Quick Check
// ====================================================================

function test_rpdSaver_skipCondition_italianInfo() {
  const classifier = new EmailClassifier();
  const gemini = new GeminiService();
  
  // Email italiana chiara (alta confidenza)
  const subject = 'Orari messe domenicali';
  const body = 'Buongiorno, vorrei sapere gli orari delle messe della domenica. Grazie.';
  
  const classification = classifier.classifyEmail(subject, body, false);
  const detection = gemini.detectEmailLanguage(body, subject);
  
  // Test 1: Detection italiana con alto safetyGrade
  TestRunner.assert(
    detection.safetyGrade >= 4,
    'RPD Saver: Italian email should have safetyGrade >= 4'
  );
  
  // Test 2: Lingua corretta
  TestRunner.assertEqual(
    detection.lang,
    'it',
    'RPD Saver: Should detect Italian'
  );
  
  // Test 3: Condizione skip completa
  const canSkip = detection.safetyGrade >= 4 &&
                  ['it', 'en', 'es'].includes(detection.lang) &&
                  classification.confidence >= 0.75 && // Rilassato per test
                  classification.shouldReply === true;
  
  return TestRunner.assert(
    canSkip,
    'RPD Saver: Should skip Gemini for clear Italian info request'
  );
}

function test_rpdSaver_noSkip_pastoral() {
  const classifier = new EmailClassifier();
  
  // Email pastorale (non dovrebbe skippare)
  const pastoralBody = 'Buongiorno, sto attraversando un momento molto difficile. Ho bisogno di parlare con qualcuno.';
  const pastoralSubject = 'Richiesta aiuto';
  
  const classification = classifier.classifyEmail(pastoralSubject, pastoralBody, false);
  
  // Email pastorale ha emotional_distress o altre sfumature
  const hasEmotionalIndicators = 
    classification.subIntents?.emotional_distress ||
    classification.category !== 'information';
  
  return TestRunner.assert(
    hasEmotionalIndicators || classification.confidence < 0.85,
    'RPD Saver: Pastoral requests should NOT skip Gemini'
  );
}

// ====================================================================
// RUNNER PRINCIPALE
// ====================================================================

/**
 * Esegue tutti i test critici
 * Esegui questa funzione da GAS Editor per verificare i fix
 */
function runAllTests() {
  console.log('═'.repeat(50));
  console.log('🧪 RUNNING CRITICAL UNIT TESTS');
  console.log('═'.repeat(50));
  
  TestRunner.reset();
  
  // Bug #7 tests
  console.log('\n--- Bug #7: computeSalutationMode ---');
  test_salutationMode_invalidTimestamp();
  test_salutationMode_nullTimestamp();
  test_salutationMode_validTimestamp();
  test_salutationMode_firstMessage();
  
  // Bug #2 tests
  console.log('\n--- Bug #2: Time Regex ---');
  test_timeRegex_notMatchURL();
  test_timeRegex_matchValidTime();
  
  // KnowledgeSelector tests
  console.log('\n--- KnowledgeSelector ---');
  test_knowledgeSelector_basicPayload();
  test_knowledgeSelector_territoryIncluded();
  test_knowledgeSelector_criticalCategoryAutoInclude();
  
  // RPD Saver tests
  console.log('\n--- RPD Saver ---');
  test_rpdSaver_skipCondition_italianInfo();
  test_rpdSaver_noSkip_pastoral();
  
  return TestRunner.summary();
}

/**
 * Quick test per verificare setup
 */
function runQuickTest() {
  console.log('🧪 Quick Test...');
  TestRunner.reset();
  test_salutationMode_firstMessage();
  test_salutationMode_firstMessage();
  TestRunner.summary();
}

// ====================================================================
// INTEGRATION TESTS - End-to-End Flow
// ====================================================================
// Questi test verificano il flusso completo senza inviare email reali.
// Usano DRY_RUN mode per testare l'intera pipeline.
// ====================================================================

/**
 * Crea mock email per test
 */
function _createMockEmail(type = 'technical') {
  const mocks = {
    technical: {
      subject: 'Orari messe domenicali',
      body: 'Buongiorno, vorrei sapere gli orari delle messe della domenica. Grazie.',
      sender: 'mario.rossi@example.com',
      senderName: 'Mario Rossi'
    },
    pastoral: {
      subject: 'Richiesta colloquio',
      body: 'Buonasera, sto attraversando un momento difficile e avrei bisogno di parlare con un sacerdote. Potrebbe ricevermi? Grazie.',
      sender: 'anna.bianchi@example.com',
      senderName: 'Anna Bianchi'
    },
    doctrinal: {
      subject: 'Dubbio di fede',
      body: 'Buongiorno, vorrei capire meglio il significato della Trinità. Potete aiutarmi?',
      sender: 'luca.verdi@example.com',
      senderName: 'Luca Verdi'
    },
    territory: {
      subject: 'Apparteniamo alla parrocchia?',
      body: 'Buongiorno, abito in via Roma 15. Rientro nel territorio della vostra parrocchia?',
      sender: 'famiglia.neri@example.com',
      senderName: 'Famiglia Neri'
    }
  };
  
  return mocks[type] || mocks.technical;
}

/**
 * Test: Classificazione email tecnica
 */
function test_integration_classifyTechnical() {
  loadResources();
  
  const mock = _createMockEmail('technical');
  const classifier = new EmailClassifier();
  const result = classifier.classifyEmail(mock.body, mock.subject);
  
  const isTechnical = result.category === 'information' || 
                      result.category === 'sacrament';
  
  return TestRunner.assert(
    isTechnical,
    'Integration: Technical email should be classified as information/sacrament'
  );
}

/**
 * Test: Quick check Gemini (richiede API key valida)
 */
function test_integration_quickCheck() {
  try {
    const mock = _createMockEmail('technical');
    const gemini = new GeminiService();
    const result = gemini.shouldRespondToEmail(mock.body, mock.subject);
    
    return TestRunner.assert(
      result.shouldRespond === true || result.shouldRespond === false,
      'Integration: Quick check should return valid shouldRespond'
    );
  } catch (e) {
    console.log(`⏭️ SKIP: Quick check test (${e.message})`);
    return true; // Skip se API non disponibile
  }
}

/**
 * Test: Language detection italiana
 */
function test_integration_languageDetection() {
  const mock = _createMockEmail('technical');
  const gemini = new GeminiService();
  const detection = gemini.detectEmailLanguage(mock.body, mock.subject);
  
  return TestRunner.assertEqual(
    detection.lang,
    'it',
    'Integration: Italian email should detect as IT'
  );
}

/**
 * Test: Language detection inglese
 */
function test_integration_languageDetectionEnglish() {
  const gemini = new GeminiService();
  const detection = gemini.detectEmailLanguage(
    'Hello, I would like to know the mass schedule for Sunday. Thank you.',
    'Mass times'
  );
  
  return TestRunner.assertEqual(
    detection.lang,
    'en',
    'Integration: English email should detect as EN'
  );
}

/**
 * Test: Request Type classification
 */
function test_integration_requestType() {
  const classifier = new RequestTypeClassifier();
  
  const technicalResult = classifier.classifyRequestType(
    'orari messe domenicali', 
    'Vorrei sapere gli orari'
  );
  
  return TestRunner.assertEqual(
    technicalResult.type,
    'technical',
    'Integration: Orari request should be TECHNICAL'
  );
}

/**
 * Test: Prompt building (senza chiamata API)
 */
function test_integration_promptBuilding() {
  loadResources();
  
  const mock = _createMockEmail('technical');
  const engine = new PromptEngine();
  
  const prompt = engine.buildPrompt({
    emailContent: mock.body,
    emailSubject: mock.subject,
    knowledgeBase: 'Test KB content',
    senderName: mock.senderName,
    senderEmail: mock.sender,
    category: 'information',
    topic: 'orari',
    detectedLanguage: 'it',
    currentSeason: 'ordinary',
    currentDate: new Date().toISOString().split('T')[0],
    salutation: 'Buongiorno.',
    closing: 'Cordiali saluti,',
    promptProfile: 'standard',
    activeConcerns: [],
    salutationMode: 'full'
  });
  
  const hasContent = prompt.length > 500 && 
                     prompt.includes(mock.body.substring(0, 20));
  
  return TestRunner.assert(
    hasContent,
    'Integration: Prompt should contain email content and be substantial'
  );
}

/**
 * Test: Validation (senza risposta reale)
 */
function test_integration_validation() {
  const validator = new ResponseValidator();
  
  // Risposta valida simulata
  const validResponse = `Buongiorno,

Grazie per la sua richiesta. Le messe domenicali sono alle ore 10:00 e 18:00.

Cordiali saluti,
Segreteria Parrocchiale di Sant'Eugenio`;

  const result = validator.validateResponse(
    validResponse,
    'it',
    'Orari messe: 10:00, 18:00', // KB con orari
    'Vorrei sapere gli orari',
    'Orari messe',
    'full'
  );
  
  return TestRunner.assert(
    result.isValid === true,
    'Integration: Valid response should pass validation'
  );
}

/**
 * Test: Validation con allucinazione
 */
function test_integration_validationHallucination() {
  const validator = new ResponseValidator();
  
  // Risposta con orario inventato
  const hallucinatedResponse = `Buongiorno,

Le messe sono alle 15:30 e 22:00.

Cordiali saluti,
Segreteria`;

  const result = validator.validateResponse(
    hallucinatedResponse,
    'it',
    'Orari messe: 10:00, 18:00', // KB NON contiene 15:30 o 22:00
    'Vorrei sapere gli orari',
    'Orari messe',
    'full'
  );
  
  // Dovrebbe rilevare allucinazione (isValid = false o warnings)
  const detected = !result.isValid || 
                   (result.warnings && result.warnings.length > 0) ||
                   (result.hallucinations && Object.keys(result.hallucinations).length > 0);
  
  return TestRunner.assert(
    detected,
    'Integration: Hallucinated times should be detected'
  );
}

/**
 * Test: Full E2E con DRY_RUN (non invia email)
 */
function test_integration_fullE2E_DryRun() {
  // Salva stato originale
  const originalDryRun = typeof CONFIG !== 'undefined' ? CONFIG.DRY_RUN : true;
  
  try {
    // Forza DRY_RUN
    if (typeof CONFIG !== 'undefined') {
      CONFIG.DRY_RUN = true;
    }
    
    loadResources();
    
    // Verifica che le risorse siano caricate
    const hasKB = typeof GLOBAL_CACHE !== 'undefined' && 
                  GLOBAL_CACHE.knowledgeBase && 
                  GLOBAL_CACHE.knowledgeBase.length > 100;
    
    // Ripristina
    if (typeof CONFIG !== 'undefined') {
      CONFIG.DRY_RUN = originalDryRun;
    }
    
    return TestRunner.assert(
      hasKB,
      'Integration E2E: Resources should load successfully'
    );
    
  } catch (e) {
    console.log(`   Error: ${e.message}`);
    
    // Ripristina
    if (typeof CONFIG !== 'undefined') {
      CONFIG.DRY_RUN = originalDryRun;
    }
    
    return TestRunner.assert(false, 'Integration E2E: Should not throw');
  }
}

// ====================================================================
// RUNNER INTEGRATION TESTS
// ====================================================================

/**
 * Esegue tutti i test di integrazione
 */
function runIntegrationTests() {
  console.log('═'.repeat(50));
  console.log('🔗 RUNNING INTEGRATION TESTS');
  console.log('═'.repeat(50));
  
  TestRunner.reset();
  
  console.log('\n--- Classification ---');
  test_integration_classifyTechnical();
  test_integration_requestType();
  
  console.log('\n--- Language Detection ---');
  test_integration_languageDetection();
  test_integration_languageDetectionEnglish();
  
  console.log('\n--- Prompt & Validation ---');
  test_integration_promptBuilding();
  test_integration_validation();
  test_integration_validationHallucination();
  
  console.log('\n--- E2E ---');
  test_integration_fullE2E_DryRun();
  test_integration_quickCheck();
  
  return TestRunner.summary();
}

/**
 * Esegue TUTTI i test (unit + integration)
 */
function runFullTestSuite() {
  console.log('\n' + '▓'.repeat(60));
  console.log('  FULL TEST SUITE');
  console.log('▓'.repeat(60));
  
  TestRunner.reset();
  
  // Unit tests
  runAllTests();
  
  // Integration tests
  console.log('\n');
  runIntegrationTests();
  
  return TestRunner.summary();
}
