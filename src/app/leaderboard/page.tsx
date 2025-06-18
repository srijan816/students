'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PointBreakdown {
  tournament: string;
  date: string;
  achievement: string;
  type: 'team' | 'speaker';
  basePoints: number;
  multiplier: number;
  totalPoints: number;
}

interface LeaderboardEntry {
  rank: number;
  student: {
    name: string;
    school: string;
  };
  totalPoints: number;
  breakdown: PointBreakdown[];
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [filterSchool, setFilterSchool] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/leaderboard');
      const result = await response.json();
      
      if (result.success) {
        setLeaderboard(result.data.leaderboard);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRowExpansion = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const filteredLeaderboard = leaderboard.filter(entry => {
    const matchesSchool = !filterSchool || entry.student.school.toLowerCase().includes(filterSchool.toLowerCase());
    const matchesSearch = !searchTerm || entry.student.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSchool && matchesSearch;
  });

  const uniqueSchools = Array.from(new Set(leaderboard.map(entry => entry.student.school))).sort();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Achievements
          </Link>
          <h1 className="text-4xl font-bold mb-2">Debater Leaderboard</h1>
          <p className="text-gray-600">Top 20 debaters ranked by achievement points</p>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search debater..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border rounded-lg flex-1"
          />
          <select
            value={filterSchool}
            onChange={(e) => setFilterSchool(e.target.value)}
            className="px-4 py-2 border rounded-lg sm:w-auto"
          >
            <option value="">All Schools</option>
            {uniqueSchools.map(school => (
              <option key={school} value={school}>{school}</option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  School
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLeaderboard.map((entry, index) => (
                <tr key={index}>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-semibold text-sm">
                      {entry.rank}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{entry.student.name}</div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{entry.student.school}</div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-base sm:text-lg font-semibold text-gray-900">{entry.totalPoints}</div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => toggleRowExpansion(index)}
                      className="px-3 py-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                    >
                      {expandedRows.has(index) ? 'Hide' : 'View'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        {/* Expanded Breakdown Modal */}
        {Array.from(expandedRows).map(index => {
          const entry = filteredLeaderboard[index];
          if (!entry) return null;
          
          return (
            <div key={index} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
              <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] sm:max-h-[80vh] overflow-y-auto">
                <div className="p-4 sm:p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl sm:text-2xl font-bold truncate">{entry.student.name}</h2>
                      <p className="text-sm sm:text-base text-gray-600">{entry.student.school} • Total Points: {entry.totalPoints}</p>
                    </div>
                    <button
                      onClick={() => toggleRowExpansion(index)}
                      className="ml-4 text-gray-500 hover:text-gray-700 flex-shrink-0"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {entry.breakdown.map((item, i) => (
                      <div key={i} className="border-l-4 border-blue-500 pl-3 sm:pl-4 py-2">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm sm:text-base">{item.achievement}</p>
                            <p className="text-xs sm:text-sm text-gray-600 truncate">
                              {item.tournament} • {item.date}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-semibold text-base sm:text-lg">{item.totalPoints} pts</p>
                            {item.multiplier > 1 && (
                              <p className="text-xs sm:text-sm text-green-600">
                                {item.basePoints} × {item.multiplier}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t">
                    <h3 className="font-semibold mb-2 text-sm sm:text-base">Scoring System</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-gray-600">
                      <div>
                        <p className="font-medium">Team Achievements:</p>
                        <ul className="ml-3 sm:ml-4 space-y-1">
                          <li>Champion: 30 pts</li>
                          <li>Finalist: 25 pts</li>
                          <li>Semifinalist: 20 pts</li>
                          <li>Quarterfinalist: 15 pts</li>
                          <li>Octofinalist: 10 pts</li>
                          <li>Double Octos: 5 pts</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium">Speaker Awards:</p>
                        <ul className="ml-3 sm:ml-4 space-y-1">
                          <li>1st-10th: 10-1 pts</li>
                          <li>Finals Best Speaker: 10 pts</li>
                          <li>Overall Best Speaker: 10 pts</li>
                        </ul>
                        <p className="mt-2 font-medium">Major tournaments (ASDC, WSDC) get 2× points</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}