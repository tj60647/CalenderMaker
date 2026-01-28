/**
 * Evals Dashboard Page
 * 
 * Displays eval results with trends, metrics, and test statistics.
 * Uses the generic EvalDashboard component from the framework.
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-08
 */

import { Box } from '@mui/material';
import path from 'path';
import fs from 'fs';
import { 
  EvalDashboard,
  loadAllRuns, 
  getTrendData, 
  getDashboardSummary 
} from '@/lib/evals/framework/dashboard';

/**
 * Server component that loads eval results and renders dashboard
 * 
 * This is domain-specific (calendar AI) but uses the generic
 * dashboard framework. Copy this file and adjust resultsDir
 * and title for other AI projects.
 */
export default function EvalsPage() {
  // Path to eval results (relative to project root)
  const resultsDir = path.join(process.cwd(), 'evals', 'results');
  const evalsPath = path.join(process.cwd(), 'evals', 'calendar-evals.jsonl');
  
  // Load all runs from disk
  const runs = loadAllRuns(resultsDir);
  
  // Generate summary statistics
  const summary = getDashboardSummary(runs);
  
  // Get time series data for charts (last 30 runs)
  const trendData = getTrendData(runs, 30);
  
  // Recent runs for the table (newest 10)
  const recentRuns = runs.slice(0, 10);

  // Load eval cases
  let testCases = [];
  try {
    const fileContent = fs.readFileSync(evalsPath, 'utf-8');
    testCases = fileContent
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));
  } catch (error) {
    console.error('Failed to load eval cases:', error);
  }

  // Load Promptfoo Results
  let promptfooResults = null;
  try {
    const pfooPath = path.join(process.cwd(), 'evals', 'promptfoo-latest.json');
    if (fs.existsSync(pfooPath)) {
      const content = fs.readFileSync(pfooPath, 'utf-8');
      promptfooResults = JSON.parse(content);
    }
  } catch (error) {
    console.error('Failed to load promptfoo results:', error);
  }

  return (
    <Box>
      <EvalDashboard
        title="Calendar AI Evals"
        summary={summary}
        trendData={trendData}
        recentRuns={recentRuns}
        testCases={testCases}
        promptfooResults={promptfooResults}
      />
    </Box>
  );
}
