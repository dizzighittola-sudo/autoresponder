// ====================================================================
// MEMORY SERVICE - Memoria conversazionale per GAS
// ✅ Usa Google Sheet come storage
// ✅ Stessa struttura dati di versione Python
// ====================================================================

/**
 * MemoryService - Versione GAS usando Google Sheets
 * 
 * STORAGE: Google Sheet "ConversationMemory" con colonne:
 * A: threadId
 * B: language
 * C: category
 * D: tone
 * E: providedInfo (JSON array)
 * F: lastUpdated (timestamp)
 * G: messageCount
 * 
 * CONFIGURATION:
 * - Aggiungi MEMORY_SHEET_NAME in CONFIG (default: 'ConversationMemory')
 * - Il foglio sarà creato automaticamente se non esiste
 */
class MemoryService {
  constructor() {
    console.log('🧠 Inizializzazione MemoryService (basato su Sheet)...');
    
    // Configurazione
    this.spreadsheetId = typeof CONFIG !== 'undefined' ? CONFIG.SPREADSHEET_ID : null;
    this.sheetName = typeof CONFIG !== 'undefined' ? 
                     (CONFIG.MEMORY_SHEET_NAME || 'ConversationMemory') : 
                     'ConversationMemory';
    
    // Cache per performance (evita lookup ripetuti)
    this._cache = {};
    this._cacheExpiry = 5 * 60 * 1000; // 5 minuti
    
    // Inizializza foglio
    this._sheet = null;
    this._initialized = false;
    
    if (this.spreadsheetId) {
      this._initializeSheet();
    } else {
      console.warn('⚠️ SPREADSHEET_ID not configured, MemoryService disabled');
    }
  }
  
  /**
   * Inizializza o crea il foglio memoria
   */
  _initializeSheet() {
    try {
      const spreadsheet = SpreadsheetApp.openById(this.spreadsheetId);
      this._sheet = spreadsheet.getSheetByName(this.sheetName);
      
      if (!this._sheet) {
        // Crea nuovo foglio con intestazioni
        this._sheet = spreadsheet.insertSheet(this.sheetName);
        this._sheet.getRange('A1:H1').setValues([[
          'threadId', 'language', 'category', 'tone', 
          'providedInfo', 'lastUpdated', 'messageCount', 'version'
        ]]);
        this._sheet.getRange('A1:H1').setFontWeight('bold');
        this._sheet.setFrozenRows(1);
        console.log(`✓ Created new sheet: ${this.sheetName}`);
      }
      
      this._initialized = true;
      console.log(`✓ MemoryService initialized (Sheet: ${this.sheetName})`);
      
    } catch (error) {
      console.error(`❌ Failed to initialize MemoryService: ${error.message}`);
      this._initialized = false;
    }
  }
  
  /**
   * Ottiene memoria per un thread
   */
  getMemory(threadId) {
    if (!this._initialized || !threadId) {
      return {};
    }
    
    // Verifica prima la cache
    const cacheKey = `memory_${threadId}`;
    const cached = this._getFromCache(cacheKey);
    if (cached) {
      console.log(`🧠 Memory hit (cached) for thread ${threadId}`);
      return cached;
    }
    
    try {
      // Trova riga per threadId
      const row = this._findRowByThreadId(threadId);
      
      if (row) {
        const data = this._rowToObject(row);
        console.log(`🧠 Memory hit for thread ${threadId} (Lang: ${data.language})`);
        
        // Memorizza in cache
        this._setCache(cacheKey, data);
        return data;
      } else {
        console.log(`🧠 Memory miss for thread ${threadId} (New conversation)`);
        return {};
      }
      
    } catch (error) {
      console.error(`❌ Error retrieving memory: ${error.message}`);
      return {};
    }
  }
  
