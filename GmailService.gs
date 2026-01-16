// ====================================================================
// GMAIL SERVICE - Gestione operazioni Gmail
// ✅ Supporto header Reply-To
// ✅ Label cache per evitare chiamate ripetute
// ✅ Costruttore cronologia conversazione
// ====================================================================

/**
 * GmailService - Servizio gestione Gmail
 * 
 * FUNZIONALITÀ PRINCIPALI:
 * ✅ Label cache per performance
 * ✅ Supporto header Reply-To per form web
 * ✅ Costruttore cronologia conversazione
 * ✅ Rimozione citazioni/firme
 */
class GmailService {
  constructor() {
    console.log('📧 Inizializzazione GmailService...');
    
    // Cache etichette per evitare chiamate API ripetute con TTL
    this._labelCache = new Map(); // Map<labelName, {label: GmailLabel, ts: number}>
    // IMHO-2: 1 hour reduces API calls without risk of stale data (labels change rarely)
    this._cacheTTL = (typeof CONFIG !== 'undefined' && CONFIG.GMAIL_LABEL_CACHE_TTL) ? CONFIG.GMAIL_LABEL_CACHE_TTL : 3600000;


    console.log('✓ GmailService inizializzato con cache etichette (TTL 1h)');
  }
  
  // ========================================================================
  // GESTIONE ETICHETTE (con cache)
  // ========================================================================
  
  /**
   * Ottiene o crea un'etichetta Gmail con caching
   */
  getOrCreateLabel(labelName) {
    // Verifica prima la cache con validazione TTL
    const cachedEntry = this._labelCache.get(labelName);
    const now = Date.now();
    if (cachedEntry && (now - cachedEntry.ts) < this._cacheTTL) {
      console.log(`📦 Label '${labelName}' found in cache`);
      return cachedEntry.label;
    } else if (cachedEntry) {
      // Voce scaduta, rimuovi
      this._labelCache.delete(labelName);
    }

    // Verifica se l'etichetta esiste in Gmail
    const labels = GmailApp.getUserLabels();
    for (const label of labels) {
      if (label.getName() === labelName) {
        // Memorizza in cache con timestamp e ritorna
        this._labelCache.set(labelName, { label: label, ts: now });
        console.log(`✓ Label '${labelName}' found`);
        return label;
      }
    }

    // Crea nuova etichetta
    const newLabel = GmailApp.createLabel(labelName);
    this._labelCache.set(labelName, { label: newLabel, ts: now });
    console.log(`✓ Created new label: ${labelName}`);
    return newLabel;
  }
  
  /**
   * Svuota la cache delle etichette
   */
  clearLabelCache() {
    this._labelCache.clear();
    console.log('🗑️ Label cache cleared');
  }
  
  /**
   * Aggiunge etichetta a un thread
   */
  addLabelToThread(thread, labelName) {
    const label = this.getOrCreateLabel(labelName);
    thread.addLabel(label);
    console.log(`✓ Added label '${labelName}' to thread`);
  }

  /**
   * Aggiunge etichetta a un messaggio specifico (Gmail API avanzata)
   * ✅ Permette di etichettare SOLO il messaggio, non l'intero thread
   * ✅ Richiede "Gmail API" abilitata nei Servizi Avanzati
   */
  addLabelToMessage(messageId, labelName) {
    const label = this.getOrCreateLabel(labelName);
    const labelId = label.getId();
    try {
      Gmail.Users.Messages.modify({
        addLabelIds: [labelId],
        removeLabelIds: []
      }, 'me', messageId);
      console.log(`✓ Added label '${labelName}' to message ${messageId}`);
    } catch (e) {
      console.warn(`⚠️ addLabelToMessage failed for message ${messageId} (Label: ${labelName}): ${e.message}`);
      // Fallback: try labeling the thread if message-level fails?
      // Optional: this.addLabelToThread(GmailApp.getMessageById(messageId).getThread(), labelName);
    }
  }

