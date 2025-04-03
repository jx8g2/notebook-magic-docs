import * as pdfjs from 'pdfjs-dist';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { createWorker } from 'tesseract.js';

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
  extractTextFromPDF: async (file) => {
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
   * Extract text from images using Tesseract.js OCR
   */
  extractTextFromImage: async (file) => {
    try {
      console.log(`Processing image with Tesseract OCR: ${file.name}`);
      
      // Create a URL for the image file
      const imageUrl = URL.createObjectURL(file);
      
      // Initialize Tesseract worker
      const worker = await createWorker('eng');
      
      console.log('Tesseract worker initialized, starting OCR processing');
      
      // Perform OCR on the image
      const { data } = await worker.recognize(imageUrl);
      
      // Release the Tesseract worker
      await worker.terminate();
      
      // Release the object URL
      URL.revokeObjectURL(imageUrl);
      
      const extractedText = data.text;
      console.log(`OCR extracted ${extractedText.length} characters of text`);
      
      return extractedText || "No text could be extracted from this image.";
    } catch (error) {
      console.error('Error extracting text from image with Tesseract:', error);
      return `Error extracting text from image: ${error.message}. The OCR engine could not process this image.`;
    }
  }
};

export default textExtractors;