  /**
   * Aggiorna memoria per un thread (merge con esistente)
   */
  /**
   * Aggiorna memoria per un thread (merge con esistente)
   * ✅ FIX Bug #1 & #3: Granular Lock (CacheService) + Retry + Optimistic Locking
   */
  updateMemory(threadId, newData) {
    if (!this._initialized || !threadId) {
      return;
    }
    
    // Filtra campi interni
    const dataToUpdate = {};
    for (const key in newData) {
      if (!key.startsWith('_')) {
        dataToUpdate[key] = newData[key];
      }
    }

    const MAX_RETRIES = 3;
    // Usa lock granulare basato su threadId (non blocca altri thread)
    const cache = CacheService.getScriptCache();
    const lockKey = `memory_lock_${threadId}`;
    
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      // 1. Check lock esistente (busy wait algoritmico)
      if (cache.get(lockKey)) {
        console.warn(`🔒 Memory locked for thread ${threadId}, waiting (Attempt ${attempt+1})`);
        Utilities.sleep(Math.pow(2, attempt) * 200);
        continue;
      }

      try {
        // 2. Acquisisci lock (durata breve: 10s)
        cache.put(lockKey, 'LOCKED', CONFIG.MEMORY_LOCK_TTL);
        
        // 3. CRITICAL: Rileggi dati FRESCHI dallo Sheet
        const existingRow = this._findRowByThreadId(threadId); // Lettura diretta
        const now = new Date().toISOString();
        
        if (existingRow) {
           const existingData = this._rowToObject(existingRow.values);
           const currentVersion = existingData.version || 0;

           // ✅ OPTIMISTIC LOCKING CHECK
           if (newData._expectedVersion !== undefined && newData._expectedVersion !== currentVersion) {
              console.warn(`🔒 Version mismatch thread ${threadId}: expected ${newData._expectedVersion}, got ${currentVersion}`);
              newData._expectedVersion = currentVersion; // Aggiorna per prossimo retry
              throw new Error('VERSION_MISMATCH');
           }
           
           // Merge: esistente + nuovi dati
           const mergedData = Object.assign({}, existingData, dataToUpdate);
           mergedData.lastUpdated = now;
           mergedData.messageCount = (existingData.messageCount || 0) + 1;
           mergedData.version = currentVersion + 1; // Incrementa versione
           
           this._updateRow(existingRow.rowIndex, mergedData);
           console.log(`🧠 Memory updated for thread ${threadId} (v${mergedData.version}, Attempt ${attempt+1})`);
        } else {
           // Nuova riga
           const insertData = Object.assign({}, dataToUpdate);
           insertData.threadId = threadId;
           insertData.lastUpdated = now;
           insertData.messageCount = 1;
           insertData.version = 1; 
           this._appendRow(insertData);
           console.log(`🧠 Memory created for thread ${threadId} (v1)`);
        }
        
        // Invalida cache locale (per coerenza immediata)
        this._invalidateCache(`memory_${threadId}`);
        
        return; // Successo
        
      } catch (error) {
        if (error.message === 'VERSION_MISMATCH') {
            console.warn(`⚠️ Concurrency conflict, retrying... (Attempt ${attempt+1})`);
        } else {
            console.warn(`Memory update failed (Attempt ${attempt+1}): ${error.message}`);
        }
        
        if (attempt === MAX_RETRIES - 1) {
           console.error(`❌ Final Memory Update Failure: ${error.message}`);
        }
        // Backoff esponenziale
        Utilities.sleep(Math.pow(2, attempt) * 200);
      } finally {
        // ✅ Rilascia lock granulare
        try {
          cache.remove(lockKey);
        } catch(e) {}
      }
    }
    throw new Error(`Failed to update memory for thread ${threadId} after ${MAX_RETRIES} attempts`);
  }

  
  /**
   * Aggiorna memoria E topic in un'unica operazione atomica
   * ✅ Previene inconsistenze: tutto o niente in un singolo lock
   * 
   * @param {string} threadId - ID del thread
   * @param {Object} newData - Dati da aggiornare (language, category, tone, etc.)
   * @param {string[]} providedTopics - Topic da aggiungere (opzionale)
   * @returns {boolean} - true se l'operazione è riuscita
   */
  /**
   * Aggiorna memoria E topic in un'unica operazione atomica
   * ✅ Previene inconsistenze: tutto o niente in un singolo lock
   * 
   * @param {string} threadId - ID del thread
   * @param {Object} newData - Dati da aggiornare (language, category, tone, etc.)
   * @param {string[]} providedTopics - Topic da aggiungere (opzionale)
   * @returns {boolean} - true se l'operazione è riuscita
   */
  updateMemoryAtomic(threadId, newData, providedTopics = null) {
    if (!this._initialized || !threadId) {
      return false;
    }
    
    // ✅ Use Granular Lock
    const cache = CacheService.getScriptCache();
    const lockKey = `memory_lock_${threadId}`;
    
    // Simple busy-wait (no complexities of updateMemory, just fail-safe atomic update)
    // Try max 3 times
    for (let i = 0; i < 3; i++) {
        if (cache.get(lockKey)) {
            Utilities.sleep(200);
            continue;
        }
        try {
            cache.put(lockKey, 'LOCKED', CONFIG.MEMORY_LOCK_TTL);
            
            // --- CRITICAL SECTION START ---
            const existingRow = this._findRowByThreadId(threadId);
            const now = new Date().toISOString();
            
            if (existingRow) {
                // Unisci con dati esistenti
                const existingData = this._rowToObject(existingRow.values);
                const currentVersion = existingData.version || 0;
                
                const mergedData = Object.assign({}, existingData, newData);
                mergedData.lastUpdated = now;
                mergedData.messageCount = (existingData.messageCount || 0) + 1;
                mergedData.version = currentVersion + 1;
                
                if (providedTopics && providedTopics.length > 0) {
                    const existingTopics = existingData.providedInfo || [];
                    mergedData.providedInfo = [...new Set([...existingTopics, ...providedTopics])];
                    console.log(`🧠 Memory: Atomically added topics ${JSON.stringify(providedTopics)}`);
                }
                
                this._updateRow(existingRow.rowIndex, mergedData);
                console.log(`🧠 Memory atomically updated for thread ${threadId} (v${mergedData.version})`);
            } else {
                newData.threadId = threadId;
                newData.lastUpdated = now;
                newData.messageCount = 1;
                newData.version = 1; 
                
                if (providedTopics && providedTopics.length > 0) {
                    newData.providedInfo = providedTopics;
                }
                
                this._appendRow(newData);
                console.log(`🧠 Memory atomically created for thread ${threadId} (v1)`);
            }
            
            this._invalidateCache(`memory_${threadId}`);
            return true;
            // --- CRITICAL SECTION END ---
            
        } catch (error) {
            console.error(`❌ Error in atomic memory update: ${error.message}`);
            return false;
        } finally {
            try { cache.remove(lockKey); } catch(e) {}
        }
    }
    return false; // Timeout
  }
  
  /**
   * Aggiunge topic alla lista info fornite
   * ✅ FIX: Non incrementa messageCount (evita doppio incremento)
   */
   addProvidedInfoTopics(threadId, topics) {
     if (!this._initialized || !threadId || !topics || topics.length === 0) {
       return;
     }
 
     // ✅ FIX: Strict atomic locking to prevent race conditions with updateMemory
     const cache = CacheService.getScriptCache();
     const lockKey = `memory_lock_${threadId}`;

     try {
       // Single try - topic addition is less critical if blocked
       if (cache.get(lockKey)) {
           Utilities.sleep(500); 
           if (cache.get(lockKey)) return; // Skip if still locked
       }
       cache.put(lockKey, 'LOCKED', CONFIG.MEMORY_LOCK_TTL);
       
       const existingRow = this._findRowByThreadId(threadId);
       if (existingRow) {
         const existingData = this._rowToObject(existingRow.values);
         const existingTopics = existingData.providedInfo || [];
         const mergedTopics = [...new Set([...existingTopics, ...topics])];
         
         const currentVersion = existingData.version || 0;
         existingData.providedInfo = mergedTopics;
         existingData.lastUpdated = new Date().toISOString();
         existingData.version = currentVersion + 1; // Increment version for consistency
         // Message count is NOT incremented here (topic-only update)
         
         this._updateRow(existingRow.rowIndex, existingData);
         this._invalidateCache(`memory_${threadId}`);
         console.log(`🧠 Memory: Atomically added provided topics ${JSON.stringify(topics)}`);
       }
     } catch (error) {
       console.error(`❌ Error adding provided info: ${error.message}`);
     } finally {
       try { cache.remove(lockKey); } catch(e) {}
     }
   }
  
  /**
   * Imposta lingua per un thread
   */
  setLanguage(threadId, language) {
    this.updateMemory(threadId, { language: language });
  }
  
  /**
   * Imposta categoria per un thread
   */
  setCategory(threadId, category) {
    this.updateMemory(threadId, { category: category });
  }
  
  // ========================================================================
  // METODI HELPER PRIVATI
  // ========================================================================
  
  /**
   * Trova riga per threadId
   * Ritorna { rowIndex, values } o null
   */
  _findRowByThreadId(threadId) {
    const data = this._sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) { // Salta intestazione
      if (data[i][0] === threadId) {
        return {
          rowIndex: i + 1, // 1-indexed per Sheets
          values: data[i]
        };
      }
    }
    
    return null;
  }
  
  /**
   * Converte array riga in oggetto
   */
  _rowToObject(row) {
    // Gestisce sia array che oggetto con .values
    const values = Array.isArray(row) ? row : row.values || row;
    
    let providedInfo = [];
    try {
      if (values[4]) {
        providedInfo = JSON.parse(values[4]);
      }
    } catch (e) {
      providedInfo = values[4] ? [values[4]] : [];
    }
    
    // FIX Bug 12: Validate timestamp BEFORE object construction
    let lastUpdated = values[5] || null;
    if (lastUpdated) {
      const testDate = new Date(lastUpdated);
      if (isNaN(testDate.getTime())) {
        console.warn(`⚠️ Invalid date in memory for thread ${values[0]}: ${lastUpdated}`);
        lastUpdated = null;
      }
    }
    
    return {
      threadId: values[0],
      language: values[1] || 'it',
      category: values[2] || null,
      tone: values[3] || 'standard',
      providedInfo: providedInfo,
      lastUpdated: lastUpdated,  // ✅ Already validated
      messageCount: parseInt(values[6]) || 0,
      version: parseInt(values[7]) || 0 // ✅ Read Version
    };
  }
  
  /**
   * Aggiorna riga esistente
   */
  _updateRow(rowIndex, data) {
    const providedInfoJson = JSON.stringify(data.providedInfo || []);
    
    this._sheet.getRange(rowIndex, 1, 1, 8).setValues([[
      data.threadId,
      data.language || 'it',
      data.category || '',
      data.tone || 'standard',
      providedInfoJson,
      data.lastUpdated,
      data.messageCount || 1,
      data.version || 1 // ✅ Write Version
    ]]);
  }
  
  /**
   * Aggiunge nuova riga
   */
  _appendRow(data) {
    const providedInfoJson = JSON.stringify(data.providedInfo || []);
    
    this._sheet.appendRow([
      data.threadId,
      data.language || 'it',
      data.category || '',
      data.tone || 'standard',
      providedInfoJson,
      data.lastUpdated,
      data.messageCount || 1,
      data.version || 1 // ✅ Write Version
    ]);
  }
  
  // ========================================================================
  // METODI CACHE
  // ========================================================================
  
  _getFromCache(key) {
    const cached = this._cache[key];
    if (cached && (Date.now() - cached.timestamp) < this._cacheExpiry) {
      return cached.data;
    }
    return null;
  }
  
  _setCache(key, data) {
    this._cache[key] = {
      data: data,
      timestamp: Date.now()
    };
  }
  
  _invalidateCache(key) {
    delete this._cache[key];
  }
  
  /**
   * Svuota tutta la cache
   */
  clearCache() {
    this._cache = {};
    console.log('🗑️ Memory cache cleared');
  }
  
  // ========================================================================
  // METODI UTILITÀ
  // ========================================================================
  
  /**
   * Pulisce voci vecchie (più vecchie di N giorni)
   */
  cleanOldEntries(daysOld = 30) {
    if (!this._initialized) return 0;
    
    try {
      const data = this._sheet.getDataRange().getValues();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      let deletedCount = 0;
      
      // Vai all'indietro per evitare problemi di shifting indici
      for (let i = data.length - 1; i >= 1; i--) {
        const lastUpdated = new Date(data[i][5]);
        if (lastUpdated < cutoffDate) {
          this._sheet.deleteRow(i + 1);
          deletedCount++;
        }
      }
      
      console.log(`🧹 Cleaned ${deletedCount} old memory entries`);
      return deletedCount;
      
    } catch (error) {
      console.error(`❌ Error cleaning old entries: ${error.message}`);
      return 0;
    }
  }
  
  /**
   * Ottieni statistiche sull'uso della memoria
   */
  getStats() {
    if (!this._initialized) {
      return { initialized: false };
    }
    
    const data = this._sheet.getDataRange().getValues();
    return {
      initialized: true,
      sheetName: this.sheetName,
      totalEntries: data.length - 1, // Escludi intestazione
      cacheSize: Object.keys(this._cache).length
    };
  }
  
  /**
   * Verifica se il servizio è sano
   */
  isHealthy() {
    return this._initialized;
  }
}

