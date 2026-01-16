// ====================================================================
// EMAIL PROCESSOR - Orchestratore Pipeline
// ✅ Pipeline chiara: Filtra → Classifica → Genera → Valida
// ✅ Architettura modulare con dependency injection
// ====================================================================

/**
 * EmailProcessor - Orchestratore elaborazione email
 * 
 * PIPELINE:
 * 1. FILTRA: Dobbiamo processare questa email?
 * 2. CLASSIFICA: Che tipo di richiesta è?
 * 3. GENERA: Crea risposta AI
 * 4. VALIDA: Controlla qualità risposta
 * 5. INVIA: Rispondi all'email
 */
class EmailProcessor {
  constructor(options = {}) {
    console.log('📬 Inizializzazione EmailProcessor...');
    
    // Inietta dipendenze o crea default
    this.geminiService = options.geminiService || new GeminiService();
    this.classifier = options.classifier || new EmailClassifier();
    this.requestClassifier = options.requestClassifier || new RequestTypeClassifier();
    this.validator = options.validator || new ResponseValidator();
    this.gmailService = options.gmailService || new GmailService();
    this.territoryValidator = options.territoryValidator || new TerritoryValidator();
    this.promptEngine = options.promptEngine || new PromptEngine();
    this.memoryService = options.memoryService || new MemoryService();
    
    // Configurazione
    this.config = {
      validationEnabled: typeof CONFIG !== 'undefined' ? CONFIG.VALIDATION_ENABLED : true,
      dryRun: typeof CONFIG !== 'undefined' ? CONFIG.DRY_RUN : false,
      maxEmailsPerRun: typeof CONFIG !== 'undefined' ? CONFIG.MAX_EMAILS_PER_RUN : 10,
      labelName: typeof CONFIG !== 'undefined' ? CONFIG.LABEL_NAME : 'IA',
      errorLabelName: typeof CONFIG !== 'undefined' ? CONFIG.ERROR_LABEL_NAME : 'IA-Error',
      validationErrorLabel: typeof CONFIG !== 'undefined' ? CONFIG.VALIDATION_ERROR_LABEL : 'IA_VALIDATION_ERROR'
    };
    
    console.log('✓ EmailProcessor inizializzato');
    console.log(`   Validation: ${this.config.validationEnabled ? 'ENABLED' : 'DISABLED'}`);
    console.log(`   Dry run: ${this.config.dryRun ? 'YES' : 'NO'}`);
  }
  
