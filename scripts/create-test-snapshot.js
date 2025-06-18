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

// Create a test snapshot from one week ago
function createTestSnapshot() {
  // Get last Sunday date from one week ago
  const today = new Date();
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 7);
  
  // Adjust to Sunday
  const dayOfWeek = lastWeek.getDay();
  const daysToSubtract = dayOfWeek === 0 ? 0 : dayOfWeek;
  lastWeek.setDate(lastWeek.getDate() - daysToSubtract);
  lastWeek.setHours(0, 0, 0, 0);
  
  // Format date for filename
  const year = lastWeek.getFullYear();
  const month = String(lastWeek.getMonth() + 1).padStart(2, '0');
  const day = String(lastWeek.getDate()).padStart(2, '0');
  const filename = `snapshot-${year}-${month}-${day}.json`;
  const filepath = path.join(SNAPSHOTS_DIR, filename);
  
  // Create test data - simulate some position changes
  const testSnapshot = {
    date: lastWeek.toISOString(),
    timestamp: new Date().toISOString(),
    leaderboard: [
      { studentName: "Ahmed Taha", school: "GEMS", rank: 3, totalPoints: 475 },
      { studentName: "Samarth Singh", school: "INSR", rank: 1, totalPoints: 485 },
      { studentName: "Meghna Manjunath", school: "GEMS", rank: 2, totalPoints: 480 },
      { studentName: "Divija Macha", school: "INSR", rank: 5, totalPoints: 420 },
      { studentName: "Syed Ilham", school: "GEMS", rank: 4, totalPoints: 440 },
      { studentName: "Jash Singh", school: "BPS", rank: 8, totalPoints: 280 },
      { studentName: "Aritra Sinha", school: "GEMS", rank: 6, totalPoints: 320 },
      { studentName: "Maryam Siddique", school: "GEMS", rank: 7, totalPoints: 305 },
      { studentName: "Rohit Sankar", school: "BPS", rank: 10, totalPoints: 250 },
      { studentName: "Anirudh Arun", school: "INSR", rank: 9, totalPoints: 260 },
      // Add more test data to simulate various position changes
      { studentName: "Aadhya Sai", school: "GEMS", rank: 11, totalPoints: 240 },
      { studentName: "Tanisha Iyer", school: "BPS", rank: 12, totalPoints: 230 },
      { studentName: "Hrithik Mhatre", school: "INSR", rank: 13, totalPoints: 220 },
      { studentName: "Vanshveer Singh", school: "GEMS", rank: 14, totalPoints: 210 },
      { studentName: "Diya Mohan", school: "BPS", rank: 15, totalPoints: 200 }
    ]
  };
  
  // Write the snapshot
  fs.writeFileSync(filepath, JSON.stringify(testSnapshot, null, 2));
  console.log(`Created test snapshot: ${filename}`);
  console.log(`Snapshot contains ${testSnapshot.leaderboard.length} entries`);
}

createTestSnapshot();