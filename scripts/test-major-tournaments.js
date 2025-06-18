// Test script to verify major tournament detection

const testTournaments = [
  // Should be major (2x multiplier)
  "WSDC 2024",
  "WSDC",
  "ASDC 2024", 
  "ASDC",
  "World Schools Debating Championship",
  "World Schools Debating Championship 2024",
  
  // Should NOT be major (1x multiplier)
  "Greater Bay Area WSDC 2024",
  "Novice WSDC 2025",
  "Asian Online Debating Championship WSDC 2024",
  "Doxbridge WSDC 2024",
  "South Asia WSDC",
  "Everest International WSDC 2024",
  "WSDC Format Tournament",
  "Pre-WSDC Training",
  "Mock WSDC",
  "ASDC Qualifier",
  "ASDC Style Tournament"
];

// The major tournament detection logic
const MAJOR_TOURNAMENTS = ['ASDC', 'WSDC'];

function isMajorTournament(tournamentName) {
  const name = tournamentName.trim();
  
  // Check if it's exactly one of the major tournaments (with optional year)
  return MAJOR_TOURNAMENTS.some(major => {
    // Exact match
    if (name === major) return true;
    
    // Match with year (e.g., "WSDC 2024", "ASDC 2023")
    const yearPattern = new RegExp(`^${major}\\s+(20\\d{2}|'\\d{2})$`, 'i');
    return yearPattern.test(name);
  });
}

console.log('Testing Major Tournament Detection:\n');
console.log('Should be MAJOR (2x points):');
testTournaments.slice(0, 6).forEach(tournament => {
  const isMajor = isMajorTournament(tournament);
  console.log(`  ${tournament}: ${isMajor ? '✓ MAJOR' : '✗ NOT MAJOR'}`);
});

console.log('\nShould NOT be major (1x points):');
testTournaments.slice(6).forEach(tournament => {
  const isMajor = isMajorTournament(tournament);
  console.log(`  ${tournament}: ${isMajor ? '✗ INCORRECTLY MARKED AS MAJOR' : '✓ CORRECT (not major)'}`);
});