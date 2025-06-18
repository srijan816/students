import { NextResponse } from 'next/server';
import fs from 'fs';
import * as XLSX from 'xlsx';
import path from 'path';

/**
 * GET handler for retrieving student data from the Excel file
 * @returns {Promise<NextResponse>} JSON response with student data
 */
export async function GET() {
  try {
    // Get the paths
    const excelFilePath = path.join(process.cwd(), 'data/debate_achievements.xlsx');
    const outputFilePath = path.join(process.cwd(), 'data/students.json');
    
    // Check if Excel file exists
    if (!fs.existsSync(excelFilePath)) {
      console.error(`[Excel Converter] Excel file not found: ${excelFilePath}`);
      throw new Error('Excel file not found');
    }
    
    // Log more details about the file
    try {
      const stats = fs.statSync(excelFilePath);
      console.log(`[Excel Converter] File stats: size=${stats.size}, isFile=${stats.isFile()}, modified=${stats.mtime}`);
    } catch (statsError) {
      console.error('[Excel Converter] Error getting file stats:', statsError.message);
    }
    
    // Read the Excel file using a Buffer approach which is more reliable in Next.js API routes
    console.log('[Excel Converter] Reading Excel file:', excelFilePath);
    
    // Declare workbook variable outside try block so it can be used later
    let workbook;
    
    // Use try-catch specifically for the file reading operation
    try {
      const buffer = fs.readFileSync(excelFilePath);
      console.log('[Excel Converter] Successfully read file, size:', buffer.length);
      workbook = XLSX.read(buffer, { type: 'buffer' });
      console.log('[Excel Converter] Successfully parsed workbook, sheets:', workbook.SheetNames);
    } catch (readError) {
      console.error('[Excel Converter] Error reading Excel file:', readError.message);
      throw readError;
    }
    
    // Verify workbook has sheets
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      console.error('[Excel Converter] Excel file has no sheets');
      throw new Error('Excel file has no sheets');
    }
    
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Verify worksheet has content
    if (!worksheet || !worksheet['!ref']) {
      console.error('[Excel Converter] Worksheet is empty');
      throw new Error('Worksheet is empty');
    }

    // Get the range of the worksheet
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    const numRows = range.e.r;

    // Initialize student map
    const studentMap = new Map();

    // Function to add a student to the map
    function addOrGetStudent(name, school) {
      const fullName = name.trim();
      
      // Create a unique key for the student
      const studentKey = `${fullName}|${school}`;
      
      if (!studentMap.has(studentKey)) {
        studentMap.set(studentKey, {
          name: fullName,
          school: school,
          achievements: []
        });
      }
      
      return studentMap.get(studentKey);
    }

    // Function to add an achievement to a student
    function addAchievement(student, tournament, date, description, type) {
      student.achievements.push({
        tournament,
        date,
        type, // 'team' or 'speaker'
        description
      });
    }

    // Process each tournament (row in the excel)
    for (let row = 2; row <= numRows; row++) {
      // Get tournament details
      const tournamentCell = `A${row}`;
      const dateCell = `B${row}`;
      
      // Skip if no tournament name
      if (!worksheet[tournamentCell]) continue;
      
      const tournament = worksheet[tournamentCell].v;
      const date = worksheet[dateCell] ? worksheet[dateCell].v : '';
      
      // Process team achievements
      const teamAchievementsCell = `D${row}`;
      if (worksheet[teamAchievementsCell]) {
        const teamAchievementsText = worksheet[teamAchievementsCell].v;
        
        // Process team achievements with improved logic for handling categories
        let currentCategory = '';
        let studentCount = 0;
        
        // Split by lines
        const lines = teamAchievementsText.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          // Skip empty lines
          if (!line) continue;
          
          // Check if this is a category line (contains a colon and doesn't look like a student entry)
          if (line.includes(':') && !line.match(/(.+)\s+\((.+)\)/)) {
            currentCategory = line.split(':')[0].trim();
            console.log(`Found category: "${currentCategory}"`);
            studentCount = 0;
            continue;
          }
          
          // This could be a student line or a line with multiple students (using &)
          // Only process lines that match the student pattern: "Name (School)"
          if (line.match(/(.+)\s+\((.+)\)/)) {
            // Check if the line contains multiple students (with &)
            if (line.includes('&')) {
              // Split by & to get each student
              const studentEntries = line.split('&').map(entry => entry.trim());
              
              for (const entry of studentEntries) {
                const studentMatch = entry.match(/(.+)\s+\((.+)\)/);
                if (!studentMatch) {
                  console.log(`Could not parse student entry: ${entry}`);
                  continue;
                }
                
                const studentName = studentMatch[1].trim();
                const school = studentMatch[2].trim();
                
                console.log(`Adding student "${studentName}" (${school}) with achievement: "${currentCategory}"`);
                
                // Add student and achievement
                const student = addOrGetStudent(studentName, school);
                addAchievement(student, tournament, date, currentCategory, 'team');
                studentCount++;
              }
            } else {
              // This is a single student line
              const studentMatch = line.match(/(.+)\s+\((.+)\)/);
              const studentName = studentMatch[1].trim();
              const school = studentMatch[2].trim();
              
              console.log(`Adding student "${studentName}" (${school}) with achievement: "${currentCategory}"`);
              
              // Add student and achievement
              const student = addOrGetStudent(studentName, school);
              addAchievement(student, tournament, date, currentCategory, 'team');
              studentCount++;
            }
          } else {
            // Line doesn't match student pattern, skip it
            console.log(`Skipping non-student line: ${line.substring(0, 50)}...`);
          }
        }
        
        console.log(`Added ${studentCount} students to category "${currentCategory}"`);
      }
      
      // Process speaker awards
      const speakerAwardsCell = `E${row}`;
      if (worksheet[speakerAwardsCell]) {
        const speakerAwardsText = worksheet[speakerAwardsCell].v;
        
        const speakerAwards = speakerAwardsText.split('\n');
        
        // Process each speaker award
        speakerAwards.forEach(award => {
          if (!award.trim()) return;
          
          // Only process lines that follow the pattern "Award: Student (School)"
          const parts = award.split(':');
          if (parts.length < 2) return;
          
          const description = parts[0].trim();
          const studentPart = parts.slice(1).join(':').trim();
          
          // Check if the student part contains multiple students with &
          if (studentPart.includes('&')) {
            // Split by & to get individual students
            const studentEntries = studentPart.split('&').map(entry => entry.trim());
            
            // Process each student
            studentEntries.forEach(entry => {
              const studentMatch = entry.match(/(.+)\s+\((.+)\)/);
              if (!studentMatch) {
                console.log(`Could not parse student entry in speaker award: ${entry}`);
                return;
              }
              
              const studentName = studentMatch[1].trim();
              const school = studentMatch[2].trim();
              
              console.log(`Adding student "${studentName}" (${school}) with speaker achievement: "${description}"`);
              
              // Add student and achievement
              const student = addOrGetStudent(studentName, school);
              addAchievement(student, tournament, date, description, 'speaker');
            });
          } else {
            // Regular single student format - only process if it matches the pattern
            const studentMatch = studentPart.match(/(.+)\s+\((.+)\)/);
            if (!studentMatch) {
              console.log(`Skipping non-standard speaker award format: ${award.substring(0, 50)}...`);
              return;
            }
            
            const studentName = studentMatch[1].trim();
            const school = studentMatch[2].trim();
            
            console.log(`Adding student "${studentName}" (${school}) with speaker achievement: "${description}"`);
            
            // Add student and achievement
            const student = addOrGetStudent(studentName, school);
            addAchievement(student, tournament, date, description, 'speaker');
          }
        });
      }
    }

    // Convert map to array of students
    const students = Array.from(studentMap.values());

    // Sort students alphabetically by name
    students.sort((a, b) => a.name.localeCompare(b.name));

    // Create the output JSON structure
    const outputData = {
      students: students
    };

    // Write to JSON file
    fs.writeFileSync(
      outputFilePath,
      JSON.stringify(outputData, null, 2)
    );

    console.log(`[Excel Converter] Successfully converted Excel to JSON. Total students: ${students.length}`);
    
    // Return the data as JSON
    return NextResponse.json(outputData);
  } catch (error) {
    console.error('Error converting Excel to JSON:', error);
    
    // If there's an error, try to return the existing JSON file
    try {
      const jsonFilePath = path.join(process.cwd(), 'data/students.json');
      if (!fs.existsSync(jsonFilePath)) {
        console.error(`[Excel Converter] Fallback JSON file not found: ${jsonFilePath}`);
        return NextResponse.json({ students: [], error: 'Failed to convert Excel and no fallback JSON found' }, { status: 500 });
      }
      
      const jsonContent = fs.readFileSync(jsonFilePath, 'utf8');
      if (!jsonContent || jsonContent.trim() === '') {
        console.error('[Excel Converter] Fallback JSON file is empty');
        return NextResponse.json({ students: [], error: 'Failed to convert Excel and fallback JSON is empty' }, { status: 500 });
      }
      
      const jsonData = JSON.parse(jsonContent);
      console.log(`[Excel Converter] Using fallback JSON with ${jsonData.students?.length || 0} students`);
      return NextResponse.json(jsonData);
    } catch (fallbackError) {
      console.error('Error reading existing JSON:', fallbackError);
      return NextResponse.json({ 
        students: [], 
        error: 'Failed to convert Excel and fallback JSON parse error: ' + fallbackError.message 
      }, { status: 500 });
    }
  }
}
