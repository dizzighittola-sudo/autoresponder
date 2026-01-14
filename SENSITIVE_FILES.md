# Files con dati sensibili

Questi file contengono informazioni che **devono** essere anonimizzate prima di essere pubblicati su GitHub:

- `TerritoryValidator.gs`
- `ResponseValidator.gs`
- `PromptEngine.gs`
- `Base di Conoscenza AI - Istruzioni.csv`
- `KNOWLEDGE_BASE_TEMPLATE.md`

> **Nota**: il repository contiene già un *pre‑commit hook* (`.git/hooks/pre-commit`) che blocca il commit se uno di questi file è stato modificato senza essere sanitizzato.
