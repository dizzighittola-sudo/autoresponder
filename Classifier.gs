// ====================================================================
// CLASSIFIER - Classificazione email semplificata
// ✅ Filtra SOLO acknowledgment ultra-semplici (≤3 parole)
// ✅ Filtra SOLO greeting standalone 
// ✅ Tutto il resto → Gemini decide
// ====================================================================

/**
 * EmailClassifier - Classificatore email
 * 
 * FILOSOFIA:
 * - Filtra SOLO acknowledgment ultra-semplici (≤3 parole)
 * - Filtra SOLO saluti standalone
 * - TUTTO IL RESTO va a Gemini per analisi intelligente
 * - Zero falsi negativi: in caso di dubbio, Gemini decide
 * 
 * ✅ Rilevamento sub-intent per sfumature emotive
 */
class EmailClassifier {
  constructor() {
    console.log('🧠 Inizializzazione EmailClassifier...');
    
    // Pattern saluto-solo (saluti standalone senza contenuto)
    this.greetingOnlyPatterns = [
      /^(buongiorno|buonasera|salve|ciao)\.?\s*$/i,
      /^cordiali\s+saluti\.?\s*$/i,
      /^distinti\s+saluti\.?\s*$/i
    ];

    // Categorie per suggerimenti a Gemini
    this.categories = {
      'appointment': [
        'appuntamento', 'fissare', 'prenotare', 'quando posso',
        'disponibilità', 'orario', 'incontro', 'prenotazione',
        'appointment', 'schedule', 'book', 'booking', 'availability'
      ],
      'information': [
        'informazioni', 'chiedere', 'sapere', 'vorrei sapere',
        'come faccio', 'dove', 'cosa serve', 'requisiti',
        'information', 'ask', 'know', 'how to', 'where', 'requirements'
      ],
      'sacrament': [
        'battesimo', 'comunione', 'cresima', 'matrimonio',
        'sacramento', 'confessione', 'prima comunione',
        'baptism', 'communion', 'confirmation', 'marriage', 'sacrament'
      ],
      'collaboration': [
        'collaborare', 'volontario', 'aiutare', 'proposta',
        'progetto', 'iniziativa', 'gruppo', 'offrire',
        'collaborate', 'volunteer', 'help', 'proposal', 'project'
      ],
      'complaint': [
        'lamentela', 'problema', 'disservizio', 'insoddisfatto',
        'reclamo', 'complaint', 'problem', 'issue', 'dissatisfied'
      ],
      'quotation': [
        'preventivo', 'offerta', 'quotazione', 'proposta commerciale',
        'prezzo', 'tariffa', 'costo', 'listino', 'budget',
        'orçamento', 'cotação', 'proposta', 'preço',
        'quote', 'quotation', 'pricing', 'offer', 'estimate', 'price list'
      ]
    };
    
    // Parole chiave sub-intent per sfumature emotive
    this.subIntentKeywords = {
      'emotional_distress': [
        'deluso', 'delusa', 'delusione', 'arrabbiato', 'arrabbiata',
        'insoddisfatto', 'insoddisfatta', 'frustrato', 'frustrata',
        'scandalizzato', 'indignato', 'amareggiato', 'dispiaciuto',
        'non va bene', 'inaccettabile', 'vergogna', 'pessimo',
        'disappointed', 'angry', 'frustrated', 'upset', 'unacceptable'
      ],
      'gratitude': [
        'ringrazio', 'grato', 'grata', 'riconoscente',
        'gentilissimo', 'gentilissima', 'prezioso aiuto',
        'grateful', 'thankful', 'appreciate'
      ],
      'bereavement': [
        'lutto', 'defunto', 'defunta', 'morto', 'morta', 'decesso',
        'scomparso', 'scomparsa', 'funerale', 'esequie',
        'deceased', 'passed away', 'funeral', 'bereavement'
      ],
      'confusion': [
        'non capisco', 'confuso', 'confusa', 'non mi è chiaro',
        'potrebbe spiegare', 'non ho capito',
        'confused', 'unclear', "don't understand"
      ]
    };
    
    console.log('✓ EmailClassifier inizializzato');
    console.log(`   Filosofia: Filtra solo casi ovvi, delega il resto a Gemini`);
  }
  