// Funzione factory
function createMemoryService() {
  return new MemoryService();
}

// ====================================================================
// FUNZIONE TRIGGER PULIZIA
// Esegui periodicamente per pulire le voci di memoria vecchie
// ====================================================================

function cleanupOldMemory() {
  const memoryService = new MemoryService();
  const deleted = memoryService.cleanOldEntries(30); // 30 giorni
  console.log(`Pulizia memoria completata: ${deleted} voci rimosse`);
}

// ====================================================================
// SETUP INIZIALE - ISTRUZIONI PER CLEANUP AUTOMATICO SETTIMANALE
// ====================================================================
//
// Per attivare il cleanup automatico della memoria conversazionale,
// eseguire UNA SOLA VOLTA la funzione `setupWeeklyCleanupTrigger()`.
//
// === ISTRUZIONI PASSO-PASSO ===
//
// 1. Aprire il progetto Google Apps Script (script.google.com)
// 2. Selezionare questo file (MemoryService.txt/gs)
// 3. Nel menu a tendina delle funzioni (in alto), selezionare:
//    `setupWeeklyCleanupTrigger`
// 4. Cliccare il pulsante ▶️ "Esegui"
// 5. Se richiesto, autorizzare le permission per i trigger
// 6. Verificare nel log: "✓ Weekly cleanup trigger created"
//
// === VERIFICA TRIGGER ATTIVO ===
//
// Per verificare che il trigger sia stato creato correttamente:
// 1. Cliccare sull'icona ⏰ "Trigger" nella barra laterale sinistra
// 2. Deve apparire un trigger con:
//    - Funzione: cleanupOldMemory
//    - Tipo: Time-driven (basato sul tempo)
//    - Frequenza: Weekly on Sunday, 3am–4am
//
// === COMPORTAMENTO ===
//
// - La funzione `cleanupOldMemory()` verrà eseguita ogni domenica alle 3:00
// - Rimuove le conversazioni più vecchie di 30 giorni
// - I log sono visibili in: Esecuzioni > Visualizza esecuzioni
//
// === NOTE ===
//
// - NON eseguire `setupWeeklyCleanupTrigger()` più volte: rimuove
//   automaticamente trigger duplicati prima di crearne uno nuovo
// - Per disattivare: eliminare manualmente il trigger dalla sezione Trigger
// - Per modificare la frequenza: modificare i parametri in questa funzione
//
// ====================================================================

/**
 * Configura trigger settimanale per pulizia automatica memoria
 * ⚠️ ESEGUI UNA SOLA VOLTA manualmente per attivare il cleanup automatico
 * 
 * Il trigger eseguirà cleanupOldMemory() ogni domenica alle 3:00
 * 
 * @example
 * // Esecuzione manuale da GAS Editor:
 * // 1. Selezionare setupWeeklyCleanupTrigger dal menu funzioni
 * // 2. Cliccare Esegui (▶️)
 * // 3. Autorizzare se richiesto
 */
function setupWeeklyCleanupTrigger() {
  // Rimuovi trigger esistenti per evitare duplicati
  const triggers = ScriptApp.getProjectTriggers();
  let removed = 0;
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'cleanupOldMemory') {
      ScriptApp.deleteTrigger(trigger);
      removed++;
    }
  }
  if (removed > 0) {
    console.log(`🗑️ Removed ${removed} existing cleanup trigger(s)`);
  }
  
  // Crea trigger settimanale (domenica alle 3:00)
  ScriptApp.newTrigger('cleanupOldMemory')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(3)
    .create();
    
  console.log('✓ Weekly cleanup trigger created (Sunday 3:00 AM)');
}
