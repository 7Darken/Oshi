# Fix: Erreur CocoaPods - Object Version Incompatibilité Xcode

## Problème
Erreur lors de l'installation de pods avec un message du type:
```
⚠️  Something went wrong running `pod install` in the `ios` directory.
Command `pod install` failed.
└─ Cause: [Xcodeproj] Unable to find compatibility version string for object version `70`.
```

## Cause
Le fichier `project.pbxproj` utilise un `objectVersion` trop récent pour votre version de Xcode installée.

## Solution

### Étape 1: Modifier l'objectVersion
Ouvrir le fichier: `ios/Oshii.xcodeproj/project.pbxproj`

Chercher la ligne (vers le début du fichier):
```
objectVersion = 70;
```

La remplacer par:
```
objectVersion = 54;
```

### Étape 2: Réinstaller les pods
```bash
cd ios
rm -rf Pods Podfile.lock
cd ..
npx pod-install
```

OU simplement:
```bash
npx pod-install
```

## Correspondance versions Xcode / objectVersion

| Xcode Version | objectVersion |
|---------------|---------------|
| Xcode 14.x    | 54            |
| Xcode 15.x    | 56            |
| Xcode 16.x    | 60            |
| Xcode 16.1+   | 70            |

## Notes
- Ce problème survient souvent après l'ajout d'une nouvelle librairie npm qui inclut des dépendances natives iOS
- Si `objectVersion = 54` ne fonctionne pas, essayez `objectVersion = 56` ou `objectVersion = 60` selon votre version de Xcode
- Pour vérifier votre version de Xcode: `xcodebuild -version`
