import * as XLSX from 'xlsx';

export const parseExcelFile = (file: File): Promise<{ sheetNames: string[], workbook: XLSX.WorkBook }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        resolve({ sheetNames: workbook.SheetNames, workbook });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

export const getSheetData = (workbook: XLSX.WorkBook, sheetName: string): any[][] => {
  const worksheet = workbook.Sheets[sheetName];
  // header: 1 returns array of arrays (rows)
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
  return data;
};

export const findHeaderRowIndex = (data: any[][]): number => {
  // Check first 20 rows
  const maxRowsToCheck = Math.min(20, data.length);
  
  for (let i = 0; i < maxRowsToCheck; i++) {
    const row = data[i];
    if (!row) continue;
    
    // Count how many non-empty string cells this row has
    const stringCells = row.filter(cell => typeof cell === 'string' && cell.trim().length > 0);
    
    // If it has multiple string columns, it's a good candidate for a header row
    if (stringCells.length >= 2) {
      // Bonus: check if it contains common header keywords
      const rowString = stringCells.join(' ').toLowerCase();
      if (
        rowString.includes('اسم') || 
        rowString.includes('درج') || 
        rowString.includes('م') || 
        rowString.includes('رقم')
      ) {
        return i;
      }
    }
  }
  
  // Default to 0 if not found clearly
  return 0;
};
