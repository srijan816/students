const fs = require('fs');
const XLSX = require('xlsx');
const path = require('path');

/**
 * Generate students.json file from Excel data with fixed team achievement parsing
 */
async function generateJSON() {
  try {
    // Get the paths
    const excelFilePath = path.join(process.cwd(), 'data/debate_achievements.xlsx');
    const outputFilePath = path.join(process.cwd(), 'data/students.json');
    
    console.log(`Reading Excel file: ${excelFilePath}`);
    
    // Check if Excel file exists
    if (!fs.existsSync(excelFilePath)) {
      console.error(`Excel file not found: ${excelFilePath}`);
      throw new Error('Excel file not found');
    }
    
    // Read the Excel file
    const buffer = fs.readFileSync(excelFilePath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    console.log(`Successfully parsed workbook, sheets: ${workbook.SheetNames}`);
    
    // Verify workbook has sheets
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      console.error('Excel file has no sheets');
      throw new Error('Excel file has no sheets');
    }
    
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Verify worksheet has content
    if (!worksheet || !worksheet['!ref']) {
      console.error('Worksheet is empty');
      throw new Error('Worksheet is empty');
    }

    // Get the range of the worksheet
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    const numRows = range.e.r;

    // Initialize student map
    const studentMap = new Map();

    // Function to add a student to the map
    function addOrGetStudent(name, school) {
      // Extract first name and last initial
      const nameParts = name.trim().split(' ');
      let firstName = nameParts[0];
      let lastInitial = '';
      
      if (nameParts.length > 1) {
        lastInitial = nameParts[nameParts.length - 1];
      }
      
      // Create a unique key for the student
      const studentKey = `${firstName}|${lastInitial}|${school}`;
      
      if (!studentMap.has(studentKey)) {
        studentMap.set(studentKey, {
          first_name: firstName,
          last_initial: lastInitial,
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
      
      console.log(`\nProcessing tournament: ${tournament}, date: ${date}`);
      
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
          
          // Check if this is a category line (contains a colon)
          if (line.includes(':')) {
            currentCategory = line.split(':')[0].trim();
            console.log(`\nFound category: "${currentCategory}"`);
            studentCount = 0;
            continue;
          }
          
          // This should be a student line
          const studentMatch = line.match(/(.+)\s+\((.+)\)/);
          if (!studentMatch) {
            console.log(`Could not parse line as student: ${line}`);
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
        
        console.log(`Added ${studentCount} students to category "${currentCategory}"`);
      }
      
      // Process speaker awards
      const speakerAwardsCell = `E${row}`;
      if (worksheet[speakerAwardsCell]) {
        const speakerAwardsText = worksheet[speakerAwardsCell].v;
        const speakerAwards = speakerAwardsText.split('\n');
        
        console.log(`Found ${speakerAwards.length} speaker awards`);
        
        // Process each speaker award
        speakerAwards.forEach(award => {
          if (!award.trim()) return;
          
          // Extract the description and student
          const awardMatch = award.match(/(.+):\s+(.+)\s+\((.+)\)/);
          if (!awardMatch) {
            console.log(`Could not parse speaker award: ${award}`);
            return;
          }
          
          const description = awardMatch[1].trim();
          const studentName = awardMatch[2].trim();
          const school = awardMatch[3].trim();
          
          console.log(`Adding speaker award "${description}" to student "${studentName}" (${school})`);
          
          // Add student and achievement
          const student = addOrGetStudent(studentName, school);
          addAchievement(student, tournament, date, description, 'speaker');
        });
      }
    }

    // Convert map to array of students
    const students = Array.from(studentMap.values());

    // Sort students alphabetically by first name
    students.sort((a, b) => a.first_name.localeCompare(b.first_name));

    // Create the output JSON structure
    const outputData = {
      students: students
    };

    // Write to JSON file
    fs.writeFileSync(
      outputFilePath,
      JSON.stringify(outputData, null, 2)
    );

    console.log(`\nSuccessfully converted Excel to JSON. Total students: ${students.length}`);
    console.log(`Output file saved to: ${outputFilePath}`);
    
    return outputData;
  } catch (error) {
    console.error('Error generating JSON:', error);
    throw error;
  }
}

// Run the function
generateJSON()
  .then(() => console.log('Done!'))
  .catch(err => console.error('Script failed:', err));
