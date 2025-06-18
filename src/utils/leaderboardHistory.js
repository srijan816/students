import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SNAPSHOTS_DIR = path.join(__dirname, '..', '..', 'data', 'leaderboard-snapshots');

// Ensure snapshots directory exists
if (!fs.existsSync(SNAPSHOTS_DIR)) {
  fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
}

// Get the date of the most recent Sunday (or today if it's Sunday)
function getLastSundayDate() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysToSubtract = dayOfWeek === 0 ? 0 : dayOfWeek;
  const lastSunday = new Date(today);
  lastSunday.setDate(today.getDate() - daysToSubtract);
  lastSunday.setHours(0, 0, 0, 0);
  return lastSunday;
}

// Format date for filename (YYYY-MM-DD)
function formatDateForFilename(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Save a snapshot of the current leaderboard
export async function saveLeaderboardSnapshot(leaderboardData) {
  const snapshotDate = getLastSundayDate();
  const filename = `snapshot-${formatDateForFilename(snapshotDate)}.json`;
  const filepath = path.join(SNAPSHOTS_DIR, filename);
  
  // Check if snapshot already exists for this week
  if (fs.existsSync(filepath)) {
    console.log(`Snapshot already exists for ${formatDateForFilename(snapshotDate)}`);
    return false;
  }
  
  // Create snapshot data structure
  const snapshot = {
    date: snapshotDate.toISOString(),
    timestamp: new Date().toISOString(),
    leaderboard: leaderboardData.map(entry => ({
      studentName: entry.student.name,
      school: entry.student.school,
      rank: entry.rank,
      totalPoints: entry.totalPoints
    }))
  };
  
  // Save snapshot
  fs.writeFileSync(filepath, JSON.stringify(snapshot, null, 2));
  console.log(`Saved leaderboard snapshot for ${formatDateForFilename(snapshotDate)}`);
  return true;
}

// Get the most recent snapshot before the current week
export function getPreviousSnapshot() {
  const currentWeekDate = getLastSundayDate();
  const files = fs.readdirSync(SNAPSHOTS_DIR)
    .filter(file => file.startsWith('snapshot-') && file.endsWith('.json'))
    .sort()
    .reverse();
  
  for (const file of files) {
    const dateStr = file.replace('snapshot-', '').replace('.json', '');
    const snapshotDate = new Date(dateStr);
    
    // Find the most recent snapshot that's before the current week
    if (snapshotDate < currentWeekDate) {
      const filepath = path.join(SNAPSHOTS_DIR, file);
      const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      return data;
    }
  }
  
  return null;
}

// Calculate position changes between current and previous snapshot
export function calculatePositionChanges(currentLeaderboard, previousSnapshot) {
  if (!previousSnapshot) {
    return currentLeaderboard.map(entry => ({
      ...entry,
      positionChange: null,
      isNew: true
    }));
  }
  
  // Create a map of previous positions
  const previousPositions = new Map();
  previousSnapshot.leaderboard.forEach(entry => {
    previousPositions.set(entry.studentName, {
      rank: entry.rank,
      points: entry.totalPoints
    });
  });
  
  // Calculate changes for current leaderboard
  return currentLeaderboard.map(entry => {
    const previousData = previousPositions.get(entry.student.name);
    
    if (!previousData) {
      // New entry
      return {
        ...entry,
        positionChange: null,
        isNew: true
      };
    }
    
    // Calculate position change (negative means moved up, positive means moved down)
    const positionChange = previousData.rank - entry.rank;
    
    return {
      ...entry,
      positionChange,
      isNew: false,
      previousRank: previousData.rank,
      previousPoints: previousData.points,
      pointsGained: entry.totalPoints - previousData.points
    };
  });
}

// Get all available snapshots
export function getAllSnapshots() {
  const files = fs.readdirSync(SNAPSHOTS_DIR)
    .filter(file => file.startsWith('snapshot-') && file.endsWith('.json'))
    .sort()
    .reverse();
  
  return files.map(file => {
    const dateStr = file.replace('snapshot-', '').replace('.json', '');
    return {
      filename: file,
      date: new Date(dateStr),
      displayDate: dateStr
    };
  });
}

// Load a specific snapshot
export function loadSnapshot(filename) {
  const filepath = path.join(SNAPSHOTS_DIR, filename);
  if (fs.existsSync(filepath)) {
    return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  }
  return null;
}