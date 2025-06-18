'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
  const [filterSchool, setFilterSchool] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/leaderboard?limit=50');
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

  const filteredLeaderboard = leaderboard.filter(entry => {
    const matchesSchool = !filterSchool || entry.student.school.toLowerCase().includes(filterSchool.toLowerCase());
    const matchesSearch = !searchTerm || entry.student.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSchool && matchesSearch;
  });

  const uniqueSchools = Array.from(new Set(leaderboard.map(entry => entry.student.school))).sort();

  // Pagination logic
  const totalPages = Math.ceil(filteredLeaderboard.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLeaderboard = filteredLeaderboard.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterSchool, searchTerm]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading leaderboard...</div>
      </div>
    );
  }

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900";
    if (rank === 2) return "bg-gradient-to-r from-gray-300 to-gray-500 text-gray-900";
    if (rank === 3) return "bg-gradient-to-r from-amber-600 to-amber-800 text-amber-100";
    if (rank <= 10) return "bg-gradient-to-r from-blue-500 to-blue-700 text-blue-100";
    return "bg-gradient-to-r from-gray-100 to-gray-300 text-gray-700";
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <Link href="/" className="text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Achievements
          </Link>
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Debater Leaderboard
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Top 50 debaters ranked by achievement points • Showing {paginatedLeaderboard.length} of {filteredLeaderboard.length} debaters
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search & Filter</CardTitle>
            <CardDescription>Find specific debaters or filter by school</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search debater..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="lg:w-64">
                <select
                  value={filterSchool}
                  onChange={(e) => setFilterSchool(e.target.value)}
                  className="w-full h-11 px-3 py-2 bg-background border border-input rounded-md text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">All Schools ({uniqueSchools.length})</option>
                  {uniqueSchools.map(school => (
                    <option key={school} value={school}>{school}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Rankings</CardTitle>
            <CardDescription>Click on "View Details" to see the complete breakdown of points</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-20 text-center">Rank</TableHead>
                    <TableHead className="min-w-[200px]">Debater</TableHead>
                    <TableHead className="min-w-[120px]">School</TableHead>
                    <TableHead className="w-32 text-center">Points</TableHead>
                    <TableHead className="w-32 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLeaderboard.map((entry, index) => (
                    <TableRow key={index} className="hover:bg-muted/25 transition-colors">
                      <TableCell className="text-center">
                        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${getRankBadgeColor(entry.rank)}`}>
                          {entry.rank}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-base">{entry.student.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-muted-foreground">{entry.student.school}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="font-bold text-xl text-primary">{entry.totalPoints}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="text-2xl flex items-center gap-3 text-foreground">
                                <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${getRankBadgeColor(entry.rank)}`}>
                                  {entry.rank}
                                </div>
                                {entry.student.name}
                              </DialogTitle>
                              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                {entry.student.school} • Total Points: <span className="font-bold text-foreground">{entry.totalPoints}</span>
                              </div>
                            </DialogHeader>
                            
                            <div className="space-y-6 mt-6">
                              {/* Achievements Breakdown */}
                              <div>
                                <h3 className="text-lg font-semibold mb-4 text-foreground">Achievement Breakdown</h3>
                                <div className="space-y-3">
                                  {entry.breakdown.map((item, i) => (
                                    <Card key={i} className="border-l-4 border-l-primary bg-white dark:bg-gray-900">
                                      <CardContent className="pt-4">
                                        <div className="flex justify-between items-start gap-4">
                                          <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-base mb-1 text-foreground">{item.achievement}</div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                              {item.tournament} • {item.date}
                                            </div>
                                            <div className="inline-flex items-center gap-2 mt-2">
                                              <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                                item.type === 'team' 
                                                  ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100' 
                                                  : 'bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100'
                                              }`}>
                                                {item.type === 'team' ? 'Team' : 'Speaker'}
                                              </span>
                                              {item.multiplier > 1 && (
                                                <span className="px-2 py-1 rounded-md text-xs font-medium bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100">
                                                  Major Tournament (2×)
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          <div className="text-right flex-shrink-0">
                                            <div className="font-bold text-2xl text-blue-600 dark:text-blue-400">{item.totalPoints}</div>
                                            {item.multiplier > 1 && (
                                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                                {item.basePoints} × {item.multiplier}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                              
                              {/* Scoring System Reference */}
                              <Card className="bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                <CardHeader>
                                  <CardTitle className="text-base text-foreground">Scoring System Reference</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                      <h4 className="font-semibold mb-3 text-blue-600 dark:text-blue-400">Team Achievements</h4>
                                      <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                        <div className="flex justify-between"><span>Champion</span><span className="font-semibold text-foreground">30 pts</span></div>
                                        <div className="flex justify-between"><span>Finalist</span><span className="font-semibold text-foreground">25 pts</span></div>
                                        <div className="flex justify-between"><span>Semifinalist</span><span className="font-semibold text-foreground">20 pts</span></div>
                                        <div className="flex justify-between"><span>Quarterfinalist</span><span className="font-semibold text-foreground">15 pts</span></div>
                                        <div className="flex justify-between"><span>Octofinalist</span><span className="font-semibold text-foreground">10 pts</span></div>
                                        <div className="flex justify-between"><span>Double Octos</span><span className="font-semibold text-foreground">5 pts</span></div>
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold mb-3 text-green-600 dark:text-green-400">Speaker Awards</h4>
                                      <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                        <div className="flex justify-between"><span>1st-10th Place</span><span className="font-semibold text-foreground">10-1 pts</span></div>
                                        <div className="flex justify-between"><span>Finals Best Speaker</span><span className="font-semibold text-foreground">10 pts</span></div>
                                        <div className="flex justify-between"><span>Overall Best Speaker</span><span className="font-semibold text-foreground">10 pts</span></div>
                                      </div>
                                      <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-800">
                                        <div className="text-sm font-semibold text-amber-900 dark:text-amber-200">Major Tournament Bonus</div>
                                        <div className="text-xs text-amber-800 dark:text-amber-300 mt-1">ASDC and WSDC achievements receive 2× points</div>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  
                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-10"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    Last
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}