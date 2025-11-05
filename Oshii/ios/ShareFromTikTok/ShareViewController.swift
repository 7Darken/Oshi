//
//  ShareViewController.swift
//  ShareFromTikTok
//
//  Created by Kenz Narainen on 03.11.2025.
//

import UIKit
import MobileCoreServices
import UniformTypeIdentifiers

class ShareViewController: UIViewController {

    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Masquer la vue (redirection invisible)
        view.alpha = 0
        
        // Traiter le lien partagé immédiatement
        handleSharedContent()
    }
    
    private func handleSharedContent() {
        // Récupérer l'URL partagée depuis le context
        guard let extensionItem = extensionContext?.inputItems.first as? NSExtensionItem else {
            print("❌ Aucun item d'extension trouvé")
            closeExtension()
            return
        }
        
        guard let itemProviders = extensionItem.attachments else {
            print("❌ Aucune pièce jointe trouvée")
            closeExtension()
            return
        }
        
        // Chercher une URL dans les pièces jointes
        for provider in itemProviders {
            if provider.hasItemConformingToTypeIdentifier("public.url") {
                provider.loadItem(forTypeIdentifier: "public.url", options: nil) { [weak self] (item, error) in
                    guard let self = self else { return }
                    
                    if let error = error {
                        print("❌ Erreur lors de la récupération de l'URL: \(error.localizedDescription)")
                        self.closeExtension()
                        return
                    }
                    
                    if let url = item as? URL {
                        print("🔗 URL reçue: \(url.absoluteString)")
                        print("🚀 Redirection vers l'app Oshii...")
                        
                        // Toujours rediriger vers l'app Oshii
                        // La validation du type de lien se fera dans l'app
                        self.openMainApp(with: url)
                    } else {
                        print("❌ L'item n'est pas une URL")
                        self.closeExtension()
                    }
                }
                return
            }
        }
        
        // Aucune URL trouvée
        print("⚠️ Aucune URL trouvée dans les pièces jointes")
        closeExtension()
    }
    
    /// Ouvre l'app principale Oshii avec l'URL
    private func openMainApp(with url: URL) {
        // Encoder l'URL en tant que paramètre de query
        guard let encodedURL = url.absoluteString.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) else {
            print("❌ Impossible d'encoder l'URL")
            closeExtension()
            return
        }
        
        // Format attendu par useDeepLinking: oshii://?url=https://...
        let deepLinkString = "oshii://?url=\(encodedURL)"
        
        print("🚀 Deep link créé: \(deepLinkString)")
        
        guard let deepLinkURL = URL(string: deepLinkString) else {
            print("❌ URL invalide: \(deepLinkString)")
            closeExtension()
            return
        }
        
        // Ouvrir l'app principale avec NSExtensionContext (méthode moderne et sécurisée)
        openURL(deepLinkURL)
    }
    
    /// Méthode pour ouvrir une URL depuis une extension
    private func openURL(_ url: URL) {
        // Méthode 1 : Essayer avec extensionContext.open (iOS 10+)
        if let extensionContext = extensionContext {
            extensionContext.open(url, completionHandler: { [weak self] success in
                guard let self = self else { return }
                
                if success {
                    print("✅ App Oshii ouverte avec succès via extensionContext.open")
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                        self.closeExtension()
                    }
                } else {
                    print("⚠️ Échec avec extensionContext.open, tentative avec UIApplication...")
                    self.openWithUIApplication(url)
                }
            })
        } else {
            print("⚠️ Extension context non disponible, tentative avec UIApplication...")
            openWithUIApplication(url)
        }
    }
    
    /// Fallback : Utiliser UIApplication.shared.open
    private func openWithUIApplication(_ url: URL) {
        // Accéder à UIApplication via la chaîne de responders
        var responder: UIResponder? = self
        while responder != nil {
            if let application = responder as? UIApplication {
                application.open(url, options: [:]) { [weak self] success in
                    if success {
                        print("✅ App ouverte avec UIApplication.open")
                    } else {
                        print("❌ Impossible d'ouvrir l'app")
                    }
                    
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                        self?.closeExtension()
                    }
                }
                return
            }
            responder = responder?.next
        }
        
        // Dernière tentative : accéder à UIApplication via KVC
        if let application = UIApplication.value(forKey: "sharedApplication") as? UIApplication {
            application.open(url, options: [:]) { [weak self] success in
                if success {
                    print("✅ App ouverte avec UIApplication via KVC")
                } else {
                    print("❌ Impossible d'ouvrir l'app via KVC")
                }
                
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                    self?.closeExtension()
                }
            }
        } else {
            print("❌ Aucune méthode d'ouverture disponible, fermeture de l'extension")
            closeExtension()
        }
    }
    
    /// Ferme l'extension
    private func closeExtension() {
        extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
    }
}
