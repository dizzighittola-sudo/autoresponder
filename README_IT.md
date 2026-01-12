[![🇬🇧 English](https://img.shields.io/badge/lang-English-blue)](README.md) [![🇮🇹 Italiano](https://img.shields.io/badge/lang-Italiano-green)](README_IT.md)

# 🤖 Autoresponder Parrocchiale con AI

> Sistema intelligente di risposta automatica alle email per parrocchie cattoliche, basato su Google Apps Script e Gemini AI

[![Licenza: MIT](https://img.shields.io/badge/Licenza-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-4285F4?logo=google&logoColor=white)](https://script.google.com)
[![Gemini AI](https://img.shields.io/badge/Gemini%20AI-8E75B2?logo=google&logoColor=white)](https://ai.google.dev)

## 📖 Panoramica

Autoresponder Parrocchiale è un sistema di automazione email pronto per la produzione, progettato specificamente per le parrocchie cattoliche. Risponde automaticamente alle email dei parrocchiani con risposte contestuali, informate sul calendario liturgico e in più lingue, mantenendo un tono caldo e pastorale.

### ✨ Funzionalità Principali

- 🌍 **Supporto Multilingue**: Gestione di italiano, inglese, spagnolo e altre lingue
- 📚 **Knowledge Base Dinamica**: Selezione intelligente delle informazioni in base alla complessità della richiesta
- 🔒 **Validazione Territorio**: Verifica automatica dei confini parrocchiali
- 🕐 **Consapevolezza Liturgica**: Saluti adattivi basati sul calendario liturgico
- 💬 **Memoria Conversazionale**: Mantiene il contesto attraverso i thread email

- 🧪 **Test Completi**: Unit test e integration test per componenti critici
- 📊 **Rate Limiting Intelligente**: Gestione quota API multi-modello

## 🏗️ Architettura

```
┌─────────────────────────────────────────────────────────────┐
│                      Trigger Gmail                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Email Processor                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Filtro     │→ │  Classifica  │→ │   Genera     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│           ↓                 ↓                  ↓            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Valida     │→ │   Memoria    │→ │    Invia     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     Servizi Core                            │
│                                                              │
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ GeminiService │  │MemoryService │  │  PromptEngine   │  │
│  │               │  │              │  │                 │  │
│  │ • Chiamate API│  │ • Tracking   │  │ • Selezione KB  │  │
│  │ • Rilevamento │  │   thread     │  │ • Prompt        │  │
│  │   lingua      │  │ • Gestione   │  │   dinamici      │  │
│  │               │  │   contesto   │  │ • Contesto      │  │
│  │               │  │              │  │   liturgico     │  │
│  └───────────────┘  └──────────────┘  └─────────────────┘  │
│                                                              │
│  ┌──────────────────┐  ┌─────────────────────────────────┐  │
│  │ResponseValidator │  │ TerritoryValidator              │  │
│  │                  │  │                                 │  │
│  │ • Rilevamento    │  │ • Matching indirizzi           │  │
│  │   allucinazioni  │  │ • Verifica confini             │  │
│  │ • Controllo      │  │                                 │  │
│  │   formato        │  │                                 │  │
│  └──────────────────┘  └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Avvio Rapido

### Prerequisiti

- Account Google Workspace con accesso Gmail
- Progetto Google Apps Script
- API key Gemini ([Ottienila qui](https://ai.google.dev))
- Google Sheets per storage knowledge base

### Installazione

1. **Crea un nuovo progetto Google Apps Script**
   ```
   Apri Google Drive → Nuovo → Altro → Google Apps Script
   ```

2. **Copia i file sorgente**
   - Copia tutti i file `.gs` nel tuo progetto Apps Script
   - Mantieni la struttura dei file come fornita

3. **Configura Google Sheets**
   - Crea un nuovo Google Sheet per la knowledge base
   - Configura i fogli: `Istruzioni`, `AI_CORE_LITE`, `AI_CORE`, `Dottrina`, `ConversationMemory`
   - Configura i fogli di controllo: `Controllo`, `Filtri Email`, `Sostituzioni`
   - Copia l'ID del foglio dall'URL

4. **Configura le Proprietà Script**
   ```javascript
   File → Proprietà progetto → Proprietà script → Aggiungi:
   
   GEMINI_API_KEY = la_tua_api_key_gemini
   SHEET_ID = id_del_tuo_google_sheet
   PARISH_EMAIL = info@parrocchiasanteugenio.it
   ```

5. **Configura il trigger Gmail**
   ```javascript
   Esegui: setupTrigger()
   
   // Oppure manualmente:
   Modifica → Trigger del progetto corrente → Aggiungi trigger
   Funzione: processUnreadEmails
   Origine evento: Basato sul tempo
   Intervallo: Ogni 5 minuti
   ```

6. **Testa la configurazione**
   ```javascript
   Esegui: runQuickTest()
   Esegui: testGeminiConnection()
   ```

## 📚 Moduli Principali

### 1. **Main.gs**
Punto di ingresso e gestione configurazione:
- Configurazione globale (oggetto `CONFIG`)
- Caricamento risorse e caching
- Gestione trigger
- Parsing dati strutturati

### 2. **EmailProcessor.gs**
Pipeline di elaborazione principale:
- Filtraggio email (no-reply, loop, auto-email)
- Analisi contesto thread
- Coordinamento generazione risposta
- Aggiornamenti memoria

### 3. **GeminiService.gs**
Layer di integrazione AI:
- Comunicazione API Gemini
- Rilevamento lingua (ibrido AI + regex)

- Rate limiting

### 4. **PromptEngine.gs**
Costruzione prompt intelligente:
- Layer Selezione KB (lite/standard/heavy)
- Iniezione direttive dinamiche
- Consapevolezza contesto liturgico
- Filtraggio basato su concern

### 5. **ResponseValidator.gs**
Quality assurance:
- Rilevamento allucinazioni
- Validazione formato
- Controllo riferimenti territoriali
- Scoring completezza

### 6. **MemoryService.gs**
Contesto conversazionale:
- Storage memoria a livello thread
- Tracking topic
- Consistenza lingua
- Aggiornamenti atomici con locking

### 7. **KnowledgeSelector.gs**
Selezione intelligente KB:
- Scoring multi-fattore
- Budget per profilo (lite/standard/heavy)
- Limiti per source
- Mapping categorie


Pattern resilienza:
- Tracking fallimenti API
- Recovery automatico
- Stato persistente (PropertiesService)
- Stati CLOSED → OPEN → HALF-OPEN

### 9. **UnitTests.gs**
Quality assurance:
- Test regressione bug

- Copertura edge case
- Test integrazione

## 🧪 Testing

### Esegui tutti gli unit test
```javascript
runAllTests()  // 12 unit test per bug critici
```

### Esegui test di integrazione
```javascript
runIntegrationTests()  // 9 test di integrazione
```

### Esegui suite completa
```javascript
runFullTestSuite()  // Tutti i 21 test (unit + integration)
```

### Test rapido
```javascript
runQuickTest()  // Controllo veloce di sanità
```

## ⚙️ Configurazione

### Configurazione Principale (`Main.gs`)

```javascript
const CONFIG = {
  // Impostazioni core
  PARISH_EMAIL: 'info@parrocchiasanteugenio.it',
  SENDER_NAME: 'Segreteria Parrocchiale',
  
  // Rate limiting
  USE_RATE_LIMITER: true,
  
  // Selezione KB
  KB_SELECTION: {
    lite: { maxChunks: 1, maxChars: 800 },
    standard: { maxChunks: 2, maxChars: 1200 },
    heavy: { maxChunks: 3, maxChars: 1600 }
  },
  
  // Modalità test
  DRY_RUN: false  // true per test senza invio
};
```

### Struttura Knowledge Base

Il sistema usa Google Sheets con la seguente struttura:

**Istruzioni**: Informazioni generali parrocchia
- Colonne: `Categoria`, `Chiave di ricerca`, `Risposta`

**AI_CORE_LITE**: Contesto AI essenziale (sempre incluso)
- Colonne: `Topic`, `Contenuto`, `Priorità`

**AI_CORE**: Linee guida AI estese
- Colonne: `Topic`, `Contenuto`, `Priorità`

**Dottrina**: Riferimenti dottrina cattolica
- Colonne: `Argomento`, `Sotto-tema`, `Tono consigliato`, `Criterio pastorale`

**ConversationMemory**: Memoria conversazionale
- Colonne: `threadId`, `language`, `category`, `providedInfo`, `lastUpdated`, `messageCount`

**Controllo**: Accensione/Spegnimento sistema (Kill-Switch)
- Cella **B2**: `Acceso` (ON) oppure `Spento` (OFF)
- Quando è SPENTO, il sistema non processa nessuna email

**Filtri Email**: Filtri email dinamici
- Colonne: `Tipo Filtro`, `Valore`, `Attivo (SI/NO)`
- Tipi: `email` (match esatto), `dominio` (dominio contiene), `keyword` (oggetto/corpo contiene)

**Sostituzioni**: Sostituzioni testo
- Colonne: `Testo Errato`, `Testo Corretto`

## 🌟 Funzionalità Avanzate

### 1. Selezione KB Intelligente

Il sistema seleziona dinamicamente il contenuto della knowledge base:

```javascript
// Modalità Lite (query semplici)
- 1 chunk, ~800 caratteri
- Solo info base

// Modalità Standard (query normali)
- 2 chunk, ~1200 caratteri
- KB principale + linee guida AI

// Modalità Heavy (query complesse)
- 3 chunk, ~1600 caratteri
- KB completa + dottrina + linee guida estese
```

### 2. Consapevolezza Calendario Liturgico

Adattamento automatico saluti basato sul calendario liturgico:

- **Tempo di Natale** (25 Dic - 13 Gen): "Buon Natale!"
- **Tempo di Pasqua** (varia): "Buona Pasqua!"
- **Quaresima**: "Buon cammino di Quaresima"
- **Tempo Ordinario**: Saluti standard basati sull'ora

### 3. Memoria Conversazionale

Tracking contesto a livello thread:
- Persistenza lingua rilevata
- Tracking categoria messaggio
- Topic informazioni fornite
- Timestamp ultima interazione

### 4. Validazione Territorio

Controllo automatico confini parrocchia:
- Normalizzazione indirizzi (accenti, abbreviazioni)
- Matching geografico contro confini parrocchia
- Messaggistica chiara per fuori territorio

### 5. Prevenzione Allucinazioni

Validazione multi-livello:
- Rilevamento frasi proibite
- Controllo struttura formato
- Validazione riferimenti territoriali
- Scoring consistenza KB

## 🔒 Sicurezza e Privacy

### Protezione Dati
- ✅ Nessun dato personale memorizzato permanentemente (conforme GDPR)
- ✅ Foglio memoria contiene solo: threadId, lingua, categoria, topic
- ✅ API key memorizzate in modo sicuro nelle Proprietà Script
- ✅ Nessun contenuto email loggato

### Validazione Input
- ✅ Rilevamento prompt injection
- ✅ Protezione anti-loop (lunghezza max thread)
- ✅ Prevenzione auto-risposta
- ✅ Filtraggio mittenti no-reply

### Rate Limiting
- ✅ Tracking quota API per modello
- ✅ Periodi di cooldown tra richieste


### Controllo Sistema (Kill-Switch)
- ✅ Accensione/Spegnimento via Google Sheets (foglio `Controllo`, cella B2)
- ✅ Valori: `Acceso` (ON) / `Spento` (OFF)
- ✅ Default a SPENTO per sicurezza se foglio non trovato

### Filtri Email Dinamici
- ✅ Filtri caricati dal foglio `Filtri Email`
- ✅ Tre tipi di filtro: `email`, `dominio`, `keyword`
- ✅ Attivazione per singolo filtro (`SI`/`NO`)
- ✅ Combinati con filtri di default hardcoded

## 🐛 Bug Fix e Testing

### Bug Corretti

| Bug ID | Descrizione | Fix | Test |
|--------|-------------|-----|------|
| #1 | Race condition aggiornamenti memoria | Locking atomico | ✅ |
| #2 | Regex orari matchava URL | Boundary check | ✅ |
| #3 | Cache non invalidata su errore | Error handling | ✅ |
| #4 | Deadlock caricamento risorse | Lock con timeout | ✅ |
| #5 | Rilevamento spagnolo troppo sensibile | Aggiustamento pesi | ✅ |
| #7 | NaN in computazione saluto | Check NaN esplicito | ✅ |

### Copertura Test

- **21 test totali** (12 unit + 9 integration)
- **100% copertura** bug fix
- **Test edge case** (null, invalidi, valori limite)

- **Integrazione componenti** (classificazione, rilevamento lingua, validazione)
- **Workflow end-to-end** (modalità dry-run)

## 📧 Contatti e Supporto

- **Issues**: [GitHub Issues](https://github.com/dizzighittola/autoresponder/issues)
- **Discussioni**: [GitHub Discussions](https://github.com/dizzighittola/autoresponder/discussions)
- **Email**: info@parrocchiasanteugenio.it

## 📝 Changelog

### v2.0.0 (Attuale)

- ✅ Implementato framework unit testing completo
- ✅ Corretti 6 bug critici
- ✅ Aggiunto Layer Selezione KB per ottimizzazione token
- ✅ Migliorata accuratezza rilevamento multi-lingua
- ✅ Potenziata consapevolezza calendario liturgico

### v2.1.0 (Ultimo)
- ✅ Aggiunto Controllo Sistema (Kill-Switch) via foglio `Controllo`
- ✅ Aggiunti Filtri Email Dinamici via foglio `Filtri Email`
- ✅ Supporto attivazione per singolo filtro

### v1.0.0
- Release iniziale con funzionalità core

## 📄 Licenza

Questo progetto è rilasciato sotto licenza MIT.

---

**Sviluppato con ❤️ per le parrocchie cattoliche**

*"Dove due o tre sono riuniti nel mio nome, io sono in mezzo a loro." - Matteo 18,20*
