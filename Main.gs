// ====================================================================
// MAIN.GS - Entry Point Pulito
// ✅ Gestione moduli e configurazione
// ✅ Nessun codice legacy
// ====================================================================

// ====================================================================
// CONFIGURAZIONE
// ====================================================================

const CONFIG = {
  // === API ===
  GEMINI_API_KEY: PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY'),
  MODEL_NAME: 'gemini-2.5-flash',
  
  // === Generazione ===
  TEMPERATURE: 0.5,
  MAX_OUTPUT_TOKENS: 6000,
  
  // === Validazione ===
  VALIDATION_ENABLED: true,
  VALIDATION_MIN_SCORE: 0.6,
  VALIDATION_STRICT_MODE: false,
  
  // === Gmail ===
  LABEL_NAME: 'IA',
  ERROR_LABEL_NAME: 'Errore',             // Richiesto da utente: "Errore"
  VALIDATION_ERROR_LABEL: 'Verifica',     // Richiesto da utente: "Verifica"
  MAX_EMAILS_PER_RUN: 10,
  GMAIL_LABEL_CACHE_TTL: 3600000, // 1 Hour (ms)
  MAX_HISTORY_MESSAGES: 10,       // Max messaggi in cronologia (thread context)
  
  // === Knowledge Base ===
  SPREADSHEET_ID: PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID'),
  KB_SHEET_NAME: 'Istruzioni',
  AI_CORE_LITE_SHEET: 'AI_CORE_LITE',
  AI_CORE_SHEET: 'AI_CORE',
  DOCTRINE_SHEET: 'Dottrina',
  REPLACEMENTS_SHEET_NAME: 'Sostituzioni',
  MEMORY_SHEET_NAME: 'ConversationMemory',
  
  // === Modalità ===
  DRY_RUN: false,  // Cambia a true per test senza invio email
  USE_RATE_LIMITER: true,  // ✅ Rate Limiter intelligente ABILITATO
  
  // === Modelli Gemini (CENTRALIZZATO - Modifica qui quando cambiano) ===
  // 📌 AGGIORNATO: 13 Gennaio 2026 (basato su ricerca quote ufficiali)
  // 🔗 Verifica limiti quota: https://ai.google.dev/gemini-api/docs/rate-limits
  GEMINI_MODELS: {
    // 🥇 PREMIUM: Qualità massima per generazione risposte
    'flash-2.5': {
      name: 'gemini-2.5-flash',
      rpm: 10,        // ✅ Richieste Per Minuto (Free Tier - Gen 2026)
      tpm: 250000,    // ✅ Token Per Minuto (250K)
      rpd: 250,       // ✅ Richieste Per Giorno (Free Tier - ridotto)
      useCases: ['generation']
    },
    // 🥈 WORKHORSE: Quick check e fallback (quota più generosa)
    'flash-lite': {
      name: 'gemini-2.5-flash-lite',
      rpm: 15,        // ✅ RPM più alto
      tpm: 250000,    // ✅ 250K TPM
      rpd: 1000,      // ✅ Quota più generosa per automazioni
      useCases: ['quick_check', 'classification', 'fallback']
    },
    // 🥉 LEGACY: Backup se tutto esaurito
    'flash-2.0': {
      name: 'gemini-2.0-flash',
      rpm: 5,         // ⚠️ RPM ridotto per favorire 2.5
      tpm: 250000,    // ✅ 250K TPM
      rpd: 100,       // ⚠️ Quota ridotta (deprecazione marzo 2026)
      useCases: ['fallback']
    }
  },
  
  // Strategia selezione modelli per task (ordine = priorità)
  // ✅ AGGIORNATO: 2.5 Flash per qualità, Flash-Lite per volume
  MODEL_STRATEGY: {
    'quick_check': ['flash-lite', 'flash-2.0'],           // Quick check usa Flash-Lite (1000 RPD)
    'generation': ['flash-2.5', 'flash-lite', 'flash-2.0'], // Generation usa 2.5 Flash (qualità), poi fallback
    'fallback': ['flash-lite', 'flash-2.0']               // Fallback generico
  },
  
  // === Ignore Lists ===
  IGNORE_DOMAINS: [
    'noreply', 'no-reply', 'newsletter', 'marketing',
    'promo', 'ads', 'notifications'
  ],
  IGNORE_KEYWORDS: [
    'unsubscribe', 'opt-out', 'newsletter'
  ]
};

