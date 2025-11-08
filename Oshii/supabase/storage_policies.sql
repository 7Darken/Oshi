-- =====================================================
-- Storage Policies pour le bucket "users-pp"
-- =====================================================

-- 1. Permettre aux utilisateurs authentifiés d'UPLOADER leur propre avatar
-- Le fichier doit être dans un dossier avec leur user_id
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'users-pp'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Permettre aux utilisateurs authentifiés de METTRE À JOUR leur propre avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'users-pp'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'users-pp'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Permettre aux utilisateurs authentifiés de SUPPRIMER leur propre avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'users-pp'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Permettre à TOUT LE MONDE de LIRE les avatars (public)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'users-pp');

-- =====================================================
-- Configuration du bucket (à exécuter si le bucket n'existe pas encore)
-- =====================================================

-- Créer le bucket s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('users-pp', 'users-pp', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- =====================================================
-- Instructions
-- =====================================================
-- 1. Aller sur Supabase Dashboard > Storage > users-pp
-- 2. Cliquer sur "Policies"
-- 3. Copier-coller ces policies SQL dans l'éditeur SQL
-- 4. Exécuter le script
-- =====================================================