  /**
   * Ottiene gli ID di tutti i messaggi con una specifica etichetta (Gmail API avanzata)
   * ✅ OTTIMIZZATO: Una sola chiamata API invece di N chiamate
   * @param {string} labelName - Nome dell'etichetta da cercare
   * @returns {Set<string>} - Set di message IDs che hanno l'etichetta
   */
  getMessageIdsWithLabel(labelName) {
    try {
      const label = this.getOrCreateLabel(labelName);
      const labelId = label.getId();
      
      const messageIds = new Set();
      let pageToken;
      
      // Recupera tutte le pagine per evitare risultati parziali
      do {
        const response = Gmail.Users.Messages.list('me', {
          labelIds: [labelId],
          maxResults: 500,
          pageToken: pageToken
        });
        
        if (response.messages) {
          response.messages.forEach(m => messageIds.add(m.id));
        }
        
        pageToken = response.nextPageToken;
      } while (pageToken);
      
      console.log(`📦 Found ${messageIds.size} messages with label '${labelName}'`);
      return messageIds;
    } catch (e) {
      console.warn(`⚠️ Could not get messages with label ${labelName}: ${e.message}`);
      return new Set(); // In caso di errore, ritorna set vuoto
    }
  }
  
  // ========================================================================
  // ESTRAZIONE MESSAGGI (con supporto Reply-To)
  // ========================================================================
  
  /**
   * Estrae dettagli messaggio con supporto Reply-To
   */
  extractMessageDetails(message) {
    const subject = message.getSubject();
    const sender = message.getFrom();
    const date = message.getDate();
    const body = message.getPlainBody() || this._htmlToPlainText(message.getBody());
    const messageId = message.getId();
    
    // Ottieni header Reply-To
    const replyTo = message.getReplyTo();
    
    // Usa Reply-To se presente e valido
    let effectiveSender;
    let hasReplyTo = false;
    
    if (replyTo && replyTo.includes('@') && replyTo !== sender) {
      effectiveSender = replyTo;
      hasReplyTo = true;
      console.log(`   📧 Using Reply-To: ${replyTo} (Original From: ${sender})`);
    } else {
      effectiveSender = sender;
    }
    
    // Estrai nome ed email
    const senderName = this._extractSenderName(effectiveSender);
    const senderEmail = this._extractEmailAddress(effectiveSender);
    
    return {
      id: messageId,
      subject: subject,
      sender: effectiveSender,
      senderName: senderName,
      senderEmail: senderEmail,
      date: date,
      body: body,
      originalFrom: sender,
      hasReplyTo: hasReplyTo
    };
  }
  
  /**
   * Estrae il nome del mittente dal campo From
   */
  _extractSenderName(fromField) {
    const match = fromField.match(/^"?(.+?)"?\s*</);
    let name = null;
    
    if (match) {
      name = match[1].trim();
    } else {
      // Usa prefisso email come fallback
      const email = this._extractEmailAddress(fromField);
      if (email) {
        name = email.split('@')[0];
      }
    }
    
    // Capitalizza il nome (prima lettera maiuscola per ogni parola)
    if (name) {
      return this._capitalizeName(name);
    }
    
    return 'Utente';
  }
  
