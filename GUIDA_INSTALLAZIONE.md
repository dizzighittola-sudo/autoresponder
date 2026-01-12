[![🇬🇧 English](https://img.shields.io/badge/lang-English-blue)](GITHUB_SETUP_GUIDE.md) [![🇮🇹 Italiano](https://img.shields.io/badge/lang-Italiano-green)](GUIDA_INSTALLAZIONE.md)

# 📋 Guida all'Installazione

## Prerequisiti

Prima di iniziare, assicurati di avere:

- ✅ Account Google con accesso a Gmail
- ✅ Accesso a Google Apps Script
- ✅ Un Google Sheet per la Knowledge Base
- ✅ API Key Gemini (gratuita su [ai.google.dev](https://ai.google.dev))

---

## 🚀 Passo 1: Crea il Progetto Apps Script

1. Vai su [script.google.com](https://script.google.com)
2. Clicca **Nuovo progetto**
3. Rinomina il progetto (es. "Autoresponder Parrocchia")

---

## 📁 Passo 2: Carica i File

Copia ogni file `.txt` nel progetto, rinominandolo in `.gs`:

| File Originale | Nome in Apps Script |
|----------------|---------------------|
| `Main.txt` | `Main.gs` |
| `EmailProcessor.txt` | `EmailProcessor.gs` |
| `GeminiService.txt` | `GeminiService.gs` |
| `PromptEngine.txt` | `PromptEngine.gs` |
| `ResponseValidator.txt` | `ResponseValidator.gs` |
| `MemoryService.txt` | `MemoryService.gs` |
| `EmailClassifier.txt` | `EmailClassifier.gs` |
| `RequestTypeClassifier.txt` | `RequestTypeClassifier.gs` |
| `TerritoryValidator.txt` | `TerritoryValidator.gs` |
| `PromptContext.txt` | `PromptContext.gs` |
| `KnowledgeSelector.txt` | `KnowledgeSelector.gs` |
| `CircuitBreaker.txt` | `CircuitBreaker.gs` |
| `GeminiRateLimiter.txt` | `GeminiRateLimiter.gs` |
| `UnitTests.txt` | `UnitTests.gs` |

---

## 📊 Passo 3: Configura Google Sheets

### 3.1 Crea un nuovo Google Sheet

1. Vai su [sheets.google.com](https://sheets.google.com)
2. Crea un nuovo foglio
3. Copia l'ID dall'URL: `https://docs.google.com/spreadsheets/d/[QUESTO_È_L'ID]/edit`

### 3.2 Crea i fogli necessari

Crea questi fogli (tab) nel tuo spreadsheet:

| Nome Foglio | Descrizione |
|-------------|-------------|
| `Istruzioni` | Knowledge base principale |
| `AI_CORE_LITE` | Principi pastorali base |
| `AI_CORE` | Principi pastorali estesi |
| `Dottrina` | Base dottrinale |
| `Sostituzioni` | Correzioni testo |
| `ConversationMemory` | Memoria conversazioni (auto-creato) |

### 3.3 Struttura foglio "Istruzioni"

| Categoria | Chiave di ricerca | Risposta |
|-----------|-------------------|----------|
| Orari Messe | messa, orari, domenica | Le messe domenicali sono alle 10:00 e 18:00 |
| Contatti | telefono, email, segreteria | La segreteria è aperta lun-ven 9-12 |
| ... | ... | ... |

---

## 🔑 Passo 4: Configura le Proprietà Script

1. In Apps Script, vai su **⚙️ Impostazioni progetto**
2. Scorri fino a **Proprietà script**
3. Clicca **Modifica proprietà script**
4. Aggiungi queste proprietà:

| Proprietà | Valore |
|-----------|--------|
| `GEMINI_API_KEY` | La tua API key Gemini |
| `SPREADSHEET_ID` | ID del Google Sheet |

---

## ⚡ Passo 5: Configura il Trigger

### Metodo Automatico

1. In Apps Script, clicca su `Main.gs`
2. Seleziona la funzione `setupTrigger` dal menu a tendina
3. Clicca ▶️ **Esegui**
4. Autorizza quando richiesto

### Metodo Manuale

1. Vai su **⏰ Trigger** (icona orologio a sinistra)
2. Clicca **+ Aggiungi trigger**
3. Configura:
   - Funzione: `processUnreadEmails`
   - Origine evento: **Basato sul tempo**
   - Tipo: **Timer minuti**
   - Intervallo: **Ogni 5 minuti**

---

## ✅ Passo 6: Test

### Test Rapido

```javascript
// Esegui questa funzione per un test veloce
runQuickTest()
```

### Test Completo

```javascript
// Esegui tutti i test
runFullTestSuite()
```

### Test Dry Run (senza inviare email)

1. In `Main.gs`, imposta `DRY_RUN: true` in CONFIG
2. Esegui `testDryRun()`
3. Controlla i log per vedere la risposta generata

---

## 🔧 Configurazione Avanzata

### Modifica CONFIG in Main.gs

```javascript
const CONFIG = {
  // Email parrocchia
  TARGET_EMAIL: 'info@parrocchiasanteugenio.it',
  
  // ID Google Sheet
  SPREADSHEET_ID: 'IL_TUO_ID_SPREADSHEET',
  
  // API Key Gemini
  GEMINI_API_KEY: PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY'),
  
  // Modello Gemini
  MODEL_NAME: 'gemini-2.5-flash',
  
  // Modalità test (true = non invia email reali)
  DRY_RUN: false,
  
  // Rate limiter
  USE_RATE_LIMITER: true,
  
  // Nomi fogli
  KB_SHEET_NAME: 'Istruzioni',
  AI_CORE_LITE_SHEET: 'AI_CORE_LITE',
  AI_CORE_SHEET: 'AI_CORE',
  DOCTRINE_SHEET: 'Dottrina',
  REPLACEMENTS_SHEET_NAME: 'Sostituzioni'
};
```

---

## ❓ Risoluzione Problemi

### "GEMINI_API_KEY non configurata"

1. Verifica di aver aggiunto la proprietà script
2. Il nome deve essere esattamente `GEMINI_API_KEY`

### "Sheet not found"

1. Verifica che i nomi dei fogli corrispondano a quelli in CONFIG
2. I nomi sono case-sensitive

### "Authorization required"

1. Esegui una funzione manualmente
2. Clicca su "Rivedi autorizzazioni"
3. Scegli il tuo account Google
4. Clicca "Consenti"

### Le email non vengono elaborate

1. Verifica che il trigger sia attivo (⏰ Trigger)
2. Controlla i log in **Esecuzioni**
3. Assicurati che ci siano email non lette

---

## 📞 Supporto

- **Issues**: [GitHub Issues](https://github.com/dizzighittola/autoresponder/issues)
- **Email**: info@parrocchiasanteugenio.it

---

*Guida creata per il progetto Autoresponder Parrocchiale v2.0*