// ====================================================================
// MARCATORI LINGUA (Costante condivisa)
// ====================================================================

const LANGUAGE_MARKERS = {
  'it': ['grazie', 'cordiali', 'saluti', 'gentile', 'parrocchia', 'messa', 'vorrei', 'quando', 'buongiorno', 'buonasera'],
  'en': ['thank', 'regards', 'dear', 'parish', 'mass', 'church', 'would', 'could', 'please', 'sincerely'],
  'es': ['gracias', 'saludos', 'estimado', 'parroquia', 'misa', 'iglesia', 'querría', 'buenos', 'días']
};

// ====================================================================
// CACHE GLOBALE (popolata da loadResources)
// ====================================================================

var GLOBAL_CACHE = {
  knowledgeBase: '',
  knowledgeStructured: [], // ✅ Smart Parsing
  aiCoreLite: '',
  aiCoreLiteStructured: [], // ✅ Smart Parsing
  aiCore: '',
  aiCoreStructured: [], // ✅ Smart Parsing
  doctrineBase: '',
  doctrineStructured: [], // ✅ Smart Parsing
  ignoreDomains: CONFIG.IGNORE_DOMAINS,
  ignoreKeywords: CONFIG.IGNORE_KEYWORDS,
  replacements: {},
  loaded: false
};

// ====================================================================
// CARICAMENTO RISORSE
// ====================================================================

function loadResources() {
  // FIX Bug 4: Previene race condition reali tra esecuzioni parallele
  const lock = LockService.getScriptLock();
  
  try {
    // FIX Bug #24: Tenta di acquisire lock per 10 secondi - ESCI se fallisce
    if (!lock.tryLock(10000)) {
      console.warn('⚠️ Could not acquire lock for loadResources, using stale cache');
      return; // ✅ Non procedere se lock fallito
    }
    
    // Check double-checked locking pattern
    if (GLOBAL_CACHE.loaded) {
      // console.log('📦 Resources already loaded (cached)'); // Riduci rumore
      return;
    }
    
    GLOBAL_CACHE.loading = true;
    console.log('📦 Loading resources...');
    
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    
    // Carica Knowledge Base (Istruzioni)
    const kbSheet = spreadsheet.getSheetByName(CONFIG.KB_SHEET_NAME);
    if (kbSheet) {
      const kbData = kbSheet.getDataRange().getValues();
      GLOBAL_CACHE.knowledgeBase = kbData.map(row => row.join(' | ')).join('\n');
      GLOBAL_CACHE.knowledgeStructured = _parseSheetToStructured(kbData); // ✅ Structured
      console.log(`✓ Knowledge Base loaded: ${GLOBAL_CACHE.knowledgeBase.length} chars (${GLOBAL_CACHE.knowledgeStructured.length} rows)`);
    } else {
      console.warn(`⚠️ Sheet '${CONFIG.KB_SHEET_NAME}' not found`);
    }
    
    // Carica AI_CORE_LITE (principi pastorali base)
    const liteSheet = spreadsheet.getSheetByName(CONFIG.AI_CORE_LITE_SHEET);
    if (liteSheet) {
      const liteData = liteSheet.getDataRange().getValues();
      GLOBAL_CACHE.aiCoreLite = liteData.map(row => row.join(' | ')).join('\n');
      GLOBAL_CACHE.aiCoreLiteStructured = _parseSheetToStructured(liteData); // ✅ Structured
      console.log(`✓ AI_CORE_LITE loaded: ${GLOBAL_CACHE.aiCoreLite.length} chars`);
    } else {
      console.warn(`⚠️ Sheet '${CONFIG.AI_CORE_LITE_SHEET}' not found`);
    }
    
    // Carica AI_CORE (principi pastorali estesi per discernimento)
    const coreSheet = spreadsheet.getSheetByName(CONFIG.AI_CORE_SHEET);
    if (coreSheet) {
      const coreData = coreSheet.getDataRange().getValues();
      GLOBAL_CACHE.aiCore = coreData.map(row => row.join(' | ')).join('\n');
      GLOBAL_CACHE.aiCoreStructured = _parseSheetToStructured(coreData); // ✅ Structured
      console.log(`✓ AI_CORE loaded: ${GLOBAL_CACHE.aiCore.length} chars`);
    } else {
      console.warn(`⚠️ Sheet '${CONFIG.AI_CORE_SHEET}' not found`);
    }
    
    // Carica Dottrina (base dottrinale completa)
    const doctrineSheet = spreadsheet.getSheetByName(CONFIG.DOCTRINE_SHEET);
    if (doctrineSheet) {
      const doctrineData = doctrineSheet.getDataRange().getValues();
      GLOBAL_CACHE.doctrineBase = doctrineData.map(row => row.join(' | ')).join('\n');
      GLOBAL_CACHE.doctrineStructured = _parseSheetToStructured(doctrineData); // ✅ Structured
      console.log(`✓ Doctrine Base loaded: ${GLOBAL_CACHE.doctrineBase.length} chars (${GLOBAL_CACHE.doctrineStructured.length} rows)`);
    } else {
      console.warn(`⚠️ Sheet '${CONFIG.DOCTRINE_SHEET}' not found`);
    }
    
    // Carica Sostituzioni
    try {
      const replSheet = spreadsheet.getSheetByName(CONFIG.REPLACEMENTS_SHEET_NAME);
      if (replSheet) {
        const replData = replSheet.getDataRange().getValues();
        for (let i = 1; i < replData.length; i++) {
          const [badText, goodText] = replData[i];
          if (badText && goodText) {
            GLOBAL_CACHE.replacements[String(badText).trim()] = String(goodText).trim();
          }
        }
        console.log(`✓ Replacements loaded: ${Object.keys(GLOBAL_CACHE.replacements).length}`);
      }
    } catch (replError) {
      console.warn(`⚠️ Could not load replacements: ${replError.message}`);
    }
    
    GLOBAL_CACHE.loaded = true;
    GLOBAL_CACHE.loading = false;
    console.log('✓ All resources loaded successfully');
    
  } catch (error) {
    GLOBAL_CACHE.loading = false;
    console.error(`❌ Error loading resources: ${error.message}`);
  } finally {
    try {
      lock.releaseLock();
    } catch(e) {
      // Ignora errori di rilascio lock
    }
  }
}

