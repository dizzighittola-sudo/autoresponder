# Riferimento Configurazione

Riferimento completo per tutte le opzioni di configurazione dell'Autoresponder Email Parrocchiale.

## Indice

- [Configurazione Principale (CONFIG)](#configurazione-principale-config)
- [Impostazioni API Gemini](#impostazioni-api-gemini)
- [Impostazioni Gmail](#impostazioni-gmail)
- [Impostazioni Knowledge Base](#impostazioni-knowledge-base)
- [Impostazioni Validazione](#impostazioni-validazione)
- [Impostazioni Schedulazione](#impostazioni-schedulazione)
- [Impostazioni Avanzate](#impostazioni-avanzate)

---

## Configurazione Principale (CONFIG)

Tutte le impostazioni core sono in `Main.gs` → oggetto `CONFIG`.

### Struttura

```javascript
const CONFIG = {
  // Impostazioni API
  GEMINI_API_KEY: 'your-api-key',
  MODEL_NAME: 'gemini-2.5-flash',
  
  // Impostazioni Generazione
  TEMPERATURE: 0.5,
  MAX_OUTPUT_TOKENS: 6000,
  
  // Impostazioni Validazione
  VALIDATION_ENABLED: true,
  VALIDATION_MIN_SCORE: 0.6,
  VALIDATION_STRICT_MODE: false,
  
  // Impostazioni Gmail
  LABEL_NAME: 'IA',
  ERROR_LABEL_NAME: 'IA-Error',
  VALIDATION_ERROR_LABEL: 'IA_VALIDATION_ERROR',
  MAX_EMAILS_PER_RUN: 10,
  
  // Impostazioni Knowledge Base
  SPREADSHEET_ID: 'your-sheet-id',
  KB_SHEET_NAME: 'Istruzioni',
  AI_CORE_LITE_SHEET: 'AI_CORE_LITE',
  AI_CORE_SHEET: 'AI_CORE',
  DOCTRINE_SHEET: 'Dottrina',
  REPLACEMENTS_SHEET_NAME: 'Sostituzioni',
  MEMORY_SHEET_NAME: 'ConversationMemory',
  
  // Impostazioni Modalità
  DRY_RUN: false,
  USE_RATE_LIMITER: true,
  
  // Configurazione Modelli
  GEMINI_MODELS: { /* ... */ },
  MODEL_STRATEGY: { /* ... */ }
};
```

---

## Impostazioni API Gemini

### GEMINI_API_KEY

**Tipo:** Stringa  
**Richiesto:** Sì  
**Fonte:** Script Properties  

**Descrizione:** La tua chiave API Gemini da https://ai.google.dev/

**Setup:**
```javascript
// Imposta tramite Script Properties (consigliato)
// Apps Script Editor → Impostazioni Progetto → Script Properties
Chiave: GEMINI_API_KEY
Valore: AIzaSy...
```

**Sicurezza:** Mai committare la chiave API nel controllo versione!

---

### MODEL_NAME

**Tipo:** Stringa  
**Default:** `'gemini-2.5-flash'`  
**Opzioni:**
- `'gemini-2.5-flash'` - Ultimo, più capace (consigliato)
- `'gemini-2.5-flash-lite'` - Più veloce, economico, quote più alte
- `'gemini-2.0-flash'` - Modello legacy

**Descrizione:** Modello di default per chiamate API quando il rate limiter è disabilitato.

**Quando rate limiter abilitato:** Ignorato (usa configurazione `GEMINI_MODELS`).

---

### TEMPERATURE

**Tipo:** Numero  
**Range:** 0.0 - 2.0  
**Default:** `0.5`  

**Descrizione:** Controlla creatività/casualità risposta.

**Linee guida:**
- **0.0-0.3:** Molto focalizzato, deterministico (buono per info fattuali)
- **0.4-0.7:** Bilanciato (consigliato per uso parrocchiale)
- **0.8-1.2:** Più creativo, risposte varie
- **1.3+:** Molto creativo, potenzialmente inconsistente

---

### MAX_OUTPUT_TOKENS

**Tipo:** Intero  
**Default:** `6000`  
**Range:** 1 - 8192 (dipende dal modello)  

**Descrizione:** Token massimi nella risposta generata.

**Linee guida:**
- **1000-2000:** Risposte brevi, concise
- **2000-4000:** Risposte standard (consigliato)
- **4000-6000:** Risposte dettagliate

---

## Impostazioni Gmail

### LABEL_NAME

**Tipo:** Stringa  
**Default:** `'IA'`  

**Descrizione:** Etichetta applicata ai messaggi processati.

**Scopo:**
- Previene ri-processamento stesso messaggio
- Permette filtro email processate

---

### ERROR_LABEL_NAME

**Tipo:** Stringa  
**Default:** `'IA-Error'`  

**Descrizione:** Etichetta per email che hanno causato errori durante elaborazione.

**Controllare regolarmente** per identificare problemi di sistema.

---

### VALIDATION_ERROR_LABEL

**Tipo:** Stringa  
**Default:** `'IA_VALIDATION_ERROR'`  

**Descrizione:** Etichetta per email dove risposta generata ha fallito validazione.

**Controlli validazione:**
- Requisiti lunghezza
- Consistenza lingua
- Rilevamento allucinazioni
- Regole grammatica
- Firma richiesta

**Revisione manuale consigliata** prima di inviare queste risposte.

---

### MAX_EMAILS_PER_RUN

**Tipo:** Intero  
**Default:** `10`  
**Range:** 1 - 50  

**Descrizione:** Massime email processate per esecuzione trigger.

**Ottimizzazione:**
```javascript
// Se timeout frequenti:
MAX_EMAILS_PER_RUN: 5

// Se sottoutilizzo quota:
MAX_EMAILS_PER_RUN: 15
```

---

## Impostazioni Knowledge Base

### SPREADSHEET_ID

**Tipo:** Stringa  
**Richiesto:** Sì  
**Fonte:** Script Properties  

**Descrizione:** ID Google Sheet contenente knowledge base.

---

### KB_SHEET_NAME

**Tipo:** Stringa  
**Default:** `'Istruzioni'`  

**Descrizione:** Nome foglio contenente informazioni operative.

---

### AI_CORE_LITE_SHEET

**Tipo:** Stringa  
**Default:** `'AI_CORE_LITE'`  

**Descrizione:** Foglio con principi pastorali base e linee guida tono.

---

### AI_CORE_SHEET

**Tipo:** Stringa  
**Default:** `'AI_CORE'`  

**Descrizione:** Guida pastorale estesa per scenari discernimento complessi.

---

### DOCTRINE_SHEET

**Tipo:** Stringa  
**Default:** `'Dottrina'`  

**Descrizione:** Linee guida dottrinali cattoliche.

---

### REPLACEMENTS_SHEET_NAME

**Tipo:** Stringa  
**Default:** `'Sostituzioni'`  

**Descrizione:** Sostituzioni testo applicate a risposte prima dell'invio.

**Casi d'uso:**
- Correzione typo comuni
- Standardizzazione terminologia
- Aggiornamento termini deprecati

---

### MEMORY_SHEET_NAME

**Tipo:** Stringa  
**Default:** `'ConversationMemory'`  

**Descrizione:** Foglio che memorizza contesto conversazione.
**Auto-creato dal sistema.** Non modificare manualmente.

---

## Impostazioni Validazione

### VALIDATION_ENABLED

**Tipo:** Booleano  
**Default:** `true`  

**Descrizione:** Abilita/disabilita validazione risposta prima invio.
**Sempre mantenere abilitato** eccetto debug.

---

### VALIDATION_MIN_SCORE

**Tipo:** Numero  
**Range:** 0.0 - 1.0  
**Default:** `0.6`  

**Descrizione:** Punteggio minimo validazione per passare.

---

### VALIDATION_STRICT_MODE

**Tipo:** Booleano  
**Default:** `false`  

**Descrizione:** Abilita regole validazione più severe.

**Usa quando:**
- Vuoi stabilire credibilità sistema
- Comunicazioni importanti
- Lingue con regole grammaticali severe (Italiano)

---

## Impostazioni Schedulazione

### SUSPENSION_HOURS

**Tipo:** Oggetto  
**Posizione:** `Main.gs`  

**Descrizione:** Orari ufficio quando il sistema è sospeso (non risponde).

**Formato:**
```javascript
const SUSPENSION_HOURS = {
  1: [[8, 20]],     // Lunedì: 8-20
  2: [[8, 14]],     // Martedì: 8-14
  // ...
};
```
**Codici giorni:** 0=Domenica, 1=Lunedì, ..., 6=Sabato

---

### ALWAYS_OPERATING_DAYS

**Tipo:** Array  
**Posizione:** `Main.gs`  

**Descrizione:** Date in cui il sistema opera sempre (festività).

**Formato:**
```javascript
const ALWAYS_OPERATING_DAYS = [
  [MONTH.JAN, 1],    // 1 Gennaio
  [MONTH.DEC, 25],   // 25 Dicembre
];
```

---

## Impostazioni Avanzate

### DRY_RUN

**Tipo:** Booleano  
**Default:** `false`  

**Descrizione:** Modalità test - processa email ma non invia risposte.

**Abilita:**
```javascript
DRY_RUN: true
```

---

### USE_RATE_LIMITER

**Tipo:** Booleano  
**Default:** `true`  

**Descrizione:** Abilita rate limiter intelligente con gestione quote.

---

### GEMINI_MODELS

**Tipo:** Oggetto  
**Descrizione:** Configurazioni modelli con quote.

---

### MODEL_STRATEGY

**Tipo:** Oggetto  
**Descrizione:** Ordine selezione modelli per diversi task.

```javascript
MODEL_STRATEGY: {
  'quick_check': ['flash-lite', 'flash-2.5'],     // Controlli veloci
  'generation': ['flash-2.5', 'flash-lite'],      // Qualità prima
  'fallback': ['flash-lite', 'flash-2.0']         // Emergenza
}
```

---

## Script Properties vs CONFIG

**Script Properties** (sicuro, persistente):
- Chiavi API
- ID Spreadsheet
- Credenziali sensibili

**Oggetto CONFIG** (codice, versionato):
- Impostazioni comportamento
- Soglie
- Feature flags

---

## Risoluzione Problemi Configurazione

### Modifiche Non Hanno Effetto

**Problema:** Modificato CONFIG ma comportamento invariato.

**Soluzione:**
```javascript
// 1. Pulisci cache globale
GLOBAL_CACHE = {};
// 2. Ricarica risorse
loadResources();
// 3. Testa di nuovo
testDryRun();
```

---

## Documentazione Correlata

- [Guida Setup](SETUP_IT.md) - Configurazione iniziale
- [Risoluzione Problemi](TROUBLESHOOTING_IT.md) - Problemi comuni
- [README Principale](README_IT.md) - Panoramica

---

**Domande sulla configurazione?**
- [GitHub Discussions](https://github.com/dizzighittola/parish-autoresponder/discussions)
- [GitHub Issues](https://github.com/dizzighittola/parish-autoresponder/issues)
