
// Export the main AI service instance as the default export
import AIService from './AIService';
import geminiApi from './geminiApi';

// Create a singleton instance
const aiService = new AIService();
export default aiService;

// Also export individual utilities for direct usage when needed
export { default as documentProcessor } from './documentProcessor';
export { default as textExtractors } from './textExtractors';
export const { generateChatResponse, verifyApiKey } = geminiApi;