  /**
   * Capitalizza un nome proprio (prima lettera maiuscola per ogni parola)
   */
  _capitalizeName(name) {
    if (!name) return name;
    
    return name
      .split(/[\s-]+/)
      .map(word => {
        if (word.length === 0) return word;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }
  
  /**
   * Estrae indirizzo email dal campo From
   * FIX: Gestisce formato "Mario Rossi mario@example.com" senza <>
   */
  _extractEmailAddress(fromField) {
    // Format: "Name <email@domain.com>"
    const angleMatch = fromField.match(/<(.+?)>/);
    if (angleMatch) {
      return angleMatch[1];
    }
    
    // FIX: Format "Name email@domain.com" - extract email with regex
    const emailMatch = fromField.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      return emailMatch[0];
    }
    
    return '';
  }
  
  /**
   * Converte HTML in testo semplice
   */
  _htmlToPlainText(html) {
    if (!html) return '';
    
    // Rimuovi tag HTML
    let text = html.replace(/<[^>]+>/g, ' ');
    // Decodifica entità HTML
    text = text.replace(/&nbsp;/g, ' ')
               .replace(/&amp;/g, '&')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>');
    // Pulisci spazi bianchi
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
  }
  
  // ========================================================================
  // CRONOLOGIA CONVERSAZIONE
  // ========================================================================
  
  /**
   * Costruisce cronologia conversazione da messaggi thread
   */
  buildConversationHistory(messages, maxMessages = (typeof CONFIG !== 'undefined' && CONFIG.MAX_HISTORY_MESSAGES) ? CONFIG.MAX_HISTORY_MESSAGES : 10, ourEmail = '') {
    // Fallback: ottieni nostra email se non fornita
    if (!ourEmail) {
      ourEmail = Session.getActiveUser().getEmail();
    }
    
    // Limita numero di messaggi
    if (messages.length > maxMessages) {
      console.warn(`⚠️ Thread with ${messages.length} messages, limiting to last ${maxMessages}`);
      messages = messages.slice(-maxMessages);
    }
    
    const history = [];
    
    for (const msg of messages) {
      const details = this.extractMessageDetails(msg);
      const isOurs = ourEmail && details.senderEmail.toLowerCase() === ourEmail.toLowerCase();
      
      const prefix = isOurs ? 'Segreteria' : `Utente (${details.senderName})`;
      
      // Tronca messaggi molto lunghi
      let body = details.body;
      if (body.length > 2000) {
        body = body.substring(0, 2000) + '\n[... messaggio troncato ...]';
      }
      
      history.push(`${prefix}: ${body}\n---`);
    }
    
    return history.join('\n');
  }
  
  // ========================================================================
  // RIMOZIONE CITAZIONI/FIRME
  // ========================================================================
  
  /**
   * Estrae contenuto principale risposta, rimuovendo testo citato
   */
  extractMainReply(content) {
    const markers = [
      /^>/m,
      /^On .* wrote:/m,
      /^Il giorno .* ha scritto:/m,
      /^-{3,}.*Original Message/m
    ];
    
    let result = content;
    
    for (const marker of markers) {
      const match = content.search(marker);
      if (match !== -1) {
        result = content.substring(0, match);
        break;
      }
    }
    
    // Rimuovi firme
    const sigMarkers = [
      /cordiali saluti/i,
      /distinti saluti/i,
      /in fede/i,
      /best regards/i,
      /sincerely/i,
      /sent from my iphone/i,
      /inviato da/i
    ];
    
    for (const marker of sigMarkers) {
      const match = result.search(marker);
      if (match !== -1) {
        result = result.substring(0, match);
        break;
      }
    }
    
    return result.trim();
  }
  
  // ========================================================================
  // INVIO RISPOSTA
  // ========================================================================
  
  /**
   * Invia risposta a un thread
   * ✅ Usa sender_email che include Reply-To quando presente
   */
  sendReply(thread, replyText, messageDetails) {
    // Ottieni oggetto GmailThread se è un ID
    const gmailThread = typeof thread === 'string' ? 
                        GmailApp.getThreadById(thread) : thread;
    
    // Rispondi al thread (Gmail gestisce il threading automaticamente)
    gmailThread.reply(replyText);
    
    console.log(`✓ Reply sent to ${messageDetails.senderEmail}`);
    
    if (messageDetails.hasReplyTo) {
      console.log('   📧 Reply sent to Reply-To address');
    }
    
    return true;
  }
  
  /**
   * Invia risposta come HTML (per risposte formattate)
   * ✅ Applica safeguard di formattazione (funzionalità legacy)
   * ✅ Applica sostituzioni personalizzate dal foglio Sostituzioni
   * @param {GmailThread|GmailMessage|string} resource - Thread, Messaggio o ID Thread
   */
  sendHtmlReply(resource, responseText, messageDetails) {
    // ✅ FIX Bug 19: Header Injection Sanitization (Refactored for testing)
    const sanitizedText = this._sanitizeHeaders(responseText);

    // 0. Applica Sostituzioni Personalizzate (dal foglio Sostituzioni)
    let finalResponse = sanitizedText;
    if (typeof GLOBAL_CACHE !== 'undefined' && GLOBAL_CACHE.replacements) {
      const replacementCount = Object.keys(GLOBAL_CACHE.replacements).length;
      if (replacementCount > 0) {
        finalResponse = this.applyReplacements(finalResponse, GLOBAL_CACHE.replacements);
        console.log(`   ✓ Applied ${replacementCount} replacement rules`);
      }
    }
    
    // 1. Applica Safeguard di Formattazione
    finalResponse = this.fixPunctuation(finalResponse, messageDetails.senderName);
    finalResponse = this.ensureGreetingLineBreak(finalResponse);

    // 2. Converti in HTML e invia
    // Se è stringa, assumiamo sia Thread ID (retro-compatibilità)
    // Se è oggetto, usiamo duck typing (sia Thread che Message hanno .reply)
    const mailEntity = typeof resource === 'string'
      ? GmailApp.getThreadById(resource)
      : resource;

    try {
      const htmlBody = markdownToHtml(finalResponse);
      mailEntity.reply('', { htmlBody: htmlBody });
      console.log(`✓ HTML reply sent to ${messageDetails.senderEmail}`);
    } catch (error) {
      console.error(`❌ Markdown conversion failed: ${error.message}`);
      // Fallback: invia come testo plain
      try {
        mailEntity.reply(finalResponse);
        console.log(`✓ Plain text reply sent to ${messageDetails.senderEmail} (fallback)`);
      } catch (fallbackError) {
        console.error(`❌ CRITICAL: Fallback reply failed: ${fallbackError.message}`);
        const errorLabel = CONFIG.ERROR_LABEL_NAME;
        if (mailEntity && typeof mailEntity.getMessages === 'function') {
          this.addLabelToThread(mailEntity, errorLabel);
        } else if (mailEntity && typeof mailEntity.getId === 'function') {
          this.addLabelToMessage(mailEntity.getId(), errorLabel);
        } else {
          console.warn('⚠️ Unable to add error label: mail entity unavailable');
        }
      }
    }
  }

  // ========================================================================
  // SAFEGUARD DI FORMATTAZIONE (Funzionalità Legacy)
  // ========================================================================

  /**
   * Corregge errori comuni di punteggiatura
   * Es. "Buongiorno, Siamo" -> "Buongiorno, siamo"
   * 
   * COMPORTAMENTO:
   * - Corregge maiuscole dopo virgola (es. "Siamo" -> "siamo")
   * - Eccezioni: titoli (Don, Padre, ecc.) e nome mittente
   * - ✅ NON tocca parole tra due virgole (vocativo: ", Federica,")
   */
  fixPunctuation(text, senderName = '') {
    if (!text) return text;
    
    // Parole che DEVONO rimanere maiuscole dopo virgola
    const exceptions = ['Don', 'Padre', 'Suor', 'Monsignor', 'Papa', 'Signore', 'Signora'];
    
    // Aggiungi nome mittente alle eccezioni
    if (senderName) {
      const nameParts = senderName.split(/\s+/);
      for (const part of nameParts) {
        if (part && !exceptions.includes(part)) {
          exceptions.push(part);
        }
      }
    }
    
    // Fix: minuscola dopo virgola (escluse eccezioni e vocativi tra virgole)
    return text.replace(/,\s+([A-ZÀÈÉÌÒÙ])([a-zàèéìòù]*)/g, (match, firstLetter, rest, offset) => {
      const word = firstLetter + rest;
      
      // Eccezione 1: titoli e nome mittente
      if (exceptions.includes(word)) {
        return match;
      }
      
      // Eccezione 2: vocativo seguito da virgola o punto (es. ", Federica," o ", Marco.")
      // Eccezione 2b: vocativo doppio (es. ", Mario e Giulia," o ", Romualdo e Gigliela.")
      // Controlla se dopo la parola c'è una virgola/punto OPPURE "e NomePropio,/."
      const afterMatch = text.substring(offset + match.length);
      
      // Pattern 1: virgola/punto diretto (vocativo singolo)
      // Pattern 2: "e NomeProprio" seguito da virgola/punto (vocativo doppio)
      if (afterMatch.match(/^\s*[,.]/) || 
          afterMatch.match(/^\s+e\s+[A-ZÀÈÉÌÒÙ][a-zàèéìòù]*\s*[,.]/)) {
        // È un nome proprio (vocativo singolo o doppio), non minuscolizzare
        return match;
      }
      
      return `, ${firstLetter.toLowerCase()}${rest}`;
    });
  }

  /**
   * Assicura che ci sia una riga vuota dopo il saluto
   */
  ensureGreetingLineBreak(text) {
    if (!text) return text;

    // Pattern: Riga saluto (inizio stringa, alcune parole, virgola/esclamativo, a capo)
    // Seguito da testo immediato senza riga vuota.
    
    // E.g. ^Buongiorno, \nSiamo... -> ^Buongiorno, \n\nSiamo...
    
    const lines = text.split('\n');
    if (lines.length > 1) {
      const firstLine = lines[0].trim();
      // Verifica se sembra un saluto
      if (/^(Buongiorno|Buonasera|Salve|Gentile|Egregio|Ciao)/i.test(firstLine)) {
        // Verifica se la seconda riga NON è vuota
        if (lines[1].trim() !== '') {
            // Inserisci riga vuota
            lines.splice(1, 0, '');
            return lines.join('\n');
        }
      }
    }
    return text;
  }

  /**
   * Applies custom text replacements from the Sostituzioni sheet
   * @param {string} text - Text to apply replacements to
   * @param {Object} replacements - Map of {badText: goodText}
   */
  applyReplacements(text, replacements) {
    if (!text || !replacements) return text;
    
    let result = text;
    for (const [bad, good] of Object.entries(replacements)) {
      // Sostituzione globale case insensitive
      const regex = new RegExp(bad.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      result = result.replace(regex, good);
    }
    return result;
  }

  /**
   * Sanitizes text to prevent header injection
   */
  _sanitizeHeaders(text) {
    if (!text) return '';
    return text
      .replace(/\n(To|Cc|Bcc|From|Subject|Reply-To):/gi, '\n[$1]:')
      .replace(/\r\n|\r/g, '\n');
  }

  // ========================================================================
  // VERIFICA STATO
  // ========================================================================
  
  /**
   * Testa accesso Gmail
   */
  testConnection() {
    const results = {
      connectionOk: false,
      canListMessages: false,
      canCreateLabels: false,
      errors: []
    };
    
    try {
      // Testa listing thread
      const threads = GmailApp.search('is:unread', 0, 1);
      results.connectionOk = true;
      results.canListMessages = true;
      
      // Testa creazione etichette
      try {
        const testLabel = this.getOrCreateLabel('_TEST_LABEL_');
        results.canCreateLabels = true;
        
        // Pulizia
        try {
          testLabel.deleteLabel();
        } catch (e) {
          // Non critico
        }
      } catch (e) {
        results.errors.push(`Cannot create labels: ${e.message}`);
      }
      
    } catch (e) {
      results.errors.push(`Connection error: ${e.message}`);
    }
    
    results.isHealthy = results.connectionOk && results.canListMessages;
    return results;
  }
}

// Funzione factory
function createGmailService() {
  return new GmailService();
}

// ====================================================================
// MARKDOWN → HTML (GLOBAL, REQUIRED BY GmailService)
// Ripristina stile originale: viola + font 20px
// ====================================================================

function markdownToHtml(text) {
  if (!text) return '';

  let html = text;

  // ✅ STEP 1: Proteggi code blocks PRIMA di tutto
  const codeBlocks = [];
  html = html.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `__CODEBLOCK_${codeBlocks.length - 1}__`;
  });