// ====================================================================
// VERIFICA ORARIO SOSPENSIONE
// ====================================================================

// Giorni in cui il sistema DEVE rispondere (Dipendenti in ferie)
// Formato: [Mese, Giorno]
// 1 Gen, 6 Gen, 25 Apr, 1 Mag, 29 Giu, 15 Ago, 1 Nov, 8 Dic, 25 Dic, 26 Dic
// FIX Bug #1: JavaScript Date uses 0-indexed months (0=Jan, 11=Dec)
const MONTH = {
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
  JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11
};

const ALWAYS_OPERATING_DAYS = [
  [MONTH.JAN, 1],    // Capodanno
  [MONTH.JAN, 6],    // Epifania
  [MONTH.APR, 25],   // Liberazione
  [MONTH.MAY, 1],    // Festa del Lavoro
  [MONTH.JUN, 29],   // SS. Pietro e Paolo
  [MONTH.AUG, 15],   // Assunzione (Ferragosto)
  [MONTH.NOV, 1],    // Ognissanti
  [MONTH.DEC, 8],    // Immacolata
  [MONTH.DEC, 25],   // Natale
  [MONTH.DEC, 26]    // Santo Stefano
];

const SUSPENSION_HOURS = {
  1: [[8, 20]],    // Lunedì: 8–20
  2: [[8, 14]],    // Martedì: 8–14
  3: [[8, 17]],    // Mercoledì: 8–17
  4: [[8, 14]],    // Giovedì: 8–14
  5: [[8, 17]]     // Venerdì: 8–17
};

/**
 * Calcola la Domenica di Pasqua per un dato anno (Occidentale/Gregoriano)
 */