  /**
   * Classifica email - filtro minimale
   */
  classifyEmail(subject, body, isReply = false) {
    console.log(`   🔍 Classifying: '${subject.substring(0, 50)}...'`);
    
    // Estrai contenuto principale
    const mainContent = this._extractMainContent(body);
    console.log(`      Main content: ${mainContent.length} chars`);

    // ✅ FIX Bug #4: Body vuoto + subject generico (es. "Re: Orari messe") → passa a Gemini
    // Se il body è vuoto (o quasi) E siamo in una reply:
    if ((!mainContent || !mainContent.trim()) && isReply) {
      const subjectClean = subject.replace(/^re:\s*/i, '').trim();
      // Se il subject è conciso (< 50 chars) ma non brevissimo (< 3 chars), probabilmente è la domanda stessa
      if (subjectClean.length > 3 && subjectClean.length < 50) {
        console.log('      ✓ Empty body but generic reasonable subject -> Passing to Gemini');
        return {
          shouldReply: true,
          reason: 'empty_body_generic_subject',
          category: null,
          subIntents: {},
          confidence: 0.8
        };
      }
    }

    // Se il body è vuoto e NON soddisfa criterio sopra, usa subject per filtri rapidi
    const contentForQuickChecks = this._isTrivialReplyBody(mainContent) ? subject : mainContent;
    
    // FILTRO 1: Acknowledgment ultra-semplice
    if (this._isUltraSimpleAcknowledgment(contentForQuickChecks)) {
      console.log('      ✗ Ultra-simple acknowledgment (≤3 words, no question)');
      return {
        shouldReply: false,
        reason: 'ultra_simple_acknowledgment',
        category: null,
        subIntents: {},
        confidence: 1.0
      };
    }
    
    // FILTRO 2: Solo saluto
    if (this._isGreetingOnly(contentForQuickChecks)) {
      console.log('      ✗ Greeting only (standalone)');
      return {
        shouldReply: false,
        reason: 'greeting_only',
        category: null,
        subIntents: {},
        confidence: 0.95
      };
    }
    
    // TUTTO IL RESTO: Passa a Gemini
    const fullText = `${subject} ${mainContent}`;
    const category = this._categorizeContent(fullText);
    const subIntents = this._detectSubIntents(fullText);
    
    console.log('      ✓ Passing to Gemini for intelligent analysis');
    if (category) {
      console.log(`      → Category hint: ${category}`);
    }
    if (Object.keys(subIntents).length > 0) {
      console.log(`      → Sub-intents: ${Object.keys(subIntents).join(', ')}`);
    }
    
    return {
      shouldReply: true,
      reason: 'needs_ai_analysis',
      category: category,
      subIntents: subIntents,
      confidence: category ? 0.85 : 0.75
    };
  }
  
  // ========================================================================
  // METODI HELPER
  // ========================================================================
  
