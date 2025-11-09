//
//  RecipeStepsAttributes.swift
//  Oshii
//
//  Created by Kenz Narainen on 09.11.2025.
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
