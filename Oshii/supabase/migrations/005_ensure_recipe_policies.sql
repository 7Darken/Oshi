-- =====================================================
-- Migration: Ensure RLS policies for recipe sharing
-- Purpose: Add missing policies for ingredients and steps
-- =====================================================

-- Enable RLS if not already enabled
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE steps ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RECIPES POLICIES
-- =====================================================

-- Policy pour permettre aux users de créer leurs propres recettes
DROP POLICY IF EXISTS "Users can insert own recipes" ON recipes;
CREATE POLICY "Users can insert own recipes"
  ON recipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy pour permettre aux users de lire leurs propres recettes
DROP POLICY IF EXISTS "Users can view own recipes" ON recipes;
CREATE POLICY "Users can view own recipes"
  ON recipes FOR SELECT
  USING (auth.uid() = user_id);

-- Policy pour permettre aux users de mettre à jour leurs propres recettes
DROP POLICY IF EXISTS "Users can update own recipes" ON recipes;
CREATE POLICY "Users can update own recipes"
  ON recipes FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy pour permettre aux users de supprimer leurs propres recettes
DROP POLICY IF EXISTS "Users can delete own recipes" ON recipes;
CREATE POLICY "Users can delete own recipes"
  ON recipes FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- INGREDIENTS POLICIES
-- =====================================================

-- Policy pour permettre aux users de créer des ingrédients pour leurs recettes
DROP POLICY IF EXISTS "Users can insert ingredients for own recipes" ON ingredients;
CREATE POLICY "Users can insert ingredients for own recipes"
  ON ingredients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = ingredients.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

-- Policy pour permettre aux users de lire les ingrédients de leurs recettes
DROP POLICY IF EXISTS "Users can view ingredients for own recipes" ON ingredients;
CREATE POLICY "Users can view ingredients for own recipes"
  ON ingredients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = ingredients.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

-- Policy pour permettre aux users de mettre à jour les ingrédients de leurs recettes
DROP POLICY IF EXISTS "Users can update ingredients for own recipes" ON ingredients;
CREATE POLICY "Users can update ingredients for own recipes"
  ON ingredients FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = ingredients.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

-- Policy pour permettre aux users de supprimer les ingrédients de leurs recettes
DROP POLICY IF EXISTS "Users can delete ingredients for own recipes" ON ingredients;
CREATE POLICY "Users can delete ingredients for own recipes"
  ON ingredients FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = ingredients.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

-- =====================================================
-- STEPS POLICIES
-- =====================================================

-- Policy pour permettre aux users de créer des étapes pour leurs recettes
DROP POLICY IF EXISTS "Users can insert steps for own recipes" ON steps;
CREATE POLICY "Users can insert steps for own recipes"
  ON steps FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = steps.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

-- Policy pour permettre aux users de lire les étapes de leurs recettes
DROP POLICY IF EXISTS "Users can view steps for own recipes" ON steps;
CREATE POLICY "Users can view steps for own recipes"
  ON steps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = steps.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

-- Policy pour permettre aux users de mettre à jour les étapes de leurs recettes
DROP POLICY IF EXISTS "Users can update steps for own recipes" ON steps;
CREATE POLICY "Users can update steps for own recipes"
  ON steps FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = steps.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

-- Policy pour permettre aux users de supprimer les étapes de leurs recettes
DROP POLICY IF EXISTS "Users can delete steps for own recipes" ON steps;
CREATE POLICY "Users can delete steps for own recipes"
  ON steps FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = steps.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

-- =====================================================
-- Vérification
-- =====================================================
-- Vous pouvez vérifier les policies avec:
-- SELECT tablename, policyname, cmd, qual, with_check FROM pg_policies
-- WHERE tablename IN ('recipes', 'ingredients', 'steps')
-- ORDER BY tablename, policyname;
