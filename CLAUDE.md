# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Debate Achievements Tracking System built with Next.js 15.2.1. It converts Excel spreadsheet data into a searchable web interface for viewing student debate tournament achievements.

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run ESLint
npm run lint
```

## Architecture

### Data Flow
1. Source data: `data/debate_achievements.xlsx`
2. API endpoint at `/api/students/route.js` converts Excel to JSON on demand
3. Main page (`src/app/page.tsx`) fetches and displays data with fallback to pre-generated JSON
4. Student search uses react-select with dynamic imports to avoid SSR issues

### Key Implementation Details
- Uses Next.js App Router (not Pages Router)
- TypeScript for main page component, JavaScript for API routes
- Client-side rendering with 'use client' directive
- Handles multiple students in achievements separated by "&"
- Tournament grouping with proper date sorting
- Dark mode support via CSS variables

### Data Processing Scripts
- `scripts/convert-excel-to-json.js` - Converts Excel to JSON format
- `scripts/generate-json.js` - Alternative JSON generator
- `src/utils/excelConverter.js` - Core Excel conversion logic

### Utility Files (src/utils/)
- `leaderboardHistory.js` - Manages weekly snapshots and position change tracking
- `leaderboardScoring.js` - Core scoring logic for achievements
- `excelConverter.js` - Excel file processing utilities

### Version Control & Snapshots
- **Baseline**: Created with current spreadsheet state (June 15, 2025)
- **Weekly snapshots**: Automatically created every Sunday when leaderboard is accessed
- **Position tracking**: Compares current week with previous week's snapshot
- **Snapshots stored**: `data/leaderboard-snapshots/snapshot-YYYY-MM-DD.json`

#### Manual Snapshot Commands
```bash
# Create baseline from current state
node scripts/create-baseline-snapshot.js

# Force create snapshot for current week (for testing)
node scripts/create-test-snapshot.js
```

**Note**: All utility files are consolidated in `src/utils/` and accessed via `@/utils/` import alias.

## Important Notes

- ESLint is disabled during builds (see next.config.mjs)
- TypeScript is configured in non-strict mode
- No testing framework is currently set up
- The application expects specific Excel format with sheets named "Speaker", "Team 1", "Team 2", etc.