/**
 * Hook useMinimumDisplayDelay
 * Garantit qu'une promesse affiche un état de chargement pendant au moins minMs millisecondes
 * Évite les flickers pour les réponses ultra-rapides
 */

import { useState, useEffect, useRef } from 'react';

export function useMinimumDisplayDelay<T>(
  promise: Promise<T> | null,
  minMs: number = 1200
): [boolean, T | null, Error | null] {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!promise) {
      setIsLoading(false);
      setResult(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setResult(null);
    setError(null);
    startTimeRef.current = Date.now();

    let promiseCompleted = false;
    let promiseResult: T | null = null;
    let promiseError: Error | null = null;

    promise
      .then((data) => {
        promiseCompleted = true;
        promiseResult = data;
      })
      .catch((err) => {
        promiseCompleted = true;
        promiseError = err instanceof Error ? err : new Error(String(err));
      });

    // Vérifier périodiquement si la promesse est terminée
    const checkCompletion = () => {
      if (promiseCompleted) {
        const elapsed = Date.now() - (startTimeRef.current ?? 0);
        const remaining = Math.max(0, minMs - elapsed);

        if (remaining === 0) {
          // Temps minimum écoulé, on peut afficher le résultat
          setIsLoading(false);
          setResult(promiseResult);
          setError(promiseError);
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        } else {
          // Attendre le temps restant
          timeoutRef.current = setTimeout(() => {
            setIsLoading(false);
            setResult(promiseResult);
            setError(promiseError);
            timeoutRef.current = null;
          }, remaining);
        }
      } else {
        // Réessayer dans 100ms
        timeoutRef.current = setTimeout(checkCompletion, 100);
      }
    };

    checkCompletion();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [promise, minMs]);

  return [isLoading, result, error];
}

