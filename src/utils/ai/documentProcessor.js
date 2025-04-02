
import textExtractors from './textExtractors';
import { encryptData, decryptData } from '../encryption';

/**
 * Document processing utilities for extracting and managing document content
 */
class DocumentProcessor {
  constructor() {
    this.processedDocuments = {};
    
    // Try to load cached documents from localStorage
    this.loadFromLocalStorage();
  }

  async loadFromLocalStorage() {
    try {
      const cachedDocs = localStorage.getItem('processedDocuments');
      if (cachedDocs) {
        const parsedDocs = JSON.parse(cachedDocs);
        
        // Decrypt all documents
        for (const [key, value] of Object.entries(parsedDocs)) {
          if (typeof value === 'string' && value.startsWith('encrypted:')) {
            // Remove the prefix and decrypt
            const encryptedData = value.replace('encrypted:', '');
            this.processedDocuments[key] = await decryptData(encryptedData);
          } else {
            // Legacy unencrypted data
            this.processedDocuments[key] = value;
          }
        }
        
        console.log('Loaded cached documents from localStorage:', Object.keys(this.processedDocuments));
      }
    } catch (error) {
      console.error('Error loading cached documents:', error);
    }
  }

  /**
   * Process a list of source documents and extract their content
   */
  async processDocuments(sources, apiKey, model) {
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
            content = await this.extractContentFromFile(file, apiKey, model);
            
            // Store the processed content in the cache using filename and size as key
            if (content) {
              this.processedDocuments[fileKey] = content;
              this.processedDocuments[file.name] = content; // Also store by name for backward compatibility
              
              if (source.name.includes('/')) {
                // Store by full path for folder files
                this.processedDocuments[source.name] = content;
              }
              
              // Cache to localStorage for persistence
              this.updateLocalStorageCache();
            }
          }
          
          processedSources.push({
            id: Math.random().toString(36).substring(7),
            name: source.name,
            content: content || "No content could be extracted from this document."
          });
        } else if (source.type === 'folder' && Array.isArray(source.content)) {
          // Process each file in the folder
          for (const file of source.content) {
            const fileName = `${source.name}/${file.name}`;
            let content = '';
            
            // Check if we already have processed this file (by name and size)
            const fileKey = `${file.name}_${file.size}`;
            if (this.processedDocuments[fileKey] || this.processedDocuments[fileName]) {
              console.log(`Using cached content for ${fileName}`);
              content = this.processedDocuments[fileName] || this.processedDocuments[fileKey];
            } else {
              // Process based on file type
              content = await this.extractContentFromFile(file, apiKey, model);
              
              // Store the processed content in the cache
              if (content) {
                this.processedDocuments[fileKey] = content;
                this.processedDocuments[fileName] = content; // Store with full path
                
                // Cache to localStorage for persistence
                this.updateLocalStorageCache();
              }
            }
            
            processedSources.push({
              id: Math.random().toString(36).substring(7),
              name: fileName,
              content: content || "No content could be extracted from this document."
            });
          }
        } else if (source.type === 'text') {
          // Handle text sources
          processedSources.push({
            id: Math.random().toString(36).substring(7),
            name: source.name,
            content: source.content
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
    
    console.log('Processed documents:', processedSources.map(s => ({name: s.name, contentLength: s.content ? s.content.length : 0})));
    return processedSources;
  }
  
  /**
   * Helper method to extract content from a file based on its type
   */
  async extractContentFromFile(file, apiKey, model) {
    let content = '';
    
    if (file.type === 'application/pdf') {
      console.log(`Processing PDF file: ${file.name}`);
      content = await textExtractors.extractTextFromPDF(file);
      console.log(`Extracted ${content.length} characters from PDF: ${file.name}`);
    } else if (file.type.startsWith('image/')) {
      console.log(`Processing image file: ${file.name}`);
      content = await textExtractors.extractTextFromImage(file, apiKey, model);
      console.log(`Extracted text from image: ${file.name}`, content.substring(0, 100) + '...');
    } else if (file.type === 'text/plain') {
      content = await file.text();
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      console.log(`Processing Word document: ${file.name}`);
      content = await textExtractors.extractTextFromDOCX(file);
      console.log(`Extracted ${content.length} characters from DOCX: ${file.name}`);
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
              file.type === 'application/vnd.ms-excel') {
      console.log(`Processing Excel file: ${file.name}`);
      content = await textExtractors.extractTextFromExcel(file);
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
    
    return content;
  }
  
  /**
   * Update the localStorage cache with the current processed documents
   */
  async updateLocalStorageCache() {
    try {
      // Create a copy of the processed documents with encrypted values
      const encryptedDocs = {};
      
      for (const [key, value] of Object.entries(this.processedDocuments)) {
        // Only encrypt strings
        if (typeof value === 'string') {
          const encrypted = await encryptData(value);
          encryptedDocs[key] = `encrypted:${encrypted}`;
        } else {
          encryptedDocs[key] = value;
        }
      }
      
      localStorage.setItem('processedDocuments', JSON.stringify(encryptedDocs));
    } catch (e) {
      console.warn('Failed to cache documents to localStorage', e);
      // If localStorage is full, clear it and try again
      try {
        localStorage.clear();
        this.updateLocalStorageCache();
      } catch (e2) {
        console.error('Failed to cache documents even after clearing localStorage', e2);
      }
    }
  }

  /**
   * Get processed document content
   */
  getProcessedDocument(fileName) {
    const content = this.processedDocuments[fileName] || null;
    if (!content) {
      console.warn(`Document "${fileName}" not found in processed documents cache`);
    } else {
      console.log(`Retrieved document ${fileName}: ${content.length} characters`);
    }
    return content;
  }

  /**
   * Clear cache for a specific document or all documents
   */
  clearCache(fileName = null) {
    if (fileName) {
      delete this.processedDocuments[fileName];
      console.log(`Cleared cache for ${fileName}`);
    } else {
      this.processedDocuments = {};
      console.log('Cleared all document caches');
    }
    
    // Update localStorage
    this.updateLocalStorageCache();
  }
}

export default new DocumentProcessor();
