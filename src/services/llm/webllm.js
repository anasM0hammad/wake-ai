import * as webllm from '@mlc-ai/web-llm';
import { MODEL_CONFIG } from '../../utils/constants';
import { getDeviceRAM } from '../../utils/deviceInfo';

export const MODEL_OPTIONS = {
  small: MODEL_CONFIG.SMALL.id,
  large: MODEL_CONFIG.LARGE.id
};

export const MODEL_STATUS = {
  NOT_INITIALIZED: 'not_initialized',
  DOWNLOADING: 'downloading',
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error'
};

const MAX_INIT_RETRIES = 2;
const RETRY_DELAY_MS = 2000;

class WebLLMService {
  constructor() {
    this.engine = null;
    this.status = MODEL_STATUS.NOT_INITIALIZED;
    this.progress = { progress: 0, status: '' };
    this.errorMessage = null;
    this.listeners = new Set();
    this._wasEverReady = false;
    this._initPromise = null; // Guards against concurrent initialization
    this._onReadyCallbacks = [];
  }

  addProgressListener(callback) {
    this.listeners.add(callback);
    // Immediately notify new listener with current state
    callback({
      status: this.status,
      progress: this.progress,
      error: this.errorMessage,
      wasEverReady: this._wasEverReady
    });
    return () => this.listeners.delete(callback);
  }

  /**
   * Register a one-time callback for when model becomes ready.
   * If already ready, fires immediately.
   */
  onReady(callback) {
    if (this.isModelReady()) {
      callback();
    } else {
      this._onReadyCallbacks.push(callback);
    }
  }

