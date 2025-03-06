'use client';

import { useState, useEffect, Fragment } from 'react';
import dynamic from 'next/dynamic';
import type { StylesConfig, GroupBase } from 'react-select';

// Import the JSON directly for initial render
import studentsData from '../../data/students.json';

// Dynamically import react-select to avoid server-side rendering issues
const Select = dynamic(() => import('react-select'), { ssr: false });

// Define types for our student data
type Achievement = {
  tournament: string;
  date: string;
  type: string;
  description: string;
};

type Student = {
  first_name: string;
  last_initial: string;
  school: string;
  achievements: Achievement[];
};

// Define select option type
interface SelectOption {
  value: Student;
  label: string;
}

export default function Home() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch the latest student data on component mount
  useEffect(() => {
    async function loadStudents() {
      try {
        setLoading(true);
        // Fetch fresh data from the API endpoint
        const response = await fetch('/api/students');
        if (!response.ok) {
          throw new Error(`Error fetching data: ${response.status}`);
        }
        const data = await response.json();
        setStudents(data.students);
      } catch (error) {
        console.error('Error fetching student data:', error);
        // Use the pre-rendered data as fallback
        setStudents(studentsData.students);
      } finally {
        setLoading(false);
      }
    }
    
    // Initialize with the pre-rendered data
    setStudents(studentsData.students);
    // Then try to update with fresh data
    loadStudents();
  }, []);

  const options: SelectOption[] = students.map((student) => ({
    value: student,
    label: `${student.first_name} ${student.last_initial} (${student.school})`,
  }));

  // Define types for the Select component styles with explicit typing
  const customStyles: StylesConfig<SelectOption, false, GroupBase<SelectOption>> = {
    control: (styles) => ({
      ...styles,
      width: '100%',
      maxWidth: '400px',
      margin: '0 auto',
    }),
    option: (styles, { isSelected, isFocused }) => ({
      ...styles,
      cursor: 'pointer',
      backgroundColor: isSelected ? '#3b82f6' : isFocused ? '#dbeafe' : 'white',
      color: isSelected ? 'white' : 'black',
    }),
  };

  // Use a simplified inline handler to avoid any ESLint issues with unused parameters

  return (
    <div className="flex flex-col min-h-screen p-6 md:p-12">
      <main className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Debate Achievements</h1>
          <p className="text-gray-600 dark:text-gray-300">Enter a student&apos;s name to view their achievements</p>
          {loading && <p className="text-blue-500 mt-2">Loading latest student data...</p>}
        </div>
        
        <div className="mb-10">
          <Select
            options={options}
            onChange={(newValue) => {
              // Cast to proper type and update state
              const selectedOption = newValue as SelectOption | null;
              setSelectedStudent(selectedOption ? selectedOption.value : null);
            }}
            placeholder="Search for a student..."
            isClearable
            styles={customStyles as unknown as StylesConfig<unknown, boolean, GroupBase<unknown>>}
            className="mb-4"
          />
        </div>

        {selectedStudent && (
          <div className="w-full border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-center">
              Achievements for {selectedStudent.first_name} {selectedStudent.last_initial} ({selectedStudent.school})
            </h2>
            
            {selectedStudent.achievements.length > 0 ? (
              <div className="overflow-x-auto">
                <div>
                {/* Speaker Achievements */}
                <h3 className="text-xl font-semibold mt-6 mb-3">Speaker Achievements</h3>
                {selectedStudent.achievements.filter(a => a.type === 'speaker').length > 0 ? (
                  <table className="w-full border-collapse mb-8">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-700">
                        <th className="border border-gray-300 dark:border-gray-600 px-4 py-2">Tournament</th>
                        <th className="border border-gray-300 dark:border-gray-600 px-4 py-2">Date</th>
                        <th className="border border-gray-300 dark:border-gray-600 px-4 py-2">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // First, filter and sort achievements
                        const speakerAchievements = selectedStudent.achievements
                          .filter(achievement => achievement.type === 'speaker')
                          .sort((a, b) => {
                            if (!a.date || !b.date) return 0;
                            return a.date < b.date ? 1 : -1;
                          });
                        
                        // Group achievements by tournament name
                        const tournamentGroups: Record<string, Achievement[]> = {};
                        
                        speakerAchievements.forEach(achievement => {
                          const tournamentKey = `${achievement.tournament}|${achievement.date}`;
                          if (!tournamentGroups[tournamentKey]) {
                            tournamentGroups[tournamentKey] = [];
                          }
                          tournamentGroups[tournamentKey].push(achievement);
                        });
                        
                        // Convert groups to array for rendering
                        const groupedRows = Object.entries(tournamentGroups).map(([key, achievements], groupIndex) => {
                          const [tournament, date] = key.split('|');
                          
                          return (
                            <Fragment key={`speaker-group-${groupIndex}`}>
                              {achievements.map((achievement, achievementIndex) => {
                                const isFirstInGroup = achievementIndex === 0;
                                return (
                                  <tr 
                                    key={`speaker-${groupIndex}-${achievementIndex}`} 
                                    className={groupIndex % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}
                                  >
                                    {isFirstInGroup ? (
                                      <>
                                        <td 
                                          className="border border-gray-300 dark:border-gray-600 px-4 py-2" 
                                          rowSpan={achievements.length}
                                        >
                                          {tournament}
                                        </td>
                                        <td 
                                          className="border border-gray-300 dark:border-gray-600 px-4 py-2" 
                                          rowSpan={achievements.length}
                                        >
                                          {date}
                                        </td>
                                      </>
                                    ) : null}
                                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                                      {achievement.description}
                                    </td>
                                  </tr>
                                );
                              })}
                            </Fragment>
                          );
                        });
                        
                        return groupedRows;
                      })()
                      }
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500 mb-6">No speaker achievements found.</p>
                )}

                {/* Team Achievements */}
                <h3 className="text-xl font-semibold mt-6 mb-3">Team Achievements</h3>
                {selectedStudent.achievements.filter(a => a.type === 'team').length > 0 ? (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-700">
                        <th className="border border-gray-300 dark:border-gray-600 px-4 py-2">Tournament</th>
                        <th className="border border-gray-300 dark:border-gray-600 px-4 py-2">Date</th>
                        <th className="border border-gray-300 dark:border-gray-600 px-4 py-2">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // First, filter and sort achievements
                        const teamAchievements = selectedStudent.achievements
                          .filter(achievement => achievement.type === 'team')
                          .sort((a, b) => {
                            if (!a.date || !b.date) return 0;
                            return a.date < b.date ? 1 : -1;
                          });
                        
                        // Group achievements by tournament name
                        const tournamentGroups: Record<string, Achievement[]> = {};
                        
                        teamAchievements.forEach(achievement => {
                          const tournamentKey = `${achievement.tournament}|${achievement.date}`;
                          if (!tournamentGroups[tournamentKey]) {
                            tournamentGroups[tournamentKey] = [];
                          }
                          tournamentGroups[tournamentKey].push(achievement);
                        });
                        
                        // Convert groups to array for rendering
                        const groupedRows = Object.entries(tournamentGroups).map(([key, achievements], groupIndex) => {
                          const [tournament, date] = key.split('|');
                          
                          return (
                            <Fragment key={`team-group-${groupIndex}`}>
                              {achievements.map((achievement, achievementIndex) => {
                                const isFirstInGroup = achievementIndex === 0;
                                return (
                                  <tr 
                                    key={`team-${groupIndex}-${achievementIndex}`} 
                                    className={groupIndex % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}
                                  >
                                    {isFirstInGroup ? (
                                      <>
                                        <td 
                                          className="border border-gray-300 dark:border-gray-600 px-4 py-2" 
                                          rowSpan={achievements.length}
                                        >
                                          {tournament}
                                        </td>
                                        <td 
                                          className="border border-gray-300 dark:border-gray-600 px-4 py-2" 
                                          rowSpan={achievements.length}
                                        >
                                          {date}
                                        </td>
                                      </>
                                    ) : null}
                                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                                      {achievement.description}
                                    </td>
                                  </tr>
                                );
                              })}
                            </Fragment>
                          );
                        });
                        
                        return groupedRows;
                      })()
                      }
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500">No team achievements found.</p>
                )}
              </div>
              </div>
            ) : (
              <p className="text-center">No achievements found for this student.</p>
            )}
          </div>
        )}
      </main>
      
      <footer className="mt-auto py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Debate Achievements Database - {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
