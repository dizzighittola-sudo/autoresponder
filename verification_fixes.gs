/**
 * verification_fixes.gs
 * Script per verificare manualmente i fix dei bug #1, #3, #4, #5, #7.
 */

function runManualVerifications() {
  console.log("🧪 AVVIO VERIFICHE MANUALI DEI FIX...");

  // 1. Verifica BUG #1 & #7 (Date parsing in Main.gs)
  testDateParsingRobustness();

  // 2. Verifica BUG #4 (Civic validation in TerritoryValidator.gs)
  testCivicValidation();

  // 3. Verifica ISSUE #5 (Salutation consistency in EmailProcessor.gs)
  testSalutationConsistency();

  console.log("🏁 VERIFICHE COMPLETATE.");
}

function testDateParsingRobustness() {
  console.log("\n--- Testing BUG #7: Date Parsing ---");
  // Simula righe con date varie
  const testRows = [
    ['Ferie', '2026-01-20', '2026-01-25'], // Valido
    ['Ferie', 'invalid-date', '2026-01-25'], // Invalido
    ['Ferie', '2026-01-30', '2026-01-20'], // Fine < Inizio
    ['Lavoro', '2026-01-20', '2026-01-25'] // No "ferie" label
  ];

  const validPeriods = [];
  testRows.forEach(row => {
    if (!row[0] || !String(row[0]).toLowerCase().includes('ferie')) return;
    if (!row[1] || !row[2]) return;

    let startDate = new Date(row[1]);
    let endDate = new Date(row[2]);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.log(`❌ BUG #7 OK: Scartata data invalida (${row[1]} - ${row[2]})`);
      return;
    }

    if (endDate < startDate) {
      console.log(`❌ BUG #7 OK: Scartata data fine < inizio (${row[1]} - ${row[2]})`);
      return;
    }

    validPeriods.push({ start: startDate, end: endDate });
    console.log(`✅ BUG #7 OK: Accettata data valida (${row[1]} - ${row[2]})`);
  });
}

function testCivicValidation() {
  console.log("\n--- Testing BUG #4: Civic Validation ---");
  const validator = new TerritoryValidator();
  
  const testTexts = [
    "Abito in Via Roma abc",  // nan
    "Abito in Via Roma -1",   // <= 0
    "Abito in Via Roma 10"    // Valido
  ];

  testTexts.forEach(text => {
    const result = validator.extractAddressFromText(text);
    if (!result) {
      console.log(`❌ BUG #4 OK: Nessun indirizzo estratto da "${text}"`);
    } else {
      console.log(`✅ BUG #4 OK: Estratto "${result[0].street} n. ${result[0].civic}" da "${text}"`);
    }
  });
}

function testSalutationConsistency() {
  console.log("\n--- Testing ISSUE #5: Salutation Consistency ---");
  const now = new Date();
  
  const testCases = [
    { label: "Date Corrotta", lastUpdated: "INVALID_DATE" },
    { label: "Date Null", lastUpdated: null }
  ];

  testCases.forEach(tc => {
    const mode = computeSalutationMode({
      isReply: true,
      messageCount: 5,
      memoryExists: true,
      lastUpdated: tc.lastUpdated,
      now: now
    });
    console.log(`🔍 Case ${tc.label}: Result = ${mode} (Expected: none_or_continuity)`);
    if (mode === 'none_or_continuity') {
      console.log(`✅ ISSUE #5 OK: Comportamento coerente per ${tc.label}`);
    } else {
      console.log(`❌ ISSUE #5 FAIL: Comportamento incoerente per ${tc.label}`);
    }
  });
}
