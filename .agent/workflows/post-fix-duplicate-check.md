---
description: Verifica duplicati dopo ogni fix/refactoring di codice
---

# Post-Fix Duplicate Check

Dopo ogni modifica che aggiunge o corregge una funzione/metodo:

1. **Cerca duplicati** della funzione modificata nel file:
   - Usa `grep_search` con il nome della funzione/metodo
   - Verifica che ci sia **solo una definizione**

2. **Se trovi duplicati**:
   - Identifica quale versione è quella corretta (con fix/guard clauses)
   - Rimuovi la versione obsoleta/vulnerabile
   - Ricorda: in JavaScript l'ultima definizione sovrascrive le precedenti!

3. **Verifica post-rimozione**:
   - Ri-esegui la ricerca per confermare che rimanga solo una definizione
   - Controlla che il file sia sintatticamente corretto

## Rationale

Questo check previene situazioni dove:
- Un fix viene applicato ma la versione originale non viene rimossa
- La versione originale (in fondo al file) sovrascrive silenziosamente il fix
- Il bug sembra risolto ma in realtà persiste
