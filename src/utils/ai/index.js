
import documentProcessor from './documentProcessor';
import geminiApi from './geminiApi';

/**
 * AI Service - Handles all AI-related functionality
 */
class AIService {
  constructor() {
    this.documentProcessor = documentProcessor;
    this.apiKey = localStorage.getItem('geminiApiKey') || null;
    this.model = localStorage.getItem('geminiModel') || 'gemini-1.5-flash';
  }

  /**
   * Process documents and extract their content
   */
  async processDocuments(sources, apiKey = this.apiKey, model = this.model) {
    return this.documentProcessor.processDocuments(sources, apiKey, model);
  }

  /**
   * Get processed document content
   */
  getProcessedDocument(fileName) {
    return this.documentProcessor.getProcessedDocument(fileName);
  }

  /**
   * Clear cache for a specific document or all documents
   */
  clearCache(fileName = null) {
    this.documentProcessor.clearCache(fileName);
  }

  /**
   * Process text with AI
   */
  async processTextWithAI(text, prompt, apiKey = this.apiKey, model = this.model) {
    return geminiApi.generateChatResponse(prompt, [], [{ name: 'input', content: text }], apiKey, model);
  }

  /**
   * Process an image with AI
   */
  async processImageWithAI(image, prompt, apiKey = this.apiKey, model = this.model) {
    // Convert image to a base64 string or use as File object
    // Format it for Gemini's image analysis capabilities
    // For now, let's add this as a placeholder
    const imageSource = { name: 'image', content: image };
    return geminiApi.generateChatResponse(prompt, [], [imageSource], apiKey, model);
  }

  /**
   * Set API key and verify it
   */
  async setApiKey(apiKey) {
    const isValid = await geminiApi.verifyApiKey(apiKey);
    if (isValid) {
      this.apiKey = apiKey;
      localStorage.setItem('geminiApiKey', apiKey);
    }
    return isValid;
  }

  /**
   * Get current API key
   */
  getApiKey() {
    return this.apiKey;
  }

  /**
   * Set model
   */
  setModel(model) {
    this.model = model;
    localStorage.setItem('geminiModel', model);
  }

  /**
   * Get current model
   */
  getModel() {
    return this.model;
  }
}

const aiService = new AIService();

// Expose aiService globally for debugging and access from other components
if (typeof window !== 'undefined') {
  window.aiService = aiService;
}

export default aiService;
