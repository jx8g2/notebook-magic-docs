
import documentProcessor from './documentProcessor';
import geminiApi from './geminiApi';

/**
 * Main AIService class that coordinates document processing and AI requests
 */
class AIService {
  constructor() {
    this.apiKey = localStorage.getItem('gemini_api_key') || '';
    this.model = 'gemini-1.5-flash'; // Using Gemini 1.5 Flash model which supports multimodality
  }

  /**
   * Set the API key for Gemini
   */
  async setApiKey(key) {
    this.apiKey = key;
    localStorage.setItem('gemini_api_key', key);
    return this.verifyApiKey();
  }

  /**
   * Get the current API key
   */
  getApiKey() {
    return this.apiKey;
  }

  /**
   * Verify if the current API key is valid
   */
  async verifyApiKey() {
    return geminiApi.verifyApiKey(this.apiKey);
  }

  /**
   * Process documents to extract their content
   */
  async processDocuments(sources) {
    return documentProcessor.processDocuments(sources, this.apiKey, this.model);
  }
  
  /**
   * Generate a chat response using the Gemini API
   */
  async generateChatResponse(message, chatHistory, sources, activeSource) {
    // Process sources into the format expected by the API
    const processedSources = sources.map(source => {
      // For file sources, get the processed content
      if (source.type === 'file') {
        return {
          name: source.name,
          content: this.getProcessedDocument(source.name) || "No content available for this source."
        };
      } else if (source.type === 'folder') {
        return {
          name: source.name,
          content: "Folder with multiple files"
        };
      } else {
        return {
          name: source.name,
          content: source.content || "No content available for this source."
        };
      }
    });

    return geminiApi.generateChatResponse(message, chatHistory, processedSources, this.apiKey, this.model);
  }
  
  /**
   * Get processed document content
   */
  getProcessedDocument(fileName) {
    return documentProcessor.getProcessedDocument(fileName);
  }

  /**
   * Clear cache for a specific document or all documents
   */
  clearCache(fileName = null) {
    documentProcessor.clearCache(fileName);
  }
}

export default AIService;