  /**
   * Elabora il singolo thread (analisi, categorizzazione, generazione risposta, invio)
   * @param {GmailThread} thread 
   * @param {string} knowledgeBase - KB testo semplice
   * @param {Array} doctrineBase - KB strutturata
   * @param {Set} labeledMessageIds - ID messaggi già etichettati (opzionale)
   * @param {boolean} skipLock - Se true, salta acquisizione lock (usato se chiamante ha già lock)
   */
  processThread(thread, knowledgeBase, doctrineBase, labeledMessageIds = new Set(), skipLock = false) {
    const threadId = thread.getId();
    
    // ═══════════════════════════════════════════════════════════════
    // ACQUISIZIONE LOCK (previene race condition tra trigger)
    // ═══════════════════════════════════════════════════════════════
    let lock = null;
    if (!skipLock) {
      lock = LockService.getScriptLock();
      console.log(`🔒 Acquiring lock for thread ${threadId}...`);
      try {
        // Attendi fino a 30s per lock
        if (!lock.tryLock(30000)) {
          console.warn(`⏱️ Could not acquire lock for thread ${threadId}, skipping`);
          return { status: 'skipped', reason: 'lock_timeout' };
        }
      } catch (e) {
         console.warn(`⚠️ Lock error: ${e.message}`);
         return { status: 'skipped', reason: 'lock_error' };
      }
    } else {
      console.log(`🔒 Lock skipped for thread ${threadId} (managed by caller)`);
    }

    const result = {
      status: 'unknown',
      validationFailed: false,
      dryRun: false,
      error: null
    };
    
    let candidate = null;
    try {
      // Raccogli informazioni su thread e messaggi
      const currentLabels = thread.getLabels().map(l => l.getName());
      const hasProcessedLabel = currentLabels.includes(this.config.labelName);
      
      // Ottieni ultimo messaggio NON LETTO nel thread
      const messages = thread.getMessages();
      const unreadMessages = messages.filter(m => m.isUnread());
      
      const myEmail = Session.getActiveUser().getEmail();
      
      // ═══════════════════════════════════════════════════════════════
      // FILTRO A LIVELLO MESSAGGIO: seleziona messaggi non ancora etichettati
      // ✅ OTTIMIZZATO: Set passato da processUnreadEmails (una sola chiamata API)
      // ═══════════════════════════════════════════════════════════════
      // Se non è stato passato il Set, fallback a chiamata locale (per test/uso standalone)
      // FIX: Check size > 0 invece di truthy (empty Set è truthy!)
      const effectiveLabeledIds = (labeledMessageIds && labeledMessageIds.size > 0) 
        ? labeledMessageIds 
        : this.gmailService.getMessageIdsWithLabel(this.config.labelName);
      const unlabeledUnread = unreadMessages.filter(message => {
        return !effectiveLabeledIds.has(message.getId());
      });

      // Considera solo messaggi non letti da mittenti esterni
      const externalUnread = unlabeledUnread.filter(message => {
        const senderEmail = this.gmailService.extractMessageDetails(message).senderEmail;
        return senderEmail && senderEmail.toLowerCase() !== myEmail.toLowerCase();
      });
      
      // Se non ci sono messaggi non letti non ancora etichettati → skip
      if (unlabeledUnread.length === 0) {
        console.log('   ⊘ Thread already processed (no new unread message)');
        result.status = 'skipped';
        result.reason = 'already_labeled_no_new_unread';
        return result;
      }
      
      // Se non ci sono messaggi da esterni → skip
      if (externalUnread.length === 0) {
        console.log('   ⊘ Skipped: no new external unread message');
        // Evita reprocessing infinito: etichetta i messaggi non letti interni
        unlabeledUnread.forEach(message => this._markMessageAsProcessed(message));
        result.status = 'skipped';
        result.reason = 'no_external_unread';
        return result;
      }
      
      // Seleziona ultimo messaggio non letto non etichettato da esterni
      candidate = externalUnread[externalUnread.length - 1];
      const messageDetails = this.gmailService.extractMessageDetails(candidate);
      
      console.log(`\n📧 Processing: ${messageDetails.subject.substring(0, 50)}...`);
      console.log(`   From: ${messageDetails.senderEmail}`);
      
      // ═══════════════════════════════════════════════════════════════
      // STEP 0: ANTI-SELF-REPLY (mandatory first check)
      // ═══════════════════════════════════════════════════════════════
      if (messageDetails.senderEmail.toLowerCase() === myEmail.toLowerCase()) {
        console.log('   ⊘ Skipped: self-sent message');
        this._markMessageAsProcessed(candidate);
        result.status = 'skipped';
        result.reason = 'self_sent';
        return result;
      }
      
      // ═══════════════════════════════════════════════════════════════
      // STEP 0.5: ANTI-LOOP (smart detection)
      // OPT-3: Distinguish legitimate long threads from actual loops
      // ═══════════════════════════════════════════════════════════════
      const MAX_THREAD_LENGTH = 10;
      const MAX_CONSECUTIVE_EXTERNAL = 5; // 5+ consecutive external = likely loop
      
      if (messages.length > MAX_THREAD_LENGTH) {
        // Smart check: count consecutive external messages at end
        const ourEmail = Session.getActiveUser().getEmail().toLowerCase();
        let consecutiveExternal = 0;
        
        for (let i = messages.length - 1; i >= 0; i--) {
          const msgFrom = messages[i].getFrom().toLowerCase();
          if (!msgFrom.includes(ourEmail)) {
            consecutiveExternal++;
          } else {
            break; // Stop counting when we find our own message
          }
        }
        
        if (consecutiveExternal >= MAX_CONSECUTIVE_EXTERNAL) {
          console.log(`   ⊘ Skipped: likely email loop (${consecutiveExternal} consecutive external)`);
          this._markMessageAsProcessed(candidate);
          result.status = 'skipped';
          result.reason = 'email_loop_detected';
          return result;
        }
        
        // Long but not a loop - just warn and continue
        console.warn(`   ⚠️ Long thread (${messages.length} messages) but not a loop - processing`);
      }
      
      // ═══════════════════════════════════════════════════════════════
      // STEP 0.8: ANTI-NOREPLY SENDER (explicit check)
      // ═══════════════════════════════════════════════════════════════
      if (/no-reply|do-not-reply|noreply/i.test(messageDetails.senderEmail)) {
        console.log('   ⊘ Skipped: no-reply sender');
        this._markMessageAsProcessed(candidate);
        result.status = 'filtered';
        result.reason = 'no_reply_sender';
        return result;
      }
      
      // ═══════════════════════════════════════════════════════════════
      // STEP 1: FILTER - Domain/keyword ignores
      // ═══════════════════════════════════════════════════════════════
      if (this._shouldIgnoreEmail(messageDetails)) {
        console.log('   ⊘ Filtered: domain/keyword ignore');
        this._markMessageAsProcessed(candidate);
        result.status = 'filtered';
        return result;
      }
      
      // ═══════════════════════════════════════════════════════════════
      // STEP 2: CLASSIFY - Ultra-simple ack/greeting filter
      // ═══════════════════════════════════════════════════════════════
      const classification = this.classifier.classifyEmail(
        messageDetails.subject,
        messageDetails.body,
        messageDetails.subject.toLowerCase().startsWith('re:')
      );
      
      if (!classification.shouldReply) {
        console.log(`   ⊘ Filtered by classifier: ${classification.reason}`);
        this._markMessageAsProcessed(candidate);
        result.status = 'filtered';
        return result;
      }
      
      // ═══════════════════════════════════════════════════════════════
      // STEP 3: QUICK CHECK - Gemini decides if response needed
      // ═══════════════════════════════════════════════════════════════
      const quickCheck = this.geminiService.shouldRespondToEmail(
        messageDetails.body,
        messageDetails.subject
      );
      
      if (!quickCheck.shouldRespond) {
        console.log(`   ⊘ Gemini quick check: no response needed (${quickCheck.reason})`);
        this._markMessageAsProcessed(candidate);
        result.status = 'filtered';
        return result;
      }
      
      const detectedLanguage = quickCheck.language;
      console.log(`   🌍 Language: ${detectedLanguage.toUpperCase()}`);
      
      // ═══════════════════════════════════════════════════════════════
      // STEP 4: REQUEST TYPE CLASSIFICATION - Technical/Pastoral/Mixed
      // ═══════════════════════════════════════════════════════════════
      const requestType = this.requestClassifier.classify(
        messageDetails.subject,
        messageDetails.body,
        quickCheck.classification // ✅ Pass Hybrid Hint from Gemini
      );
      
      // ═══════════════════════════════════════════════════════════════
      // STEP 5: TERRITORY CHECK - If address found
      // ═══════════════════════════════════════════════════════════════
      const territoryResult = this.territoryValidator.analyzeEmailForAddress(
        messageDetails.body,
        messageDetails.subject
      );
      
      let enrichedKnowledgeBase = knowledgeBase;
      
      // 5.1: SPECIAL MASS RULE INJECTION (Prioritary)
      const specialMassRule = getSpecialMassTimeRule(new Date());
      if (specialMassRule) {
        console.log('   🚨 Special Mass Rule Injected into Prompt');
        enrichedKnowledgeBase = specialMassRule + '\n\n' + enrichedKnowledgeBase;
      }

      if (territoryResult.addressFound) {
        const v = territoryResult.verification;
        const sanitizedStreet = territoryResult.street.replace(/[═─]/g, '-');
        const territoryContext = `
════════════════════════════════════════════════════════════════════════
🎯 VERIFICA TERRITORIO AUTOMATICA (INFORMAZIONE VERIFICATA)
════════════════════════════════════════════════════════════════════════
Indirizzo: ${sanitizedStreet} n. ${territoryResult.civic}

Risultato: ${v.inParish ? '✅ RIENTRA' : '❌ NON RIENTRA'}

Dettaglio: ${v.reason}

⚠️ Usa ESATTAMENTE queste informazioni verificate programmaticamente.
════════════════════════════════════════════════════════════════════════
`;
        // FIX: Use enrichedKnowledgeBase to preserve previous enrichments (e.g., specialMassRule)
        enrichedKnowledgeBase = territoryContext + '\n\n' + enrichedKnowledgeBase;
      }
      
      // ═══════════════════════════════════════════════════════════════
      // STEP 5.5: CONDITIONAL KB ENRICHMENT (Based on Request Type Flags)
      // ═══════════════════════════════════════════════════════════════
      // Logica: per domande TECNICHE (orari, documenti) → solo Istruzioni
      //         per domande PASTORALI/DOTTRINALI → caricamento graduato
      
      const needsPastoralSupport = requestType.needsDiscernment || requestType.needsDoctrine;
      
      // AI_CORE_LITE: solo se c'è componente pastorale o dottrinale
      if (needsPastoralSupport && typeof GLOBAL_CACHE !== 'undefined' && GLOBAL_CACHE.aiCoreLite) {
        const liteSection = `
════════════════════════════════════════════════════════════════════════
📋 PRINCIPI PASTORALI FONDAMENTALI (AI_CORE_LITE)
════════════════════════════════════════════════════════════════════════
${GLOBAL_CACHE.aiCoreLite}
════════════════════════════════════════════════════════════════════════
`;
        enrichedKnowledgeBase = liteSection + '\n\n' + enrichedKnowledgeBase;
        console.log('   ✓ AI_CORE_LITE injected (pastoral/doctrinal question)');
      }
      
      // AI_CORE esteso: solo se needsDiscernment = true (accompagnamento personale)
      if (requestType.needsDiscernment && typeof GLOBAL_CACHE !== 'undefined' && GLOBAL_CACHE.aiCore) {
        const coreSection = `
════════════════════════════════════════════════════════════════════════
🧭 PRINCIPI PASTORALI ESTESI (AI_CORE) - Accompagnamento Personale
════════════════════════════════════════════════════════════════════════
${GLOBAL_CACHE.aiCore}
════════════════════════════════════════════════════════════════════════
`;
        enrichedKnowledgeBase = coreSection + '\n\n' + enrichedKnowledgeBase;
        console.log('   ✓ AI_CORE injected (needsDiscernment=true)');
      }
      
      // Dottrina: solo se needsDoctrine = true (spiegazione dottrinale esplicita)
      if (requestType.needsDoctrine && typeof GLOBAL_CACHE !== 'undefined' && GLOBAL_CACHE.doctrineBase) {
        const doctrineSection = `
════════════════════════════════════════════════════════════════════════
📖 BASE DOTTRINALE (Dottrina) - Spiegazione Dottrinale
════════════════════════════════════════════════════════════════════════
${GLOBAL_CACHE.doctrineBase}
════════════════════════════════════════════════════════════════════════
`;
        enrichedKnowledgeBase = doctrineSection + '\n\n' + enrichedKnowledgeBase;
        console.log('   ✓ Doctrine Base injected (needsDoctrine=true)');
      }
      
      // ═══════════════════════════════════════════════════════════════
      // STEP 6: BUILD CONVERSATION HISTORY
      // ═══════════════════════════════════════════════════════════════
      let conversationHistory = '';
      if (messages.length > 1) {
        // Escludi il messaggio candidato per evitare duplicazione nel prompt
        const candidateId = candidate.getId();
        const historyMessages = messages.filter(m => m.getId() !== candidateId);
        
        if (historyMessages.length > 0) {
          conversationHistory = this.gmailService.buildConversationHistory(
            historyMessages,
            10, // Max messaggi
            myEmail // La nostra email per marcare i nostri messaggi
          );
        }
      }
      
      // ═══════════════════════════════════════════════════════════════
      // STEP 6.5: GET MEMORY CONTEXT (avoid repetition)
      // ═══════════════════════════════════════════════════════════════
      // threadId già dichiarato alla linea 60
      const memoryContext = this.memoryService.getMemory(threadId);
      
      if (Object.keys(memoryContext).length > 0) {
        console.log(`   🧠 Memory found: lang=${memoryContext.language}, topics=${(memoryContext.providedInfo || []).length}`);
      }
      
      // ═══════════════════════════════════════════════════════════════
      // STEP 6.6: COMPUTE SALUTATION MODE
      // ═══════════════════════════════════════════════════════════════
      const salutationMode = computeSalutationMode({
        isReply: messageDetails.subject.toLowerCase().startsWith('re:'),
        messageCount: memoryContext.messageCount || messages.length,
        memoryExists: Object.keys(memoryContext).length > 0,
        lastUpdated: memoryContext.lastUpdated || null,
        now: new Date()
      });
      console.log(`   📝 Salutation mode: ${salutationMode}`);
      
      // ═══════════════════════════════════════════════════════════════
      // STEP 7: BUILD PROMPT
      // ═══════════════════════════════════════════════════════════════
      let { greeting, closing } = this.geminiService.getAdaptiveGreeting(
        messageDetails.senderName,
        detectedLanguage
      );
      
      // 🔴 OVERRIDE STRUTTURALE: nessun saluto rituale in conversazioni attive
      if (salutationMode === 'none_or_continuity') {
        greeting = '';
      } else if (salutationMode === 'soft') {
        // Soft mode: frase di riaggancio cortese dopo pausa
        greeting = '[Inizia con una breve frase di riaggancio cordiale, es: "Riprendiamo la nostra conversazione..." o "Grazie per essere tornato/a..."]';
      }
      
      // STEP 7: BUILD PROMPT CONTEXT
const promptContext = createPromptContext({
  email: {
    subject: messageDetails.subject,
    body: messageDetails.body,
    isReply: messageDetails.subject.toLowerCase().startsWith('re:'),
    detectedLanguage: detectedLanguage
  },

  classification: {
    category: classification.category,
    subIntents: classification.subIntents || {},
    confidence: classification.confidence || 0.8
  },

  requestType: requestType,

  memory: {
    exists: Object.keys(memoryContext).length > 0,
    providedInfoCount: (memoryContext.providedInfo || []).length
  },

  conversation: {
    messageCount: memoryContext.messageCount || messages.length
  },

  territory: {
    addressFound: territoryResult.addressFound
  },

  knowledgeBase: {
    length: enrichedKnowledgeBase.length,
    containsDates: /\d{4}/.test(enrichedKnowledgeBase)
  },

  temporal: {
    mentionsDates: /\b(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre|\d{1,2}\/\d{1,2})\b/i.test(messageDetails.body),
    mentionsTimes: /\d{1,2}[:.]\d{2}/.test(messageDetails.body)
  },

  // 🧠 Modalità saluto per continuità conversazionale
  salutationMode: salutationMode
});
console.log('🧠 PromptContext:', JSON.stringify(promptContext.meta));

// 🎯 Passa profilo e concern per filtering dinamico template
const promptOptions = {
        emailContent: messageDetails.body,
        emailSubject: messageDetails.subject,
        knowledgeBase: enrichedKnowledgeBase, // Use enrichedKnowledgeBase
        senderName: messageDetails.senderName, // Use messageDetails.senderName
        senderEmail: messageDetails.senderEmail, // Use messageDetails.senderEmail
        conversationHistory: conversationHistory,
        category: classification.category, // Use classification.category
        topic: quickCheck.classification ? quickCheck.classification.topic : '', // ✅ Pass Topic
        detectedLanguage: detectedLanguage,
        currentSeason: this._getCurrentSeason(),
        currentDate: new Date().toISOString().split('T')[0],
        salutation: greeting, // Use greeting
        closing: closing, // Use closing
        subIntents: classification.subIntents || {}, // Use classification.subIntents
        memoryContext: memoryContext, // Use memoryContext
        promptProfile: promptContext.profile, // Use promptContext.profile
        activeConcerns: promptContext.concerns, // Use promptContext.concerns
        salutationMode: salutationMode
      };
const prompt = this.promptEngine.buildPrompt(promptOptions);
      
      // Aggiungi hint tipo richiesta
      const typeHint = this.requestClassifier.getRequestTypeHint(requestType.type);
      const fullPrompt = typeHint + '\n\n' + prompt;
      
      // ═══════════════════════════════════════════════════════════════
      // STEP 8: GENERATE RESPONSE
      // ═══════════════════════════════════════════════════════════════
      const response = this.geminiService.generateResponse(fullPrompt);
      
      if (!response) {
        console.error('   ❌ Failed to generate response');
        this._addErrorLabel(thread);
        this._markMessageAsProcessed(candidate); // Prevent infinite reprocessing
        result.status = 'error';
        result.error = 'Generation failed';
        return result;
      }
      
      // Controlla marcatore NO_REPLY (solo corrispondenza esatta per evitare falsi positivi)
      if (response.trim() === 'NO_REPLY') {
        console.log('   ⊘ AI returned NO_REPLY');
        this._markMessageAsProcessed(candidate);
        result.status = 'filtered';
        return result;
      }
      
      // ═══════════════════════════════════════════════════════════════
      // STEP 9: VALIDATE RESPONSE
      // ═══════════════════════════════════════════════════════════════
      if (this.config.validationEnabled) {
        const validation = this.validator.validateResponse(
          response,
          detectedLanguage,
          enrichedKnowledgeBase,
          messageDetails.body,
          messageDetails.subject,
          salutationMode  // Per controllo firma contestuale (opzionale in follow-up)
        );
        
        if (!validation.isValid) {
          console.warn(`   ❌ Validation FAILED (score: ${validation.score.toFixed(2)})`);
          this._addValidationErrorLabel(thread);
          this._markMessageAsProcessed(candidate); // Prevent infinite reprocessing
          result.status = 'validation_failed';
          result.validationFailed = true;
          return result;
        }
        
        // ✅ Se ci sono WARNING (ma validazione passata), aggiungi etichetta "verifica"
        if (validation.warnings && validation.warnings.length > 0) {
          console.log(`   ⚠️ Validation PASSED with ${validation.warnings.length} warning(s) - adding 'verifica' label`);
          this.gmailService.addLabelToThread(thread, 'verifica');
        }
        
        console.log(`   ✓ Validation PASSED (score: ${validation.score.toFixed(2)})`);
      }
      
      // ═══════════════════════════════════════════════════════════════
      // STEP 10: SEND REPLY
      // ═══════════════════════════════════════════════════════════════
      if (this.config.dryRun) {
        console.log('   🔴 DRY RUN - Not sending reply');
        console.log(`   📝 Would send: ${response.substring(0, 100)}...`);
        result.dryRun = true;
      } else {
        // ✅ FIX: Use 'candidate' (Message) instead of 'thread' to force correct In-Reply-To header
        this.gmailService.sendHtmlReply(candidate, response, messageDetails);
      }
      
      // ═══════════════════════════════════════════════════════════════
      // STEP 11: UPDATE MEMORY (for next interaction)
      // ═══════════════════════════════════════════════════════════════
      // Rileva topic forniti dalla risposta
      const providedTopics = this._detectProvidedTopics(response);
      
      // ✅ Operazione atomica: aggiorna memoria e topic in un singolo lock
      this.memoryService.updateMemoryAtomic(threadId, {
        language: detectedLanguage,
        category: classification.category || requestType.type
      }, providedTopics.length > 0 ? providedTopics : null);
      
      if (candidate) {
        this._markMessageAsProcessed(candidate);
      }
      result.status = 'replied';
      return result;
      
    } catch (error) {
      console.error(`   ❌ Error processing thread: ${error.message}`);
      this._addErrorLabel(thread);
      if (candidate) {
        this._markMessageAsProcessed(candidate); // Prevent infinite reprocessing loop
      }
      result.status = 'error';
      result.error = error.message;
      return result;
    } finally {
      // Rilascia lock solo se acquisito (skipLock=false)
      // FIX BUG-1: Null-safe check to prevent error when skipLock=true
      if (lock) {
        try {
          lock.releaseLock();
        } catch (e) {
          console.warn('⚠️ Failed to release lock:', e.message);
        }
      }
    }
  }
  
