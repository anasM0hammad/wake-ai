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

class WebLLMService {
  constructor() {
    this.engine = null;
    this.status = MODEL_STATUS.NOT_INITIALIZED;
    this.progress = { progress: 0, status: '' };
    this.errorMessage = null;
    this.listeners = new Set();
  }

  addProgressListener(callback) {
    this.listeners.add(callback);
    // Immediately notify new listener with current state
    callback({
      status: this.status,
      progress: this.progress,
      error: this.errorMessage
    });
    return () => this.listeners.delete(callback);
  }

  _notifyListeners() {
    const state = {
      status: this.status,
      progress: { ...this.progress },
      error: this.errorMessage
    };
    // Use setTimeout to ensure React state updates trigger re-renders
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (e) {
        console.error('Error in progress listener:', e);
      }
    });
  }

  _updateStatus(status, progress = null, error = null) {
    this.status = status;
    if (progress !== null) {
      // Create new object to ensure React detects the change
      this.progress = { ...progress };
    }
    if (error !== null) {
      this.errorMessage = error;
    }
    this._notifyListeners();
  }

  async getRecommendedModel() {
    try {
      // Use platform-appropriate RAM detection from deviceInfo
      const ramMB = await getDeviceRAM();
      console.log(`[WebLLM] Device RAM: ${ramMB}MB, threshold: ${MODEL_CONFIG.LARGE.ramThreshold}MB`);

      // If RAM >= threshold (6GB), use large model
      if (ramMB >= MODEL_CONFIG.LARGE.ramThreshold) {
        console.log('[WebLLM] Using large model (1.5B)');
        return MODEL_OPTIONS.large;
      }

      // Default to small model for lower RAM devices
      console.log('[WebLLM] Using small model (0.5B)');
      return MODEL_OPTIONS.small;
    } catch (error) {
      console.error('[WebLLM] Error detecting device RAM:', error);
      // Default to small model if any uncertainty
      return MODEL_OPTIONS.small;
    }
  }

  async initializeModel() {
    try {
      // Auto-detect and use recommended model
      const modelId = await this.getRecommendedModel();

      this._updateStatus(MODEL_STATUS.DOWNLOADING, { progress: 0, status: 'Starting download...' });

      // Create engine with progress callback set BEFORE loading
      this.engine = new webllm.MLCEngine();

      // Set progress callback before calling reload
      this.engine.setInitProgressCallback((report) => {
        // WebLLM progress is 0-1, convert to 0-100
        const progressPercent = Math.round((report.progress || 0) * 100);
        const statusText = report.text || 'Downloading...';

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

      this._updateStatus(MODEL_STATUS.READY, { progress: 100, status: 'Model ready' });
      return true;
    } catch (error) {
      console.error('WebLLM initialization error:', error);
      this._updateStatus(
        MODEL_STATUS.ERROR,
        { progress: 0, status: 'Failed to load model' },
        error.message
      );
      return false;
    }
  }

  isModelReady() {
    return this.status === MODEL_STATUS.READY && this.engine !== null;
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

    // Default system prompt for question generation
    const defaultSystemPrompt = `Generate simple quiz questions in JSON. Output ONLY valid JSON with: question, options (4 items), correctIndex (0-3). Ensure the correct answer is in options at correctIndex.`;

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

export default webLLMService;
