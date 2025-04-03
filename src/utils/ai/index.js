
import documentProcessor from './documentProcessor';
import geminiApi, { processText, processImage } from './geminiApi';

/**
 * AI Service - Handles all AI-related functionality
 */
class AIService {
  constructor() {
    this.documentProcessor = documentProcessor;
  }

  /**
   * Process documents and extract their content
   */
  async processDocuments(sources, apiKey = null, model = null) {
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
  async processTextWithAI(text, prompt, apiKey = null, model = null) {
    return processText(text, prompt, apiKey, model);
  }

  /**
   * Process an image with AI
   */
  async processImageWithAI(image, prompt, apiKey = null, model = null) {
    return processImage(image, prompt, apiKey, model);
  }
}

const aiService = new AIService();

// Expose aiService globally for debugging and access from other components
window.aiService = aiService;

export default aiService;