  /**
   * Processa tutte le email non lette
   * ✅ OTTIMIZZATO: chiamata API etichette solo se ci sono email non lette
   */
  processUnreadEmails(knowledgeBase, doctrineBase = '') {
    console.log('\n' + '='.repeat(70));
    console.log('📬 Starting email processing...');
    console.log('='.repeat(70));
    
    if (this.config.dryRun) {
      console.warn('🔴 DRY_RUN MODE ACTIVE - Emails will NOT be sent!');
    }
    
    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Cerca thread non letti (SENZA chiamata API avanzata)
    // ═══════════════════════════════════════════════════════════════
    const threads = GmailApp.search(
      'in:inbox is:unread -from:me',
      0,
      this.config.maxEmailsPerRun
    );
    
    // Se non ci sono email non lette, esci subito (NESSUNA chiamata API)
    if (threads.length === 0) {
      console.log('Nessuna email da processare.');
      return { total: 0, replied: 0, filtered: 0, errors: 0 };
    }
    
    console.log(`📬 Trovate ${threads.length} email da elaborare`);
    
    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Solo ora, fai UNA SOLA chiamata API per le etichette
    // ═══════════════════════════════════════════════════════════════
    const labeledMessageIds = this.gmailService.getMessageIdsWithLabel(this.config.labelName);
    console.log(`📦 Found ${labeledMessageIds.size} messages with label '${this.config.labelName}'`);
    
    // Statistiche
    const stats = {
      total: 0,
      replied: 0,
      filtered: 0,
      validationFailed: 0,
      errors: 0,
      dryRun: 0,
      skipped: 0
    };
    
    // Processa ogni thread, passando il Set già caricato
    threads.forEach((thread, index) => {
      console.log(`\n--- Thread ${index + 1}/${threads.length} ---`);
      
      const threadId = thread.getId();
      // FIX Bug #15: Lock per prevenire race conditions tra trigger paralleli
      // NOTA BUG-2: LockService.getScriptLock() è globale (by design in GAS). 
      // Questo previene due trigger paralleli dal processare qualsiasi thread simultaneamente.
      // Per un sistema con volumi più alti, considerare lock document-based (Sheet row lock).
          // FIX BUG-2: Implementazione Lock Document-Based (o Thread-Based via Cache)
          // LockService.getScriptLock() blocca TUTTO lo script. Usiamo CacheService per lockare
          // SOLO questo specifico threadId, permettendo esecuzione parallela su altri thread.
          const threadLockKey = `lock_thread_${threadId}`;
          const cache = CacheService.getScriptCache();
          
          // Tenta di acquisire "lock virtuale" su questo thread
          if (cache.get(threadLockKey)) {
             console.warn(`🔒 Thread ${threadId} is locked by another trigger (cache), skipping.`);
             stats.skipped++;
             return;
          }
          
          // Imposta lock per 5 minuti (durata max esecuzione)
          try {
            cache.put(threadLockKey, 'LOCKED', 300); 
            lockAcquired = true;
            
            // Per sicurezza, mantengo anche un breve tryLock globale per operazioni atomiche critiche interne,
            // ma rilasciandolo subito se non necessario, oppure affidandoci solo al CacheLock per la concorrenza macro.
            // Qui ci fidiamo del CacheLock per evitare sovrapposizioni macroscopiche.

            // Processa il thread (con lock mantenuto dal ciclo esterno)
            // Passiamo skipLock=true perché il lock è gestito qui
            const result = this.processThread(thread, knowledgeBase, doctrineBase, labeledMessageIds, true);
            stats.total++;
            
            if (result.validationFailed) {
              stats.validationFailed++;
            } else if (result.status === 'replied') {
              stats.replied++;
              if (result.dryRun) stats.dryRun++;
            } else if (result.status === 'skipped') {
              stats.skipped++;
            } else if (result.status === 'filtered') {
              stats.filtered++;
            } else if (result.status === 'error') {
              stats.errors++;
            }
          } finally {
            // Rilascia lock specifico
            if (lockAcquired) {
              cache.remove(threadLockKey);
            }
          }
    });
    
    // Stampa riepilogo
    console.log('\n' + '='.repeat(70));
    console.log('📊 RIEPILOGO ELABORAZIONE');
    console.log('='.repeat(70));
    console.log(`   Totale processate: ${stats.total}`);
    console.log(`   ✓ Risposte inviate: ${stats.replied}`);
    if (stats.dryRun > 0) console.warn(`   🔴 DRY RUN: ${stats.dryRun}`);
    if (stats.skipped > 0) console.log(`   ⊘ Skipped (self-sent): ${stats.skipped}`);
    console.log(`   ⊘ Filtrate: ${stats.filtered}`);
    if (stats.validationFailed > 0) console.warn(`   ❌ Validazione fallita: ${stats.validationFailed}`);
    if (stats.errors > 0) console.error(`   ❌ Errori: ${stats.errors}`);
    console.log('='.repeat(70));
    
    return stats;
  }
  
