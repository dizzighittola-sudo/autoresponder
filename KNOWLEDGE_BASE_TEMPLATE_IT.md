# Template Knowledge Base

Questa guida mostra come strutturare la tua knowledge base per risposte AI ottimali.

## Panoramica

La knowledge base è salvata in un Google Sheet con multiple schede. Ogni scheda serve uno scopo specifico.

---

## Struttura Foglio

### 1. Istruzioni (Instructions) - **RICHIESTO**

Questa è la tua conoscenza operativa principale.

**Colonne:**
- Categoria
- Sottocategoria (opzionale)
- Domanda/Argomento
- Risposta/Informazione
- Note (opzionale)

**Contenuto Esempio:**

| Categoria | Sottocategoria | Domanda | Risposta | Note |
|-----------|----------------|---------|----------|------|
| Orari Messe | Feriale | Quando sono le messe feriali? | Lun-Ven: 7:30, 18:00 | Inverno |
| Contatti | Telefono | Numero telefono? | 06 1234567 | Lun-Ven 9-13 |
| Battesimo | Documenti | Documenti per battesimo? | Certificato nascita, Idoneità padrini | |

**Best Practices:**
✅ **Fai:** Sii specifico, includi variazioni stagionali, usa elenchi puntati.
❌ **Non fare:** Usare linguaggio vago, includere info obsolete.

---

### 2. AI_CORE_LITE (Principi Pastorali Base) - **RICHIESTO**

Linee guida per tono e approccio.

**Contenuto Esempio:**
```
TONO E APPROCCIO GENERALE
- Usa "noi" (prima persona plurale)
- Accogliente ma professionale
- Empatico ma non invadente
```

---

### 3. AI_CORE (Guida Pastorale Estesa) - **OPZIONALE**

Guida dettagliata per scenari complessi (discernimento).

**Contenuto Esempio:**
```
DIVORZIATI E RISPOSATI
- Accogli con calore
- Non dire "non è possibile"
- Rimanda a colloquio con sacerdote
```

---

### 4. Dottrina (Linee Guida Dottrinali) - **OPZIONALE**

Insegnamento cattolico su domande comuni.

| Tema | Sotto-tema | Tono consigliato | Criterio pastorale |
|------|------------|------------------|--------------------|
| Confessione | Peccati gravi | Incoraggiante | Sottolinea misericordia |

---

### 5. Sostituzioni (Sostituzioni Testo) - **OPZIONALE**

Correzioni automatiche per typo.

| BrokenText | FixedText |
|------------|-----------|
| peregrinaggio | pellegrinaggio |
| eugenio | Eugenio |

---

### 6. ConversationMemory - **AUTO-CREATO**

Il sistema crea questo automaticamente. **Non modificare manualmente.**

---

## Linee Guida Contenuto

1. **Sii Specifico**
   ❌ "Le messe sono al mattino"
   ✅ "Messe feriali: 7:30 e 18:00"

2. **Includi Eccezioni**
   ✅ "Catechismo martedì ore 17, tranne luglio e agosto"

3. **Fornisci Contatti**
   ✅ "Tel. 06 123456 (Lun-Ven 9-13)"

---

## Testare la Knowledge Base

1. **Carica Risorse**
   Esegui `loadResources()` nell'editor.

2. **Testa Query**
   Invia email di prova ("Quando sono le messe?").

3. **Rivedi Risposte**
   Controlla se le info sono corrette e il tono appropriato.

4. **Raffina**
   Aggiorna KB basandoti sui test.

---

## Manutenzione

- **Settimanale:** Rivedi errori AI, aggiungi FAQ.
- **Mensile:** Aggiorna info stagionali.
- **Annuale:** Refresh completo contenuti.

---

## Template Download

**Quick Start Template:** Vedi tabella sopra per struttura.

---

## Domande?

- **Documentazione:** [README Principale](README_IT.md)
- **Guida Setup:** [Istruzioni setup](SETUP_IT.md)
- **Supporto:** [GitHub Issues](https://github.com/dizzighittola/parish-autoresponder/issues)
