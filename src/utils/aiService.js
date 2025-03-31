// AI service for handling chat requests using Google Gemini
import { useToast } from "@/hooks/use-toast";
import * as pdfjs from 'pdfjs-dist';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

// Set worker path for PDF.js - Updated to match the API version
const pdfjsWorker = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// Default system prompt that instructs the AI on how to analyze documents
const DEFAULT_SYSTEM_PROMPT = 
  "You are an AI assistant called NotebookLM that helps users understand their documents. " +
  "Analyze the provided context from the user's documents and answer questions based on that information. " +
  "When analyzing images or PDFs, use OCR to extract and understand all visible text and content. " +
  "If you don't know the answer based on the provided context, say so clearly rather than making up information. " +
  "The document content has already been extracted and provided to you, so you don't need to request access to any files. " +
  "Use ONLY the document context provided to answer questions.";

class AIService {
  constructor() {
    this.apiKey = localStorage.getItem('gemini_api_key') || '';
    this.model = 'gemini-1.5-flash'; // Using Gemini 1.5 Flash model which supports multimodality
    this.processedDocuments = {}; // Cache for processed documents
    
    // Try to load cached documents from localStorage
    try {
      const cachedDocs = localStorage.getItem('processedDocuments');
      if (cachedDocs) {
        this.processedDocuments = JSON.parse(cachedDocs);
        console.log('Loaded cached documents from localStorage:', Object.keys(this.processedDocuments));
      }
    } catch (error) {
      console.error('Error loading cached documents:', error);
    }
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
    console.log('Processing documents:', sources);
    const processedSources = [];
    
    for (const source of sources) {
      try {
        if (source.type === 'file') {
          const file = source.content;
          let content = '';
          
          // Check if we already have processed this file (by name and size)
          const fileKey = `${file.name}_${file.size}`;
          if (this.processedDocuments[fileKey]) {
            console.log(`Using cached content for ${file.name}`);
            content = this.processedDocuments[fileKey];
          } else {
            // Process based on file type
            if (file.type === 'application/pdf') {
              console.log(`Processing PDF file: ${file.name}`);
              content = await this.extractTextFromPDF(file);
              console.log(`Extracted ${content.length} characters from PDF: ${file.name}`);
            } else if (file.type.startsWith('image/')) {
              console.log(`Processing image file: ${file.name}`);
              content = await this.extractTextFromImage(file);
              console.log(`Extracted text from image: ${file.name}`, content.substring(0, 100) + '...');
            } else if (file.type === 'text/plain') {
              content = await file.text();
            } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
              console.log(`Processing Word document: ${file.name}`);
              content = await this.extractTextFromDOCX(file);
              console.log(`Extracted ${content.length} characters from DOCX: ${file.name}`);
            } else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                      file.type === 'application/vnd.ms-excel') {
              console.log(`Processing Excel file: ${file.name}`);
              content = await this.extractTextFromExcel(file);
              console.log(`Extracted ${content.length} characters from Excel: ${file.name}`);
            } else {
              // For other file types, try as text or use a generic approach
              try {
                content = await file.text();
              } catch (e) {
                console.warn(`Could not extract text from ${file.type}, using generic message`);
                content = `Unable to extract content from this file type (${file.type}). Please convert it to PDF, text, or an image for better results.`;
              }
            }
            
            // Store the processed content in the cache using filename and size as key
            this.processedDocuments[fileKey] = content;
            this.processedDocuments[file.name] = content; // Also store by name for backward compatibility
            
            // Cache to localStorage for persistence
            try {
              localStorage.setItem('processedDocuments', JSON.stringify(this.processedDocuments));
            } catch (e) {
              console.warn('Failed to cache documents to localStorage', e);
            }
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
    
    console.log('Processed documents:', processedSources.map(s => ({name: s.name, contentLength: s.content.length})));
    return processedSources;
  }
  
  async extractTextFromExcel(file) {
    try {
      console.log(`Processing Excel: ${file.name}`);
      
      // Convert the File object to an ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Use xlsx library to parse the Excel file
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Extract text from each sheet
      let extractedText = '';
      
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        extractedText += `Sheet: ${sheetName}\n\n`;
        
        // Convert the sheet data to a readable format
        sheetData.forEach((row, rowIndex) => {
          if (row && row.length > 0) {
            const rowText = row.map(cell => cell !== undefined ? cell.toString() : '').join('\t');
            extractedText += `${rowText}\n`;
          }
        });
        
        extractedText += '\n---\n\n';
      });
      
      console.log(`Extracted ${extractedText.length} characters from Excel`);
      return extractedText || "No text could be extracted from this Excel file. It may be protected or empty.";
    } catch (error) {
      console.error('Error extracting text from Excel:', error);
      return `Error extracting text from Excel: ${error.message}. The file may be protected, damaged, or in an unsupported format.`;
    }
  }
  