  // ========================================================================
  // METODI HELPER
  // ========================================================================
  
  _shouldIgnoreEmail(messageDetails) {
    // Ottieni liste ignore da CONFIG o GLOBAL_CACHE con fallback sicuri
    let ignoreDomains = [];
    let ignoreKeywords = [];
    
    if (typeof GLOBAL_CACHE !== 'undefined' && GLOBAL_CACHE.ignoreDomains) {
      ignoreDomains = GLOBAL_CACHE.ignoreDomains;
    } else if (typeof CONFIG !== 'undefined' && CONFIG.IGNORE_DOMAINS) {
      ignoreDomains = CONFIG.IGNORE_DOMAINS;
    }
    
    if (typeof GLOBAL_CACHE !== 'undefined' && GLOBAL_CACHE.ignoreKeywords) {
      ignoreKeywords = GLOBAL_CACHE.ignoreKeywords;
    } else if (typeof CONFIG !== 'undefined' && CONFIG.IGNORE_KEYWORDS) {
      ignoreKeywords = CONFIG.IGNORE_KEYWORDS;
    }
    
    const email = messageDetails.senderEmail.toLowerCase();
    const subject = messageDetails.subject.toLowerCase();
    const body = messageDetails.body.toLowerCase();
    
    // Controlla domini
    for (const domain of ignoreDomains) {
      if (email.includes(domain.toLowerCase())) {
        console.log(`   Domain ignored: ${domain}`);
        return true;
      }
    }
    
    // Controlla parole chiave
    for (const keyword of ignoreKeywords) {
      if (subject.includes(keyword.toLowerCase()) || body.includes(keyword.toLowerCase())) {
        console.log(`   Keyword ignored: ${keyword}`);
        return true;
      }
    }
    
    return false;
  }
  
