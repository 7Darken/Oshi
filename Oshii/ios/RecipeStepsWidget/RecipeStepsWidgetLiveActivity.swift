//
//  RecipeStepsWidgetLiveActivity.swift
//  RecipeStepsWidget
//
//  Created by Kenz Narainen on 09.11.2025.
//

import ActivityKit
import WidgetKit
import SwiftUI

struct RecipeStepsWidgetAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Dynamic stateful properties about your activity go here!
        var emoji: String
    }

    // Fixed non-changing properties about your activity go here!
    var name: String
}

struct RecipeStepsWidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: RecipeStepsWidgetAttributes.self) { context in
            // Lock screen/banner UI goes here
            VStack {
                Text("Hello \(context.state.emoji)")
            }
            .activityBackgroundTint(Color.cyan)
            .activitySystemActionForegroundColor(Color.black)

        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI goes here.  Compose the expanded UI through
                // various regions, like leading/trailing/center/bottom
                DynamicIslandExpandedRegion(.leading) {
                    Text("Leading")
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("Trailing")
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text("Bottom \(context.state.emoji)")
                    // more content
                }
            } compactLeading: {
                Text("L")
            } compactTrailing: {
                Text("T \(context.state.emoji)")
            } minimal: {
                Text(context.state.emoji)
            }
            .widgetURL(URL(string: "http://www.apple.com"))
            .keylineTint(Color.red)
        }
    }
}

extension RecipeStepsWidgetAttributes {
    fileprivate static var preview: RecipeStepsWidgetAttributes {
        RecipeStepsWidgetAttributes(name: "World")
    }
}

extension RecipeStepsWidgetAttributes.ContentState {
    fileprivate static var smiley: RecipeStepsWidgetAttributes.ContentState {
        RecipeStepsWidgetAttributes.ContentState(emoji: "😀")
     }
     
     fileprivate static var starEyes: RecipeStepsWidgetAttributes.ContentState {
         RecipeStepsWidgetAttributes.ContentState(emoji: "🤩")
     }
}

#Preview("Notification", as: .content, using: RecipeStepsWidgetAttributes.preview) {
   RecipeStepsWidgetLiveActivity()
} contentStates: {
    RecipeStepsWidgetAttributes.ContentState.smiley
    RecipeStepsWidgetAttributes.ContentState.starEyes
}