function calculateEaster(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3=March, 4=April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/**
 * Verifica se una data è nel periodo vacanze di Ferragosto
 * Regola: Periodo fisso dal 15 al 31 Agosto (inclusi)
 */
function isFerragostoFixedPeriod(date) {
  // FIX Bug #27: Validate date parameter
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    console.warn('⚠️ Invalid date passed to isFerragostoFixedPeriod');
    return false;
  }
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();
  return month === 8 && day >= 15 && day <= 31;
}

/**
 * Verifica se il sistema dovrebbe essere SOSPESO (cioè Dipendenti LAVORANO)
 * Ritorna TRUE se Sospeso (Segreteria lavora)
 * Ritorna FALSE se Attivo (Sistema risponde, es. Feste, Notte, Weekend)
 * @param {Date} [checkDate] - Data opzionale da verificare (default: ora)
 */
function isInSuspensionTime(checkDate = new Date()) {
  /* 
   * FIX Bug #21: Month Index Logic Mismatch
   * JS uses 0-11 for months. Our constants (MONTH.JAN) are 0-11.
   * But logic below used month+1 (1-12).
   * Solution: Use consistent variables.
   */
  const now = checkDate;
  const year = now.getFullYear();
  const monthIndex = now.getMonth(); // 0-based (0=Jan)
  const month1Based = monthIndex + 1; // 1-based (1=Jan)
  const date = now.getDate();
  const day = now.getDay();
  const hour = now.getHours();

  // ----------------------------------------------------------
  // 1. CONTROLLA GIORNI "SEMPRE OPERATIVI" (Priorità)
  // Se è un giorno festivo, il sistema DEVE funzionare (ritorna false)
  // ----------------------------------------------------------

  // A. Festività Fisse
  for (const [hMonth, hDay] of ALWAYS_OPERATING_DAYS) {
    if (monthIndex === hMonth && date === hDay) { // ✅ Use 0-based monthIndex
      console.log('📅 Giorno Festivo Fisso (Sistema Attivo)');
      return false; // Active
    }
  }
  // Periodo attivo speciale: 24 e 31 Dic dalle 14:00, giorni interi 25-26 Dic, 1 Gen
  if (month1Based === 12 && ((date === 24 && hour >= 14) || date === 25 || date === 26 || (date === 31 && hour >= 14))) {
    console.log('📅 Periodo speciale attivo (Natale/Capodanno)');
    return false; // Active
  }

  // B. Date Mobili Pasqua
  const easter = calculateEaster(year);
  
  // Pasquetta (Easter + 1 day)
  const pasquetta = new Date(easter);
  pasquetta.setDate(easter.getDate() + 1);
  if (month1Based === (pasquetta.getMonth() + 1) && date === pasquetta.getDate()) {
    console.log('📅 Pasquetta (Sistema Attivo)');
    return false;
  }

  // Sabato Santo (Pasqua - 1 giorno)
  const holySaturday = new Date(easter);
  holySaturday.setDate(easter.getDate() - 1);
  if (month1Based === (holySaturday.getMonth() + 1) && date === holySaturday.getDate()) {
    console.log('📅 Sabato Santo (Sistema Attivo)');
    return false;
  }

  // C. Periodo Ferragosto (Fisso: 15-31 Agosto)
  if (isFerragostoFixedPeriod(now)) {
    console.log('📅 Periodo Ferragosto (Sistema Attivo)');
    return false;
  }

  // ----------------------------------------------------------
  // 2. CONTROLLA ORARI UFFICIO REGOLARI
  // Se non è festivo, controlla se i dipendenti lavorano
  // ----------------------------------------------------------
  if (SUSPENSION_HOURS[day]) {
    for (const [startH, endH] of SUSPENSION_HOURS[day]) {
      if (hour >= startH && hour < endH) {
        // Siamo in orario lavorativo, e NON è un giorno festivo
        return true; // SOSPESO
      }
    }
  }

  // Default: Non in orari sospensione -> Attivo
  return false;
}

// ====================================================================
// REGOLE MESSE SPECIALI (Ripristino Funzionalità Legacy)
// ====================================================================

/**
 * Ritorna una stringa con regola speciale se oggi è un giorno festivo speciale.
 * Regola: Nei giorni speciali (Pasquetta, 25 Apr, 1 Mag, 2 Giu, 26 Dic),
 * la Messa è SOLO alle 19:00 (a meno che non sia Domenica).
 */
