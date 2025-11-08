-- =====================================================
-- Migration: Fix recipe sharing trigger
-- Purpose: Allow recipe copy creation via trigger
-- =====================================================

-- Supprimer l'ancien trigger et la fonction
DROP TRIGGER IF EXISTS trigger_create_recipe_copy ON shared_recipes;
DROP FUNCTION IF EXISTS create_recipe_copy_on_share();

-- Recréer la fonction avec SECURITY DEFINER pour bypasser RLS
CREATE OR REPLACE FUNCTION create_recipe_copy_on_share()
RETURNS TRIGGER
SECURITY DEFINER -- Exécute avec les privilèges du créateur (bypasse RLS)
SET search_path = public
AS $$
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

-- Recréer le trigger
CREATE TRIGGER trigger_create_recipe_copy
AFTER INSERT ON shared_recipes
FOR EACH ROW
EXECUTE FUNCTION create_recipe_copy_on_share();

-- =====================================================
-- Vérifier que les policies INSERT existent sur recipes
-- =====================================================

-- Note: Normalement la table recipes devrait déjà avoir une policy INSERT
-- qui permet aux users de créer leurs propres recettes.
-- Si ce n'est pas le cas, ajouter:

-- DROP POLICY IF EXISTS "Users can insert own recipes" ON recipes;
-- CREATE POLICY "Users can insert own recipes"
--   ON recipes FOR INSERT
--   WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- Vérification
-- =====================================================
-- Vous pouvez vérifier les policies avec:
-- SELECT * FROM pg_policies WHERE tablename = 'recipes';
