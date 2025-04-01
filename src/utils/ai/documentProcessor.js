
import textExtractors from './textExtractors';

/**
 * Document processing utilities for extracting and managing document content
 */
class DocumentProcessor {
  constructor() {
    this.processedDocuments = {};
    
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
          // Handle text and link types
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

  /**
   * Get processed document content
   */
  getProcessedDocument(fileName) {
    const content = this.processedDocuments[fileName] || null;
    console.log(`Retrieved document ${fileName}: ${content ? content.length + ' characters' : 'not found'}`);
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
    try {
      localStorage.setItem('processedDocuments', JSON.stringify(this.processedDocuments));
    } catch (e) {
      console.warn('Failed to update localStorage after clearing cache', e);
    }
  }
}

export default new DocumentProcessor();
