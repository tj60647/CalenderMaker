import { useState, useEffect } from 'react';

// Type definition for the pdfjs library
// We use 'any' for the imported module to avoid strict typing issues with the dynamic import
// but we structure our usage carefully.
type PdfJsLib = any; 

/**
 * A custom hook for parsing text content from PDF files.
 * It encapsulates the PDF parsing logic and loading state.
 */
export function usePdfParser() {
  const [isParsing, setIsParsing] = useState(false);
  const [pdfjs, setPdfjs] = useState<PdfJsLib | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Dynamically import pdfjs-dist on the client-side only
  useEffect(() => {
    const importPdfjs = async () => {
      try {
        // We use the legacy build to ensure maximum compatibility
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
        
        // Set the workerSrc for pdfjs
        // Using unpkg is a reliable way to get the matching worker version
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.min.mjs`;
        
        setPdfjs(pdfjsLib);
      } catch (err) {
        console.error('Failed to load PDF.js library:', err);
        setError('Failed to initialize PDF parser');
      }
    };
    
    importPdfjs();
  }, []);

  /**
   * Parses a PDF file and returns the extracted text content as a string.
   * @param file The PDF file to parse.
   * @returns A Promise that resolves with the extracted text, or null if parsing fails.
   */
  const parsePdf = async (file: File): Promise<string | null> => {
    setError(null);

    if (!pdfjs) {
        setError("PDF Library is still loading... please try again in a moment.");
        return null;
    }

    if (file.type !== "application/pdf") {
        setError("Invalid file type. Please upload a PDF.");
        return null;
    }

    setIsParsing(true);

    return new Promise((resolve) => {
        const reader = new FileReader();
        
        reader.onload = async (event) => {
            if (!event.target?.result) {
                setError("Could not read the file.");
                setIsParsing(false);
                resolve(null);
                return;
            }
            
            try {
                // Load the PDF document
                const loadingTask = pdfjs.getDocument({ data: event.target.result as ArrayBuffer });
                const pdf = await loadingTask.promise;
                
                // Extract text from all pages
                const text = (await Promise.all(
                    Array.from({ length: pdf.numPages }, (_, i) => pdf.getPage(i + 1))
                    .map(async (pagePromise) => {
                        const page = await pagePromise as any;
                        const content = await page.getTextContent();
                        // Join items with spaces, treating them as strings
                        return content.items.map((item: any) => 'str' in item ? item.str : '').join(' ');
                    })
                )).join('\n\n');

                resolve(text);
            } catch (err: any) {
                console.error('PDF parsing error:', err);
                setError(err.message || "Failed to parse PDF structure");
                resolve(null);
            } finally {
                setIsParsing(false);
            }
        };
        
        reader.onerror = () => {
            setError("An error occurred while reading the file from disk.");
            setIsParsing(false);
            resolve(null);
        };
        
        reader.readAsArrayBuffer(file);
    });
  };

  return { isParsing, parsePdf, error };
}
