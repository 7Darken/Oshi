# 🔴 Erreur CocoaPods - Object Version 70

## ⚠️ Problème

Lors de l'exécution de `pod install`, vous pouvez rencontrer cette erreur :

```
[!] Oh no, an error occurred.
[Xcodeproj] Unable to find compatibility version string for object version `70`.
```

## 🔍 Cause

Cette erreur survient lorsque :
- Xcode (version 16.1+) met à jour automatiquement le projet vers `objectVersion = 70`
- CocoaPods ne supporte pas encore cette version d'objet Xcode
- Le fichier `project.pbxproj` utilise une version trop récente

## ✅ Solution

### 1. Vérifier la version actuelle

```bash
cd ios
grep -n "objectVersion" Oshii.xcodeproj/project.pbxproj
```

Si vous voyez `objectVersion = 70;`, continuez avec l'étape suivante.

### 2. Downgrader à la version 63

Ouvrez le fichier `Oshii.xcodeproj/project.pbxproj` et modifiez :

**Avant :**
```
objectVersion = 70;
```

**Après :**
```
objectVersion = 63;
```

### 3. Réinstaller les Pods

```bash
cd ios
rm -rf Pods Podfile.lock
pod install
```

## 🛡️ Prévention

### ⚠️ Attention

Si vous ouvrez le projet dans Xcode et le sauvegardez, Xcode peut automatiquement remettre `objectVersion = 70`.

### Solutions préventives

1. **Vérifier avant chaque `pod install` :**
   ```bash
   grep "objectVersion" ios/Oshii.xcodeproj/project.pbxproj
   ```

2. **Ne pas sauvegarder automatiquement dans Xcode :**
   - Désactiver "Save Automatically" dans Xcode (Preferences > General)
   - Ou être vigilant lors de la fermeture du projet

3. **Script de vérification automatique :**
   ```bash
   # Ajouter dans package.json ou créer un script séparé
   "scripts": {
     "check-object-version": "grep -q 'objectVersion = 63' ios/Oshii.xcodeproj/project.pbxproj || (echo '⚠️  objectVersion doit être 63' && exit 1)"
   }
   ```

## 📝 Notes

- **Version 63** est la dernière version d'objet Xcode supportée par CocoaPods
- Cette version est compatible avec Xcode 15.x et les versions antérieures
- CocoaPods devrait supporter la version 70 dans une future mise à jour

## 🔗 Références

- [Issue GitHub CocoaPods](https://github.com/CocoaPods/CocoaPods/search?q=%5BXcodeproj%5D+Unable+to+find+compatibility+version+string+for+object+version+%6070%60)
- [Documentation Xcode Project Object Versions](https://developer.apple.com/documentation/xcode/build-settings-reference)

## ✅ Vérification rapide

Pour vérifier rapidement si tout est correct :

```bash
cd ios
grep "objectVersion = 63" Oshii.xcodeproj/project.pbxproj && echo "✅ Version correcte (63)" || echo "❌ Version incorrecte"
```
