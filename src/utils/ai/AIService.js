
import documentProcessor from './documentProcessor';
import geminiApi from './geminiApi';

/**
 * Main AIService class that coordinates document processing and AI requests
 */
class AIService {
  constructor() {
    this.apiKey = localStorage.getItem('gemini_api_key') || '';
    this.model = 'gemini-2.0-flash'; // Using Gemini 1.5 Flash model which supports multimodality
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
    // Process all sources into the format expected by the API
    const processedSources = [];
    
    for (const source of sources) {
      // For file sources, get the processed content
      if (source.type === 'file') {
        const content = this.getProcessedDocument(source.name);
        if (content) {
          processedSources.push({
            name: source.name,
            content: content
          });
        }
      } else if (source.type === 'folder') {
        // For folder sources, collect all processed contents from its files
        if (Array.isArray(source.content)) {
          // Process each file in the folder
          for (const file of source.content) {
            const fileName = `${source.name}/${file.name}`;
            const content = this.getProcessedDocument(fileName);
            if (content) {
              processedSources.push({
                name: fileName,
                content: content
              });
            }
          }
        }
      } else if (source.type === 'fileGroup') {
        // For file groups (multiple selected files), include all files
        if (Array.isArray(source.content)) {
          for (const file of source.content) {
            const content = this.getProcessedDocument(file.name);
            if (content) {
              processedSources.push({
                name: file.name,
                content: content
              });
            }
          }
        }
      } else if (source.type === 'text') {
        processedSources.push({
          name: source.name,
          content: source.content || "No content available for this source."
        });
      }
    }

    // If no processed sources were found, let the user know
    if (processedSources.length === 0) {
      console.error('No processed content available for any sources!');
      return "I couldn't find any processed content for your documents. Please try re-uploading them or check if the document format is supported.";
    }
    
    console.log(`Sending ${processedSources.length} processed sources to the API`);
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
