
import geminiApi from './geminiApi';
import llamaLocalClient from './llamaLocalClient';
import documentProcessor from './documentProcessor';

/**
 * AIService class that handles interactions with AI providers
 */
class AIService {
  constructor() {
    // Initialize with default values
    this.apiKey = localStorage.getItem('gemini_api_key') || '';
    this.model = localStorage.getItem('ai_model') || 'gemini-1.5-flash';
    this.provider = localStorage.getItem('ai_provider') || 'gemini';
    this.serverUrl = localStorage.getItem('llama_server_url') || 'http://localhost:8000';
    this.localModel = localStorage.getItem('llama_model') || 'llama-3.2-8b';
    
    // Make AIService available globally for debugging
    if (typeof window !== 'undefined') {
      window.aiService = this;
    }
  }

  /**
   * Set and verify the Gemini API key
   */
  async setApiKey(apiKey) {
    const isValid = await geminiApi.verifyApiKey(apiKey);
    if (isValid) {
      this.apiKey = apiKey;
      localStorage.setItem('gemini_api_key', apiKey);
    }
    return isValid;
  }
  
  /**
   * Set the model for Gemini API
   */
  setModel(model) {
    this.model = model;
    localStorage.setItem('ai_model', model);
    return true;
  }
  
  /**
   * Get the current API key
   */
  getApiKey() {
    return this.apiKey;
  }
  
  /**
   * Get the current model
   */
  getModel() {
    if (this.provider === 'gemini') {
      return this.model;
    } else {
      return this.localModel;
    }
  }
  
  /**
   * Set the AI provider (gemini or local)
   */
  setProvider(provider) {
    if (provider !== 'gemini' && provider !== 'local') {
      console.error('Invalid provider. Must be "gemini" or "local"');
      return false;
    }
    this.provider = provider;
    localStorage.setItem('ai_provider', provider);
    return true;
  }
  
  /**
   * Get the current AI provider
   */
  getProvider() {
    return this.provider;
  }
  
  /**
   * Set and verify the local Llama server
   */
  async setLocalServer(serverUrl, model) {
    llamaLocalClient.setServerUrl(serverUrl);
    llamaLocalClient.setModel(model);
    
    const isConnected = await llamaLocalClient.verifyConnection();
    if (isConnected) {
      this.serverUrl = serverUrl;
      this.localModel = model;
      localStorage.setItem('llama_server_url', serverUrl);
      localStorage.setItem('llama_model', model);
    }
    return isConnected;
  }
  
  /**
   * Get the current Llama server URL
   */
  getServerUrl() {
    return this.serverUrl;
  }

  /**
   * Process files/documents and generate chat responses
   */
  async processDocuments(sources) {
    // Process documents (same for both providers)
    return await documentProcessor.processDocuments(sources, this.apiKey, this.model);
  }

  /**
   * Generate a chat response using the chosen AI provider
   */
  async generateChatResponse(message, chatHistory, sources) {
    if (this.provider === 'gemini') {
      return await geminiApi.generateChatResponse(message, chatHistory, sources, this.apiKey, this.model);
    } else {
      return await llamaLocalClient.generateChatResponse(message, chatHistory, sources);
    }
  }
  
  /**
   * Process an image (OCR) using the chosen AI provider
   */
  async processImage(imageData) {
    if (this.provider === 'gemini') {
      // Ensure we have a method to process images in geminiApi
      if (!geminiApi.processImage) {
        throw new Error('Image processing not available with current Gemini API implementation');
      }
      return await geminiApi.processImage(imageData, this.apiKey, this.model);
    } else {
      return await llamaLocalClient.processImage(imageData);
    }
  }
  
  /**
   * Clear document cache
   */
  clearCache(fileName = null) {
    documentProcessor.clearCache(fileName);
  }
}

export default AIService;
