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
  
  // Create realistic test data with actual student names and simulated position changes
  const testSnapshot = {
    date: lastWeek.toISOString(),
    timestamp: new Date().toISOString(),
    leaderboard: [
      // Simulate Tony S. being in 2nd place last week (now 1st - moved up 1)
      { studentName: "Tony S.", school: "CIS", rank: 2, totalPoints: 220 },
      // Simulate Pacey Q. being in 1st place last week (now 2nd - moved down 1) 
      { studentName: "Pacey Q.", school: "DCB", rank: 1, totalPoints: 225 },
      // Simulate Aiden T. staying in 3rd place (no change)
      { studentName: "Aiden T.", school: "CIS", rank: 3, totalPoints: 215 },
      // Simulate Yeonseo K. being in 6th place last week (now 4th - moved up 2)
      { studentName: "Yeonseo K.", school: "GSIS", rank: 6, totalPoints: 165 },
      // Simulate Alexander B. being in 4th place last week (now 5th - moved down 1)
      { studentName: "Alexander B.", school: "TA", rank: 4, totalPoints: 170 },
      // Simulate Anson C. being in 8th place last week (now 6th - moved up 2)
      { studentName: "Anson C.", school: "DGS", rank: 8, totalPoints: 130 },
      // Simulate Zhe-Hong W. being in 5th place last week (now 6th tied - moved down 1)
      { studentName: "Zhe-Hong W.", school: "HKIS", rank: 5, totalPoints: 145 },
      // Simulate Moses L. being in 7th place last week (now 8th - moved down 1)
      { studentName: "Moses L.", school: "CIS", rank: 7, totalPoints: 135 },
      // Simulate Samuel K. staying in 9th place (no change)
      { studentName: "Samuel K.", school: "CIS", rank: 9, totalPoints: 125 },
      // Simulate Nick S. being in 12th place last week (now 10th - moved up 2)
      { studentName: "Nick S.", school: "CIS", rank: 12, totalPoints: 105 },
      // Add more students to complete the snapshot
      { studentName: "Jonathan H.", school: "DBS", rank: 10, totalPoints: 110 },
      { studentName: "Mollie M.", school: "HKIS", rank: 11, totalPoints: 108 },
      { studentName: "Gemma Y.", school: "KGV", rank: 13, totalPoints: 95 },
      { studentName: "Bella L.", school: "CIS", rank: 15, totalPoints: 90 },
      { studentName: "Catherine H.", school: "CIS", rank: 14, totalPoints: 92 },
      { studentName: "Adam P.", school: "CIS", rank: 16, totalPoints: 85 },
      { studentName: "Adrian W.", school: "HKIS", rank: 17, totalPoints: 85 },
      { studentName: "Emi R.", school: "CIS", rank: 18, totalPoints: 85 },
      { studentName: "Gigi C.", school: "DGS", rank: 19, totalPoints: 83 },
      { studentName: "Riya P.", school: "STC", rank: 20, totalPoints: 83 }
    ]
  };
  
  // Write the snapshot
  fs.writeFileSync(filepath, JSON.stringify(testSnapshot, null, 2));
  console.log(`Created test snapshot: ${filename}`);
  console.log(`Snapshot contains ${testSnapshot.leaderboard.length} entries`);
}

createTestSnapshot();