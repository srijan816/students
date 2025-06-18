import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

/**
 * Converts the Excel file to JSON and returns the student data
 */
export function getStudents() {
  try {
    // Get the paths
    const excelFilePath = path.join(process.cwd(), 'data/debate_achievements.xlsx');
    const outputFilePath = path.join(process.cwd(), 'data/students.json');
    
    // Read the Excel file
    console.log('[Excel Converter] Reading Excel file:', excelFilePath);
    const workbook = xlsx.readFile(excelFilePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Get the range of the worksheet
    const range = xlsx.utils.decode_range(worksheet['!ref']);
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
        const teamAchievementGroups = teamAchievementsText.split('\n\n');
        
        // Process each group of team achievements
        teamAchievementGroups.forEach(group => {
          if (!group.trim()) return;
          
          // Extract the category and students
          const lines = group.trim().split('\n');
          if (lines.length < 2) return;
          
          const categoryLine = lines[0].trim();
          const categoryParts = categoryLine.split(':');
          if (categoryParts.length < 1) return;
          
          const category = categoryParts[0].trim();
          
          // Process each student in this category
          for (let i = 1; i < lines.length; i++) {
            const studentLine = lines[i].trim();
            if (!studentLine) continue;
            
            // Extract student name and school
            const studentMatch = studentLine.match(/(.+)\s+\((.+)\)/);
            if (!studentMatch) continue;
            
            const studentName = studentMatch[1].trim();
            const school = studentMatch[2].trim();
            
            // Add student and achievement
            const student = addOrGetStudent(studentName, school);
            addAchievement(student, tournament, date, category, 'team');
          }
        });
      }
      
      // Process speaker awards
      const speakerAwardsCell = `E${row}`;
      if (worksheet[speakerAwardsCell]) {
        const speakerAwardsText = worksheet[speakerAwardsCell].v;
        const speakerAwards = speakerAwardsText.split('\n');
        
        // Process each speaker award
        speakerAwards.forEach(award => {
          if (!award.trim()) return;
          
          // Extract the description and student
          const awardMatch = award.match(/(.+):\s+(.+)\s+\((.+)\)/);
          if (!awardMatch) return;
          
          const description = awardMatch[1].trim();
          const studentName = awardMatch[2].trim();
          const school = awardMatch[3].trim();
          
          // Add student and achievement
          const student = addOrGetStudent(studentName, school);
          addAchievement(student, tournament, date, description, 'speaker');
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
    
    return students;
  } catch (error) {
    console.error('Error converting Excel to JSON:', error);
    
    // If there's an error, try to return the existing JSON file
    try {
      const jsonData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/students.json'), 'utf8'));
      return jsonData.students;
    } catch (fallbackError) {
      console.error('Error reading existing JSON:', fallbackError);
      return [];
    }
  }
}
