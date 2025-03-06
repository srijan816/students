// We dynamically import the Excel conversion utility on the server-side
let students = [];

// This try-catch is needed for handling server vs client-side rendering
try {
  // Only run the conversion on the server side to avoid CORS issues in the browser
  if (typeof window === 'undefined') {
    const { convertExcelToJson } = require('../utils/excelConverter');
    // Convert Excel to JSON and get the latest data
    const freshData = convertExcelToJson();
    students = freshData.students;
  } else {
    // In browser environment, just import the JSON
    const studentsData = require('./students.json');
    students = studentsData.students;
  }
} catch (error) {
  console.error('Error loading student data:', error);
  // Fallback to empty array if there's an error
  students = [];
}

export { students };
