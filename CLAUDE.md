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
- `utils/excelConverter.js` - Core Excel conversion logic

## Important Notes

- ESLint is disabled during builds (see next.config.mjs)
- TypeScript is configured in non-strict mode
- No testing framework is currently set up
- The application expects specific Excel format with sheets named "Speaker", "Team 1", "Team 2", etc.