const fs = require('fs');
const XLSX = require('xlsx');
const path = require('path');

/**
 * Generate students.json file from Excel data
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
      
      console.log(`\nProcessing tournament: ${tournament}, date: ${date}`);
      
      // Process team achievements
      const teamAchievementsCell = `D${row}`;
      if (worksheet[teamAchievementsCell]) {
        const teamAchievementsText = worksheet[teamAchievementsCell].v;
        
        // Split by double newlines to get each category group
        const teamAchievementGroups = teamAchievementsText.split('\n\n');
        
        console.log(`Found ${teamAchievementGroups.length} team achievement groups`);
        
        // Process each group of team achievements
        teamAchievementGroups.forEach(group => {
          // Skip empty groups
          if (!group.trim()) return;
          
          // Extract the category and students
          const lines = group.trim().split('\n');
          if (lines.length < 2) return;
          
          // The first line should contain the category name with a colon
          const categoryLine = lines[0].trim();
          const categoryParts = categoryLine.split(':');
          if (categoryParts.length < 1) return;
          
          // Extract the category name (the part before the colon)
          const category = categoryParts[0].trim();
          
          console.log(`Processing category: "${category}" with ${lines.length-1} students`);
          
          // Process each student line in this category
          for (let i = 1; i < lines.length; i++) {
            const studentLine = lines[i].trim();
            if (!studentLine) continue;
            
            // Extract student name and school using regex
            const studentMatch = studentLine.match(/(.+)\s+\((.+)\)/);
            if (!studentMatch) {
              console.log(`Could not parse student line: ${studentLine}`);
              continue;
            }
            
            const studentName = studentMatch[1].trim();
            const school = studentMatch[2].trim();
            
            console.log(`Adding student "${studentName}" (${school}) with achievement: "${category}"`);
            
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
