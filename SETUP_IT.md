# Guida al Setup

Guida completa passo-passo per l'installazione e la configurazione dell'Autoresponder Email Parrocchiale.

## Indice

- [Prerequisiti](#prerequisiti)
- [Passaggio 1: Ottieni Chiave API Gemini](#passaggio-1-ottieni-chiave-api-gemini)
- [Passaggio 2: Installa Apps Script CLI](#passaggio-2-installa-apps-script-cli)
- [Passaggio 3: Distribuisci Codice](#passaggio-3-distribuisci-codice)
- [Passaggio 4: Crea Knowledge Base](#passaggio-4-crea-knowledge-base)
- [Passaggio 5: Configura Script Properties](#passaggio-5-configura-script-properties)
- [Passaggio 6: Abilita Gmail API](#passaggio-6-abilita-gmail-api)
- [Passaggio 7: Crea Trigger Temporizzato](#passaggio-7-crea-trigger-temporizzato)
- [Passaggio 8: Testa il Sistema](#passaggio-8-testa-il-sistema)
- [Risoluzione Problemi](#risoluzione-problemi)

---

## Prerequisiti

Prima di iniziare, assicurati di avere:

- ✅ Account Google (Gmail o Workspace)
- ✅ Node.js installato (v14 o superiore)
- ✅ Familiarità base con la riga di comando
- ✅ 30 minuti di tempo per il setup

**Verifica versione Node.js:**
```bash
node --version
# Dovrebbe mostrare v14.0.0 o superiore
```

---

## Passaggio 1: Ottieni Chiave API Gemini

### 1.1 Crea Chiave API

1. Visita https://ai.google.dev/
2. Clicca "Get API key" in alto a destra
3. Accedi con il tuo account Google
4. Clicca "Create API key"
5. Seleziona o crea un progetto Google Cloud
6. Copia la chiave API generata

**Importante:** Tieni questa chiave al sicuro! Non condividerla o caricarla su sistemi di controllo versione.

### 1.2 Verifica Chiave API

Testa che la tua chiave funzioni:

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=LA_TUA_CHIAVE_API" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Ciao"}]}]}'
```

Dovresti vedere una risposta JSON con del testo generato.

---

## Passaggio 2: Installa Apps Script CLI

### 2.1 Installa clasp

```bash
npm install -g @google/clasp
```

### 2.2 Login a Google

```bash
clasp login
```

Questo apre una finestra del browser per l'autenticazione. Concedi i permessi richiesti.

### 2.3 Verifica Installazione

```bash
clasp --version
# Dovrebbe mostrare il numero di versione (es. 2.4.2)
```

---

## Passaggio 3: Distribuisci Codice

### 3.1 Clona Repository

```bash
git clone https://github.com/dizzighittola/parish-autoresponder.git
cd parish-autoresponder
```

### 3.2 Crea Progetto Apps Script

```bash
clasp create --type standalone --title "Parish Autoresponder"
```

Questo crea un nuovo progetto Apps Script collegato al tuo account.

### 3.3 Carica Codice su Apps Script

```bash
clasp push
```

Conferma l'upload quando richiesto.

### 3.4 Apri nel Browser

```bash
clasp open
```

Questo apre il tuo progetto nell'Editor di Apps Script.

---

## Passaggio 4: Crea Knowledge Base

### 4.1 Crea Google Sheet

1. Vai su https://sheets.google.com
2. Crea nuovo foglio di calcolo
3. Chiamalo "Knowledge Base Parrocchia"

### 4.2 Crea Fogli Richiesti

Crea queste schede nel tuo foglio di calcolo:

1. **Istruzioni** (Info operative)
2. **AI_CORE_LITE** (Principi pastorali base)
3. **AI_CORE** (Guida pastorale estesa)
4. **Dottrina** (Linee guida dottrinali)
5. **Sostituzioni** (Sostituzioni testo)
6. **ConversationMemory** (Auto-creato dal sistema)

### 4.3 Compila Knowledge Base

**Esempio Tab Istruzioni:**

| Categoria | Domanda | Risposta |
|-----------|---------|----------|
| Orari Messe | Feriale | Lunedì-Venerdì: 7:30, 18:00 |
| Orari Messe | Festivo | Sabato: 18:00, Domenica: 9:00, 11:00, 18:00 |
| Contatti | Telefono | +39 06 1234567 |
| Contatti | Email | parrocchia@esempio.it |
| Contatti | Indirizzo | Via Roma 1, Città, CAP |

Vedi [Template Knowledge Base](KNOWLEDGE_BASE_TEMPLATE_IT.md) per la struttura completa.

### 4.4 Ottieni ID Spreadsheet

Dall'URL del tuo Google Sheet:
```
https://docs.google.com/spreadsheets/d/ID_SPREADSHEET_QUI/edit
```

Copia la parte `ID_SPREADSHEET_QUI` (lunga stringa di lettere/numeri).

---

## Passaggio 5: Configura Script Properties

### 5.1 Apri Impostazioni Progetto

Nell'Editor Apps Script:
1. Clicca ⚙️ (Impostazioni Progetto) nella barra laterale sinistra
2. Scorri a "Proprietà dello script"
3. Clicca "Aggiungi proprietà script"

### 5.2 Aggiungi Proprietà

Aggiungi queste due proprietà:

| Proprietà | Valore |
|-----------|--------|
| `GEMINI_API_KEY` | La tua chiave API dal Passaggio 1 |
| `SPREADSHEET_ID` | Il tuo ID foglio dal Passaggio 4.4 |

### 5.3 Verifica Proprietà

Clicca "Salva proprietà dello script" e assicurati che entrambe appaiano nella lista.

---

## Passaggio 6: Abilita Gmail API

### 6.1 Abilita Servizio Avanzato

Nell'Editor Apps Script:
1. Clicca ⚙️ (Impostazioni Progetto)
2. Scorri a "Servizi Google"
3. Trova "Gmail API v1"
4. Attiva l'interruttore su **ON**

### 6.2 Abilita in Google Cloud Console

1. Nelle Impostazioni Progetto, clicca il link sotto "Progetto Google Cloud Platform (GCP)"
2. Clicca "API e servizi" → "Libreria"
3. Cerca "Gmail API"
4. Clicca "Abilita"

---

## Passaggio 7: Crea Trigger Temporizzato

### 7.1 Esegui Funzione Setup Trigger

Nell'Editor Apps Script:

1. Seleziona funzione: `createTimeTrigger` dal menu a tendina
2. Clicca ▶️ Esegui
3. Concedi permessi quando richiesto:
   - Rivedi permessi
   - Clicca "Avanzate"
   - Clicca "Vai a Parish Autoresponder (non sicuro)" *(questo è il tuo script)*
   - Clicca "Consenti"

### 7.2 Verifica Creazione Trigger

1. Clicca ⏰ (Attivatori) nella barra laterale sinistra
2. Dovresti vedere:
   - Funzione: `main`
   - Origine evento: Basato sul tempo
   - Tipo: Timer in minuti
   - Intervallo: Ogni 10 minuti

---

## Passaggio 8: Testa il Sistema

### 8.1 Esegui Health Check

Nell'Editor Apps Script:
1. Seleziona funzione: `healthCheck`
2. Clicca ▶️ Esegui
3. Clicca "Visualizza" → "Log di esecuzione" (Ctrl+Enter)
4. Verifica che tutti i controlli passino:
   ```
   Gemini API: ✓ OK
   Gmail API: ✓ OK
   Memory: ✓ OK
   Knowledge Base: ✓ OK
   ```

### 8.2 Testa Connessione Gemini

Seleziona ed esegui: `testGeminiConnection`

Output atteso:
```javascript
{
  "connectionOk": true,
  "canGenerate": true,
  "isHealthy": true,
  "errors": []
}
```

### 8.3 Testa Connessione Gmail

Seleziona ed esegui: `testGmailConnection`

Output atteso:
```javascript
{
  "connectionOk": true,
  "canListMessages": true,
  "canCreateLabels": true,
  "isHealthy": true,
  "errors": []
}
```

### 8.4 Test Dry Run

Seleziona ed esegui: `testDryRun`

Questo processa email reali ma **non invia** risposte. Controlla i log per:
```
🔴 DRY RUN MODE ACTIVE - Emails will NOT be sent!
```

---

## Risoluzione Problemi

### "Gemini API: ❌ FAIL"

**Problema:** Chiave API non valida o quota superata

**Soluzioni:**
1. Verifica chiave API nelle Script Properties
2. Controlla che la chiave non sia stata eliminata da Google AI Studio
3. Verifica quota su https://ai.google.dev/
4. Attendi reset quota (9:00 ora italiana)

### "Gmail API: ❌ FAIL"

**Problema:** Gmail API non abilitata o permessi insufficienti

**Soluzioni:**
1. Verifica Gmail API abilitata nel Passaggio 6
2. Ri-autorizza: Elimina trigger, esegui `createTimeTrigger` di nuovo
3. Controlla Google Cloud Console per stato API

### "Knowledge Base: ❌ FAIL"

**Problema:** Foglio non accessibile o ID errato

**Soluzioni:**
1. Verifica SPREADSHEET_ID nelle Script Properties
2. Assicurati che lo script abbia accesso al foglio
3. Controlla che il foglio abbia le schede richieste (Istruzioni, AI_CORE_LITE, ecc.)

### "Nessuna email processata"

**Problema:** Sistema non trova email non lette o è sospeso

**Soluzioni:**
1. Controlla che il trigger sia attivo (⏰ Attivatori)
2. Verifica che l'ora attuale NON sia ore ufficio:
   - Esegui `testHolidayLogic()` per vedere orari
3. Invia email di prova ed esegui manualmente `main()`

### "Risposte sembrano sbagliate o fuori tema"

**Problema:** Knowledge base incompleta o problemi prompt

**Soluzioni:**
1. Rivedi ed espandi contenuto foglio Istruzioni
2. Aggiungi più esempi e casi limite
3. Popola AI_CORE_LITE con linee guida pastorali
4. Usa `testDryRun()` per iterare senza inviare

---

## Prossimi Passi

1. **Monitora Prestazioni**
   - Esegui `showQuotaDashboard()` giornalmente
2. **Raffina Knowledge Base**
   - Aggiungi domande frequenti
3. **Personalizza Prompt**
   - Modifica template in `PromptEngine.gs`

---

## Supporto

Se incontri problemi non coperti qui:

- **Documentazione:** [Docs completi](README_IT.md)
- **Problemi:** [GitHub Issues](https://github.com/dizzighittola/parish-autoresponder/issues)
- **Community:** [Discussioni](https://github.com/dizzighittola/parish-autoresponder/discussions)

---

**Congratulazioni! Il tuo Autoresponder Parrocchiale è ora attivo!** 🎉
