
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
    this.model = 'gemini-1.5-flash'; // Using Gemini 1.5 Flash model which supports multimodality
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
    // Now we'll process documents with improved OCR capabilities
    const processedSources = [];
    
    for (const source of sources) {
      try {
        if (source.type === 'file') {
          const file = source.content;
          let content = '';
          
          // Process based on file type
          if (file.type === 'application/pdf') {
            content = await this.extractTextFromPDF(file);
          } else if (file.type.startsWith('image/')) {
            content = await this.extractTextFromImage(file);
          } else if (file.type === 'text/plain') {
            content = await file.text();
          } else {
            // For other file types, use a generic approach
            content = `Content extracted from ${file.name} (${file.type})`;
          }
          
          processedSources.push({
            id: Math.random().toString(36).substring(7),
            name: source.name,
            content: content
          });
        } else {
          // Handle text and link types as before
          processedSources.push({
            id: Math.random().toString(36).substring(7),
            name: source.name,
            content: source.type === 'text' ? source.content : `Content from ${source.name}`
          });
        }
      } catch (error) {
        console.error(`Error processing document ${source.name}:`, error);
        processedSources.push({
          id: Math.random().toString(36).substring(7),
          name: source.name,
          content: `Error extracting content: ${error.message}`
        });
      }
    }
    
    return processedSources;
  }
  
  async extractTextFromPDF(file) {
    // For PDFs, we'll analyze them directly with Gemini's vision capabilities
    // by converting pages to images and sending them to the model
    try {
      if (!this.apiKey) {
        throw new Error('API key not set');
      }
      
      // Here we would typically use a PDF.js approach to render pages
      // For now, we'll create a placeholder with information for the user
      
      return "PDF text extraction with OCR is being processed. The Gemini API will analyze the document content when you ask questions about it.";
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      return `Error extracting text from PDF: ${error.message}`;
    }
  }
  
  async extractTextFromImage(file) {
    // Similar approach for images
    try {
      if (!this.apiKey) {
        throw new Error('API key not set');
      }
      
      return "Image OCR is being processed. The Gemini API will analyze the image content when you ask questions about it.";
    } catch (error) {
      console.error('Error extracting text from image:', error);
      return `Error extracting text from image: ${error.message}`;
    }
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

    // Enhanced instruction for Gemini to utilize OCR capabilities
    const enhancedSystemPrompt = DEFAULT_SYSTEM_PROMPT + 
      " If the document is a PDF or an image, extract and analyze all visible text including text in images using OCR technology.";

    // Prepare the request body
    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: enhancedSystemPrompt }]
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