function getSpecialMassTimeRule(date = new Date()) {
  // FIX Bug #27: Validate date parameter
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    console.warn('⚠️ Invalid date passed to getSpecialMassTimeRule');
    return null;
  }
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();
  const weekDay = date.getDay(); // 0=Sun
  
  // Se è Domenica, si applicano le regole standard domenicali (a meno di override)
  // Logica legacy implicava: "tranne se cadono di domenica" -> se Domenica, regole standard.
  if (weekDay === 0) {
    return null; 
  }

  // Giorni Fissi Speciali: 25 Apr, 1 Mag, 2 Giu, 26 Dic
  const specialFixed = [
    [4, 25], // Anniversario Liberazione
    [5, 1],  // Festa Lavoro
    [6, 2],  // Repubblica
    [12, 26] // Santo Stefano
  ];

  let isSpecial = false;
  
  // Controlla Fissi
  for (const [m, d] of specialFixed) {
    if (month === m && day === d) {
      isSpecial = true;
      break;
    }
  }

  // Controlla Pasquetta
  if (!isSpecial) {
    const easter = calculateEaster(date.getFullYear());
    const pasquetta = new Date(easter);
    pasquetta.setDate(easter.getDate() + 1);
    
    if (month === (pasquetta.getMonth() + 1) && day === pasquetta.getDate()) {
      isSpecial = true;
    }
  }

  if (isSpecial) {
    return `
════════════════════════════════════════════════════════════════════════
🚨 REGOLA SPECIALE ORARIO MESSA (OGGI È GIORNO FESTIVO INFRASETTIMANALE)
════════════════════════════════════════════════════════════════════════
ATTENZIONE: Oggi è un giorno festivo speciale (es. Lunedì dell'Angelo, 25 Aprile, 
1 Maggio, 2 Giugno o Santo Stefano).

REGOLA: In questi giorni, la Santa Messa viene celebrata ESCLUSIVAMENTE alle ore 19:00.
NON citare orari feriali standard (es. 8:30 o 18:00).
NON citare orari festivi standard se non è Domenica.

Unico orario valido per OGGI: ore 19:00.
════════════════════════════════════════════════════════════════════════
`;
  }

  return null;
}

/**
 * Ritorna una stringa che descrive il periodo vacanze di Ferragosto.
 * Periodo fisso: 15-31 Agosto.
 */
function getFerragostoPeriodInfo(date = new Date()) {
  const year = date.getFullYear();
  return `Periodo Ferragosto: 15 ago - 31 ago ${year}`;
}



// ====================================================================
// ASSERZIONE CONFIG CRITICA (fail-fast)
// ====================================================================

function assertCriticalConfig() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('GEMINI_API_KEY')) {
    throw new Error('❌ GEMINI_API_KEY missing in Script Properties');
  }
  if (!props.getProperty('SPREADSHEET_ID')) {
    throw new Error('❌ SPREADSHEET_ID missing in Script Properties');
  }
}

// ====================================================================
// ENTRY POINT PRINCIPALE - Per Trigger
// ====================================================================

/**
 * Funzione principale da collegare al trigger
 * Eseguire ogni 5-15 minuti
 */
function main() {
  console.log('\n' + '═'.repeat(70));
  console.log('🚀 AVVIO ELABORAZIONE EMAIL');
  console.log('═'.repeat(70));
  console.log(`⏰ ${new Date().toLocaleString('it-IT')}`);
  
  // Fail-fast su config mancante
  assertCriticalConfig();
  
  // Controlla sospensione
  if (isInSuspensionTime()) {
    console.log('⏸️ Servizio sospeso: orario di lavoro segreteria');
    return;
  }
  
  // Carica risorse
  loadResources();
  
  if (!GLOBAL_CACHE.knowledgeBase) {
    console.error('❌ Knowledge Base non caricata, esco');
    return;
  }
  
  // Crea ed esegui processore
  try {
    const processor = new EmailProcessor();
    const stats = processor.processUnreadEmails(
      GLOBAL_CACHE.knowledgeBase,
      GLOBAL_CACHE.doctrineBase
    );
    
    console.log('\n✓ Elaborazione completata');
    console.log(`   Processate: ${stats.total}, Risposte: ${stats.replied}, Filtrate: ${stats.filtered}`);
    
  } catch (error) {
    console.error(`❌ Errore fatale: ${error.message}`);
  }
}

