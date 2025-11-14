/**
 * Hook pour gérer l'upload de l'avatar utilisateur vers Supabase Storage
 */

import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/services/supabase';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert } from 'react-native';

interface UseAvatarUploadReturn {
  isUploading: boolean;
  uploadAvatar: () => Promise<void>;
}

export function useAvatarUpload(): UseAvatarUploadReturn {
  const { user, profile, refreshProfile } = useAuthContext();
  const [isUploading, setIsUploading] = useState(false);

  const uploadAvatar = async () => {
    console.log('📸 [useAvatarUpload] Début du processus de changement de photo');

    if (!user?.id) {
      console.error('❌ [useAvatarUpload] Utilisateur non connecté');
      Alert.alert('Erreur', 'Vous devez être connecté pour modifier votre photo de profil');
      return;
    }

    const previousAvatarPath = (() => {
      if (!profile?.avatar_url) return null;
      const parts = profile.avatar_url.split('/storage/v1/object/public/users-pp/');
      return parts.length === 2 ? parts[1] : null;
    })();

    try {
      console.log('🔑 [useAvatarUpload] Demande de permission...');

      // Demander la permission d'accès à la galerie
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('🔑 [useAvatarUpload] Permission:', permissionResult.status);

      if (!permissionResult.granted) {
        console.warn('⚠️ [useAvatarUpload] Permission refusée');
        Alert.alert(
          'Permission requise',
          'Vous devez autoriser l\'accès à vos photos pour changer votre photo de profil'
        );
        return;
      }

      console.log('📱 [useAvatarUpload] Ouverture de la galerie...');

      // Ouvrir la galerie avec options de crop
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log('📱 [useAvatarUpload] Résultat galerie:', { canceled: result.canceled });

      if (result.canceled) {
        console.log('ℹ️ [useAvatarUpload] Sélection annulée par l\'utilisateur');
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        console.error('❌ [useAvatarUpload] Aucun asset sélectionné');
        Alert.alert('Erreur', 'Aucune image sélectionnée');
        return;
      }

      setIsUploading(true);
      console.log('📤 [useAvatarUpload] Début de l\'upload...');

      const asset = result.assets[0];
      const imageUri = asset.uri;
      console.log('📸 [useAvatarUpload] URI de l\'image:', imageUri);

      // Créer un nom de fichier unique
      const fileNameFromPicker = asset.fileName?.split('/')?.pop();
      const fileExtFromName = fileNameFromPicker?.includes('.')
        ? fileNameFromPicker.split('.').pop()?.toLowerCase()
        : undefined;
      const mimeTypeExt = asset.mimeType?.split('/').pop()?.toLowerCase();
      const fileExt =
        mimeTypeExt === 'jpeg'
          ? 'jpg'
          : mimeTypeExt || fileExtFromName || imageUri.split('.').pop()?.toLowerCase() || 'jpg';
      const uniqueSuffix = Date.now();
      const fileName = `avatar-${uniqueSuffix}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      console.log('📁 [useAvatarUpload] Chemin fichier:', filePath);

      // Lire le fichier avec XMLHttpRequest (compatible React Native)
      console.log('📖 [useAvatarUpload] Lecture du fichier...');
      const fileData = await new Promise<ArrayBuffer>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () {
          resolve(xhr.response);
        };
        xhr.onerror = function (e) {
          reject(new Error('Erreur lecture fichier'));
        };
        xhr.responseType = 'arraybuffer';
        xhr.open('GET', imageUri, true);
        xhr.send();
      });

      console.log('✅ [useAvatarUpload] Fichier lu, taille:', fileData.byteLength);

      // Upload vers Supabase Storage
      console.log('☁️ [useAvatarUpload] Upload vers Supabase...');
      const { error: uploadError } = await supabase.storage
        .from('users-pp')
        .upload(filePath, fileData, {
          contentType: asset.mimeType || `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('❌ [useAvatarUpload] Erreur upload:', uploadError);
        throw uploadError;
      }

      console.log('✅ [useAvatarUpload] Upload réussi');

      // Obtenir l'URL publique
      const { data: publicUrlData } = supabase.storage
        .from('users-pp')
        .getPublicUrl(filePath);

      const avatarUrl = publicUrlData.publicUrl;
      console.log('🔗 [useAvatarUpload] URL publique:', avatarUrl);

      // Mettre à jour le profil dans la base de données
      console.log('💾 [useAvatarUpload] Mise à jour du profil...');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);

      if (updateError) {
        console.error('❌ [useAvatarUpload] Erreur mise à jour profil:', updateError);
        throw updateError;
      }

      console.log('✅ [useAvatarUpload] Profil mis à jour');

      // Rafraîchir le profil pour afficher la nouvelle image
      console.log('🔄 [useAvatarUpload] Rafraîchissement du profil...');
      await refreshProfile();

      // Supprimer l'ancien avatar si présent et différent
      if (previousAvatarPath && previousAvatarPath !== filePath) {
        console.log('🧹 [useAvatarUpload] Suppression de l\'ancien avatar...', previousAvatarPath);
        const { error: removeError } = await supabase.storage
          .from('users-pp')
          .remove([previousAvatarPath]);
        if (removeError) {
          console.warn('⚠️ [useAvatarUpload] Impossible de supprimer l\'ancien avatar:', removeError.message);
        } else {
          console.log('✅ [useAvatarUpload] Ancien avatar supprimé');
        }
      }

      console.log('✅ [useAvatarUpload] Processus terminé avec succès');
      Alert.alert('Succès', 'Votre photo de profil a été mise à jour');
    } catch (error: any) {
      console.error('❌ [useAvatarUpload] Erreur lors de l\'upload:', error);
      console.error('❌ [useAvatarUpload] Stack:', error?.stack);
      Alert.alert(
        'Erreur',
        error?.message || 'Impossible de mettre à jour votre photo de profil'
      );
    } finally {
      setIsUploading(false);
      console.log('🏁 [useAvatarUpload] Fin du processus');
    }
  };

  return {
    isUploading,
    uploadAvatar,
  };
}
