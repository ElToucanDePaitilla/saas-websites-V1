---

### 2. `README.md`

```markdown
<!--
==============================================================================
NOTICE D'UTILISATION DU FICHIER README.MD
------------------------------------------------------------------------------
À quoi sert ce fichier ?
1. Fournir à Cline la vue d'ensemble du projet dès qu'il démarre une session.
2. Lui donner les commandes système exactes (build, dev, test) qu'il a le droit 
   d'exécuter dans le terminal.
3. Documenter les prérequis pour éviter que l'agent ne tente d'installer des 
   dépendances inutiles.
==============================================================================
-->

# [Nom de ton projet]

Projet développé avec l'assistance de Cline.

## 🚀 Préréquis et Installation

```bash
# Lancer l'environnement de développement
npm run dev

# Vérifier la validité des types TypeScript
npm run type-check

# Tester le build de production
npm run build

# Lancer les tests unitaires
npm run test