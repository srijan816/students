import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SNAPSHOTS_DIR = path.join(__dirname, '..', 'data', 'leaderboard-snapshots');

// Ensure directory exists
if (!fs.existsSync(SNAPSHOTS_DIR)) {
  fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
}

// Get the current Sunday date (or most recent Sunday)
function getCurrentSundayDate() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysToSubtract = dayOfWeek === 0 ? 0 : dayOfWeek;
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - daysToSubtract);
  sunday.setHours(0, 0, 0, 0);
  return sunday;
}

// Format date for filename (YYYY-MM-DD)
function formatDateForFilename(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function createBaselineSnapshot() {
  try {
    console.log('Fetching current leaderboard state...');
    
    // Fetch current leaderboard data (without history to avoid circular calls)
    const response = await fetch('http://localhost:3000/api/leaderboard?limit=all');
    const result = await response.json();
    
    if (!result.success) {
      throw new Error('Failed to fetch leaderboard data');
    }
    
    const currentDate = getCurrentSundayDate();
    const filename = `snapshot-${formatDateForFilename(currentDate)}.json`;
    const filepath = path.join(SNAPSHOTS_DIR, filename);
    
    // Convert leaderboard data to snapshot format
    const snapshot = {
      date: currentDate.toISOString(),
      timestamp: new Date().toISOString(),
      description: "Baseline snapshot - current state of the spreadsheet",
      leaderboard: result.data.leaderboard.map(entry => ({
        studentName: entry.student.name,
        school: entry.student.school,
        rank: entry.rank,
        totalPoints: entry.totalPoints
      }))
    };
    
    // Save the baseline snapshot
    fs.writeFileSync(filepath, JSON.stringify(snapshot, null, 2));
    
    console.log(`✅ Created baseline snapshot: ${filename}`);
    console.log(`📊 Captured ${snapshot.leaderboard.length} students`);
    console.log(`📅 Date: ${formatDateForFilename(currentDate)}`);
    console.log('🚀 Weekly tracking is now active!');
    
    return true;
  } catch (error) {
    console.error('❌ Error creating baseline snapshot:', error.message);
    return false;
  }
}

// Run the script
createBaselineSnapshot();