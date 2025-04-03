
/**
 * Client for interacting with locally-running Llama 3.2 models
 * This implementation assumes you have Llama running locally via a REST API
 */

// Default system prompt for instructing the AI
export const DEFAULT_SYSTEM_PROMPT = 
  "You are an AI assistant called NotebookLM that helps users understand their documents. " +
  "Analyze the provided context from ALL the user's documents and answer questions based on that information. " +
  "When analyzing images or PDFs, use OCR to extract and understand all visible text and content. " +
  "You may also use your general knowledge to provide more comprehensive answers. " +
  "When providing information not found in the user's documents, clearly indicate this with phrases like 'Based on my knowledge...' or 'According to external information...' " +
  "If relevant, provide citations by including the document name in [brackets] after relevant information. " +
  "If a user asks about which document(s) contain specific content or keywords, list all matching documents with their names in [brackets]. " +
  "IMPORTANT: When referencing document names in your response, always use the EXACT document names as provided in the source list so they can be properly linked. " +
  "If you're uncertain about something, acknowledge this rather than making up information. " +
  "Use HTML tags for formatting: <b>bold</b>, <i>italic</i>, <u>underline</u>, <ol><li>numbered lists</li></ol>, <ul><li>bullet lists</li></ul>. " +
  "DO NOT use markdown formatting like **, __, ##, etc. Always use proper HTML tags instead. " +
  "Use hyperlinks where possible when referencing external sources to help users find more information: <a href='URL'>link text</a>.";

/**
 * Configuration for local Llama server
 */
const CONFIG = {
  localServerUrl: 'http://localhost:8000', // Default local server URL
  defaultModel: 'llama-3.2-8b', // Default local model
};

/**
 * Handles communication with a locally running Llama model
 */
const llamaLocalClient = {
  serverUrl: CONFIG.localServerUrl,
  currentModel: CONFIG.defaultModel,
  
  /**
   * Set the server URL for the local Llama instance
   */
  setServerUrl(url) {
    if (!url) return false;
    this.serverUrl = url;
    return true;
  },
  
  /**
   * Set the model to use
   */
  setModel(model) {
    if (!model) return false;
    this.currentModel = model;
    return true;
  },
  
  /**
   * Verify if the local Llama server is available
   */
  async verifyConnection() {
    try {
      // Simple health check request to verify the server is running
      const response = await fetch(`${this.serverUrl}/health`, {
        method: 'GET',
      });
      return response.ok;
    } catch (error) {
      console.error('Error connecting to local Llama server:', error);
      return false;
    }
  },

  /**
   * Generate a chat response using the local Llama model
   */
  generateChatResponse: async (message, chatHistory, sources) => {
    console.log('Generating chat response with local Llama model using', sources.length, 'sources');
    
    if (!llamaLocalClient.serverUrl) {
      throw new Error('Local Llama server URL not configured. Please set the server URL in settings.');
    }

    // Allow generating responses even without sources
    let sourceContextPrompt = '';
    let documentIndex = [];
    
    if (sources && sources.length > 0) {
      // Process all sources
      let allSourcesContent = '';
      
      for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        
        if (typeof source.content === 'string') {
          allSourcesContent += `Document [${source.name}]:\n${source.content}\n\n`;
          documentIndex.push(source.name);
        }
      }
      
      console.log(`Using ${documentIndex.length} sources with total content length: ${allSourcesContent.length} characters`);
      sourceContextPrompt = `Document Context from your sources - REFER TO THESE DOCUMENTS BY THEIR EXACT NAMES IN [BRACKETS]:\n\n${allSourcesContent}`;
      
      // Add document index for reference
      sourceContextPrompt += "\nAVAILABLE DOCUMENTS INDEX (use these exact names when referencing):\n";
      documentIndex.forEach((doc, idx) => {
        sourceContextPrompt += `${idx + 1}. [${doc}]\n`;
      });
    } else {
      // If no sources are available, let the model use its general knowledge
      sourceContextPrompt = "No specific document content provided. Use your general knowledge to answer the question, and provide citations where appropriate.";
    }

    // Format chat history for Llama API
    const formattedHistory = chatHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));

    // Prepare the request body for local Llama server
    // Note: This format might need to be adjusted based on your specific local Llama API implementation
    const requestBody = {
      model: llamaLocalClient.currentModel,
      messages: [
        {
          role: 'system',
          content: DEFAULT_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: sourceContextPrompt
        },
        ...formattedHistory,
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    };

    try {
      console.log('Sending request to local Llama server');
      // Make the API request to local Llama server
      const response = await fetch(`${llamaLocalClient.serverUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Error response from local Llama server:', error);
        throw new Error(error.error?.message || 'Failed to get response from local Llama server');
      }

      console.log('Received response from local Llama server');
      const data = await response.json();
      
      // Extract the response text from Llama's response format
      // This format will depend on your local Llama API - adjust as needed
      if (data.choices && data.choices.length > 0 && 
          data.choices[0].message && 
          data.choices[0].message.content) {
        const responseText = data.choices[0].message.content;
        console.log(`Generated response with ${responseText.length} characters`);
        return responseText;
      } else {
        console.error('Invalid response format from local Llama server:', data);
        throw new Error('Invalid response format from local Llama server');
      }
    } catch (error) {
      console.error('Error generating chat response:', error);
      throw error;
    }
  },

  /**
   * Process an image using the local Llama model with vision capabilities
   * Used for OCR and image analysis
   */
  processImage: async (imageData) => {
    if (!llamaLocalClient.serverUrl) {
      throw new Error('Local Llama server URL not configured');
    }

    try {
      // Convert image data to base64 if it's not already
      let base64Image = imageData;
      if (imageData instanceof Blob) {
        base64Image = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(imageData);
        });
      }

      // Prepare request for Llama vision API endpoint
      const requestBody = {
        model: llamaLocalClient.currentModel,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Extract and analyze all text visible in this image. Describe any non-text content briefly." },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
            ]
          }
        ],
        max_tokens: 1000
      };

      // Send request to local Llama vision API
      const response = await fetch(`${llamaLocalClient.serverUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Failed to process image: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Extract text from response
      if (result.choices && result.choices.length > 0 && result.choices[0].message) {
        return result.choices[0].message.content;
      } else {
        throw new Error('Invalid response format from image processing');
      }
    } catch (error) {
      console.error('Error processing image:', error);
      throw error;
    }
  }
};

export default llamaLocalClient;