  async extractTextFromPDF(file) {
    try {
      console.log(`Processing PDF: ${file.name}`);
      
      // Convert the File object to an ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Load the PDF using PDF.js with explicit API version
      const loadingTask = pdfjs.getDocument({
        data: arrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: true,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true,
      });
      
      const pdf = await loadingTask.promise;
      console.log(`PDF loaded with ${pdf.numPages} pages`);
      
      let extractedText = '';
      
      // Extract text from each page
      for (let i = 1; i <= pdf.numPages; i++) {
        console.log(`Extracting text from page ${i}...`);
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
      
      console.log(`Converting image to base64: ${file.name}`);
      // Convert image to base64
      const base64Image = await this.fileToBase64(file);
      
      console.log('Creating request to Gemini for OCR extraction');
      // Create a request to Gemini to extract text from the image
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: "Extract all visible text from this image using OCR. Return only the extracted text, nothing else. Be thorough and extract ALL text visible in the image, including small text, headers, captions, and any text in diagrams or figures."
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
          maxOutputTokens: 4000,
        }
      };
      
      console.log('Sending OCR request to Gemini API');
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
      
      console.log('Received OCR response from Gemini API');
      const data = await response.json();
      const extractedText = data.candidates[0].content.parts[0].text;
      
      console.log(`OCR extracted ${extractedText.length} characters of text`);
      return extractedText || "No text could be extracted from this image.";
    } catch (error) {
      console.error('Error extracting text from image:', error);
      return `Error extracting text from image: ${error.message}`;
    }
  }
  
  async extractTextFromDOCX(file) {
    try {
      console.log(`Processing DOCX: ${file.name}`);
      
      // Convert the File object to an ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Use mammoth.js to extract text from the DOCX file
      const result = await mammoth.extractRawText({ arrayBuffer });
      const extractedText = result.value;
      
      console.log(`Extracted ${extractedText.length} characters from DOCX`);
      
      if (!extractedText || extractedText.trim() === '') {
        return "No text could be extracted from this Word document. It may be protected, contain only images, or use unsupported formatting.";
      }
      
      return extractedText;
    } catch (error) {
      console.error('Error extracting text from DOCX:', error);
      return `Error extracting text from Word document: ${error.message}. The document may be protected or damaged.`;
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
    console.log('Generating chat response with sources:', sources.length > 0 ? sources[activeSource]?.name : 'No sources');
    
    if (!this.apiKey) {
      throw new Error('Google Gemini API key not set. Please add your API key in settings.');
    }

    // Ensure we have sources to use
    if (!sources || sources.length === 0) {
      throw new Error('No sources have been added. Please add at least one document or text source.');
    }

    // Extract the relevant source content
    const activeSourceData = sources[activeSource];
    if (!activeSourceData) {
      throw new Error('Selected source not found. Please select a valid source.');
    }

    let sourceContent = '';
    if (activeSourceData.type === 'file') {
      // Get the cached version of the document content
      sourceContent = this.getProcessedDocument(activeSourceData.name) || 
                     "No content available for this source. Please try re-uploading the document.";
    } else {
      sourceContent = activeSourceData.content || "No content available for this source.";
    }
    
    console.log(`Using source: ${activeSourceData.name}, content length: ${sourceContent.length} characters`);

    // Format chat history for Gemini API
    const formattedHistory = chatHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Enhanced instruction for Gemini
    const enhancedSystemPrompt = DEFAULT_SYSTEM_PROMPT + 
      " Remember: You already have all the document content, so don't say you can't access the file - use what's been provided in the context.";

    // Prepare the request body
    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: enhancedSystemPrompt }]
        },
        {
          role: 'user',
          parts: [{ text: `Document Context from "${activeSourceData.name}":\n\n${sourceContent}` }]
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
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`, {
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
  }
  
  // Get processed document content
  getProcessedDocument(fileName) {
    const content = this.processedDocuments[fileName] || null;
    console.log(`Retrieved document ${fileName}: ${content ? content.length + ' characters' : 'not found'}`);
    return content;
  }

  // Clear cache for a specific document or all documents
  clearCache(fileName = null) {
    if (fileName) {
      delete this.processedDocuments[fileName];
      console.log(`Cleared cache for ${fileName}`);
    } else {
      this.processedDocuments = {};
      console.log('Cleared all document caches');
    }
    
    // Update localStorage
    try {
      localStorage.setItem('processedDocuments', JSON.stringify(this.processedDocuments));
    } catch (e) {
      console.warn('Failed to update localStorage after clearing cache', e);
    }
  }
}

// Create a singleton instance
const aiService = new AIService();
export default aiService;
