import { generateLeaderboard } from '../src/utils/leaderboardScoring.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load student data
const dataPath = path.join(process.cwd(), 'data/students.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Generate leaderboard
const leaderboard = generateLeaderboard(data.students);

// Display top 10
console.log('=== TOP 10 DEBATERS ===\n');
leaderboard.slice(0, 10).forEach(entry => {
  console.log(`Rank ${entry.rank}: ${entry.student.name} (${entry.student.school})`);
  console.log(`Total Points: ${entry.totalPoints}`);
  console.log('Top achievements:');
  entry.breakdown.slice(0, 3).forEach(achievement => {
    console.log(`  - ${achievement.achievement} at ${achievement.tournament}`);
    console.log(`    ${achievement.basePoints} × ${achievement.multiplier} = ${achievement.totalPoints} pts`);
  });
  console.log('');
});

// Show some parsing examples
console.log('\n=== SCORING EXAMPLES ===');
const testCases = [
  { desc: 'Champion', points: 30 },
  { desc: 'Grand Finalist', points: 25 },
  { desc: 'Semifinalist', points: 20 },
  { desc: 'Quarterfinalist', points: 15 },
  { desc: '1st Best Speaker', points: 10 },
  { desc: 'Finals Best Speaker', points: 10 },
  { desc: '5th Best Speaker', points: 6 }
];

testCases.forEach(test => {
  console.log(`"${test.desc}" should be ${test.points} points`);
});