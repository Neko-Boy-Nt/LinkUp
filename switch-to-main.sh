#!/bin/bash
# Script pour changer la branche par défaut de master vers main

echo "=== Changement de branche par défaut vers main ==="

# 1. Créer et basculer sur la branche main
echo "1. Création de la branche main..."
git checkout -b main

# 2. Pousser main vers le remote
echo "2. Push de main vers GitHub..."
git push -u LinkUp main

# 3. Supprimer master localement
echo "3. Suppression de master locale..."
git branch -d master

echo ""
echo "=== Étapes manuelles sur GitHub ==="
echo "1. Va sur https://github.com/Neko-Boy-Nt/LinkUp"
echo "2. Clique sur 'Settings' → 'Branches'"
echo "3. Change la branche par défaut de 'master' vers 'main'"
echo "4. Retourne ici et exécute :"
echo "   git push LinkUp --delete master"
echo ""
echo "=== Branches actuelles ==="
git branch -a
