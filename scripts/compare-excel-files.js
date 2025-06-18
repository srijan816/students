const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

console.log('Comparing Excel file structures...\n');

// File paths
const file1 = path.join(process.cwd(), 'data/debate_achievements.xlsx');
const file2 = path.join(process.cwd(), 'data/debate_achievements2.xlsx');

// Check if files exist
if (!fs.existsSync(file1)) {
  console.error(`File 1 not found: ${file1}`);
  process.exit(1);
}
if (!fs.existsSync(file2)) {
  console.error(`File 2 not found: ${file2}`);
  process.exit(1);
}

// Read both files
const workbook1 = xlsx.readFile(file1);
const workbook2 = xlsx.readFile(file2);

console.log('=== debate_achievements.xlsx ===');
console.log(`Sheet names: ${workbook1.SheetNames.join(', ')}`);
console.log(`Number of sheets: ${workbook1.SheetNames.length}`);

// Analyze first sheet of file 1
const sheet1 = workbook1.Sheets[workbook1.SheetNames[0]];
const range1 = xlsx.utils.decode_range(sheet1['!ref']);
console.log(`First sheet dimensions: ${range1.e.r + 1} rows x ${range1.e.c + 1} columns`);

// Check column headers for file 1
console.log('\nColumn headers in first sheet:');
for (let col = 0; col <= range1.e.c; col++) {
  const cellAddress = xlsx.utils.encode_cell({ r: 0, c: col });
  const cell = sheet1[cellAddress];
  if (cell) {
    console.log(`  Column ${String.fromCharCode(65 + col)}: ${cell.v}`);
  }
}

// Sample first data row
console.log('\nFirst data row (row 2):');
for (let col = 0; col <= range1.e.c; col++) {
  const cellAddress = xlsx.utils.encode_cell({ r: 1, c: col });
  const cell = sheet1[cellAddress];
  if (cell) {
    const value = typeof cell.v === 'string' ? cell.v.substring(0, 50) + (cell.v.length > 50 ? '...' : '') : cell.v;
    console.log(`  Column ${String.fromCharCode(65 + col)}: ${value}`);
  }
}

console.log('\n\n=== debate_achievements2.xlsx ===');
console.log(`Sheet names: ${workbook2.SheetNames.join(', ')}`);
console.log(`Number of sheets: ${workbook2.SheetNames.length}`);

// Analyze all sheets of file 2
workbook2.SheetNames.forEach((sheetName, index) => {
  console.log(`\n--- Sheet ${index + 1}: "${sheetName}" ---`);
  const sheet = workbook2.Sheets[sheetName];
  const range = xlsx.utils.decode_range(sheet['!ref']);
  console.log(`Dimensions: ${range.e.r + 1} rows x ${range.e.c + 1} columns`);
  
  // Check column headers
  console.log('Column headers:');
  for (let col = 0; col <= Math.min(range.e.c, 10); col++) {
    const cellAddress = xlsx.utils.encode_cell({ r: 0, c: col });
    const cell = sheet[cellAddress];
    if (cell) {
      console.log(`  Column ${String.fromCharCode(65 + col)}: ${cell.v}`);
    }
  }
  
  // Sample first data row
  console.log('First data row (row 2):');
  for (let col = 0; col <= Math.min(range.e.c, 10); col++) {
    const cellAddress = xlsx.utils.encode_cell({ r: 1, c: col });
    const cell = sheet[cellAddress];
    if (cell) {
      const value = typeof cell.v === 'string' ? cell.v.substring(0, 30) + (cell.v.length > 30 ? '...' : '') : cell.v;
      console.log(`  Column ${String.fromCharCode(65 + col)}: ${value}`);
    }
  }
});

console.log('\n\n=== COMPARISON SUMMARY ===');
console.log(`File 1 sheets: ${workbook1.SheetNames.length} | File 2 sheets: ${workbook2.SheetNames.length}`);
console.log(`File 1 format: Single sheet with columns A-E`);
console.log(`File 2 format: ${workbook2.SheetNames.length} sheets (${workbook2.SheetNames.slice(0, 3).join(', ')}${workbook2.SheetNames.length > 3 ? '...' : ''})`);