# Configuration Live Activity pour Oshii

Guide complet pour implémenter les Live Activities pour afficher les étapes de recette sur l'écran verrouillé iOS.

## 📋 Prérequis
- ✅ Target RecipeStepsWidget créé
- ✅ Bundle ID: com.x7kenz.Oshii.RecipeStepsWidget
- ⚠️ NSSupportsLiveActivities = YES dans Info.plist
- ⚠️ Push Notifications capability activée

## 🔧 Étape 1: Créer les fichiers Swift dans Xcode

### 1.1 RecipeStepsAttributes.swift
**Localisation**: Ajouter au target RecipeStepsWidget

1. Dans Xcode, clique droit sur le dossier **RecipeStepsWidget**
2. New File → Swift File
3. Nomme-le **RecipeStepsAttributes.swift**
4. ✅ Coche **RecipeStepsWidget** dans les targets
5. ✅ Coche **Oshii** dans les targets (IMPORTANT!)

```swift
//
//  RecipeStepsAttributes.swift
//  RecipeStepsWidget
//

import ActivityKit
import Foundation

struct RecipeStepsAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var currentStep: Int
        var totalSteps: Int
        var stepDescription: String
        var stepDuration: String?
        var stepTemperature: String?
    }

    var recipeTitle: String
}
```

### 1.2 RecipeStepsWidget.swift
**Localisation**: Remplacer le fichier existant dans RecipeStepsWidget

Remplace le contenu du fichier **RecipeStepsWidget.swift** généré automatiquement par:

```swift
//
//  RecipeStepsWidget.swift
//  RecipeStepsWidget
//

import ActivityKit
import WidgetKit
import SwiftUI

struct RecipeStepsWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: RecipeStepsAttributes.self) { context in
            // Lock screen/banner UI
            RecipeStepsLockScreenView(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded region
                DynamicIslandExpandedRegion(.leading) {
                    Label {
                        Text("\(context.state.currentStep)/\(context.state.totalSteps)")
                    } icon: {
                        Image(systemName: "list.number")
                            .foregroundColor(.red)
                    }
                }

                DynamicIslandExpandedRegion(.trailing) {
                    if let duration = context.state.stepDuration {
                        Label {
                            Text(duration)
                        } icon: {
                            Image(systemName: "clock.fill")
                                .foregroundColor(.red)
                        }
                    }
                }

                DynamicIslandExpandedRegion(.center) {
                    Text(context.state.stepDescription)
                        .font(.caption)
                        .lineLimit(3)
                }

                DynamicIslandExpandedRegion(.bottom) {
                    HStack {
                        Text(context.attributes.recipeTitle)
                            .font(.caption2)
                            .foregroundColor(.secondary)
                        Spacer()
                        if let temp = context.state.stepTemperature {
                            Label(temp, systemImage: "thermometer")
                                .font(.caption2)
                                .foregroundColor(.orange)
                        }
                    }
                    .padding(.horizontal)
                }
            } compactLeading: {
                Image(systemName: "fork.knife")
                    .foregroundColor(.red)
            } compactTrailing: {
                Text("\(context.state.currentStep)/\(context.state.totalSteps)")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            } minimal: {
                Image(systemName: "fork.knife")
                    .foregroundColor(.red)
            }
        }
    }
}

struct RecipeStepsLockScreenView: View {
    let context: ActivityViewContext<RecipeStepsAttributes>

    var body: some View {
        VStack(spacing: 12) {
            // Header avec titre
            HStack {
                Image(systemName: "fork.knife.circle.fill")
                    .foregroundColor(.red)
                    .font(.title3)

                Text(context.attributes.recipeTitle)
                    .font(.headline)
                    .fontWeight(.bold)
                    .lineLimit(1)

                Spacer()

                Text("\(context.state.currentStep)/\(context.state.totalSteps)")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.secondary)
            }

            Divider()

            // Description de l'étape
            Text(context.state.stepDescription)
                .font(.body)
                .lineLimit(4)
                .frame(maxWidth: .infinity, alignment: .leading)

            // Métadonnées (durée, température)
            if context.state.stepDuration != nil || context.state.stepTemperature != nil {
                HStack(spacing: 16) {
                    if let duration = context.state.stepDuration {
                        Label(duration, systemImage: "clock.fill")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    if let temp = context.state.stepTemperature {
                        Label(temp, systemImage: "thermometer")
                            .font(.caption)
                            .foregroundColor(.orange)
                    }

                    Spacer()
                }
            }

            // Barre de progression
            ProgressView(value: Double(context.state.currentStep), total: Double(context.state.totalSteps))
                .tint(.red)
        }
        .padding()
        .activityBackgroundTint(Color(UIColor.systemBackground))
        .activitySystemActionForegroundColor(.red)
    }
}
```

### 1.3 RecipeStepsLiveActivity.swift
**Localisation**: Ajouter au dossier **Oshii** (app principale)

