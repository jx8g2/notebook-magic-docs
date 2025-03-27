
// AI service for handling chat requests using Google Gemini
import { useToast } from "@/components/ui/use-toast";
import * as pdfjs from 'pdfjs-dist';

// Set worker path for PDF.js
const pdfjsWorker = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.worker.min.js';
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// Default system prompt that instructs the AI on how to analyze documents
const DEFAULT_SYSTEM_PROMPT = 
  "You are an AI assistant called NotebookLM that helps users understand their documents. " +
  "Analyze the provided context from the user's documents and answer questions based on that information. " +
  "If you don't know the answer based on the provided context, say so clearly rather than making up information.";

class AIService {
  constructor() {
    this.apiKey = localStorage.getItem('gemini_api_key') || '';
    this.model = 'gemini-1.5-flash'; // Using Gemini 1.5 Flash model which supports multimodality
    this.processedDocuments = {}; // Cache for processed documents
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
            // Store the processed content in the cache
            this.processedDocuments[file.name] = content;
          } else if (file.type.startsWith('image/')) {
            content = await this.extractTextFromImage(file);
            this.processedDocuments[file.name] = content;
          } else if (file.type === 'text/plain') {
            content = await file.text();
            this.processedDocuments[file.name] = content;
          } else {
            // For other file types, use a generic approach
            content = `Content extracted from ${file.name} (${file.type})`;
            this.processedDocuments[file.name] = content;
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
    try {
      console.log(`Processing PDF: ${file.name}`);
      
      // Convert the File object to an ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Load the PDF using PDF.js
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      console.log(`PDF loaded with ${pdf.numPages} pages`);
      
      let extractedText = '';
      
      // Extract text from each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        extractedText += `Page ${i}: ${pageText}\n\n`;
      }
      
      console.log(`Extracted ${extractedText.length} characters from PDF`);
      return extractedText || "No text could be extracted from this PDF. It may be scanned or contain only images.";
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      return `Error extracting text from PDF: ${error.message}. The PDF may be encrypted, damaged, or in an unsupported format.`;
    }
  }
  
  async extractTextFromImage(file) {
    // Similar approach for images, using Gemini's vision capabilities
    try {
      if (!this.apiKey) {
        throw new Error('API key not set');
      }
      
      // Convert image to base64
      const base64Image = await this.fileToBase64(file);
      
      // Create a request to Gemini to extract text from the image
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: "Extract all visible text from this image using OCR. Return only the extracted text, nothing else."
              },
              {
                inline_data: {
                  mime_type: file.type,
                  data: base64Image.split(',')[1]
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 1000,
        }
      };
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to process image with Gemini');
      }
      
      const data = await response.json();
      const extractedText = data.candidates[0].content.parts[0].text;
      
      return extractedText || "No text could be extracted from this image.";
    } catch (error) {
      console.error('Error extracting text from image:', error);
      return `Error extracting text from image: ${error.message}`;
    }
  }
  
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
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
  
  // New method to get processed document content
  getProcessedDocument(fileName) {
    return this.processedDocuments[fileName] || null;
  }
}

// Create a singleton instance
const aiService = new AIService();
export default aiService;
