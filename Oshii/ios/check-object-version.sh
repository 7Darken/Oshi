#!/bin/bash

# Script de vérification et correction de objectVersion dans project.pbxproj
# Usage: ./check-object-version.sh [--fix]

set -e

PROJECT_FILE="Oshii.xcodeproj/project.pbxproj"
CORRECT_VERSION="63"
WRONG_VERSION="70"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier si le fichier existe
if [ ! -f "$PROJECT_FILE" ]; then
    echo -e "${RED}❌ Fichier $PROJECT_FILE introuvable${NC}"
    echo "Assurez-vous d'exécuter ce script depuis le dossier ios/"
    exit 1
fi

# Lire la version actuelle
CURRENT_VERSION=$(grep -o "objectVersion = [0-9]*" "$PROJECT_FILE" | grep -o "[0-9]*")

if [ -z "$CURRENT_VERSION" ]; then
    echo -e "${RED}❌ Impossible de trouver objectVersion dans $PROJECT_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Version actuelle détectée: $CURRENT_VERSION${NC}"

# Vérifier si la version est correcte
if [ "$CURRENT_VERSION" = "$CORRECT_VERSION" ]; then
    echo -e "${GREEN}✅ Version correcte ($CORRECT_VERSION)${NC}"
    exit 0
fi

# Si la version est incorrecte
if [ "$CURRENT_VERSION" = "$WRONG_VERSION" ]; then
    echo -e "${RED}❌ Version incorrecte détectée ($CURRENT_VERSION)${NC}"
    echo -e "${YELLOW}⚠️  CocoaPods ne supporte pas objectVersion = $WRONG_VERSION${NC}"
    
    # Corriger automatiquement si --fix est passé
    if [ "$1" = "--fix" ]; then
        echo -e "${YELLOW}🔧 Correction automatique...${NC}"
        
        # Utiliser sed pour remplacer (compatible macOS et Linux)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/objectVersion = $WRONG_VERSION/objectVersion = $CORRECT_VERSION/g" "$PROJECT_FILE"
        else
            # Linux
            sed -i "s/objectVersion = $WRONG_VERSION/objectVersion = $CORRECT_VERSION/g" "$PROJECT_FILE"
        fi
        
        echo -e "${GREEN}✅ Version corrigée à $CORRECT_VERSION${NC}"
        echo -e "${YELLOW}💡 Vous pouvez maintenant exécuter: pod install${NC}"
        exit 0
    else
        echo -e "${YELLOW}💡 Pour corriger automatiquement, exécutez:${NC}"
        echo -e "${GREEN}   $0 --fix${NC}"
        echo ""
        echo -e "${YELLOW}Ou modifiez manuellement dans $PROJECT_FILE:${NC}"
        echo -e "${RED}   objectVersion = $WRONG_VERSION;${NC}"
        echo -e "${GREEN}   objectVersion = $CORRECT_VERSION;${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Version inattendue: $CURRENT_VERSION${NC}"
    echo -e "${YELLOW}   La version attendue est $CORRECT_VERSION${NC}"
    exit 1
fi
