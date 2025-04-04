
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
 * Handles communication with the Gemini API
 */
const geminiApi = {
  /**
   * Generate a chat response using the Gemini API
   */
  generateChatResponse: async (message, chatHistory, sources, apiKey, model) => {
    console.log('Generating chat response with', sources.length, 'sources');
    
    if (!apiKey) {
      throw new Error('Google Gemini API key not set. Please add your API key in settings.');
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
          parts: [{ text: sourceContextPrompt }]
        },
        ...formattedHistory,
        {
          role: 'user',
          parts: [{ text: message }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4000,
      }
    };

    try {
      console.log('Sending request to Gemini API');
      // Make the API request to Gemini with the updated model
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Error response from Gemini API:', error);
        throw new Error(error.error?.message || 'Failed to get response from Google Gemini');
      }

      console.log('Received response from Gemini API');
      const data = await response.json();
      
      // Extract the response text from Gemini's response format
      if (data.candidates && data.candidates.length > 0 && 
          data.candidates[0].content && 
          data.candidates[0].content.parts && 
          data.candidates[0].content.parts.length > 0) {
        const responseText = data.candidates[0].content.parts[0].text;
        console.log(`Generated response with ${responseText.length} characters`);
        return responseText;
      } else {
        console.error('Invalid response format from Gemini API:', data);
        throw new Error('Invalid response format from Gemini API');
      }
    } catch (error) {
      console.error('Error generating chat response:', error);
      throw error;
    }
  },

  /**
   * Process an image using Gemini's vision capabilities for OCR and analysis
   */
  processImage: async (imageData, apiKey, model) => {
    if (!apiKey) {
      throw new Error('Google Gemini API key not set. Please add your API key in settings.');
    }

    console.log('Processing image with Gemini OCR capabilities');
    
    try {
      // Convert the image data to base64 if it's not already
      let base64Image = imageData;
      if (imageData instanceof Blob) {
        base64Image = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(imageData);
        });
      } else if (!imageData.startsWith('data:') && !imageData.startsWith('/9j/')) {
        // If it's not a base64 string already, assume it's a URL or path
        console.error('Image data must be a Blob or base64 string');
        throw new Error('Invalid image data format');
      }

      // Prepare the request to Gemini with the image
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: "Extract and analyze all text content from this image. Include all visible text in the image. Format the text to preserve the original layout as much as possible. For complex documents, organize the content by sections."
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Image
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4000,
        }
      };

      console.log('Sending image to Gemini API for OCR processing');
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Error response from Gemini API for image processing:', error);
        throw new Error(error.error?.message || 'Failed to process image with Google Gemini');
      }

      const data = await response.json();
      
      // Extract the OCR text from Gemini's response
      if (data.candidates && data.candidates.length > 0 && 
          data.candidates[0].content && 
          data.candidates[0].content.parts && 
          data.candidates[0].content.parts.length > 0) {
        const ocrText = data.candidates[0].content.parts[0].text;
        console.log(`Extracted ${ocrText.length} characters from image using OCR`);
        return ocrText;
      } else {
        console.error('Invalid response format from Gemini API for image processing:', data);
        throw new Error('Invalid response format from Gemini API for image processing');
      }
    } catch (error) {
      console.error('Error processing image with OCR:', error);
      throw error;
    }
  },

  /**
   * Verify if an API key is valid
   */
  verifyApiKey: async (apiKey) => {
    if (!apiKey) return false;
    
    try {
      // Using a simple request to verify the API key
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      return response.ok;
    } catch (error) {
      console.error('Error verifying API key:', error);
      return false;
    }
  }
};

export default geminiApi;