  _getCurrentSeason() {
    const month = new Date().getMonth() + 1; // 1-12
    // Estivo: Giugno-Settembre, altrimenti Invernale
    return (month >= 6 && month <= 9) ? 'estivo' : 'invernale';
  }
  
  /**
   * Marca un messaggio specifico come processato
   * ✅ Usa etichettatura a livello messaggio per permettere follow-up
   */
  _markMessageAsProcessed(message) {
    // NON segnare come letto - la segreteria vuole vederle!
    this.gmailService.addLabelToMessage(message.getId(), this.config.labelName);
  }
  
  _addErrorLabel(thread) {
    this.gmailService.addLabelToThread(thread, this.config.errorLabelName);
  }
  
  _addValidationErrorLabel(thread) {
    this.gmailService.addLabelToThread(thread, this.config.validationErrorLabel);
  }
  
  /**
   * Rileva topic forniti nella risposta (per anti-ripetizione memoria)
   */
  _detectProvidedTopics(response) {
    const topics = [];
    const lower = response.toLowerCase();
    
    // Pattern topic
    const patterns = {
      'orari_messe': /messe?\b.*\d{1,2}[:.]\d{2}|orari\w*\s+messe/i,
      'contatti': /telefono|email|@|segreteria/i,
      'battesimo_info': /battesimo.*documento|documento.*battesimo/i,
      'comunione_info': /comunione.*catechismo|catechismo.*comunione/i,
      'cresima_info': /cresima.*percorso|percorso.*cresima/i,
      'matrimonio_info': /matrimonio.*corso|corso.*matrimonio/i,
      'territorio': /rientra|non rientra|parrocchia.*competenza/i,
      'indirizzo': /(?:via|viale|corso|piazza|largo|circonvallazione)\s+[a-zA-ZàèéìòùÀÈÉÌÒÙ']+(?:\s+[a-zA-ZàèéìòùÀÈÉÌÒÙ']+)*\s*,?\s*\d+/i
    };
    
