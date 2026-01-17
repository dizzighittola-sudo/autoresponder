# 🤖 Autoresponder Email Parrocchiale

[![Language](https://img.shields.io/badge/🇬🇧_English-blue?style=for-the-badge)](README.md) [![Language](https://img.shields.io/badge/🇮🇹_Italiano-red?style=for-the-badge)](README_IT.md) [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE) [![GAS](https://img.shields.io/badge/Google%20Apps%20Script-v8-green.svg)](https://developers.google.com/apps-script) [![AI](https://img.shields.io/badge/Gemini-2.5%20Flash-orange.svg)](https://ai.google.dev/) [![Status](https://img.shields.io/badge/status-production-success.svg)](#-stato-progetto)

> **Autoresponder email intelligente basato su AI per segreterie parrocchiali cattoliche** — Costruito con Google Apps Script e API Google Gemini

Trasforma il flusso di lavoro email della tua parrocchia con un assistente AI che risponde in modo intelligente quando la segreteria non è disponibile. Perfetto per notti, weekend, festività e periodi di ferie.

---

## 🌟 Perché Questo Progetto?

Le segreterie parrocchiali ricevono centinaia di email su orari delle messe, preparazione ai sacramenti, richieste di documenti e guida pastorale. Questo sistema fornisce:

- **Disponibilità 24/7** quando il personale umano non può rispondere
- **Risposte intelligenti e pastorali** usando l'AI Gemini di Google
- **Supporto multilingue** per comunità diverse
- **Risposte consapevoli del contesto** che ricordano la cronologia della conversazione
- **Validazione territorio** per idoneità battesimi/matrimoni
- **Costo zero** usando servizi Google gratuiti

---

## 📋 Funzionalità Principali

| Funzionalità | Descrizione |
|--------------|-------------|
| 🤖 **Risposte AI** | Usa Gemini 2.5 Flash per risposte intelligenti e contestuali |
| 📅 **Schedulazione Intelligente** | Si attiva solo quando l'ufficio è chiuso (notti, weekend, festività) |
| 🌍 **Multilingue** | Rileva automaticamente e risponde in IT, EN, ES, FR, DE, PL, TR, PT... |
| 📊 **Gestione Quote** | Gestione intelligente quote con fallback automatico tra modelli |
| ✅ **Validazione Risposte** | Controlli qualità prima dell'invio per prevenire allucinazioni |
| 🧠 **Memoria Conversazione** | Mantiene il contesto attraverso i thread email |
| 🏠 **Validazione Territorio** | Verifica indirizzi entro i confini parrocchiali |
| 📈 **Monitoraggio** | Health check integrati e dashboard utilizzo |

---

## 🎯 Impatto nel Mondo Reale

**Prima:**
- Email senza risposta per 48+ ore
- Parrocchiani frustrati che chiamano più volte
- Staff sopraffatto il lunedì mattina

**Dopo:**
- Acknowledgment istantaneo con informazioni utili
- Volume chiamate telefoniche ridotto del 40%
- Staff concentrato su casi complessi che richiedono tocco umano

---

## 🚀 Avvio Rapido

### Prerequisiti

- Account Google Workspace (funziona anche Gmail gratuito)
- Google Sheets per knowledge base
- [Chiave API Gemini](https://ai.google.dev/) (tier gratuito: 1.500 richieste/giorno)
- 10 minuti tempo di setup

### Installazione

```bash
# 1. Installa CLI Google Apps Script
npm install -g @google/clasp

# 2. Clona questo repository
git clone https://github.com/dizzighittola/parish-autoresponder.git
cd parish-autoresponder

# 3. Login a Google Apps Script
clasp login

# 4. Crea nuovo progetto Apps Script
clasp create --type standalone --title "Parish Autoresponder"

# 5. Carica codice su Apps Script
clasp push
```

### Configurazione

1. **Ottieni Chiave API Gemini** (gratuita)
   - Visita https://ai.google.dev/
   - Crea chiave API
   - Copia chiave per prossimo passaggio

2. **Imposta Script Properties**
   - Apri Apps Script Editor
   - Impostazioni Progetto → Script Properties
   - Aggiungi:
     - `GEMINI_API_KEY`: La tua chiave API
     - `SPREADSHEET_ID`: ID spreadsheet knowledge base

3. **Crea Knowledge Base**
   - Copia [questo template](KNOWLEDGE_BASE_TEMPLATE_IT.md)
   - Compila con informazioni parrocchia
   - Salva ID spreadsheet in Script Properties

4. **Crea Trigger Temporizzato**
   - In Apps Script Editor, esegui funzione: `createTimeTrigger()`
   - Autorizza e imposta esecuzione intervallo 10 minuti

**✅ Fatto!** Il tuo autoresponder è ora attivo.

---

## 📊 Panoramica Architettura

```
┌─────────────────────────────────────────────────────────────────┐
│                      PIPELINE ELABORAZIONE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 📬 FILTRA    →  Dobbiamo processare questa email?          │
│     ├─ Blocklist domini/parole chiave                          │
│     ├─ Rilevamento anti-loop                                   │
│     └─ Filtro messaggi auto-inviati                            │
│                                                                 │
│  2. 🔍 CLASSIFICA →  Che tipo di richiesta è?                  │
│     ├─ Filtro acknowledgment ultra-semplice                    │
│     ├─ Quick check Gemini (rispondere: sì/no)                  │
│     └─ Classificazione Tecnica/Pastorale/Dottrinale           │
│                                                                 │
│  3. 🤖 GENERA    →  Crea risposta AI                            │
│     ├─ Composizione prompt dinamico (18 template)              │
│     ├─ Iniezione knowledge base                                │
│     ├─ Contesto cronologia conversazione                       │
│     └─ Chiamata API Gemini con rate limiting                   │
│                                                                 │
│  4. ✅ VALIDA    →  Controllo qualità                           │
│     ├─ Check lunghezza (25-3000 caratteri)                     │
│     ├─ Consistenza lingua                                      │
│     ├─ Rilevamento allucinazioni (email/telefoni/orari fake)  │
│     ├─ Validazione grammatica (maiuscola dopo virgola)         │
│     └─ Presenza firma                                          │
│                                                                 │
│  5. 📧 INVIA     →  Rispondi all'email                          │
│     ├─ Conversione Markdown → HTML                             │
│     ├─ Safeguard sostituzione testo                            │
│     ├─ Aggiorna memoria conversazione                          │
│     └─ Etichetta messaggio come processato                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Struttura Moduli

| Modulo | Scopo | Classi Principali |
|--------|-------|-------------------|
| **Main.gs** | Entry point, configurazione | `CONFIG`, logica festività |
| **EmailProcessor.gs** | Orchestratore pipeline | `EmailProcessor` |
| **GeminiService.gs** | Integrazione AI | `GeminiService` |
| **GeminiRateLimiter.gs** | Gestione quote | `GeminiRateLimiter` |
| **Classifier.gs** | Filtro email | `EmailClassifier` |
| **RequestTypeClassifier.gs** | Categorizzazione richieste | `RequestTypeClassifier` |
| **PromptEngine.gs** | Generazione prompt | `PromptEngine` |
| **ResponseValidator.gs** | Controlli qualità | `ResponseValidator` |
| **GmailService.gs** | Operazioni Gmail | `GmailService` |
| **MemoryService.gs** | Contesto conversazione | `MemoryService` |
| **TerritoryValidator.gs** | Verifica indirizzi | `TerritoryValidator` |

---

## 🔧 Guida Configurazione

### Calendario Attivazione

Il sistema **si attiva** (risponde) quando la segreteria non è disponibile:

| Condizione | Comportamento |
|------------|---------------|
| **Notti feriali** | ✅ Attivo (segreteria chiusa) |
| **Weekend** | ✅ Attivo (Sabato e Domenica) |
| **Festività** | ✅ Attivo (Pasqua, Natale, Festività Nazionali) |
| **Orari Lavoro** | ⏸️ Sospeso (segreteria lavora) |

**Orari Ufficio** (sistema sospeso):
- Lunedì: 8:00-20:00
- Martedì: 8:00-14:00
- Mercoledì: 8:00-17:00
- Giovedì: 8:00-14:00
- Venerdì: 8:00-17:00

> **Nota:** Personalizza calendario in `Main.gs` → `SUSPENSION_HOURS` e `ALWAYS_OPERATING_DAYS`

### Quote API Gemini (Gennaio 2026)

| Modello | RPM | TPM | RPD | Scopo |
|---------|-----|-----|-----|-------|
| `gemini-2.5-flash` | 10 | 250K | 250 | 🥇 Generazione risposte |
| `gemini-2.5-flash-lite` | 15 | 250K | 1.000 | 🥈 Quick check + fallback |
| `gemini-2.0-flash` | 5 | 250K | 100 | 🥉 Backup legacy |

⏰ **Reset quote:** 9:00 ora italiana (mezzanotte Pacific)

Il sistema passa automaticamente tra modelli quando le quote sono esaurite.

---

## 📁 Struttura Knowledge Base

Il sistema usa Google Sheets per gestione contenuti facile:

| Nome Sheet | Scopo | Contenuto Esempio |
|------------|-------|-------------------|
| **Istruzioni** | Info operative | Orari messe, contatti, procedure |
| **AI_CORE_LITE** | Principi pastorali base | Linee guida tono, situazioni comuni |
| **AI_CORE** | Guida pastorale estesa | Scenari discernimento complessi |
| **Dottrina** | Linee guida dottrinali | Insegnamento cattolico su sacramenti, matrimonio, ecc. |
| **Sostituzioni** | Sostituzioni testo | Correzioni automatiche (es. "peregrinaggio" → "pellegrinaggio") |
| **ConversationMemory** | Contesto thread | Lingua, categoria, info fornite |

**Suggerimento:** Aggiorna regolarmente la tua knowledge base. La qualità dell'AI dipende dal tuo contenuto!

---

## 🛠️ Funzioni Utilità

Esegui queste dall'Apps Script Editor:

| Funzione | Scopo | Quando Usare |
|----------|-------|--------------|
| `main()` | Esecuzione manuale | Test o trigger manuale |
| `testDryRun()` | Test senza invio | Ambiente test sicuro |
| `testGeminiConnection()` | Verifica accesso API | Troubleshoot problemi API |
| `healthCheck()` | Stato completo sistema | Monitora salute sistema |
| `showQuotaDashboard()` | Visualizza utilizzo quote | Traccia consumo API |
| `cleanupMemory()` | Rimuovi vecchia memoria | Housekeeping (auto-settimanale) |
| `testHolidayLogic()` | Verifica calendario | Conferma date attivazione |

---

## 🔒 Sicurezza e Privacy

### Gestione Dati

- **Contenuto email:** Processato da Google Gemini API (vedi [Termini Google AI](https://ai.google.dev/gemini-api/terms))
- **Memoria conversazione:** Salvata nel tuo Google Sheet (tuo controllo)
- **Nessuno storage esterno:** Tutti i dati rimangono nell'ecosistema Google
- **Sicurezza chiave API:** Salvata in Script Properties (criptata da Google)

### Best Practice

✅ **Fai:**
- Rivedi periodicamente le risposte generate
- Aggiorna knowledge base con informazioni accurate
- Monitora etichette errore per problemi
- Testa modifiche in modalità dry-run prima

❌ **Non fare:**
- Condividere pubblicamente la tua chiave API
- Includere dati personali sensibili nella knowledge base
- Disabilitare validazione senza capire i rischi
- Dimenticare di monitorare l'utilizzo quote

---

## 📖 Documentazione

- **[Guida Setup](SETUP_IT.md)** — Installazione passo-passo
- **[Riferimento Configurazione](CONFIGURATION_IT.md)** — Tutte le opzioni spiegate
- **[Guida Knowledge Base](KNOWLEDGE_BASE_TEMPLATE_IT.md)** — Creare contenuti di qualità
- **[Troubleshooting](TROUBLESHOOTING_IT.md)** — Problemi comuni e soluzioni
- **[Contribuire](CONTRIBUTING_IT.md)** — Come contribuire

---

## 🤝 Contribuire

I contributi sono benvenuti! Che si tratti di:

- 🐛 Segnalazioni bug
- 💡 Richieste funzionalità
- 📖 Miglioramenti documentazione
- 🌍 Traduzioni
- 💻 Contributi codice

Vedi [CONTRIBUTING_IT.md](CONTRIBUTING_IT.md) per linee guida.

---

## 📊 Stato Progetto

### Versione Attuale: 2.3.7

**Funzionalità Stabili:**
- ✅ Pipeline elaborazione email core
- ✅ Rilevamento multi-lingua (12 lingue)
- ✅ Integrazione API Gemini con rate limiting
- ✅ Validazione risposta (7 controlli)
- ✅ Memoria conversazione
- ✅ Validazione territorio
- ✅ Schedulazione festività

**Roadmap:**
- 🚧 Dashboard web per monitoraggio
- 🚧 Supporto modello custom fine-tuned
- 🚧 Analitiche avanzate
- 🚧 Template deployment multi-parrocchia

---

## ❓ FAQ

**D: Funziona con Microsoft 365 / Outlook?**  
R: Attualmente solo Gmail. Integrazione Outlook in roadmap.

**D: Cosa succede se Gemini fa un errore?**  
R: Le risposte sono validate prima dell'invio. I casi di errore vengono flaggati con etichetta `IA_VALIDATION_ERROR` per revisione umana.

**D: Posso personalizzare la personalità dell'AI?**  
R: Sì! Modifica i template prompt sistema in `PromptEngine.gs` e le linee guida pastorali nella tua knowledge base.

**D: È conforme al GDPR?**  
R: L'elaborazione email usa l'infrastruttura Google (conforme GDPR). Rivedi [Termini Google AI](https://ai.google.dev/gemini-api/terms) per specifiche API Gemini.

**D: Quanto costa?**  
R: **Gratuito** se rimani entro il tier gratuito Gemini (1.500 richieste/giorno). Utilizzo tipico parrocchia: 50-150 richieste/giorno.

---

## 🙏 Riconoscimenti

**Costruito con:**
- [Google Apps Script](https://developers.google.com/apps-script)
- [Google Gemini API](https://ai.google.dev/)
- [Gmail API](https://developers.google.com/gmail/api)
- [Google Sheets API](https://developers.google.com/sheets/api)

**Ispirato da:**
- Esigenze reali segreterie parrocchiali
- Desiderio di servire le comunità 24/7
- Il potenziale dell'AI per il bene

**Grazie speciali a:**
- Staff parrocchiale che ha fornito feedback
- Il team Google Gemini
- Early adopter e tester

---

## 📄 Licenza

MIT License - Vedi file [LICENSE](LICENSE) (originale inglese) o [LICENSE_IT](LICENSE_IT) (traduzione italiana)

Copyright (c) 2025 Contributori Parish Autoresponder

---

## 📞 Supporto e Comunità

- **Problemi:** [GitHub Issues](https://github.com/dizzighittola/parish-autoresponder/issues)
- **Discussioni:** [GitHub Discussions](https://github.com/dizzighittola/parish-autoresponder/discussions)
- **Email:** dizzighittola@gmail.com

---

<div align="center">

**Fatto con ❤️ per le comunità parrocchiali**

⭐ Dai una stella a questo repo se aiuta la tua parrocchia! ⭐

</div>
