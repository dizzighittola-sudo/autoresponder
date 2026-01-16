# Changelog

Tutti i cambiamenti significativi al Risponditore Automatico Parrocchiale saranno documentati in questo file.

Il formato è basato su [Keep a Changelog](https://keepachangelog.com/it/1.0.0/),
e questo progetto aderisce al [Semantic Versioning](https://semver.org/lang/it/spec/v2.0.0.html).

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
