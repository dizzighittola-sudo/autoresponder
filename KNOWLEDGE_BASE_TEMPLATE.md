# Knowledge Base Template

This guide shows you how to structure your knowledge base for optimal AI responses.

## Overview

The knowledge base is stored in a Google Sheet with multiple tabs. Each tab serves a specific purpose in guiding the AI's behavior and responses.

---

## Sheet Structure

### 1. Istruzioni (Instructions) - **REQUIRED**

This is your main operational knowledge. The AI references this for factual information.

**Columns:**
- Category
- Subcategory (optional)
- Question/Topic
- Answer/Information
- Notes (optional)

**Example Content:**

| Category | Subcategory | Question | Answer | Notes |
|----------|-------------|----------|--------|-------|
| Orari Messe | Feriale | Quando sono le messe nei giorni feriali? | Lunedì-Venerdì: 7:30, 18:00 | Periodo invernale |
| Orari Messe | Festivo | Quando sono le messe domenica e festivi? | Sabato: 18:00<br>Domenica: 9:00, 11:00, 12:15, 18:00 | |
| Contatti | Telefono | Qual è il numero di telefono? | 06 1234567 | Attivo Lun-Ven 9-13 |
| Contatti | Email | Qual è l'email della parrocchia? | info@parrocchia.it | |
| Battesimo | Documenti | Che documenti servono per il battesimo? | - Certificato di nascita<br>- Documento identità genitori<br>- Nulla osta madrina/padrino | |
| Battesimo | Corso | C'è un corso di preparazione? | Sì, corso genitori obbligatorio. 3 incontri il giovedì sera ore 20:30 | |
| Prima Comunione | Età | A che età si fa la Prima Comunione? | Normalmente in seconda o terza elementare (7-8 anni) | |
| Prima Comunione | Catechismo | Quanti anni dura il catechismo? | 2 anni di catechismo obbligatorio | |
| Cresima | Età | A che età si può ricevere la Cresima? | Per ragazzi: 14-15 anni (terza media)<br>Per adulti: qualsiasi età | |
| Matrimonio | Corso | È obbligatorio il corso prematrimoniale? | Sì, corso di 6 incontri. Due sessioni all'anno (marzo e ottobre) | |
| Matrimonio | Documenti | Che documenti servono per sposarsi? | - Certificato battesimo recente (6 mesi)<br>- Stato libero<br>- Documento identità<br>- Certificato cresima | |
| Segreteria | Orari | Quando è aperta la segreteria? | Lunedì 16-19<br>Martedì 9-12<br>Mercoledì 16-19<br>Giovedì 9-12<br>Venerdì 16-19 | |
| Territorio | Vie | Quali vie fanno parte della parrocchia? | Via Roma (tutta), Via Dante 1-50, Piazza Garibaldi | Vedi foglio completo |

**Best Practices:**

✅ **Do:**
- Be specific with times, dates, phone numbers
- Include seasonal variations (summer/winter)
- List requirements completely
- Use bullet points for lists
- Update regularly

❌ **Don't:**
- Use vague language ("usually", "sometimes")
- Include outdated information
- Forget to specify exceptions
- Make assumptions about "common knowledge"

---

### 2. AI_CORE_LITE (Basic Pastoral Principles) - **REQUIRED**

Guidelines for tone, approach, and common pastoral situations.

**Example Content:**

```
TONO E APPROCCIO GENERALE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Usa sempre prima persona plurale: "siamo", "restiamo", "possiamo"
- Tono accogliente ma professionale
- Empatico ma non invadente
- Conciso ma completo

GESTIONE RICHIESTE SACRAMENTI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Esprimi genuina gioia per la richiesta
- Fornisci info pratiche chiare
- Invita a contatto personale per dettagli
- Non fare supposizioni su situazioni familiari

SITUAZIONI SENSIBILI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Se menziona divorzio/risposati: accogli senza giudizio, rimanda a sacerdote
- Se esprime dolore/lutto: vicinanza sincera, offri supporto concreto
- Se esprime rabbia: non minimizzare, riconosci il sentimento
- Se chiede guida spirituale personale: invita a colloquio con sacerdote

LIMITI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- NON dare giudizi morali personali
- NON interpretare dottrina in modo autonomo
- NON promettere ciò che non puoi garantire
- NON sostituirti al sacerdote per discernimento
```

---

### 3. AI_CORE (Extended Pastoral Guidance) - **OPTIONAL**

Detailed guidance for complex scenarios requiring discernment.

**Example Content:**

```
ACCOMPAGNAMENTO SITUAZIONI COMPLESSE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DIVORZIATI E RISPOSATI
- Accogli con calore: "Comprendiamo la sua situazione"
- NON dire: "Non è possibile" o "La Chiesa non permette"
- Spiega: "La sua situazione richiede un colloquio con il sacerdote"
- Offri: contatti per fissare appuntamento
- Evita: dettagli procedurali che potrebbero non applicarsi

SITUAZIONI MISTE (cattolico + non cattolico)
- Accogli entrambe le tradizioni con rispetto
- Spiega: possibilità matrimonio misto con dispensa
- Invita: incontro per valutare insieme
- NON dare per scontato: che debbano sposarsi cattolici

LUTTO E DOLORE
- Vicinanza immediata: "Siamo vicini in questo momento difficile"
- Info pratiche con discrezione (funerale, messa commemorazione)
- Offri: supporto continuativo (gruppi, ascolto)
- NON: frasi fatte o consolazioni teologiche premature
```

---

