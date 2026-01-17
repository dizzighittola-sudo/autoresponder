# Changelog

Tutti i cambiamenti significativi al Risponditore Automatico Parrocchiale saranno documentati in questo file.

Il formato è basato su [Keep a Changelog](https://keepachangelog.com/it/1.0.0/),
e questo progetto aderisce al [Semantic Versioning](https://semver.org/lang/it/spec/v2.0.0.html).

## [2.3.5] - 17-01-2026

### Aggiunto
- **Tuning Educazione (Ascolto Attivo)**: Aggiornato il prompt del Quick Check in `GeminiService.gs` per garantire che il bot confermi la ricezione di informazioni utili (disponibilità, documenti, ecc.) anche in assenza di domande dirette.

---
## [2.3.4] - 17-01-2026

### Aggiunto
- **Hardenizzazione Lock Thread**: Implementata rilevazione lock obsoleti e rilascio sicuro in `EmailProcessor.gs`.
  - I lock rimasti orfani vengono ora rilevati e puliti automaticamente.
  - Il rilascio del lock avviene solo se il valore in cache corrisponde a quello impostato, evitando di rimuovere lock presi in carico da altri processi.

---
## [2.3.3] - 17-01-2026

### Aggiunto
- **Lock di Esecuzione Globale**: Implementato lock a livello di script nella funzione `main()` per impedire collisioni tra esecuzioni parallele integrali (trigger sovrapposti).
- **Diagnostica Salti Dettagliata**: Il riepilogo log ora fornisce un dettaglio granulare dei thread saltati (Bloccati da altra istanza, Già elaborati, Interni/Self, Loop).

### Risolti (Bug Fixes)
- **Saturazione Inbox (CRITICO)**: Risolto bug in cui il bot veniva "bloccato" dalla presenza di molte email già etichettate ma non lette. Ottimizzata la query di ricerca con `-label:IA`.
- **Riepilogo Fuorviante**: Corretto errore di logging in cui tutti i thread saltati venivano erroneamente indicati come "self-sent".

---
## [2.3.2] - 17-01-2026

### Aggiunto
- **Logica di "Ascolto Attivo"**: Il PromptEngine ora riconosce le informazioni già fornite dall'utente (es. motivi di impedimento o date proposte) invece di richiederle meccanicamente.
- **Sblocco Manuale**: Aggiunta utility `clearStaleLocks(threadId)` in `Main.gs` per rimuovere lock orfani dalla cache.

### Risolti (Bug Fixes)
- **Regressione Multi-Turn**: Ripristinata la capacità di rispondere ai follow-up degli utenti (rimosso `-from:me` dalla ricerca iniziale).
- **Stabilità Lock**: Corretto errore di scoping delle variabili e impostato TTL del lock a 30 secondi per prevenire thread bloccati a tempo indeterminato.

---
## [2.3.1] - 17-01-2026

### Risolti (Bug Fixes)
- **CRITICO: Thinking Leak (Gemini 2.5)**: Corretto problema in cui l'IA esponeva il suo ragionamento interno nelle risposte email (es. "Rivedendo la knowledge base...", "Correggo la sezione...").
  - **PromptEngine.gs**: Aggiunto ERRORE #4 per vietare esplicitamente il ragionamento esposto nelle risposte.
  - **ResponseValidator.gs**: Aggiunto CHECK 7 (`_checkExposedReasoning`) per rilevare e bloccare risposte con meta-commenti o auto-correzioni.

---
## [2.3.0] - 17-01-2026

### Aggiunti
- **Periodi Ferie Multi-Anno**: Il sistema ora legge fino a 5 periodi ferie dalle righe 6-10 del foglio `Controllo` (A=etichetta "Ferie...", B=inizio, C=fine).
- **`isInVacationPeriod()`**: Nuova funzione che verifica se la data corrente ricade in uno qualsiasi dei periodi configurati.
- **`GLOBAL_CACHE.vacationPeriods`**: Array di periodi ferie caricati dal foglio.

### Rimossi
- **`isFerragostoFixedPeriod()`**: Sostituita dalla nuova funzione dinamica multi-periodo.
- **`getFerragostoPeriodInfo()`**: Codice morto rimosso.

### Modificati
- I periodi ferie non sono più hardcoded (15-31 Agosto); ora completamente configurabili via foglio. Le righe vuote vengono saltate in sicurezza.

---
## [2.2.2] - 17-01-2026

### Aggiunti
- **`withSheetsRetry()`**: Funzione helper per retry automatico con backoff esponenziale su errori transitori Sheets API (503, 500, timeout).
- **Config**: Aggiunti `SHEETS_RETRY_MAX` (3) e `SHEETS_RETRY_BACKOFF_MS` (1000ms).
- **Config**: Aggiunto `MAX_PROVIDED_TOPICS` (50) per limitare la crescita della memoria su thread lunghi.

### Risolti
- **MemoryService**: Corretto potenziale memory bloat su thread lunghi limitando `providedInfo` a 50 topic.
- **Main.gs**: `loadResources()` ora usa il wrapper retry per gestire errori Sheets transitori.

---
## [2.2.1] - 17-01-2026

### Correzioni Critiche (Logic Bugs)
- **EmailProcessor**: Corretta firma di `processThread` per accettare parametro `skipLock`. Aggiunti controlli di sicurezza sull'accesso a `CONFIG`.
- **GmailService**: Risolto crash critico nella gestione errori (`sendHtmlReply` fallback) quando manca la configurazione.
- **GmailService**: Risolto bypass di sicurezza SSRF in `markdownToHtml` (decodifica URL prima del check IP).
- **RequestTypeClassifier**: Corretta inversione di priorità: le email "Dottrinali" ora prevalgono su quelle "Pastorali" se il punteggio è alto.
- **MemoryService**: Corretta pulizia memoria (`cleanOldEntries`) per rimuovere anche le date corrotte/invalide.
- **GeminiService**: Uniformata l'estrazione robusta del testo anche nel meccanismo di fallback.

---
## [2.2.0] - 17-01-2026

### Sicurezza & Hardening
- **PromptContext**: Implementato logging aggressivo per input non validi, per tracciare l'origine di dati corrotti.
- **MemoryService**: Aggiunta validazione rigorosa dei timestamp ISO-8601 per prevenire la scrittura di date corrotte su Google Sheets.

### Pulizia
- **Codebase**: Rimossi commenti sviluppatore legacy ("TODO", "NOTA") e codice morto da `GeminiService` e `PromptEngine` per migliorare la manutenibilità.

---
## [2.1.8] - 17-01-2026

### Risolti (Bug Fixes)
- **Config**: Aggiunti parametri `CACHE_LOCK_TTL` e `CACHE_RACE_SLEEP_MS` mancanti in `Main.gs`, prevenendo potenziali errori di runtime nel processore email.

---

## [2.1.7] - 17-01-2026

### Risolti (Bug Fixes)
- **Logica (RAG)**: Ottimizzato l'ordine del contesto in `EmailProcessor` per garantire che le regole specifiche (Orari Speciali, Territorio) abbiano priorità sulla dottrina generica.
- **Refactor (Gemini)**: Consolidata la logica di fallback in `GeminiService` eliminando duplicazioni legacy ("Split-Brain") e garantendo l'uso coerente del Rate Limiter.

---

## [2.1.6] - 16-01-2026

### Pulizia (Cleaned)
- **Codice**: Rimossi commenti duplicati in `Main.gs` per migliorare la leggibilità.

---

## [2.1.5] - 16-01-2026

### Modifiche (Changed)
- **UX**: Aggiornate etichette di default a 'Errore' e 'Verifica' come richiesto.
- **Etichettatura Granulare**: I warning di validazione (es. bassa confidenza) vengono ora applicati al **singolo messaggio** invece che all'intero thread, facilitando la revisione.

---

## [2.1.4] - 16-01-2026

### Risolti (Bug Fixes)
- **Sicurezza (Inject)**: Rafforzata regex in `GmailService` per prevenire header injection dalla prima riga.
- **Affidabilità (Fallback)**: Aggiornato `GeminiService` Quick Check su "fail open" (rispondi: true) in caso di errore API, prevenendo perdita email.
- **Configurazione (Label)**: Sostituita etichetta 'verifica' hardcoded in `EmailProcessor` con configurazione dinamica per rispettare preferenze utente.

---

## [2.1.3] - 16-01-2026

### Risolti (Bug Fixes)
- **Fix Critico (Locking)**: Aggiunto blocco `try...finally` in `EmailProcessor` per garantire il rilascio del lock in ogni scenario, prevenendo deadlock.
- **Sicurezza (TOCTOU)**: Implementato il pattern "Double-Check" nell'acquisizione del lock per mitigare race conditions.
- **Performance**: Rimosso il `LockService` globale in `MemoryService`, sostituendolo con lock granulari su `CacheService`, abilitando l'elaborazione parallela.
- **Logica (Bug #4)**: Aggiornato il `Classifier` per accettare email con corpo vuoto se l'oggetto è significativo (es. "Re: Orari messe").

### Aggiunti
- **Testing**: Aggiunti unit test per la logica di concorrenza e casi limite del classificatore.

### Modificati
- **Refactor (Config)**: Centralizzata la configurazione Gmail (`GMAIL_LABEL_CACHE_TTL`, `MAX_HISTORY_MESSAGES`) in `Main.gs`, rimuovendo valori "hardcoded".
- **Polish (Etichette)**: Rinominate le etichette di sistema secondo preferenza utente (`IA-Error` -> `Errore`, `IA_VALIDATION_ERROR` -> `Verifica`).
- **Polish (Concorrenza)**: Spostati i parametri di Lock TTL e Race Sleep in `CONFIG` su `Main.gs` per maggiore configurabilità.

---

## [2.1.2] - 16-01-2026

### Risolti (Bug Fixes)
- **Fix Critico (BUG-1)**: Implementati aggiornamenti transazionali con logica di retry e optimistic locking in `MemoryService` per prevenire condizioni di gara (race conditions) durante esecuzioni simultanee.
- **Sicurezza (BUG-5)**: Rafforzati i pattern Regex in `TerritoryValidator` per prevenire vulnerabilità ReDoS (Catastrophic Backtracking) e aggiunto limite lunghezza input.
- **Accuratezza (BUG-3)**: Migliorato l'algoritmo di stima token in `GeminiRateLimiter` per considerare i confini di parola e l'overhead del protocollo (conteggio parole * 1.25 + fattore overhead).
- **UX (BUG-7)**: Aggiornata la dashboard quote (`showQuotaDashboard`) per mostrare l'orario Pacifico (PST/PDT) accanto a quello italiano, chiarendo l'orario di reset delle quote Google.
- **Fix Critico (BUG-2)**: Sostituito il lock globale con un lock basato su thread (via `CacheService`) in `EmailProcessor` per permettere l'elaborazione parallela.
- **Stabilità (BUG-6)**: Aggiunta validazione per timestamp `lastUpdated` non validi in `PromptContext`.

### Modificati
- Rifattorizzazione meccanismo di locking in `EmailProcessor`.

---

*Per le versioni precedenti, fare riferimento al file `CHANGELOG.md` in inglese.*
