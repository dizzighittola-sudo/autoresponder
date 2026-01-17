// ====================================================================
// TERRITORY VALIDATOR - Validazione indirizzi territorio parrocchiale
// ====================================================================

class TerritoryValidator {
  constructor() {
    // Database territorio con vie e numeri civici accettati
    // ✅ SANITIZZATO PER GITHUB: Placeholder generici
    this.territory = {
      'via roma': {tutti: true},
      'corso vittorio emanuele': {dispari: [1, 100]},
      'piazza vittorio': {tutti: true},
      'via mazzini': {pari: [2, null]},
      'viale delle scienze': {tutti: true}
      // ... altri indirizzi del territorio ...
    };
  }
  
  normalizeStreetName(street) {
    let normalized = street.toLowerCase().trim();
    return normalized.replace(/\s+/g, ' ');
  }
  
  extractAddressFromText(text) {
    // ✅ FIX Bug #5: ReDoS Prevention
    // 1. Guardrail: Limit input length to prevent processing extremely long malicious strings
    if (text && text.length > 5000) {
      text = text.substring(0, 5000);
    }
    
    // 2. Pattern ottimizzati per sicurezza (Backtracking limitato)
    const patterns = [
      // Pattern 1: "via Rossi 10" (Limited recursion key: use {0,6} instead of * or 10, non-greedy)
      /((?:via|viale|piazza|piazzale|largo|lungotevere|salita)\s+(?:[a-zA-ZàèéìòùÀÈÉÌÒÙ']+\s+){0,6}?[a-zA-ZàèéìòùÀÈÉÌÒÙ']+)\s+(?:n\.?\s*|civico\s+)?(\d+)/gi,
      
      // Pattern 2: "abito in... via Rossi 10"
      /(?:in|abito\s+in|abito\s+al|abito\s+alle|abito\s+a|al|alle)\s+((?:via|viale|piazza|piazzale|largo|lungotevere|salita)\s+(?:[a-zA-ZàèéìòùÀÈÉÌÒÙ']+\s+){0,6}?[a-zA-ZàèéìòùÀÈÉÌÒÙ']+)\s+(?:n\.?\s*|civico\s+)?(\d+)/gi
    ];
    
    const addresses = [];
    
    for (const pattern of patterns) {
      let match;
      try {
        // Usa exec in loop per ottenere TUTTE le corrispondenze, non solo la prima
        while ((match = pattern.exec(text)) !== null) {
          const street = match[1].trim();
          const civicRaw = match[2];
          const civic = parseInt(civicRaw, 10);
          
          // ✅ FIX BUG #4: Valida civic number
          if (isNaN(civic) || civic <= 0) {
            console.warn(`⚠️ Invalid civic number: ${civicRaw} for street ${street}`);
            continue; // Salta questa match
          }
          
          // Evita duplicati (stessa via + numero civico)
          const isDuplicate = addresses.some(addr => 
            addr.street.toLowerCase() === street.toLowerCase() && addr.civic === civic
          );
          
          if (!isDuplicate) {
            addresses.push({street: street, civic: civic});
            console.log(`📍 Indirizzo rilevato: ${street} n. ${civic}`);
          }
        }
      } catch (e) {
        console.warn(`⚠️ Pattern match failed: ${e.message}`);
      }
    }
    
    return addresses.length > 0 ? addresses : null;
  }
  
  verifyAddress(street, civicNumber) {
    const streetKey = this.normalizeStreetName(street);
    
    // Controlla se la via esiste nel territorio
    if (!this.territory[streetKey]) {
      return {
        inParish: false,
        reason: `'${street}' non è nel territorio della nostra parrocchia`,
        details: 'street_not_found'
      };
    }
    
    const rules = this.territory[streetKey];
    
    // Caso 1: Tutti i numeri civici accettati
    if (rules.tutti === true) {
      return {
        inParish: true,
        reason: `'${street}' è completamente nel territorio parrocchiale`,
        details: 'all_numbers'
      };
    }
    
    // Caso 2: Range specifico per tutti i numeri
    if (Array.isArray(rules.tutti)) {
      const [minNum, maxNum] = rules.tutti;
      if (civicNumber >= minNum && (maxNum === null || civicNumber <= maxNum)) {
        const rangeStr = maxNum ? `dal ${minNum} al ${maxNum}` : `dal ${minNum} in poi`;
        return {
          inParish: true,
          reason: `'${street}' n. ${civicNumber} è nel territorio (numeri ${rangeStr})`,
          details: `range_${minNum}_${maxNum}`
        };
      }
    }
    
    // Caso 3: Numeri pari/dispari con range
    const isOdd = civicNumber % 2 === 1;
    const isEven = civicNumber % 2 === 0;
    
    if (isOdd && rules.dispari) {
      const [minNum, maxNum] = rules.dispari;
      if (civicNumber >= minNum && (maxNum === null || civicNumber <= maxNum)) {
        return {
          inParish: true,
          reason: `'${street}' n. ${civicNumber} è nel territorio (numeri dispari)`,
          details: `odd_range`
        };
      }
    }
    
    if (isEven && rules.pari) {
      const [minNum, maxNum] = rules.pari;
      if (civicNumber >= minNum && (maxNum === null || civicNumber <= maxNum)) {
        return {
          inParish: true,
          reason: `'${street}' n. ${civicNumber} è nel territorio (numeri pari)`,
          details: `even_range`
        };
      }
    }
    
    return {
      inParish: false,
      reason: `'${street}' n. ${civicNumber} non rientra nel territorio parrocchiale`,
      details: 'civic_not_in_range'
    };
  }
  
  analyzeEmailForAddress(emailContent, emailSubject) {
    const fullText = `${emailSubject} ${emailContent}`;
    const addressesInfo = this.extractAddressFromText(fullText);
    
    if (addressesInfo && addressesInfo.length > 0) {
      // Valida TUTTI gli indirizzi trovati
      const verifications = addressesInfo.map(addrInfo => {
        const verification = this.verifyAddress(addrInfo.street, addrInfo.civic);
        return {
          street: addrInfo.street,
          civic: addrInfo.civic,
          verification: verification
        };
      });
      
      // Log ogni risultato di verifica
      verifications.forEach(v => {
        console.log(`🏘️ Territorio: ${v.verification.reason}`);
      });
      
      return {
        addressFound: true,
        addresses: verifications,  // Array di tutti gli indirizzi con le loro verifiche
        // Mantieni compatibilità - ritorna info primo indirizzo
        street: verifications[0].street,
        civic: verifications[0].civic,
        verification: verifications[0].verification
      };
    }
    
    return {
      addressFound: false,
      addresses: [],
      verification: null
    };
  }
}

// Funzione factory
function createTerritoryValidator() {
  return new TerritoryValidator();
}
