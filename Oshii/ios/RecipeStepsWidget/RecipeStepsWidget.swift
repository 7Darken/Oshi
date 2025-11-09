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
                // Expanded region - Plus compact
                DynamicIslandExpandedRegion(.leading) {
                    HStack(spacing: 6) {
                        Image(systemName: "list.number")
                            .foregroundColor(.red)
                            .font(.caption)

            Text("\(context.state.currentStep)/\(context.state.totalSteps)")
                            .font(.caption)
                            .fontWeight(.semibold)

                    }
                }

                DynamicIslandExpandedRegion(.trailing) {
                    if let temp = context.state.stepTemperature {
                        HStack(spacing: 4) {
                            Image(systemName: "thermometer")
                                .foregroundColor(.orange)
                                .font(.caption)
                            Text(temp)
                                .font(.caption)
                                .fontWeight(.medium)
                        }
                    }
                }

                DynamicIslandExpandedRegion(.center) {
                    VStack(spacing: 4) {
                        Text(context.state.stepDescription)
                            .font(.callout)
                            .lineLimit(2)
                            .multilineTextAlignment(.center)

                        Text(context.attributes.recipeTitle)
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                    .padding(.top, 4)
                }

                DynamicIslandExpandedRegion(.bottom) {
                    ProgressView(value: Double(context.state.currentStep), total:
            Double(context.state.totalSteps))
                        .tint(.red)
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