  _notifyListeners() {
    const state = {
      status: this.status,
      progress: { ...this.progress },
      error: this.errorMessage,
      wasEverReady: this._wasEverReady
    };
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (e) {
        console.error('Error in progress listener:', e);
      }
    });
  }

  _fireOnReadyCallbacks() {
    const callbacks = this._onReadyCallbacks.splice(0);
    callbacks.forEach(cb => {
      try {
        cb();
      } catch (e) {
        console.error('[WebLLM] Error in onReady callback:', e);
      }
    });
  }

  _updateStatus(status, progress = null, error = null) {
    this.status = status;
    if (progress !== null) {
      this.progress = { ...progress };
    }
    if (error !== null) {
      this.errorMessage = error;
    }
    this._notifyListeners();
  }

  async getRecommendedModel() {
    try {
      const ramMB = await getDeviceRAM();
      console.log(`[WebLLM] Device RAM: ${ramMB}MB, threshold: ${MODEL_CONFIG.LARGE.ramThreshold}MB`);

      if (ramMB >= MODEL_CONFIG.LARGE.ramThreshold) {
        console.log('[WebLLM] Using large model (1.5B)');
        return MODEL_OPTIONS.large;
      }

      console.log('[WebLLM] Using small model (0.5B)');
      return MODEL_OPTIONS.small;
    } catch (error) {
      console.error('[WebLLM] Error detecting device RAM:', error);
      return MODEL_OPTIONS.small;
    }
  }

  /**
   * Initialize the model with concurrency guard and retry logic.
   * Multiple callers get the same promise — only one init runs at a time.
   */
  async initializeModel() {
    // Already ready — nothing to do
    if (this.isModelReady()) {
      console.log('[WebLLM] Model already ready, skipping init');
      return true;
    }

    // Already initializing — return the existing promise so callers deduplicate
    if (this._initPromise) {
      console.log('[WebLLM] Init already in progress, waiting on existing promise');
      return this._initPromise;
    }

    this._initPromise = this._initializeWithRetry();

    try {
      return await this._initPromise;
    } finally {
      this._initPromise = null;
    }
  }

  async _initializeWithRetry() {
    for (let attempt = 1; attempt <= MAX_INIT_RETRIES + 1; attempt++) {
      const success = await this._tryInitialize(attempt);
      if (success) return true;

      if (attempt <= MAX_INIT_RETRIES) {
        const delay = RETRY_DELAY_MS * attempt;
        console.log(`[WebLLM] Retry ${attempt}/${MAX_INIT_RETRIES} in ${delay}ms...`);
        this._updateStatus(
          MODEL_STATUS.DOWNLOADING,
          { progress: 0, status: `Retrying (${attempt}/${MAX_INIT_RETRIES})...` }
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    console.error('[WebLLM] All initialization attempts failed');
    return false;
  }

  async _tryInitialize(attempt) {
    try {
      const modelId = await this.getRecommendedModel();
      console.log(`[WebLLM] Init attempt ${attempt}, model: ${modelId}`);

      this._updateStatus(MODEL_STATUS.DOWNLOADING, {
        progress: 0,
        status: attempt === 1 ? 'Preparing model...' : `Retrying (attempt ${attempt})...`
      });

      // Clean up any existing engine before creating a new one
      if (this.engine) {
        try {
          await this.engine.unload();
        } catch {
          // Ignore cleanup errors
        }
        this.engine = null;
      }

      this.engine = new webllm.MLCEngine();

      this.engine.setInitProgressCallback((report) => {
        const progressPercent = Math.round((report.progress || 0) * 100);
        const statusText = report.text || 'Loading...';

        console.log(`[WebLLM] Progress: ${progressPercent}% - ${statusText}`);

        if (report.progress < 1) {
          this._updateStatus(
            MODEL_STATUS.DOWNLOADING,
            { progress: progressPercent, status: statusText }
          );
        } else {
          this._updateStatus(
            MODEL_STATUS.LOADING,
            { progress: 100, status: 'Initializing model...' }
          );
        }
      });

      await this.engine.reload(modelId);

      this._wasEverReady = true;
      this.errorMessage = null;
      this._updateStatus(MODEL_STATUS.READY, { progress: 100, status: 'Model ready' });
      console.log('[WebLLM] Model loaded successfully');

      // Fire onReady callbacks
      this._fireOnReadyCallbacks();

      return true;
    } catch (error) {
      console.error(`[WebLLM] Init attempt ${attempt} failed:`, error);
      console.error('[WebLLM] Error name:', error.name, 'message:', error.message);

      // Clean up failed engine
      if (this.engine) {
        try {
          await this.engine.unload();
        } catch {
          // Ignore
        }
        this.engine = null;
      }

      this._updateStatus(
        MODEL_STATUS.ERROR,
        { progress: 0, status: `Failed to load model (attempt ${attempt})` },
        error.message
      );
      return false;
    }
  }

  isModelReady() {
    return this.status === MODEL_STATUS.READY && this.engine !== null;
  }

  wasEverReady() {
    return this._wasEverReady;
  }

  getLoadingProgress() {
    return { ...this.progress };
  }

  getStatus() {
    return this.status;
  }

  getError() {
    return this.errorMessage;
  }

  async generateCompletion(prompt, options = {}) {
    if (!this.isModelReady()) {
      throw new Error('Model is not ready. Call initializeModel first.');
    }

    const {
      maxTokens = 512,
      temperature = 0.7,
      topP = 0.9,
      systemPrompt = null
    } = options;

    const defaultSystemPrompt = `You generate grade 2-3 level quiz questions. Use small numbers only. Output valid JSON only.`;

    try {
      const response = await this.engine.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt || defaultSystemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: maxTokens,
        temperature,
        top_p: topP
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('WebLLM generation error:', error);
      throw error;
    }
  }

  async unloadModel() {
    if (this.engine) {
      try {
        await this.engine.unload();
      } catch (error) {
        console.error('Error unloading model:', error);
      }
      this.engine = null;
    }
    this._updateStatus(MODEL_STATUS.NOT_INITIALIZED, { progress: 0, status: '' });
  }
}

// Singleton instance
const webLLMService = new WebLLMService();

export function initializeModel() {
  return webLLMService.initializeModel();
}

export function getRecommendedModel() {
  return webLLMService.getRecommendedModel();
}

export function isModelReady() {
  return webLLMService.isModelReady();
}

export function wasModelEverReady() {
  return webLLMService.wasEverReady();
}

export function getLoadingProgress() {
  return webLLMService.getLoadingProgress();
}

export function getStatus() {
  return webLLMService.getStatus();
}

export function getError() {
  return webLLMService.getError();
}

export function generateCompletion(prompt, options) {
  return webLLMService.generateCompletion(prompt, options);
}

export function unloadModel() {
  return webLLMService.unloadModel();
}

export function addProgressListener(callback) {
  return webLLMService.addProgressListener(callback);
}

export function onModelReady(callback) {
  return webLLMService.onReady(callback);
}

export default webLLMService;
