//
//  ShareViewController.swift
//  ShareFromTikTok
//
//  Created by Kenz Narainen on 03.11.2025.
//

import UIKit
import Social

class ShareViewController: SLComposeServiceViewController {

    override func isContentValid() -> Bool {
        // Do validation of contentText and/or NSExtensionContext attachments here
        return true
    }

  override func didSelectPost() {
          if let item = extensionContext?.inputItems.first as? NSExtensionItem {
              if let attachments = item.attachments {
                  for provider in attachments {
                      if provider.hasItemConformingToTypeIdentifier("public.url") {
                          provider.loadItem(forTypeIdentifier: "public.url", options: nil) { (item, error) in
                              if let url = item as? URL {
                                  self.openApp(with: url)
                              }
                          }
                      }
                  }
              }
          }

          extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
      }
  func openApp(with url: URL) {
          let customURL = "oshii://shared?url=\(url.absoluteString)"
          if let encoded = customURL.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
             let openURL = URL(string: encoded) {
              _ = self.openURL(openURL)
          }
      }

      func openURL(_ url: URL) -> Bool {
          var responder: UIResponder? = self
          let selectorOpenURL = sel_registerName("openURL:")
          while responder != nil {
              if responder?.responds(to: selectorOpenURL) == true {
                  responder?.perform(selectorOpenURL, with: url)
                  return true
              }
              responder = responder?.next
          }
          return false
      }
    override func configurationItems() -> [Any]! {
        // To add configuration options via table cells at the bottom of the sheet, return an array of SLComposeSheetConfigurationItem here.
        return []
    }

}
