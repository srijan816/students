/**
 * Leaderboard Scoring System for Debate Achievements
 */

// Major tournaments that get 2x multiplier
// Only the actual WSDC and ASDC championships
const MAJOR_TOURNAMENTS = [
  'ASDC', // Asian Schools Debating Championship (exact or with year)
  'WSDC'  // World Schools Debating Championship (exact or with year)
];

// Team achievement patterns and their base points
const TEAM_ACHIEVEMENT_PATTERNS = [
  { patterns: ['champion', 'winner', 'won'], points: 30 },
  { patterns: ['grand final', 'gf', 'finals'], points: 25 },
  { patterns: ['semifinal', 'semi-final', 'sf'], points: 20 },
  { patterns: ['quarterfinal', 'quarter-final', 'qf'], points: 15 },
  { patterns: ['octofinal', 'octo-final', 'of', 'octos'], points: 10 },
  { patterns: ['double octofinal', 'double-octofinal', 'pre-octofinal', 'pre octofinal'], points: 5 }
];

// Speaker ranking patterns
const SPEAKER_RANKING_PATTERNS = {
  '1st': 10, 'first': 10, '1': 10,
  '2nd': 9, 'second': 9, '2': 9,
  '3rd': 8, 'third': 8, '3': 8,
  '4th': 7, 'fourth': 7, '4': 7,
  '5th': 6, 'fifth': 6, '5': 6,
  '6th': 5, 'sixth': 5, '6': 5,
  '7th': 4, 'seventh': 4, '7': 4,
  '8th': 3, 'eighth': 3, '8': 3,
  '9th': 2, 'ninth': 2, '9': 2,
  '10th': 1, 'tenth': 1, '10': 1
};

// Special speaker awards
const SPECIAL_SPEAKER_AWARDS = {
  'fbs': 10,
  'finals best speaker': 10,
  'final\'s best speaker': 10,
  'finals best': 10,
  'best speaker': 10, // Only if it's clearly the overall best speaker
  'obs': 10, // Overall best speaker
  'overall best speaker': 10
};

/**
 * Check if a tournament is a major tournament
 */
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

/**
 * Parse team achievement and return points
 */
function parseTeamAchievement(achievement) {
  const lowerAchievement = achievement.toLowerCase();
  
  for (const { patterns, points } of TEAM_ACHIEVEMENT_PATTERNS) {
    for (const pattern of patterns) {
      if (lowerAchievement.includes(pattern)) {
        return points;
      }
    }
  }
  
  return 0;
}

/**
 * Parse speaker achievement and return points
 */
function parseSpeakerAchievement(achievement) {
  const lowerAchievement = achievement.toLowerCase();
  
  // First check for special speaker awards
  for (const [pattern, points] of Object.entries(SPECIAL_SPEAKER_AWARDS)) {
    if (lowerAchievement.includes(pattern)) {
      return points;
    }
  }
  
  // Then check for ranked speaker awards
  for (const [pattern, points] of Object.entries(SPEAKER_RANKING_PATTERNS)) {
    // Look for patterns like "1st best", "2nd speaker", etc.
    const regex = new RegExp(`\\b${pattern}\\b.*(?:best|speaker)`, 'i');
    if (regex.test(achievement)) {
      return points;
    }
  }
  
  return 0;
}

/**
 * Calculate points for a single achievement
 */
function calculateAchievementPoints(achievement, tournament) {
  const basePoints = achievement.type === 'team' 
    ? parseTeamAchievement(achievement.description)
    : parseSpeakerAchievement(achievement.description);
  
  const multiplier = isMajorTournament(tournament) ? 2 : 1;
  const totalPoints = basePoints * multiplier;
  
  return {
    basePoints,
    multiplier,
    totalPoints
  };
}

/**
 * Calculate total points and breakdown for a student
 */
function calculateStudentPoints(student) {
  const breakdown = [];
  let totalPoints = 0;
  
  for (const achievement of student.achievements) {
    const points = calculateAchievementPoints(achievement, achievement.tournament);
    
    if (points.totalPoints > 0) {
      breakdown.push({
        tournament: achievement.tournament,
        date: achievement.date,
        achievement: achievement.description,
        type: achievement.type,
        basePoints: points.basePoints,
        multiplier: points.multiplier,
        totalPoints: points.totalPoints
      });
      
      totalPoints += points.totalPoints;
    }
  }
  
  return {
    student: {
      name: student.name,
      school: student.school
    },
    totalPoints,
    breakdown: breakdown.sort((a, b) => {
      // Sort by date (latest first)
      if (!a.date || !b.date) return 0;
      
      // Parse dates to get comparable values
      const parseDate = (dateStr) => {
        if (!dateStr) return new Date(0);
        
        // Handle different date formats
        // "June 8-10, 2024", "Jan 25-26, 2025", "March 1-3, 2024"
        const match = dateStr.match(/(\w+)\s+\d+(?:-\d+)?,?\s+(\d{4})/);
        if (match) {
          const [, month, year] = match;
          const monthMap = {
            'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
            'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
            'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12',
            'January': '01', 'February': '02', 'March': '03', 'April': '04',
            'May': '05', 'June': '06', 'July': '07', 'August': '08',
            'September': '09', 'October': '10', 'November': '11', 'December': '12'
          };
          const monthNum = monthMap[month] || '01';
          return new Date(`${year}-${monthNum}-01`);
        }
        
        return new Date(dateStr);
      };
      
      const dateA = parseDate(a.date);
      const dateB = parseDate(b.date);
      
      return dateB - dateA; // Latest first
    })
  };
}

/**
 * Generate leaderboard from students data
 */
function generateLeaderboard(students) {
  const leaderboard = students
    .map(student => calculateStudentPoints(student))
    .filter(entry => entry.totalPoints > 0)
    .sort((a, b) => b.totalPoints - a.totalPoints);
  
  // Add rank
  let currentRank = 1;
  let previousPoints = null;
  
  leaderboard.forEach((entry, index) => {
    if (previousPoints !== entry.totalPoints) {
      currentRank = index + 1;
    }
    entry.rank = currentRank;
    previousPoints = entry.totalPoints;
  });
  
  return leaderboard;
}

export {
  generateLeaderboard,
  calculateStudentPoints,
  calculateAchievementPoints,
  MAJOR_TOURNAMENTS
};