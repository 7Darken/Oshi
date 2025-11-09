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
