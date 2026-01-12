[![🇬🇧 English](https://img.shields.io/badge/lang-English-blue)](TESTING.md) [![🇮🇹 Italiano](https://img.shields.io/badge/lang-Italiano-green)](GUIDA_TESTING.md)

# 🧪 Guida al Testing

Questa guida descrive come eseguire e interpretare i test del sistema Autoresponder Parrocchiale.

---

## 📋 Panoramica Test

Il sistema include **21 test** organizzati in due categorie:

| Categoria | Numero Test | Descrizione |
|-----------|-------------|-------------|
| Unit Test | 12 | Test isolati per singoli componenti |
| Integration Test | 9 | Test di integrazione tra componenti |

---

## 🚀 Esecuzione Test

### Tutti i Test

```javascript
// Esegue tutti i 21 test (unit + integration)
runFullTestSuite()
```

### Solo Unit Test

```javascript
// Esegue i 12 unit test
runAllTests()
```

### Solo Integration Test

```javascript
// Esegue i 9 integration test
runIntegrationTests()
```

### Test Rapido

```javascript
// 2 test per controllo veloce
runQuickTest()
```

---

## 📊 Unit Test Dettaglio

### Bug #7: computeSalutationMode

| Test | Verifica |
|------|----------|
| `test_salutationMode_invalidTimestamp` | Timestamp invalido → `none_or_continuity` |
| `test_salutationMode_nullTimestamp` | Timestamp null → `none_or_continuity` |
| `test_salutationMode_validTimestamp` | Timestamp valido (2h fa) → `none_or_continuity` |
| `test_salutationMode_firstMessage` | Primo messaggio → `full` |

### Bug #2: Regex Orari

| Test | Verifica |
|------|----------|
| `test_timeRegex_notMatchURL` | Pattern NON matcha orari in URL |
| `test_timeRegex_matchValidTime` | Pattern matcha orari standalone |

### Circuit Breaker

| Test | Verifica |
|------|----------|
| `test_circuitBreaker_initialClosed` | Stato iniziale = CLOSED |
| `test_circuitBreaker_openAfterThreshold` | Stato = OPEN dopo 3 fallimenti |
| `test_circuitBreaker_blocksWhenOpen` | Blocca chiamate quando OPEN |
| `test_circuitBreaker_resetOnSuccess` | Reset contatore su successo |

### Knowledge Selector

| Test | Verifica |
|------|----------|
| `test_knowledgeSelector_basicPayload` | Ritorna kbForPrompt e kbForValidation |
| `test_knowledgeSelector_territoryIncluded` | Territorio incluso nei blocchi mandatory |

---

## 🔗 Integration Test Dettaglio

### Classificazione

| Test | Verifica |
|------|----------|
| `test_integration_classifyTechnical` | Email tecnica → categoria information/sacrament |
| `test_integration_requestType` | Richiesta orari → TECHNICAL |

### Rilevamento Lingua

| Test | Verifica |
|------|----------|
| `test_integration_languageDetection` | Email italiana → IT |
| `test_integration_languageDetectionEnglish` | Email inglese → EN |

### Prompt e Validazione

| Test | Verifica |
|------|----------|
| `test_integration_promptBuilding` | Prompt contiene email e ha lunghezza adeguata |
| `test_integration_validation` | Risposta valida passa validazione |
| `test_integration_validationHallucination` | Orari inventati vengono rilevati |

### End-to-End

| Test | Verifica |
|------|----------|
| `test_integration_fullE2E_DryRun` | Risorse caricate correttamente |
| `test_integration_quickCheck` | Quick check Gemini ritorna shouldRespond |

---

## 📝 Output Atteso

```
══════════════════════════════════════════════════
🧪 RUNNING CRITICAL UNIT TESTS
══════════════════════════════════════════════════

--- Bug #7: computeSalutationMode ---
✅ PASS: Bug #7: Invalid timestamp should return none_or_continuity
✅ PASS: Bug #7: Null timestamp should return none_or_continuity
✅ PASS: Bug #7: Recent valid timestamp (2h ago) should return none_or_continuity
✅ PASS: First message should return full salutation

--- Bug #2: Time Regex ---
✅ PASS: Bug #2: Time pattern should NOT match inside URL
✅ PASS: Bug #2: Time pattern should match standalone times

--- CircuitBreaker ---
✅ PASS: CircuitBreaker: Initial state should be CLOSED
✅ PASS: CircuitBreaker: Should be OPEN after 3 failures
✅ PASS: CircuitBreaker: Should block calls when OPEN
✅ PASS: CircuitBreaker: Failures should reset on success

--- KnowledgeSelector ---
✅ PASS: KnowledgeSelector: Should return kbForPrompt and kbForValidation
✅ PASS: KnowledgeSelector: Territory block should be included

══════════════════════════════════════════════════
📊 Tests: 12/12 passed, 0 failed
══════════════════════════════════════════════════
```

---

## ❌ Gestione Fallimenti

### Test Fallito

Se un test fallisce, l'output sarà:

```
❌ FAIL: Nome del test
   Expected: valore_atteso
   Actual:   valore_ottenuto
```

### Azioni Correttive

1. **Identifica il test fallito** dal nome
2. **Trova il file sorgente** del componente testato
3. **Verifica le modifiche recenti** a quel componente
4. **Esegui il singolo test** per debug:
   ```javascript
   test_salutationMode_invalidTimestamp()
   ```

---

## 🔧 Aggiungere Nuovi Test

### Struttura Base

```javascript
function test_nomeComponente_comportamento() {
  // Arrange - prepara i dati
  const input = { ... };
  
  // Act - esegui l'azione
  const result = funzioneDaTestare(input);
  
  // Assert - verifica il risultato
  return TestRunner.assertEqual(
    result,
    valoreAtteso,
    'Descrizione del test'
  );
}
```

### Aggiungi al Runner

In `runAllTests()` o `runIntegrationTests()`:

```javascript
console.log('\n--- Nuovo Componente ---');
test_nomeComponente_comportamento();
```

---

## 📧 Supporto

- **Issues**: [GitHub Issues](https://github.com/dizzighittola/autoresponder/issues)
- **Email**: info@parrocchiasanteugenio.it

---

*Guida Testing per Autoresponder Parrocchiale v2.0*
