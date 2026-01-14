# Guida alla Risoluzione Problemi

Problemi comuni e relative soluzioni per l'Autoresponder Email Parrocchiale.

## Indice

- [Sistema Non Processa Email](#sistema-non-processa-email)
- [Problemi Quota API](#problemi-quota-api)
- [Problemi Qualità Risposta](#problemi-qualità-risposta)
- [Problemi Integrazione Gmail](#problemi-integrazione-gmail)
- [Problemi Knowledge Base](#problemi-knowledge-base)
- [Problemi Prestazioni](#problemi-prestazioni)
- [Fallimenti Validazione](#fallimenti-validazione)

---

## Sistema Non Processa Email

### Problema: Nessuna email processata

**Sintomi:**
- Trigger gira ma log mostrano "0 emails processed"
- Email non lette rimangono tali
- Nessuna etichetta aggiunta

**Diagnosi:**
Esegui health check:
```javascript
healthCheck()
```

**Cause Comuni & Soluzioni:**

#### 1. Sistema Sospeso (Orario Ufficio)
**Verifica:**
```javascript
testHolidayLogic()
```
**Soluzione:**
- Verifica che l'ora attuale NON sia orario ufficio (vedi `Main.gs` → `SUSPENSION_HOURS`)

#### 2. Trigger Non Attivo
**Verifica:**
- Apps Script Editor → Barra laterale ⏰ Attivatori
- Dovresti vedere `main`, Basato sul tempo, Ogni 10 minuti

**Soluzione:**
```javascript
// Elimina vecchi trigger
removeTriggers()
// Crea nuovo trigger
createTimeTrigger()
```

#### 3. Query Ricerca Gmail Errata
**Soluzione:** Amplia temporaneamente la ricerca in `EmailProcessor.gs` per testare.

---

### Problema: Email specifiche non processate

**Sintomi:**
- Alcune email ricevono risposta, altre no
- Certi mittenti sempre filtrati

**Diagnosi:**
Abilita debug log, invia email test, esegui manualmente `main()` e controlla log.

**Motivi Comuni:**

#### 1. Blocklist Domini
**Verifica:** `CONFIG.IGNORE_DOMAINS` in `Main.gs`

#### 2. Email Auto-Inviata
**Log mostra:** `⊘ Skipped: self-sent message`. Comportamento corretto.

#### 3. Già Processata
**Problema:** Email ha già etichetta "IA".
**Soluzione:** Rimuovi etichetta.

#### 4. Quick Check Gemini ha detto "No Reply"
**Log mostra:** `⊘ Gemini quick check: no response needed`.
**Cause:** Newsletter, ricevute, acknowledgment.

---

## Problemi Quota API

### Problema: Errori "Quota Exhausted"

**Sintomi:**
- Log mostrano: `❌ QUOTA_EXHAUSTED`
- Risposte si fermano
- Sistema passa a modelli fallback

**Verifica Utilizzo Corrente:**
```javascript
showQuotaDashboard()
```

**Soluzioni:**

#### 1. Attendi Reset
Le quote si resettano alle **9:00 AM ora italiana**.

#### 2. Riduci Volume Richieste
- Ottimizza knowledge base
-iduci `MAX_EMAILS_PER_RUN` in `Main.gs`

---

## Problemi Qualità Risposta

### Problema: Risposte AI fuori tema o errate

**Sintomi:**
- Non risponde alla domanda
- Informazioni contraddicono KB

**Soluzioni:**

#### 1. Knowledge Base Incompleta
**Soluzione:** Aggiungi info mancanti al foglio Istruzioni.

#### 2. Allucinazioni (Info Inventate)
**Soluzione:** Abilita validazione stretta in `Main.gs`: `VALIDATION_STRICT_MODE: true`.

#### 3. Lingua Sbagliata
**Soluzione:** Migliora rilevamento in `GeminiService.gs` aggiungendo marker.

#### 4. Tono Inappropriato
**Soluzione:** Aggiorna linee guida in foglio AI_CORE_LITE.

---

## Problemi Integrazione Gmail

### Problema: "Gmail API: ❌ FAIL" in health check

**Sintomi:**
- Impossibile inviare risposte o leggere email

**Soluzioni:**

#### 1. Gmail API Non Abilitata
Abilita in Impostazioni Progetto Apps Script E in Google Cloud Console.

#### 2. Permessi Insufficienti
Ri-autorizza ricreando il trigger.

---

## Problemi Knowledge Base

### Problema: "Knowledge Base: ❌ FAIL"

**Sintomi:**
- Cache KB vuota
- Errori caricamento nei log

**Soluzioni:**

#### 1. ID Spreadsheet Errato
Verifica `SPREADSHEET_ID` nelle Script Properties.

#### 2. Foglio Non Accessibile
Condividi foglio con account script.

#### 3. Fogli Mancanti
Assicurati esistano fogli con nomi esatti: `Istruzioni`, `AI_CORE_LITE`, ecc.

---

## Problemi Prestazioni

### Problema: Tempo esecuzione script superato

**Sintomi:**
- Errore: "Maximum execution time exceeded"

**Soluzioni:**

#### 1. Riduci Email Per Esecuzione
Riduci `MAX_EMAILS_PER_RUN` in `Main.gs`.

#### 2. Ottimizza Dimensione KB
Riduci contenuto non necessario se >100K caratteri.

#### 3. Riduci Storico Conversazioni
Riduci `maxMessages` in `EmailProcessor.gs`.

---

## Fallimenti Validazione

### Problema: Molte email etichettate "IA_VALIDATION_ERROR"

**Cause Comuni:**

#### 1. Maiuscola Dopo Virgola
Regola grammatica italiana.

#### 2. Firma Mancante
Richiesta per policy.

#### 3. Mismatch Lingua
Rilevato IT, atteso EN (o viceversa).

---

## Supporto

Se hai ancora problemi:

1. **Abilita Debug Logging**
   Aggiungi `const DEBUG_MODE = true;` in `Main.gs`.

2. **Segnala Problema**
   - [GitHub Issues](https://github.com/dizzighittola/parish-autoresponder/issues)
   - Includi log completi
   - Descrivi comportamento atteso vs reale

3. **Aiuto Comunità**
   - [GitHub Discussions](https://github.com/dizzighittola/parish-autoresponder/discussions)

---

**Documentazione:**
- [README Principale](README_IT.md)
- [Guida Setup](SETUP_IT.md)
- [Riferimento Configurazione](CONFIGURATION_IT.md)
