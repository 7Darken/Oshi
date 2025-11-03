/**
 * Tests unitaires pour RecipeAnalyzeSkeleton
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RecipeAnalyzeSkeleton } from '@/components/RecipeAnalyzeSkeleton';

// Mock des modules natifs si nécessaire
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    AccessibilityInfo: {
      announceForAccessibility: jest.fn(),
    },
  };
});

describe('RecipeAnalyzeSkeleton', () => {
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    const { getByText } = render(
      <RecipeAnalyzeSkeleton onCancel={mockOnCancel} />
    );

    expect(getByText('On analyse la recette…')).toBeTruthy();
    expect(getByText('Transcription en cours — nous détectons ingrédients & étapes.')).toBeTruthy();
  });

  it('displays the correct stage', () => {
    const { getByText } = render(
      <RecipeAnalyzeSkeleton onCancel={mockOnCancel} stage="Extraction" />
    );

    expect(getByText('Extraction')).toBeTruthy();
  });

  it('calls onCancel when cancel button is pressed', () => {
    const { getByLabelText } = render(
      <RecipeAnalyzeSkeleton onCancel={mockOnCancel} />
    );

    const cancelButton = getByLabelText("Annuler l'analyse");
    fireEvent.press(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('displays the estimated time', () => {
    const { getByText } = render(
      <RecipeAnalyzeSkeleton onCancel={mockOnCancel} estimatedTime={45} />
    );

    expect(getByText('Temps estimé : ~45s')).toBeTruthy();
  });

  it('displays all progress stages', () => {
    const { getByText } = render(
      <RecipeAnalyzeSkeleton onCancel={mockOnCancel} />
    );

    expect(getByText('Transcription')).toBeTruthy();
    expect(getByText('Extraction')).toBeTruthy();
    expect(getByText('Normalisation')).toBeTruthy();
    expect(getByText('Finalisation')).toBeTruthy();
  });

  it('has accessible cancel button', () => {
    const { getByRole } = render(
      <RecipeAnalyzeSkeleton onCancel={mockOnCancel} />
    );

    const cancelButton = getByRole('button');
    expect(cancelButton).toBeTruthy();
  });
});

