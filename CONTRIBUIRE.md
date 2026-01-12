[![🇬🇧 English](https://img.shields.io/badge/lang-English-blue)](CONTRIBUTING.md) [![🇮🇹 Italiano](https://img.shields.io/badge/lang-Italiano-green)](CONTRIBUIRE.md)

# Contribuire ad Autoresponder Parrocchiale

Prima di tutto, grazie per voler contribuire! 🙏

## 🌟 Come Contribuire?

### Segnalare Bug

Prima di creare una segnalazione, verifica che il bug non sia già segnalato. Includi:

- **Titolo e descrizione chiari**
- **Passi per riprodurre** il comportamento
- **Comportamento atteso** vs comportamento reale
- **Screenshot** (se applicabile)
- **Dettagli ambiente** (versione Apps Script, impostazioni Gmail)
- **Log** dall'esecuzione Apps Script

**Esempio segnalazione:**
```markdown
**Titolo**: Errore NaN nel calcolo del saluto con timestamp invalidi

**Descrizione**: Quando si elaborano email con metadati data corrotti, 
il sistema va in crash con errore NaN.

**Passi per riprodurre**:
1. Crea email di test con header data invalido
2. Esegui processUnreadEmails()
3. Controlla i log

**Atteso**: Fallback gracefully al saluto predefinito
**Reale**: Esecuzione fallisce con errore NaN

**Ambiente**: Google Apps Script, Gmail API v1
**Log**: [incolla log rilevanti]
```

### Proporre Miglioramenti

Quando proponi un miglioramento, includi:

- **Caso d'uso chiaro** - Quale problema risolve?
- **Soluzione proposta** - Come lo implementeresti?
- **Alternative considerate** - Quali altri approcci hai pensato?
- **Impatto** - Chi beneficia di questo miglioramento?

### Pull Request

1. **Fork il repository** e crea il tuo branch da `main`
2. **Fai le modifiche** seguendo i nostri standard
3. **Aggiungi test** per nuove funzionalità
4. **Assicurati che i test passino**: `runAllTests()`
5. **Aggiorna la documentazione** se necessario
6. **Scrivi messaggi di commit chiari**
7. **Invia la PR** con descrizione completa

## 📋 Standard di Codice

### Stile JavaScript

```javascript
// ✅ BENE: Nomi funzioni chiari, JSDoc, gestione errori
/**
 * Valida formato indirizzo email
 * @param {string} email - Email da validare
 * @returns {boolean} True se valida
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    console.warn('Input email invalido');
    return false;
  }
  
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

// ❌ MALE: No documentazione, no validazione, nomi poco chiari
function check(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}
```

### Documentazione

- **Tutte le funzioni** devono avere commenti JSDoc
- **Logica complessa** deve avere commenti inline
- **Bug fix** devono includere `// FIX Bug #X: Descrizione`
- **TODO** devono referenziare issue GitHub: `// TODO(#123): Descrizione`

### Testing

Ogni nuova funzionalità o bug fix deve includere test:

```javascript
/**
 * Test per nuova funzione validazione email
 */
function test_validateEmail_formatoValido() {
  const result = validateEmail('test@example.com');
  return TestRunner.assertEqual(result, true, 'Email valida deve passare');
}

function test_validateEmail_formatoInvalido() {
  const result = validateEmail('email-invalida');
  return TestRunner.assertEqual(result, false, 'Email invalida deve fallire');
}
```

### Messaggi di Commit

Segui la specifica Conventional Commits:

```
feat: Aggiunto supporto rilevamento lingua portoghese
fix: Previeni NaN in calcolo modalità saluto (#7)
docs: Aggiorna README con configurazione circuit breaker
test: Aggiunti unit test per validatore territorio
refactor: Estratta logica selezione KB in modulo separato
perf: Ottimizzata performance lookup cache memoria
```

## 🧪 Linee Guida Testing

### Prima di Inviare

1. Esegui unit test: `runAllTests()`
2. Esegui integration test: `runIntegrationTests()`
3. Esegui suite completa: `runFullTestSuite()`
4. Verifica nessun nuovo errore nei log
5. Testa prima in modalità dry-run
6. Controlla impatto performance

### Scrivere Test

- **Testa una cosa** per funzione di test
- **Usa nomi descrittivi**: `test_[modulo]_[scenario]_[risultatoAtteso]`
- **Copri edge case**: null, undefined, vuoto, valori limite
- **Asserisci chiaramente**: Usa TestRunner.assertEqual per messaggi errore migliori
- **Mocka dipendenze**: Usa `_createMockEmail()` per scenari realistici

## 📚 Risorse Aggiuntive

- [Documentazione Google Apps Script](https://developers.google.com/apps-script)
- [Documentazione Gemini AI](https://ai.google.dev/docs)
- [Riferimento Gmail API](https://developers.google.com/gmail/api)

## 🤔 Domande?

- **Domande generali**: Apri una [GitHub Discussion](https://github.com/dizzighittola/autoresponder/discussions)
- **Segnalazione bug**: Apri una [GitHub Issue](https://github.com/dizzighittola/autoresponder/issues)
- **Problemi di sicurezza**: Email info@parrocchiasanteugenio.it (disclosure privato)

## 💝 Riconoscimenti

I contributori saranno:
- Elencati nel README del progetto
- Menzionati nelle note di rilascio
- Accreditati nei commit

Grazie per rendere migliore Autoresponder Parrocchiale! 🙏

---

*"Qualunque cosa facciate, fatela di buon animo, come per il Signore" - Colossesi 3,23*