    for (const [topic, pattern] of Object.entries(patterns)) {
      if (pattern.test(lower)) {
        topics.push(topic);
      }
    }
    
    return topics;
  }
}

// ====================================================================
// CALCOLATORE MODALITÀ SALUTO
// Determina la modalità saluto in base allo stato conversazione
// ====================================================================

/**
 * Calcola modalità saluto basata su segnali strutturali
 * @param {Object} params - Parametri di input
 * @param {boolean} params.isReply - È una risposta?
 * @param {number} params.messageCount - Numero di messaggi nel thread
 * @param {boolean} params.memoryExists - Esiste memoria per questo thread?
 * @param {string|null} params.lastUpdated - Timestamp ISO ultimo aggiornamento memoria
 * @param {Date} params.now - Data corrente
 * @returns {'full'|'soft'|'none_or_continuity'}
 */
function computeSalutationMode({ isReply, messageCount, memoryExists, lastUpdated, now = new Date() }) {
  // 1️⃣ Primo messaggio assoluto
  if (!isReply && !memoryExists && messageCount <= 1) {
    return 'full';
  }

  // 2️⃣ Conversazione attiva (reply o thread già avviato)
  if (isReply || messageCount > 1 || memoryExists) {
    // Se non sappiamo quando è stata l'ultima interazione → continuità
    if (!lastUpdated) {
      return 'none_or_continuity';
    }

    const parsedLastUpdated = new Date(lastUpdated);
    const hoursSinceLast = (now.getTime() - parsedLastUpdated.getTime()) / (1000 * 60 * 60);

    // FIX Bug #6: Se timestamp invalido (NaN), tratta come NUOVO contatto (full greeting)
    // Dato corrotto non deve impedire saluto completo
    if (isNaN(hoursSinceLast)) {
      console.warn('⚠️ computeSalutationMode: Invalid lastUpdated timestamp, defaulting to FULL greeting');
      return 'full';
    }

    // 2a️⃣ Follow-up ravvicinato (entro 48h)
    if (hoursSinceLast <= 48) {
      return 'none_or_continuity';
    }

    // 2b️⃣ Conversazione ripresa dopo pausa (48h - 4 giorni)
    if (hoursSinceLast <= 96) {
      return 'soft';
    }

    // 2c️⃣ Troppo tempo passato (> 4 giorni) → tratta come nuovo contatto
    return 'full';
  }

  // Fallback di sicurezza
  return 'full';
}

// Funzione factory
function createEmailProcessor(options) {
  return new EmailProcessor(options);
}

// ====================================================================
// ENTRY POINT PRINCIPALE - Per trigger script
// ====================================================================

function processUnreadEmailsMain() {
  try {
    // Controlla orario sospensione
    if (typeof isInSuspensionTime === 'function' && isInSuspensionTime()) {
      console.log('Servizio sospeso per orario di lavoro.');
      return;
    }
    
    // Carica risorse
    if (typeof loadResources === 'function') {
      loadResources();
    }
    
    // Ottieni knowledge base
    const knowledgeBase = typeof GLOBAL_CACHE !== 'undefined' ? 
                          GLOBAL_CACHE.knowledgeBase || '' : '';
    const doctrineBase = typeof GLOBAL_CACHE !== 'undefined' ? 
                         GLOBAL_CACHE.doctrineBase || '' : '';
    
    // Crea processore ed esegui
    const processor = new EmailProcessor();
    processor.processUnreadEmails(knowledgeBase, doctrineBase);
    
  } catch (error) {
    console.error(`❌ Errore nel processo principale: ${error.message}`);
  }
}
