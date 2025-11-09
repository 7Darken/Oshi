//
//  RecipeStepsLiveActivity.m
//  Oshii
//
//  Created by Kenz Narainen on 09.11.2025.
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
