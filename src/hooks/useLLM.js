import { useState, useEffect, useCallback, useRef } from 'react';
import {
  initializeModel as initModel,
  isModelReady,
  getStatus,
  getLoadingProgress,
  addProgressListener,
  MODEL_STATUS
} from '../services/llm/webllm';
import { generateQuestionBatch } from '../services/llm/questionGenerator';
import { getRandomFallbackQuestions } from '../services/llm/fallbackQuestions';

export function useLLM() {
  const [modelStatus, setModelStatus] = useState(getStatus());
  const [loadingProgress, setLoadingProgress] = useState(getLoadingProgress());
  const [error, setError] = useState(null);
  const initializingRef = useRef(false);

  useEffect(() => {
    // Subscribe to progress updates
    const unsubscribe = addProgressListener((state) => {
      setModelStatus(state.status);
      setLoadingProgress(state.progress);
      if (state.error) {
        setError(state.error);
      }
    });

    // Sync initial state
    setModelStatus(getStatus());
    setLoadingProgress(getLoadingProgress());

    return unsubscribe;
  }, []);

  const initializeModel = useCallback(async (modelSize = 'small') => {
    if (initializingRef.current) {
      return false;
    }

    if (isModelReady()) {
      return true;
    }

    initializingRef.current = true;
    setError(null);

    try {
      const success = await initModel(modelSize);
      return success;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      initializingRef.current = false;
    }
  }, []);

  const generateQuestions = useCallback(async (categories, count) => {
    const categoriesList = Array.isArray(categories) ? categories : [categories];

    // Try LLM generation if model is ready
    if (isModelReady()) {
      try {
        const questions = await generateQuestionBatch(categoriesList, count);
        if (questions && questions.length >= count) {
          return questions.slice(0, count);
        }
        // If we got some questions but not enough, supplement with fallback
        if (questions && questions.length > 0) {
          const remaining = count - questions.length;
          const fallback = getRandomFallbackQuestions(categoriesList, remaining);
          return [...questions, ...fallback].slice(0, count);
        }
      } catch (err) {
        console.warn('LLM question generation failed, using fallback:', err);
      }
    }

    // Fallback to pre-written questions
    return getRandomFallbackQuestions(categoriesList, count);
  }, []);

  const isReady = modelStatus === MODEL_STATUS.READY;
  const isLoading = modelStatus === MODEL_STATUS.DOWNLOADING || modelStatus === MODEL_STATUS.LOADING;
  const hasError = modelStatus === MODEL_STATUS.ERROR;

  return {
    modelStatus,
    loadingProgress,
    error,
    initializeModel,
    generateQuestions,
    isReady,
    isLoading,
    hasError
  };
}

export default useLLM;