// ====================================================================
// FUNZIONI UTILITÀ
// ====================================================================

/**
 * Test connessione API Gemini
 */
function testGeminiConnection() {
  console.log('🧪 Testing Gemini connection...');
  const gemini = new GeminiService();
  const result = gemini.testConnection();
  console.log('Result:', JSON.stringify(result, null, 2));
  return result;
}

/**
 * Test connessione Gmail
 */
function testGmailConnection() {
  console.log('🧪 Testing Gmail connection...');
  const gmail = new GmailService();
  const result = gmail.testConnection();
  console.log('Result:', JSON.stringify(result, null, 2));
  return result;
}

/**
 * Test pipeline senza inviare email
 */
function testDryRun() {
  console.log('🧪 Starting DRY RUN test...');
  CONFIG.DRY_RUN = true;
  main();
}

/**
 * TEST FUNZIONE VACANZE
 * Eseguire da editor per verificare la logica
 */
function testHolidayLogic() {
  console.log('🧪 TESTING HOLIDAY LOGIC (Simulazione date)...');
  
  // Casi di test
  // Nota: I mesi in JS Date sono 0-indexed (0=Gennaio, 11=Dicembre)
  const testCases = [
    // --- DATE FISSE (Devono essere ATTIVO/FALSE) ---
    { label: 'Natale (Giovedì)', d: new Date(2025, 11, 25, 10, 0), expectSuspended: false },
    { label: 'Santo Stefano (Venerdì)', d: new Date(2025, 11, 26, 10, 0), expectSuspended: false },
    { label: 'Capodanno (Mercoledì)', d: new Date(2025, 0, 1, 10, 0), expectSuspended: false },
    { label: 'Epifania (Lunedì)', d: new Date(2025, 0, 6, 10, 0), expectSuspended: false },
    { label: 'Liberazione (Venerdì)', d: new Date(2025, 3, 25, 10, 0), expectSuspended: false },
    { label: '1 Maggio (Giovedì)', d: new Date(2025, 4, 1, 10, 0), expectSuspended: false },
    { label: 'SS Pietro Paolo (Domenica)', d: new Date(2025, 5, 29, 10, 0), expectSuspended: false },
    { label: 'Ferragosto (Venerdì)', d: new Date(2025, 7, 15, 10, 0), expectSuspended: false },
    { label: 'Ognissanti (Sabato)', d: new Date(2025, 10, 1, 10, 0), expectSuspended: false },
    { label: 'Immacolata (Lunedì)', d: new Date(2025, 11, 8, 10, 0), expectSuspended: false },

    // --- DATE MOBILI PASQUA 2025 (Pasqua: 20 Aprile) ---
    { label: 'Sabato Santo 2025', d: new Date(2025, 3, 19, 10, 0), expectSuspended: false },
    { label: 'Pasqua 2025', d: new Date(2025, 3, 20, 10, 0), expectSuspended: false },
    { label: 'Pasquetta 2025', d: new Date(2025, 3, 21, 10, 0), expectSuspended: false },
    
    // --- PERIODO FERRAGOSTO 2025 (Fisso: 15-31 Agosto) ---
    { label: 'Prima di Ferragosto (14 Ago - Giovedì)', d: new Date(2025, 7, 14, 10, 0), expectSuspended: true }, // Giovedì orario lavoro
    { label: 'Inizio Ferragosto (15 Ago)', d: new Date(2025, 7, 15, 10, 0), expectSuspended: false },
    { label: 'Durante Ferragosto (20 Ago)', d: new Date(2025, 7, 20, 10, 0), expectSuspended: false },
    { label: 'Fine Ferragosto (31 Ago)', d: new Date(2025, 7, 31, 10, 0), expectSuspended: false },
    { label: 'Dopo Ferragosto (1 Set - Lunedì)', d: new Date(2025, 8, 1, 10, 0), expectSuspended: true }, // Lunedì orario lavoro

    // --- ORARI STANDARD ---
    { label: 'Giovedì lavorativo (16 Ott)', d: new Date(2025, 9, 16, 10, 0), expectSuspended: true },  // Sospeso
    { label: 'Giovedì sera (16 Ott)', d: new Date(2025, 9, 16, 20, 0), expectSuspended: false },       // Attivo (fuori orario)
    { label: 'Domenica (non festiva)', d: new Date(2025, 9, 12, 10, 0), expectSuspended: false }       // Attivo
  ];

  let passed = 0;
  console.log('---------------------------------------------------');
  testCases.forEach(tc => {
    const isSuspended = isInSuspensionTime(tc.d);
    // expectSuspended: true = Sospeso (Dipendenti lavorano)
    // expectSuspended: false = Attivo (Dipendenti in ferie)
    
    const resultStr = isSuspended ? "⛔ SOSPESO (Lavoro)" : "✅ ATTIVO (Bot risponde)";
    const ok = isSuspended === tc.expectSuspended;
    
    if (ok) passed++;
    const icon = ok ? "👍" : "❌ ERRORE";
    
    console.log(`${icon} ${tc.label} -> ${resultStr}`);
    if (!ok) {
      console.log(`   ⚠️ Atteso: ${tc.expectSuspended ? "SOSPESO" : "ATTIVO"} | Data: ${tc.d.toLocaleString()}`);
    }
  });
  console.log('---------------------------------------------------');
  console.log(`Risultato: ${passed}/${testCases.length} test passati.`);
}