1. Dans Xcode, clique droit sur le dossier **Oshii**
2. New File → Swift File
3. Nomme-le **RecipeStepsLiveActivity.swift**
4. ✅ Coche **Oshii** dans les targets
5. ❌ Ne coche PAS RecipeStepsWidget

```swift
//
//  RecipeStepsLiveActivity.swift
//  Oshii
//

import Foundation
import ActivityKit
import React

@objc(RecipeStepsLiveActivity)
class RecipeStepsLiveActivity: NSObject {
  private var currentActivity: Activity<RecipeStepsAttributes>?

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }

  @objc
  func start(_ recipeTitle: String,
             currentStep: Int,
             totalSteps: Int,
             stepDescription: String,
             stepDuration: String?,
             stepTemperature: String?,
             resolver resolve: @escaping RCTPromiseResolveBlock,
             rejecter reject: @escaping RCTPromiseRejectBlock) {

    guard ActivityAuthorizationInfo().areActivitiesEnabled else {
      reject("PERMISSION_DENIED", "Live Activities are not enabled", nil)
      return
    }

    let attributes = RecipeStepsAttributes(recipeTitle: recipeTitle)
    let contentState = RecipeStepsAttributes.ContentState(
      currentStep: currentStep,
      totalSteps: totalSteps,
      stepDescription: stepDescription,
      stepDuration: stepDuration,
      stepTemperature: stepTemperature
    )

    do {
      let activity = try Activity<RecipeStepsAttributes>.request(
        attributes: attributes,
        contentState: contentState,
        pushType: nil
      )
      self.currentActivity = activity
      resolve(activity.id)
    } catch {
      reject("START_FAILED", "Failed to start Live Activity: \(error.localizedDescription)", error)
    }
  }

  @objc
  func update(_ currentStep: Int,
              totalSteps: Int,
              stepDescription: String,
              stepDuration: String?,
              stepTemperature: String?,
              resolver resolve: @escaping RCTPromiseResolveBlock,
              rejecter reject: @escaping RCTPromiseRejectBlock) {

    guard let activity = currentActivity else {
      reject("NO_ACTIVITY", "No active Live Activity found", nil)
      return
    }

    let contentState = RecipeStepsAttributes.ContentState(
      currentStep: currentStep,
      totalSteps: totalSteps,
      stepDescription: stepDescription,
      stepDuration: stepDuration,
      stepTemperature: stepTemperature
    )

    Task {
      await activity.update(using: contentState)
      resolve(nil)
    }
  }

  @objc
  func stop(_ resolver resolve: @escaping RCTPromiseResolveBlock,
            rejecter reject: @escaping RCTPromiseRejectBlock) {

    guard let activity = currentActivity else {
      reject("NO_ACTIVITY", "No active Live Activity found", nil)
      return
    }

    Task {
      await activity.end(dismissalPolicy: .immediate)
      self.currentActivity = nil
      resolve(nil)
    }
  }
}
```

### 1.4 RecipeStepsLiveActivity.m (Bridge Objective-C)
**Localisation**: Ajouter au dossier **Oshii** (app principale)

1. Dans Xcode, clique droit sur le dossier **Oshii**
2. New File → Objective-C File
3. Nomme-le **RecipeStepsLiveActivity.m**
4. ✅ Coche **Oshii** dans les targets

```objc
//
//  RecipeStepsLiveActivity.m
//  Oshii
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(RecipeStepsLiveActivity, NSObject)

RCT_EXTERN_METHOD(start:(NSString *)recipeTitle
                  currentStep:(NSInteger)currentStep
                  totalSteps:(NSInteger)totalSteps
                  stepDescription:(NSString *)stepDescription
                  stepDuration:(NSString *)stepDuration
                  stepTemperature:(NSString *)stepTemperature
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(update:(NSInteger)currentStep
                  totalSteps:(NSInteger)totalSteps
                  stepDescription:(NSString *)stepDescription
                  stepDuration:(NSString *)stepDuration
                  stepTemperature:(NSString *)stepTemperature
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(stop:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
```

## 📱 Étape 2: Configuration Info.plist

Ouvre **ios/Oshii/Info.plist** et ajoute:

```xml
<key>NSSupportsLiveActivities</key>
<true/>
```

## 🔨 Étape 3: Build dans Xcode

1. Sélectionne le scheme **Oshii** (pas RecipeStepsWidget)
2. Build (Cmd+B)
3. Vérifie qu'il n'y a pas d'erreurs

## ⚠️ Points importants

1. **RecipeStepsAttributes.swift** doit être dans les 2 targets (Oshii + RecipeStepsWidget)
2. **RecipeStepsLiveActivity.swift** doit être UNIQUEMENT dans Oshii
3. **RecipeStepsLiveActivity.m** doit être UNIQUEMENT dans Oshii
4. Deployment Target minimum: iOS 16.1 pour les 2 targets

## 🎯 Prochaine étape

Une fois que tout compile sans erreur, je pourrai créer:
- Le hook React Native pour utiliser la Live Activity
- L'intégration dans steps.tsx
