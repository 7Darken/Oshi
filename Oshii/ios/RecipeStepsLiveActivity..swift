//
//  RecipeStepsLiveActivity..swift
//  Oshii
//
//  Created by Kenz Narainen on 09.11.2025.
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
        content: ActivityContent(state: contentState, staleDate: nil),
        pushType: nil
      )
      self.currentActivity = activity
      resolve(activity.id)
    } catch {
      let errorMessage = "Failed to start Live Activity: \(error.localizedDescription)"
      reject("START_FAILED", errorMessage, error)
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
      await activity.update(ActivityContent(state: contentState, staleDate: nil))
      resolve(nil)
    }
  }

  @objc
  func stop(_ resolve: @escaping RCTPromiseResolveBlock,
            rejecter reject: @escaping RCTPromiseRejectBlock) {

    guard let activity = currentActivity else {
      reject("NO_ACTIVITY", "No active Live Activity found", nil)
      return
    }

    Task {
      await activity.end(nil, dismissalPolicy: .immediate)
      self.currentActivity = nil
      resolve(nil)
    }
  }
}
