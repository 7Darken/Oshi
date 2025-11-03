/**
 * Tests unitaires pour useAnalyzeLink
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useAnalyzeLink } from '@/hooks/useAnalyzeLink';
import { analyzeRecipe } from '@/services/api';

// Mock du store
jest.mock('@/stores/useRecipeStore', () => ({
  useRecipeStore: jest.fn(() => ({
    setLoading: jest.fn(),
    setError: jest.fn(),
    setRecipe: jest.fn(),
  })),
}));

// Mock du service API
jest.mock('@/services/api', () => ({
  analyzeRecipe: jest.fn(),
}));

describe('useAnalyzeLink', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls analyzeRecipe with correct parameters', async () => {
    const mockRecipe = {
      title: 'Test Recipe',
      ingredients: [],
      steps: [],
      total_time: '10 min',
      servings: 2,
    };

    (analyzeRecipe as jest.Mock).mockResolvedValue(mockRecipe);

    const { result } = renderHook(() => useAnalyzeLink());

    await result.current.analyzeLink('https://test.com', {
      onProgress: jest.fn(),
    });

    expect(analyzeRecipe).toHaveBeenCalledWith(
      'https://test.com',
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      })
    );
  });

  it('cancels analysis when cancelAnalysis is called', async () => {
    const { result } = renderHook(() => useAnalyzeLink());

    // Lancer une analyse
    const analyzePromise = result.current.analyzeLink('https://test.com');

    // Annuler immédiatement
    result.current.cancelAnalysis();

    // Vérifier que la promesse est rejetée ou annulée
    await expect(analyzePromise).rejects.toThrow();
  });

  it('calls onProgress callback with different stages', async () => {
    const mockRecipe = {
      title: 'Test Recipe',
      ingredients: [],
      steps: [],
      total_time: '10 min',
      servings: 2,
    };

    (analyzeRecipe as jest.Mock).mockResolvedValue(mockRecipe);
    const onProgress = jest.fn();

    const { result } = renderHook(() => useAnalyzeLink());

    await result.current.analyzeLink('https://test.com', { onProgress });

    // Vérifier qu'onProgress a été appelé au moins une fois avec Transcription
    expect(onProgress).toHaveBeenCalledWith('Transcription');
  });

  it('handles errors correctly', async () => {
    const mockError = new Error('API Error');
    (analyzeRecipe as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useAnalyzeLink());

    await result.current.analyzeLink('https://test.com');

    // Le hook devrait gérer l'erreur via setError (mocké dans le store)
    expect(analyzeRecipe).toHaveBeenCalled();
  });
});

