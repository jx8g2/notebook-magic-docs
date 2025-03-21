
// AI service for handling chat requests
import { useToast } from "@/components/ui/use-toast";

// Default system prompt that instructs the AI on how to analyze documents
const DEFAULT_SYSTEM_PROMPT = 
  "You are an AI assistant called NotebookLM that helps users understand their documents. " +
  "Analyze the provided context from the user's documents and answer questions based on that information. " +
  "If you don't know the answer based on the provided context, say so clearly rather than making up information.";

class AIService {
  constructor() {
    this.apiKey = localStorage.getItem('openai_api_key') || '';
  }

  setApiKey(key) {
    this.apiKey = key;
    localStorage.setItem('openai_api_key', key);
    return this.verifyApiKey();
  }

  getApiKey() {
    return this.apiKey;
  }

  async verifyApiKey() {
    if (!this.apiKey) return false;
    
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
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
      throw new Error('OpenAI API key not set. Please add your API key in settings.');
    }

    // Extract the relevant source content
    const sourceContent = sources.length > 0 
      ? `Information from source "${sources[activeSource]?.name}": ${sources[activeSource]?.content || "No content available"}`
      : "No sources have been added yet.";

    // Create messages array with system prompt, context, and chat history
    const messages = [
      { role: 'system', content: DEFAULT_SYSTEM_PROMPT },
      { role: 'system', content: `Context: ${sourceContent}` },
      ...chatHistory,
      { role: 'user', content: message }
    ];

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to get response from OpenAI');
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error generating chat response:', error);
      throw error;
    }
  }
}

// Create a singleton instance
const aiService = new AIService();
export default aiService;