### 4. Dottrina (Doctrinal Guidelines) - **OPTIONAL**

Catholic teaching on common questions. Used when system detects doctrinal question.

**Structured Format:**

| Tema | Sotto-tema | Tono consigliato | Criterio pastorale | Limiti da non superare | Indicazioni operative AI |
|------|------------|------------------|--------------------|-----------------------|--------------------------|
| Matrimonio | Divorziati risposati | Accogliente, non giudicante | Spiega insegnamento Chiesa senza allontanare | NON dire "non possono comunione" senza spiegare percorso | Parla sempre di possibilità dialogo con sacerdote |
| Sacramenti | Confessione | Incoraggiante | Sottolinea misericordia Dio | NON dare indicazioni su peccati gravi/veniali | Invita al sacramento, non sostituire confessore |
| Vita morale | Convivenza | Rispettoso | Proponi ideale cristiano senza condannare | NON dire "vivete nel peccato" | Spiega visione matrimonio, invita a cammino |

---

### 5. Sostituzioni (Text Replacements) - **OPTIONAL**

Automatic corrections for common typos or alternative spellings.

**Columns:**
- BrokenText (wrong/outdated)
- FixedText (correct)

**Example:**

| BrokenText | FixedText |
|-----------|-----------|
| peregrinaggio | pellegrinaggio |
| eugenio | Eugenio |
| pariolo | Parioli |
| 06-12345678 | 06 12345678 |
| prematrimioniale | prematrimoniale |

---

### 6. ConversationMemory - **AUTO-CREATED**

System creates this automatically. **Do not edit manually.**

Tracks conversation context to avoid repeating information.

---

## Content Guidelines

### Writing Good Knowledge Base Content

**1. Be Specific**

❌ Bad: "Le messe sono al mattino e alla sera"  
✅ Good: "Messe feriali: 7:30 e 18:00"

**2. Include Exceptions**

❌ Bad: "Il catechismo è il martedì"  
✅ Good: "Il catechismo è il martedì alle 17:00, tranne nei mesi di luglio e agosto"

**3. Provide Contact Methods**

❌ Bad: "Contattaci per informazioni"  
✅ Good: "Contattaci: tel. 06 123456 (Lun-Ven 9-13) o email info@parrocchia.it"

**4. Update Seasonal Information**

Create separate rows for summer/winter schedules:

| Category | Subcategory | Question | Answer | Notes |
|----------|-------------|----------|--------|-------|
| Orari Messe | Feriale Inverno | Orari messe settembre-maggio | 7:30, 18:00 | Periodo invernale |
| Orari Messe | Feriale Estate | Orari messe giugno-agosto | 7:30, 19:00 | Periodo estivo |

**5. Use Structured Lists**

For documents/requirements, use bullet points:

```
Documenti necessari:
- Certificato di nascita
- Documento identità genitori
- Nulla osta madrina/padrino (se di altra parrocchia)
```

---

## Testing Your Knowledge Base

### 1. Load Resources

In Apps Script Editor, run:
```javascript
loadResources()
```

Check logs for:
```
✓ Knowledge Base loaded: XXXX chars
```

### 2. Test Queries

Send test emails with common questions:
- "Quando sono le messe?"
- "Come si fa a battezzare un bambino?"
- "Vorrei sposarmi, che documenti servono?"

### 3. Review Responses

Check if responses:
- ✅ Include correct information from KB
- ✅ Use appropriate tone
- ✅ Provide next steps (contacts, appointments)
- ✅ Don't hallucinate information not in KB

### 4. Refine Content

Based on responses, update KB:
- Add missing information
- Clarify ambiguous content
- Expand on frequently asked topics
- Remove outdated information

---

## Maintenance Schedule

**Weekly:**
- Review AI-Error labeled emails
- Check if questions couldn't be answered
- Add new FAQs to KB

**Monthly:**
- Update seasonal information
- Review and refresh dates/times
- Check for outdated contacts

**Quarterly:**
- Full KB content review
- Update pastoral guidelines based on feedback
- Expand Dottrina sheet for recurring doctrinal questions

**Annually:**
- Complete refresh of all content
- Update statistical information
- Review and update all procedures

---

## Advanced Tips

### Multi-Language Support

If your parish serves multiple languages, create separate rows for each:

| Category | Question | Answer | Language |
|----------|----------|--------|----------|
| Mass Times | When are weekday masses? | Monday-Friday: 7:30 AM, 6:00 PM | EN |
| Orari Messe | Quando sono le messe feriali? | Lunedì-Venerdì: 7:30, 18:00 | IT |
| Horarios Misa | ¿Cuándo son las misas entre semana? | Lunes-Viernes: 7:30, 18:00 | ES |

### Territory Information

For parishes with territorial boundaries, include:

| Category | Street | Numbers | Notes |
|----------|--------|---------|-------|
| Territory | Via Roma | All | Entire street |
| Territory | Via Dante | 1-50 odd, 2-48 even | Partial coverage |
| Territory | Piazza Garibaldi | All | Entire square |

The system has built-in territory validation - see `TerritoryValidator.gs` for adding addresses.

---

## Template Download

**Quick Start Template:** [Download Excel](../templates/KnowledgeBase_Template.xlsx)

This includes:
- Pre-formatted sheets
- Example content
- Formula helpers
- Import instructions

---

## Questions?

- **Documentation:** [Main README](../README.md)
- **Setup Guide:** [Setup instructions](SETUP.md)
- **Support:** [GitHub Issues](https://github.com/YOUR_USERNAME/parish-autoresponder/issues)
