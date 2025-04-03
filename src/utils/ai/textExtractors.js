
import * as pdfjs from 'pdfjs-dist';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

// Set worker path for PDF.js
const pdfjsWorker = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * Utilities for extracting text from different document types
 */
const textExtractors = {
  /**
   * Convert file to base64 representation
   */
  fileToBase64: async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  },
  
  /**
   * Extract text from Excel files
   */
  extractTextFromExcel: async (file) => {
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
        sheetData.forEach((row) => {
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
  },
  
  /**
   * Extract text from PDF files
   */
  extractTextFromPDF: async (file, apiKey, model) => {
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
      let isScannedPDF = true;
      
      // Extract text from each page
      for (let i = 1; i <= pdf.numPages; i++) {
        console.log(`Extracting text from page ${i}...`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        
        // If we found actual text content, this probably isn't a scanned PDF
        if (pageText.trim().length > 100) {
          isScannedPDF = false;
        }
        
        extractedText += `Page ${i}: ${pageText}\n\n`;
      }
      
      // If it appears to be a scanned PDF (very little or no text extracted)
      // Use OCR via Gemini API
      if (isScannedPDF && extractedText.trim().length < 200) {
        console.log(`PDF appears to be scanned with minimal text content (${extractedText.length} chars). Using OCR...`);
        
        if (!apiKey || !model) {
          return `This appears to be a scanned PDF. To extract text, please set your Google Gemini API key in settings for OCR processing. Current text content: ${extractedText}`;
        }
        
        // Convert PDF to images and process with OCR
        let ocrText = '';
        
        // Process first 10 pages max to avoid quota issues
        const pageLimit = Math.min(pdf.numPages, 10);
        
        for (let i = 1; i <= pageLimit; i++) {
          try {
            console.log(`Rendering page ${i} as image for OCR...`);
            const page = await pdf.getPage(i);
            
            // Adjust scale for better OCR results
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            // Render PDF page to canvas
            const renderContext = {
              canvasContext: context,
              viewport: viewport
            };
            
            await page.render(renderContext).promise;
            
            // Convert canvas to image blob
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            const imageFile = new File([blob], `page-${i}.png`, { type: 'image/png' });
            
            // Process image with OCR
            console.log(`Sending page ${i} for OCR processing...`);
            const pageOcrText = await textExtractors.extractTextFromImage(imageFile, apiKey, model);
            ocrText += `Page ${i}:\n${pageOcrText}\n\n`;
            
            // Clean up
            canvas.remove();
          } catch (err) {
            console.error(`Error processing page ${i} for OCR:`, err);
            ocrText += `Page ${i}: Error extracting text via OCR: ${err.message}\n\n`;
          }
        }
        
        if (pageLimit < pdf.numPages) {
          ocrText += `\n(Note: Only the first ${pageLimit} pages were processed with OCR to stay within API limits. The PDF has ${pdf.numPages} pages total.)\n`;
        }
        
        return ocrText || "No text could be extracted from this scanned PDF.";
      }
      
      console.log(`Extracted ${extractedText.length} characters from PDF`);
      return extractedText || "No text could be extracted from this PDF. It may be scanned or contain only images.";
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      return `Error extracting text from PDF: ${error.message}. The PDF may be encrypted, damaged, or in an unsupported format.`;
    }
  },
  
  /**
   * Extract text from Word documents
   */
  extractTextFromDOCX: async (file) => {
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
  },
  
  /**
   * Extract text from images using Gemini's OCR capabilities
   */
  extractTextFromImage: async (file, apiKey, model) => {
    try {
      if (!apiKey) {
        throw new Error('API key not set');
      }
      
      console.log(`Converting image to base64: ${file.name}`);
      // Convert image to base64
      const base64Image = await textExtractors.fileToBase64(file);
      
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
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
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
};

export default textExtractors;
