[![🇬🇧 English](https://img.shields.io/badge/lang-English-blue)](CHANGELOG.md) [![🇮🇹 Italiano](https://img.shields.io/badge/lang-Italiano-green)](CHANGELOG_IT.md)

# 📝 Changelog

Tutte le modifiche importanti a questo progetto sono documentate in questo file.

---

## [2.0.0] - Gennaio 2026

### ✨ Nuove Funzionalità

#### Circuit Breaker
- Aggiunto pattern Circuit Breaker per resilienza API Gemini
- Stati: CLOSED → OPEN → HALF-OPEN
- Persistenza stato con PropertiesService
- Soglia: 5 fallimenti consecutivi, timeout 60 secondi

#### Knowledge Base Selector
- Nuovo layer di selezione intelligente KB
- Profili: `lite`, `standard`, `heavy`
- Scoring multi-fattore per rilevanza chunk
- Limiti per source (evita over-injection dottrinale)
- Mapping categorie classificatore → categorie KB

#### Suite di Test
- Framework TestRunner minimale per GAS
- 12 unit test per bug critici
- 9 integration test per componenti
- Funzioni runner: `runAllTests()`, `runIntegrationTests()`, `runFullTestSuite()`

### 🐛 Bug Corretti

#### Bug #1 - Race Condition Memoria (CRITICO)
- **Problema**: `updateMemory()` e `addProvidedInfoTopics()` potevano causare inconsistenze
- **Fix**: Uso di `updateMemoryAtomic()` con lock

#### Bug #2 - Regex Orari matcha URL (MEDIO)
- **Problema**: Pattern `(\d{1,2})\.([0-5]\d)` matchava parti di URL
- **Fix**: Aggiunto lookahead negativo `(?![\/\w])`

#### Bug #3 - Cache Non Invalidata su Errore (BASSO)
- **Problema**: Se `updateMemory()` falliva, la cache non veniva invalidata
- **Fix**: Aggiunto `_invalidateCache()` nel blocco catch

#### Bug #4 - Deadlock in loadResources (MEDIO)
- **Problema**: Check-then-act non atomico poteva causare caricamento doppio
- **Fix**: Uso di `LockService.tryLock()` prima del check

#### Bug #5 - Rilevamento Spagnolo Troppo Sensibile (BASSO)
- **Problema**: Carattere ñ in nomi spagnoli causava falsi positivi
- **Fix**: ñ conta solo se accompagnato da keywords spagnole (≥2)

#### Bug #7 - NaN in computeSalutationMode (CRITICO)
- **Problema**: Timestamp invalido causava `hoursSinceLast = NaN`
- **Fix**: Check esplicito `isNaN()` con fallback

### 🔧 Miglioramenti

#### GeminiService
- Integrazione CircuitBreaker in `_withRetry()`
- Check `canProceed()` prima di chiamate API
- Record success/failure automatico

#### PromptEngine
- Aggiunto blocco anti-prompt-injection (Errore #4)
- Rimossi guardrails ridondanti dalla KB

#### ResponseValidator
- Pattern orari migliorato per evitare URL
- Supporto apostrofi Unicode in signature

#### Main
- Lock atomico in `loadResources()`
- Migliore gestione errori caricamento

---

## [1.0.0] - Dicembre 2025

### ✨ Funzionalità Iniziali

- Elaborazione email automatica con Gemini AI
- Rilevamento lingua multilingue (IT, EN, ES)
- Knowledge base da Google Sheets
- Memoria conversazionale
- Validazione territorio
- Calendario liturgico
- Rate limiting base

---

## Crediti

### v2.0.0
- Lead Developer: Romolo
- Framework: Google Apps Script
- AI: Google Gemini

---

*Per la cronologia completa dei commit, vedi [GitHub Commits](https://github.com/dizzighittola/autoresponder/commits)*
