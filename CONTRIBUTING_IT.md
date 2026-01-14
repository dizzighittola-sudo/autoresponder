# Contribuire a Parish Email Autoresponder

Grazie per il tuo interesse nel contribuire! Questo progetto aiuta le comunità parrocchiali in tutto il mondo.

## Indice

- [Codice di Condotta](#codice-di-condotta)
- [Come Posso Contribuire?](#come-posso-contribuire)
- [Setup Sviluppo](#setup-sviluppo)
- [Processo Pull Request](#processo-pull-request)
- [Standard Codice](#standard-codice)

---

## Codice di Condotta

Ci impegniamo a fornire un'esperienza accogliente e inclusiva per tutti.

**Comportamenti incoraggiati:**
✅ Linguaggio inclusivo e accogliente
✅ Rispetto per punti di vista diversi
✅ Empatia verso altri membri

**Segnala violazioni a:** [dizzighittola@gmail.com]

---

## Come Posso Contribuire?

### 🐛 Segnalare Bug

**Prima di inviare:**
1. Controlla [issue esistenti](https://github.com/dizzighittola/parish-autoresponder/issues)
2. Esegui `healthCheck()`
3. Rivedi [guida troubleshooting](TROUBLESHOOTING_IT.md)

**Quando segnali:**
- Includi passi per riprodurre
- Fornisci log di esecuzione (anonimizzati)

### 💡 Suggerire Miglioramenti

Usa il template feature request e descrivi:
- Problema che risolve
- Soluzione proposta
- Impatto sulle funzionalità esistenti

### 🌍 Tradurre

Aiuta a rendere questo disponibile a più comunità!
Vedi guida traduzione sotto.

### 📖 Migliorare Documentazione

Miglioramenti alla documentazione sono sempre benvenuti:
- Correggi typo
- Aggiungi esempi
- Traduci docs

---

## Setup Sviluppo

### Prerequisiti

- Node.js 14+
- Git
- Account Google
- Chiave API Gemini
- Google Apps Script CLI (clasp)

### Fork e Clone

```bash
git clone https://github.com/dizzighittola/parish-autoresponder.git
cd parish-autoresponder
```

### Setup Ambiente

```bash
npm install -g @google/clasp
clasp login
clasp create --type standalone --title "Parish Autoresponder Dev"
clasp push
```

### Configura per Test

Usa modalità dry-run:
```javascript
// In Main.gs CONFIG:
DRY_RUN: true
```

---

## Processo Pull Request

### Prima di Inviare

- [ ] Codice segue standard
- [ ] Test passano (`runAllTests()`)
- [ ] Documentazione aggiornata
- [ ] Descrizione PR chiara

---

## Standard Codice

### Principi Generali

1. **Leggibilità sopra astuzia**
2. **Commenti spiegano "perché", non "cosa"**
3. **Funzioni fanno una cosa bene**

### Guide Stile

```javascript
// Classi: PascalCase
class EmailProcessor { }

// Funzioni: camelCase
function processEmail() { }

// Costanti: UPPER_SNAKE_CASE
const MAX_EMAILS_PER_RUN = 10;
```

---

## Domande?

- **Documentazione:** [README Principale](README_IT.md)
- **Discussioni:** [GitHub Discussions](https://github.com/dizzighittola/parish-autoresponder/discussions)
- **Email:** dizzighittola@gmail.com

Grazie per il tuo contributo! 🙏
