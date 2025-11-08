-- =====================================================
-- SYSTÈME D'AMIS ET PARTAGE DE RECETTES
-- =====================================================

-- 1️⃣ Table des demandes d'amis
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Contraintes
  CONSTRAINT unique_friend_request UNIQUE(sender_id, receiver_id),
  CONSTRAINT no_self_friend CHECK (sender_id != receiver_id)
);

-- 2️⃣ Table des amitiés (créée automatiquement quand acceptée)
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id_1 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id_2 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Contraintes : amitié bidirectionnelle unique
  CONSTRAINT unique_friendship UNIQUE(user_id_1, user_id_2),
  CONSTRAINT no_self_friendship CHECK (user_id_1 != user_id_2),
  CONSTRAINT ordered_user_ids CHECK (user_id_1 < user_id_2)
);

-- 3️⃣ Table des recettes partagées
CREATE TABLE IF NOT EXISTS shared_recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  shared_by_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT, -- Message optionnel
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT no_self_share CHECK (shared_by_user_id != shared_with_user_id)
);

-- =====================================================
-- INDEX POUR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver
  ON friend_requests(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender
  ON friend_requests(sender_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_user1
  ON friendships(user_id_1);
CREATE INDEX IF NOT EXISTS idx_friendships_user2
  ON friendships(user_id_2);
CREATE INDEX IF NOT EXISTS idx_shared_recipes_receiver
  ON shared_recipes(shared_with_user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_shared_recipes_sender
  ON shared_recipes(shared_by_user_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger : Créer automatiquement une amitié quand demande acceptée
CREATE OR REPLACE FUNCTION create_friendship_on_accept()
RETURNS TRIGGER AS $$
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

CREATE TRIGGER IF NOT EXISTS trigger_create_friendship
AFTER UPDATE ON friend_requests
FOR EACH ROW
EXECUTE FUNCTION create_friendship_on_accept();

-- Trigger : Créer une copie de la recette pour le receiver (sans folder_id)
CREATE OR REPLACE FUNCTION create_recipe_copy_on_share()
RETURNS TRIGGER AS $$
DECLARE
  new_recipe_id UUID;
  ingredient_record RECORD;
  step_record RECORD;
BEGIN
  -- Copier la recette SANS folder_id (NULL = recette partagée)
  INSERT INTO recipes (
    user_id, folder_id, title, servings, prep_time, cook_time, total_time,
    source_url, image_url, calories, proteins, carbs, fats
  )
  SELECT
    NEW.shared_with_user_id, -- Nouveau propriétaire
    NULL, -- Pas de dossier (identifié par shared_recipes)
    title, servings, prep_time, cook_time, total_time,
    source_url, image_url, calories, proteins, carbs, fats
  FROM recipes
  WHERE id = NEW.recipe_id
  RETURNING id INTO new_recipe_id;

  -- Copier les ingrédients
  FOR ingredient_record IN
    SELECT name, quantity, unit
    FROM ingredients
    WHERE recipe_id = NEW.recipe_id
  LOOP
    INSERT INTO ingredients (recipe_id, name, quantity, unit)
    VALUES (new_recipe_id, ingredient_record.name, ingredient_record.quantity, ingredient_record.unit);
  END LOOP;

  -- Copier les étapes
  FOR step_record IN
    SELECT "order", text, duration, temperature
    FROM steps
    WHERE recipe_id = NEW.recipe_id
    ORDER BY "order"
  LOOP
    INSERT INTO steps (recipe_id, "order", text, duration, temperature)
    VALUES (new_recipe_id, step_record.order, step_record.text, step_record.duration, step_record.temperature);
  END LOOP;

  -- Mettre à jour le shared_recipe avec le nouvel ID de recette
  UPDATE shared_recipes
  SET recipe_id = new_recipe_id
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS trigger_create_recipe_copy
AFTER INSERT ON shared_recipes
FOR EACH ROW
EXECUTE FUNCTION create_recipe_copy_on_share();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_recipes ENABLE ROW LEVEL SECURITY;

-- POLICIES pour friend_requests
CREATE POLICY "Users can view their friend requests"
  ON friend_requests FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send friend requests"
  ON friend_requests FOR INSERT
  WITH CHECK (auth.uid() = sender_id AND sender_id != receiver_id);

CREATE POLICY "Users can update received requests"
  ON friend_requests FOR UPDATE
  USING (auth.uid() = receiver_id);

CREATE POLICY "Users can delete their sent requests"
  ON friend_requests FOR DELETE
  USING (auth.uid() = sender_id);

-- POLICIES pour friendships
CREATE POLICY "Users can view their friendships"
  ON friendships FOR SELECT
  USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

CREATE POLICY "Users can delete their friendships"
  ON friendships FOR DELETE
  USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- POLICIES pour shared_recipes
CREATE POLICY "Users can view shared recipes"
  ON shared_recipes FOR SELECT
  USING (auth.uid() = shared_by_user_id OR auth.uid() = shared_with_user_id);

CREATE POLICY "Users can share recipes with friends"
  ON shared_recipes FOR INSERT
  WITH CHECK (
    auth.uid() = shared_by_user_id AND
    EXISTS (
      SELECT 1 FROM friendships
      WHERE (user_id_1 = auth.uid() AND user_id_2 = shared_with_user_id)
         OR (user_id_2 = auth.uid() AND user_id_1 = shared_with_user_id)
    )
  );

CREATE POLICY "Users can update received shared recipes"
  ON shared_recipes FOR UPDATE
  USING (auth.uid() = shared_with_user_id);

CREATE POLICY "Users can delete shared recipes"
  ON shared_recipes FOR DELETE
  USING (auth.uid() = shared_by_user_id OR auth.uid() = shared_with_user_id);

-- =====================================================
-- VUES UTILITAIRES
-- =====================================================

-- Vue pour récupérer facilement les recettes partagées avec leurs infos
CREATE OR REPLACE VIEW shared_recipes_with_details AS
SELECT
  sr.id,
  sr.recipe_id,
  sr.shared_by_user_id,
  sr.shared_with_user_id,
  sr.message,
  sr.is_read,
  sr.created_at,
  r.title as recipe_title,
  r.image_url as recipe_image_url,
  p.username as shared_by_username,
  p.avatar_url as shared_by_avatar_url
FROM shared_recipes sr
JOIN recipes r ON sr.recipe_id = r.id
JOIN profiles p ON sr.shared_by_user_id = p.id;