function testRestoredFeatures() {
  console.log('🧪 VERIFICA FUNZIONALITÀ RESTAURATE');
  
  // 1. TEST REGOLA MESSA SPECIALE
  console.log('\n--- 1. Special Mass Rule Test ---');
  const d = new Date(2026, 3, 6); // 6 Aprile 2026 (Lunedì dell'Angelo - Pasqua è il 5)
  // Pasqua 2026 calcolo:
  // a=2026%19=12, b=20, c=26, d=5, e=0, f=1, g=6, h=(19*12+20-5-6+15)%30 = (228+9+15)%30 = 252%30=12
  // i=6, k=2, l=(32+0+12-12-2)%7 = 30%7=2
  // m=(12+132+44)/451=0.
  // month=(12+2+114)/31 = 128/31 = 4 (Aprile). day=(128%31)+1 = 5.
  // Easter 2026 is April 5. Pasquetta is April 6.
  
  const rule = getSpecialMassTimeRule(d);
  if (rule && rule.includes('19:00')) {
    console.log('✅ Regola Pasquetta rilevata correttamente:\n', rule.trim().substring(0, 100) + '...');
  } else {
    console.error('❌ ERRORE: Regola Pasquetta NON rilevata per il ' + d.toDateString());
  }
  
  const dNormal = new Date(2026, 3, 7); // 7 Aprile (Martedì)
  if (getSpecialMassTimeRule(dNormal) === null) {
    console.log('✅ Giorno normale = Nessuna regola (Corretto)');
  } else {
    console.error('❌ ERRORE: Rilevata regola speciale in giorno normale');
  }

  // 2. TEST FORMATTING SAFEGUARDS
  console.log('\n--- 2. Formatting Safeguards Test ---');
  const service = new GmailService();
  
  // A. Punctuation
  const badPunc = "Buongiorno, Siamo lieti di...";
  const fixedPunc = service.fixPunctuation(badPunc);
  if (fixedPunc === "Buongiorno, siamo lieti di...") {
    console.log(`✅ Fix Punctuation: "${badPunc}" -> "${fixedPunc}"`);
  } else {
    console.error(`❌ ERROR Punctuation: "${badPunc}" -> "${fixedPunc}"`);
  }
  
  // B. Line Break
  const badBreak = "Buongiorno, siamo\nEcco le info...";
  const fixedBreak = service.ensureGreetingLineBreak(badBreak);
  if (fixedBreak.includes('\n\n')) {
    console.log(`✅ Fix LineBreak: Break inserted correctly.`);
  } else {
    console.error(`❌ ERROR LineBreak: Break NOT inserted.`);
  }
}

/**
 * Pulizia memoria vecchia (>30 giorni)
 */
function cleanupMemory() {
  const memory = new MemoryService();
  const deleted = memory.cleanOldEntries(30);
  console.log(`🧹 Cleaned ${deleted} old memory entries`);
  return deleted;
}