  // ✅ STEP 2: Converti links PRIMA di escape (preserva URL intatti)
  // ✅ STEP 2: Converti links con sanitizzazione (FIX Bug #3 XSS)
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, (match, linkText, url) => {
    // Sanitize link text
    const escapedText = linkText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // ✅ SANITIZE URL
    const escapedUrl = url
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
  // ✅ FIX Bug 19: Header Injection Prevention (during mail send phase)
  // But also in markdown conversion, we ensure no hidden control characters
  
  // ✅ FIX Bug 20: SSRF & Internal IP Protection
  // Blacklist internal IPs and localhost
  const INTERNAL_IP_PATTERN = /^(https?:\/\/)?(localhost|127\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|169\.254\.)/i;
  
  if (INTERNAL_IP_PATTERN.test(escapedUrl)) {
    console.warn(`🛑 Blocked internal IP/SSRF attempt: ${escapedUrl}`);
    return escapedText;
  }

  // ✅ FIX Bug #8: Decode URL and remove control chars BEFORE validation
  // Prevents bypasses like JAVA%53CRIPT:alert(1) or java\u0009script:
  let decodedUrl = escapedUrl;
  try {
    decodedUrl = decodeURIComponent(escapedUrl);
  } catch (e) {
    // Invalid encoding - use as-is
  }
  decodedUrl = decodedUrl.replace(/[\u0000-\u001F\u007F-\u009F]/g, ''); // Remove control chars

  // ✅ VALIDATE URL protocol (only http/https/mailto)
  // Se protocollo sospetto (javascript:, vbscript:, data:), ritorna solo testo
  const isDangerous = /^\s*(javascript|vbscript|data|file):/i.test(decodedUrl);
  const isSafeProtocol = /^\s*(https?|mailto):/i.test(decodedUrl);

  if (isDangerous || !isSafeProtocol) {
    console.warn(`⚠️ Blocked suspicious URL: ${escapedUrl}`);
    return escapedText; // Return just text, no link
  }
    
    return `<a href="${escapedUrl}" style="color:#351c75;">${escapedText}</a>`;
  });

  // ✅ STEP 3: Headers (markdown → HTML)
  // IMPORTANTE: Ordine decrescente (#### prima di ###) per evitare match parziali
  html = html.replace(/^####\s+(.+)$/gm, '<p style="font-size:14px;font-weight:bold;">$1</p>');
  html = html.replace(/^###\s+(.+)$/gm, '<p style="font-size:16px;font-weight:bold;">$1</p>');
  html = html.replace(/^##\s+(.+)$/gm, '<p style="font-size:18px;font-weight:bold;">$1</p>');
  html = html.replace(/^#\s+(.+)$/gm, '<p style="font-size:20px;font-weight:bold;">$1</p>');

  // ✅ STEP 4: Bold / Italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)\*(?!\*)/g, '<em>$1</em>');

  // ✅ STEP 5: Escape testo rimanente (dopo conversione markdown)
  // Split by HTML tags to escape only text content
  html = html.replace(/>[^<]+</g, (match) => {
    return match.slice(0, 1) + 
           match.slice(1, -1)
             .replace(/&(?!amp;|lt;|gt;|quot;|#\d+;)/g, '&amp;')
             .replace(/<(?![^>]*>)/g, '&lt;')
             .replace(/(?<![^<]*)>/g, '&gt;') + 
           match.slice(-1);
  });

  // ✅ STEP 6: Restore code blocks (con escape interno)
  codeBlocks.forEach((block, i) => {
    const code = block.replace(/```/g, '').trim()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    html = html.replace(
      `__CODEBLOCK_${i}__`,
      `<pre style="background:#f4f4f4;padding:10px;border-radius:4px;font-family:monospace;">${code}</pre>`
    );
  });

  // ✅ STEP 7: Paragraphs and line breaks
  html = html.replace(/\n\n+/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');

  // ✅ STEP 8: Convert emojis to HTML entities
  // FIX Bug #31: Use Array.from to handle multi-codepoint emoji correctly
  html = Array.from(html).map(char => {
    const codePoint = char.codePointAt(0);
    if (codePoint > 0x7F) {
      return '&#' + codePoint + ';';
    }
    return char;
  }).join('');

  // Wrapper finale
  return `
    <div style="
      font-family: Arial, Helvetica, sans-serif;
      font-size: 20px;
      color: #351c75;
      line-height: 1.6;
    ">
      <p>${html}</p>
    </div>
  `;
}
