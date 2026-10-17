export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB
export const MAX_FILE_SIZE_LABEL = '20 MB';

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export function validatePdfFile(file: File): FileValidationResult {
  if (!file) {
    return { isValid: false, error: 'No file selected. Please choose a PDF document.' };
  }

  // Check file extension
  const fileName = file.name.toLowerCase();
  const isPdfExtension = fileName.endsWith('.pdf');

  // Check MIME type
  const isPdfMime = file.type === 'application/pdf' || file.type === '';

  if (!isPdfExtension && !isPdfMime) {
    return {
      isValid: false,
      error: 'Only PDF documents (.pdf) are accepted. Please upload an industrial RFQ in PDF format.',
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `File is too large (${fileSizeMB} MB). Maximum supported upload size is ${MAX_FILE_SIZE_LABEL}.`,
    };
  }

  if (file.size === 0) {
    return {
      isValid: false,
      error: 'The selected PDF file is empty (0 bytes). Please upload a valid document.',
    };
  }

  return { isValid: true };
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip data:application/pdf;base64, prefix
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read the PDF file.'));
    reader.readAsDataURL(file);
  });
}
