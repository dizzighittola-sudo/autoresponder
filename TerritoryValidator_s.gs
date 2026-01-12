// ====================================================================
// TERRITORY VALIDATOR - Validazione indirizzi territorio parrocchiale
// ====================================================================
// ⚠️ VERSIONE SANITIZZATA PER GITHUB
// Sostituire le vie di esempio con le vie reali del territorio parrocchiale
// ====================================================================

class TerritoryValidator {
  constructor() {
    // Database territorio con vie e numeri civici accettati
    // ⚠️ ESEMPIO: Sostituire con vie reali della propria parrocchia
    this.territory = {
      // Esempi di vie complete (tutti i numeri civici accettati)
      'via esempio uno': {tutti: true},
      'via esempio due': {tutti: true},
      'piazza esempio': {tutti: true},
      'viale delle arti': {tutti: true},
      'largo esempio': {tutti: true},
      
      // Esempi con range specifici
      'viale principale': {dispari: [1, 99], pari: [2, 100]},
      'via secondaria': {dispari: [1, null]},  // null = senza limite
      'lungotevere esempio': {tutti: [1, 50]},
      
      // Esempi con solo pari o dispari
      'via dispari only': {dispari: [1, null]},
      'via pari only': {pari: [2, null]}
    };
  }
  
  /**
   * Normalizza nome via per matching
   * ✅ FIX Bug #4: Normalizza Unicode (apostrofi, diacritici)
   */
  normalizeStreetName(street) {
    let normalized = street.toLowerCase().trim();
    
    // ✅ FIX: Normalizza apostrofi (tutte le varianti → ')
    normalized = normalized.replace(/[\u2018\u2019\u201A\u201B`´]/g, "'");
    
    // ✅ FIX: Normalizza spazi
    normalized = normalized.replace(/\s+/g, ' ');
    
    return normalized;
  }
  
  extractAddressFromText(text) {
    // Pattern per rilevare indirizzi - FIX Bug 6: Aggiunto apostrofo al pattern
    const patterns = [
      // Pattern 1: "via Rossi 10", "viale Belle Arti n. 5", "via dell'Angelo 3"
      /((?:via|viale|piazza|piazzale|largo|lungotevere|salita)\s+[a-zA-ZàèéìòùÀÈÉÌÒÙ']+(?:\s+[a-zA-ZàèéìòùÀÈÉÌÒÙ']+)*)\s+(?:n\.?\s*|civico\s+)?(\d+)/gi,
      
      // Pattern 2: "abito in via Rossi 10", "abito a via Bianchi 3", "abito alle Belle Arti 10"
      /(?:in|abito\s+in|abito\s+al|abito\s+alle|abito\s+a|al|alle)\s+((?:via|viale|piazza|piazzale|largo|lungotevere|salita)\s+[a-zA-ZàèéìòùÀÈÉÌÒÙ']+(?:\s+[a-zA-ZàèéìòùÀÈÉÌÒÙ']+)*)\s+(?:n\.?\s*|civico\s+)?(\d+)/gi
    ];
    
    const addresses = [];
    const MAX_MATCHES = 10; // ✅ FIX Bug #5: Safety limit per prevenire loop infiniti
    
    for (const pattern of patterns) {
      let match;
      let matchCount = 0;
      
      // ✅ FIX Bug #5: Reset lastIndex per sicurezza
      pattern.lastIndex = 0;
      
      try {
        // Usa exec in loop per ottenere TUTTE le corrispondenze, non solo la prima
        while ((match = pattern.exec(text)) !== null) {
          matchCount++;
          
          // ✅ FIX Bug #5: Safety check - previeni loop infiniti
          if (matchCount > MAX_MATCHES) {
            console.warn(`⚠️ Too many address matches (>${MAX_MATCHES}), stopping`);
            break;
          }
          
          // ✅ FIX Bug #5: Previeni zero-width match loop
          if (match.index === pattern.lastIndex) {
            pattern.lastIndex++;
          }
          
          const street = match[1].trim();
          const civic = parseInt(match[2]);
          
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
