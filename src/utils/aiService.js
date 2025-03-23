
// AI service for handling chat requests using Google Gemini
import { useToast } from "@/components/ui/use-toast";

// Default system prompt that instructs the AI on how to analyze documents
const DEFAULT_SYSTEM_PROMPT = 
  "You are an AI assistant called NotebookLM that helps users understand their documents. " +
  "Analyze the provided context from the user's documents and answer questions based on that information. " +
  "If you don't know the answer based on the provided context, say so clearly rather than making up information.";

class AIService {
  constructor() {
    this.apiKey = localStorage.getItem('gemini_api_key') || '';
    this.model = 'gemini-1.5-flash'; // Updated to Gemini 1.5 Flash model
  }

  setApiKey(key) {
    this.apiKey = key;
    localStorage.setItem('gemini_api_key', key);
    return this.verifyApiKey();
  }

  getApiKey() {
    return this.apiKey;
  }

  async verifyApiKey() {
    if (!this.apiKey) return false;
    
    try {
      // Using a simple request to verify the API key
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`);
      return response.ok;
    } catch (error) {
      console.error('Error verifying API key:', error);
      return false;
    }
  }

  async processDocuments(sources) {
    // This would process documents to extract content
    // For demonstration purposes, we'll just return mock processed content
    return sources.map(source => {
      return {
        id: Math.random().toString(36).substring(7),
        name: source.name,
        content: source.type === 'text' 
          ? source.content 
          : `Content extracted from ${source.name}`
      };
    });
  }

  async generateChatResponse(message, chatHistory, sources, activeSource) {
    if (!this.apiKey) {
      throw new Error('Google Gemini API key not set. Please add your API key in settings.');
    }

    // Extract the relevant source content
    const sourceContent = sources.length > 0 
      ? `Information from source "${sources[activeSource]?.name}": ${sources[activeSource]?.content || "No content available"}`
      : "No sources have been added yet.";

    // Format chat history for Gemini API
    const formattedHistory = chatHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Prepare the request body
    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: DEFAULT_SYSTEM_PROMPT }]
        },
        {
          role: 'user',
          parts: [{ text: `Context: ${sourceContent}` }]
        },
        ...formattedHistory,
        {
          role: 'user',
          parts: [{ text: message }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      }
    };

    try {
      // Make the API request to Gemini with the updated model
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to get response from Google Gemini');
      }

      const data = await response.json();
      
      // Extract the response text from Gemini's response format
      if (data.candidates && data.candidates.length > 0 && 
          data.candidates[0].content && 
          data.candidates[0].content.parts && 
          data.candidates[0].content.parts.length > 0) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error('Invalid response format from Gemini API');
      }
    } catch (error) {
      console.error('Error generating chat response:', error);
      throw error;
    }
  }
}

// Create a singleton instance
const aiService = new AIService();
export default aiService;
