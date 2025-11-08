-- =====================================================
-- Migration: Fix friendships INSERT policy
-- Purpose: Allow friendship creation via trigger
-- =====================================================

-- Supprimer l'ancien trigger et la fonction
DROP TRIGGER IF EXISTS trigger_create_friendship ON friend_requests;
DROP FUNCTION IF EXISTS create_friendship_on_accept();

-- Recréer la fonction avec SECURITY DEFINER pour bypasser RLS
CREATE OR REPLACE FUNCTION create_friendship_on_accept()
RETURNS TRIGGER
SECURITY DEFINER -- Exécute avec les privilèges du créateur (bypasse RLS)
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Insérer l'amitié avec user_id_1 < user_id_2
    INSERT INTO friendships (user_id_1, user_id_2)
    VALUES (
      LEAST(NEW.sender_id, NEW.receiver_id),
      GREATEST(NEW.sender_id, NEW.receiver_id)
    )
    ON CONFLICT (user_id_1, user_id_2) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recréer le trigger
CREATE TRIGGER trigger_create_friendship
AFTER UPDATE ON friend_requests
FOR EACH ROW
EXECUTE FUNCTION create_friendship_on_accept();

-- Ajouter une policy INSERT pour friendships (au cas où)
-- Cette policy permet l'insertion si l'utilisateur est l'un des deux users
DROP POLICY IF EXISTS "Users can create friendships" ON friendships;
CREATE POLICY "Users can create friendships"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- =====================================================
-- Vérification
-- =====================================================
-- Vous pouvez vérifier les policies avec:
-- SELECT * FROM pg_policies WHERE tablename = 'friendships';