/**
 * Status check completo
 */
/**
 * TEST: Verifica flusso ibrido (Gemini + Smart RAG)
 */
function testHybridFlow() {
  loadResources();
  console.log('🧪 TESTING HYBRID FLOW...');
  
  const testSubject = "Richiesta Battesimo";
  const testBody = "Vorremmo battezzare nostro figlio, ma siamo divorziati. È possibile? Come funziona?";
  
  console.log(`📧 Subject: ${testSubject}`);
  console.log(`📝 Body: ${testBody}`);
  
  const gemini = new GeminiService();
  const quickCheck = gemini.shouldRespondToEmail(testBody, testSubject);
  
  console.log('🤖 Gemini Classification:', JSON.stringify(quickCheck, null, 2));
  
  if (quickCheck.classification) {
     const engine = new PromptEngine();
     const directives = engine._renderDynamicDirectives(
       quickCheck.classification.topic
     );
     console.log('📚 Dynamic Directives (Smart RAG):');
     console.log(directives || 'NONE');
  }
}

function healthCheck() {
  console.log('\n' + '═'.repeat(50));
  console.log('🏥 HEALTH CHECK');
  console.log('═'.repeat(50));
  
  // Gemini
  const gemini = new GeminiService();
  const geminiStatus = gemini.testConnection();
  console.log(`Gemini API: ${geminiStatus.isHealthy ? '✓ OK' : '❌ FAIL'}`);
  
  // Gmail
  const gmail = new GmailService();
  const gmailStatus = gmail.testConnection();
  console.log(`Gmail API: ${gmailStatus.isHealthy ? '✓ OK' : '❌ FAIL'}`);
  
  // Memory
  const memory = new MemoryService();
  const memoryStatus = memory.getStats();
  console.log(`Memory: ${memoryStatus.initialized ? '✓ OK' : '❌ FAIL'} (${memoryStatus.totalEntries || 0} entries)`);
  
  // Knowledge Base
  loadResources();
  console.log(`Knowledge Base: ${GLOBAL_CACHE.knowledgeBase ? '✓ OK' : '❌ FAIL'} (${GLOBAL_CACHE.knowledgeBase?.length || 0} chars)`);
  console.log(`Structured Doctrine: ${GLOBAL_CACHE.doctrineStructured?.length > 0 ? '✓ OK' : '❌ FAIL'} (${GLOBAL_CACHE.doctrineStructured?.length || 0} entries)`);
  
  console.log('═'.repeat(50));
  
  return {
    gemini: geminiStatus.isHealthy,
    gmail: gmailStatus.isHealthy,
    memory: memoryStatus.initialized,
    knowledgeBase: !!GLOBAL_CACHE.knowledgeBase
  };
}

// ====================================================================
// GESTIONE TRIGGER
// ====================================================================

/**
 * Crea trigger temporizzato (ogni 10 minuti)
 */
function createTimeTrigger() {
  // Rimuovi trigger esistenti
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'main') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Crea nuovo trigger
  ScriptApp.newTrigger('main')
    .timeBased()
    .everyMinutes(10)
    .create();
    
  console.log('✓ Trigger creato: main() ogni 10 minuti');
}

/**
 * Rimuovi tutti i trigger
 */
function removeTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  console.log(`✓ Rimossi ${triggers.length} trigger`);
}

/**
 * Helper: Converte array 2D da Sheet in Array di Oggetti
 * Assume che la prima riga sia Header
 */
function _parseSheetToStructured(data) {
  if (!data || data.length < 2) return [];
  const headers = data[0].map(h => String(h).trim());
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      // FIX Bug #25: Handle Date objects + undefined/null + whitespace
      let cellVal = row[j];
      if (cellVal === undefined || cellVal === null) {
        cellVal = '';
      } else if (cellVal instanceof Date) {
        cellVal = cellVal.toISOString(); // Convert Date to string
      } else if (typeof cellVal !== 'string') {
        cellVal = String(cellVal); // Convert numbers/booleans
      }
      obj[headers[j]] = typeof cellVal === 'string' ? cellVal.trim() : cellVal;
    }
    rows.push(obj);
  }
  return rows;
}
