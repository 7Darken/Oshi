#!/bin/bash

# Script pour démarrer Metro Bundler automatiquement depuis Xcode
# Ce script vérifie si Metro tourne déjà avant de le démarrer

set -e

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "${GREEN}🚀 Vérification de Metro Bundler...${NC}"

# Vérifier si Metro tourne déjà sur le port 8081
if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null ; then
    echo "${GREEN}✅ Metro Bundler est déjà en cours d'exécution${NC}"
    exit 0
fi

echo "${YELLOW}⚠️  Metro Bundler n'est pas démarré${NC}"
echo "${GREEN}🔄 Démarrage de Metro Bundler...${NC}"

# Aller dans le dossier du projet
cd "${PROJECT_DIR}/.."

# Démarrer Metro en arrière-plan
npx expo start --dev-client &

# Attendre que Metro soit prêt (max 30 secondes)
echo "${YELLOW}⏳ Attente du démarrage de Metro...${NC}"
for i in {1..30}; do
    if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null ; then
        echo "${GREEN}✅ Metro Bundler est prêt !${NC}"
        exit 0
    fi
    sleep 1
done

echo "${RED}❌ Timeout: Metro Bundler n'a pas démarré dans les temps${NC}"
exit 1