  /**
    * Estrae contenuto principale, rimuovendo citazioni e firme
    * ✅ BUG-4 FIX: Enhanced to handle HTML blockquotes and various email client formats
    */
   _extractMainContent(body) {
     // ✅ BUG-4 FIX: Pre-process - strip HTML blockquotes before text processing
     let processedBody = body;
     
     // Remove <blockquote> tags and their content (common in HTML emails)
     processedBody = processedBody.replace(/<blockquote[^>]*>[\s\S]*?<\/blockquote>/gi, '');
     
     // Remove div.gmail_quote and similar (Gmail-specific)
     processedBody = processedBody.replace(/<div\s+class=["']gmail_quote["'][^>]*>[\s\S]*?<\/div>/gi, '');
     
     // Remove outlook-style quotes
     processedBody = processedBody.replace(/<div\s+id=["']?divRplyFwdMsg["']?[^>]*>[\s\S]*?$/gi, '');
     
     // ✅ BUG-4 FIX: Enhanced quote markers for various email clients
     const quoteMarkers = [
       /^>.*$/m,                                      // Standard > prefix
       /^On .* wrote:.*$/m,                          // English Gmail/Outlook
       /^Il giorno .* ha scritto:.*$/m,              // Italian Gmail
       /^Il .* alle .* .* ha scritto:.*$/m,          // Italian Apple Mail
       /^Da:.*$/m,                                   // Italian forward header
       /^From:.*Sent:.*$/m,                          // Outlook forward
       /^-{3,}.*Original Message.*$/m,               // Outlook separator
       /^-{3,}.*Messaggio originale.*$/m,            // Italian Outlook separator
       /^_{3,}$/m,                                   // Thunderbird separator
       /^Begin forwarded message:.*$/m,              // Apple Mail forward
       /^Inizio messaggio inoltrato:.*$/m,           // Italian Apple Mail forward
       /^-------- Forwarded Message --------$/m,    // Thunderbird forward
       /^\*From:\*.*$/m,                             // Bold markdown-style quote
       /^Le .* à .* .* a écrit.*$/m                 // French Gmail
     ];
     
     const lines = processedBody.split('\n');
     const cleanLines = [];
     
     for (const line of lines) {
       const stripped = line.trim();
       
       // Mantieni righe vuote per separazione paragrafi
       if (stripped === '') {
         cleanLines.push(line);
         continue;
       }
       
       // Salta saluti standalone all'inizio
       if (/^(salve|buongiorno|buonasera|ciao)[\s,!.]*$/i.test(stripped)) {
         continue;
       }
       
       // Ferma ai marcatori di citazione
       let isQuote = false;
       for (const marker of quoteMarkers) {
         if (marker.test(stripped)) {
           isQuote = true;
           break;
         }
       }
       if (isQuote) break;
       
       cleanLines.push(line);
     }
     
     let content = cleanLines.join('\n').trim();
     
     // Rimuovi firme
     const signatureMarkers = [
       /cordiali saluti/i,
       /distinti saluti/i,
       /in fede/i,
       /best regards/i,
       /sincerely/i,
       /sent from my iphone/i,
       /inviato da/i
     ];
     
     for (const marker of signatureMarkers) {
       const match = content.search(marker);
       if (match !== -1) {
         content = content.substring(0, match).trim();
         break;
       }
     }
     
     return content;
   }


  /**
   * Controlla se acknowledgment ultra-semplice (≤3 parole, nessuna domanda)
   */
  _isUltraSimpleAcknowledgment(text) {
    if (!text || text.trim().length === 0) return false;
    
    // Normalizza
    let normalized = text.toLowerCase().trim();
    normalized = normalized.replace(/[^\w\sàèéìòù?!]/g, '');
    normalized = normalized.replace(/\s+/g, ' ');
    
    // Se contiene punto interrogativo, NON è un semplice ack
    if (text.includes('?')) return false;
    
    // Conta parole
    const wordCount = normalized.split(' ').filter(w => w.length > 0).length;
    
    // STRICT: max 3 parole
    if (wordCount > 3) return false;
    
    // Deve contenere parola di ringraziamento/ricevuto
    const thankWords = ['grazie', 'ringrazio', 'ricevuto', 'ok', 'perfetto'];
    const hasThanks = thankWords.some(word => normalized.includes(word));
    
    return hasThanks && wordCount <= 3;
  }
  
  /**
   * Verifica se solo saluto
   */
  _isGreetingOnly(text) {
    let normalized = text.toLowerCase().trim();
    normalized = normalized.replace(/[^\w\sàèéìòù]/g, '');

    if (this.greetingOnlyPatterns.some(pattern => pattern.test(normalized))) {
      return true;
    }

    // Permette saluti con titolo/nome breve (es. "Buongiorno don")
    const words = normalized.split(/\s+/).filter(Boolean);
    const greetingWord = words[0];
    const greetingSet = new Set(['buongiorno', 'buonasera', 'salve', 'ciao']);

    return greetingSet.has(greetingWord) && words.length <= 3;
  }

  /**
   * Rileva body banale (vuoto o solo "Re:")
   */
  _isTrivialReplyBody(text) {
    if (!text) return true;
    const normalized = text.toLowerCase().trim();
    const cleaned = normalized.replace(/[^\w\sàèéìòù:]/g, '');
    const words = cleaned.split(/\s+/).filter(Boolean);

    if (words.length === 0) return true;
    if (words[0] === 're' || words[0] === 're:') {
      return words.length <= 3;
    }

    return false;
  }
  
  /**
   * Categorizza contenuto (suggerimento per Gemini)
   */
  _categorizeContent(text) {
    const textLower = text.toLowerCase();
    const categoryScores = {};
    
    for (const category in this.categories) {
      const keywords = this.categories[category];
      const score = keywords.filter(kw => textLower.includes(kw)).length;
      if (score > 0) {
        categoryScores[category] = score;
      }
    }
    
    if (Object.keys(categoryScores).length === 0) return null;
    
    // Ritorna categoria con punteggio più alto
    let maxCategory = null;
    let maxScore = 0;
    for (const cat in categoryScores) {
      if (categoryScores[cat] > maxScore) {
        maxScore = categoryScores[cat];
        maxCategory = cat;
      }
    }
    return maxCategory;
  }
  
  /**
   * Rileva sub-intent emotivi
   */
  _detectSubIntents(text) {
    const textLower = text.toLowerCase();
    const detected = {};
    
    for (const intentName in this.subIntentKeywords) {
      const keywords = this.subIntentKeywords[intentName];
      for (const keyword of keywords) {
        if (textLower.includes(keyword)) {
          detected[intentName] = true;
          break;
        }
      }
    }
    
    return detected;
  }
  
  /**
   * Ottieni statistiche classificatore
   */
  getStats() {
    return {
      categories: Object.keys(this.categories).length,
      subIntents: Object.keys(this.subIntentKeywords).length,
      greetingPatterns: this.greetingOnlyPatterns.length,
      philosophy: 'minimal_filtering_gemini_decides'
    };
  }
}

// Funzione factory
function createEmailClassifier() {
  return new EmailClassifier();
}
