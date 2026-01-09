/**
 * Dashboard Data Loader
 * 
 * Utilities for loading and processing eval results from disk.
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-08
 */

import fs from 'fs';
import path from 'path';
import type { EvalTestResult } from '../types';
import type { 
  EvalRunData, 
  TrendDataPoint, 
  TestCaseStats, 
  DashboardSummary 
} from './types';

/**
 * Load all eval runs from the results directory
 * 
 * Reads each run folder and parses the consolidated run.json file.
 * 
 * @param resultsDir - Absolute path to evals/results directory
 * @returns Array of eval run data, sorted newest first
 */
export function loadAllRuns(resultsDir: string): EvalRunData[] {
  if (!fs.existsSync(resultsDir)) {
    return [];
  }

  const folders = fs.readdirSync(resultsDir);
  const runs: EvalRunData[] = [];

  for (const folder of folders) {
    const folderPath = path.join(resultsDir, folder);
    
    // Skip if not a directory
    if (!fs.statSync(folderPath).isDirectory()) {
      continue;
    }

    const runJsonPath = path.join(folderPath, 'run.json');

    // Skip if missing run.json
    if (!fs.existsSync(runJsonPath)) {
      continue;
    }

    try {
      const runData = JSON.parse(fs.readFileSync(runJsonPath, 'utf-8'));
      const { metadata, results } = runData;

      const passedTests = results.filter((r: EvalTestResult) => r.passed).length;
      const totalTests = results.length;
      const failedTests = totalTests - passedTests;

      runs.push({
        runId: folder,
        folderPath,
        timestamp: new Date(metadata.timestamp),
        metadata,
        results,
        passRate: totalTests > 0 ? (passedTests / totalTests) * 100 : 0,
        avgExecutionTime: totalTests > 0 
          ? results.reduce((sum: number, r: EvalTestResult) => sum + r.execution_time_ms, 0) / totalTests 
          : 0,
        totalTests,
        passedTests,
        failedTests,
      });
    } catch (error) {
      console.warn(`Failed to load run ${folder}:`, error);
    }
  }

  // Sort by timestamp, newest first
  return runs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

/**
 * Convert runs into time series data for trend charts
 * 
 * Creates data points for pass rate and execution time over time.
 * Limits to most recent N runs to keep charts readable.
 * 
 * @param runs - All eval runs (should be sorted newest first)
 * @param limit - Maximum number of data points (default: 30)
 * @returns Trend data points, sorted oldest to newest for chart display
 */
export function getTrendData(runs: EvalRunData[], limit: number = 30): TrendDataPoint[] {
  const recentRuns = runs.slice(0, limit);
  
  const points: TrendDataPoint[] = recentRuns.map(run => ({
    timestamp: run.timestamp.toISOString(),
    passRate: run.passRate,
    avgTime: run.avgExecutionTime,
    testCount: run.totalTests,
    runId: run.runId.split('-').pop() || run.runId,
  }));

  // Reverse to show oldest to newest (typical for time series charts)
  return points.reverse();
}

/**
 * Calculate statistics for each test case across all runs
 * 
 * Aggregates pass/fail counts and execution times to identify
 * problematic tests that fail frequently.
 * 
 * @param runs - All eval runs
 * @returns Map of test case ID to statistics
 */
export function getTestCaseStats(runs: EvalRunData[]): Map<string, TestCaseStats> {
  const statsMap = new Map<string, TestCaseStats>();

  for (const run of runs) {
    for (const result of run.results) {
      const existing = statsMap.get(result.test_id);

      if (!existing) {
        statsMap.set(result.test_id, {
          id: result.test_id,
          description: result.prompt,
          totalRuns: 1,
          passes: result.passed ? 1 : 0,
          failures: result.passed ? 0 : 1,
          passRate: result.passed ? 100 : 0,
          avgTime: result.execution_time_ms,
        });
      } else {
        existing.totalRuns++;
        existing.passes += result.passed ? 1 : 0;
        existing.failures += result.passed ? 0 : 1;
        existing.passRate = (existing.passes / existing.totalRuns) * 100;
        existing.avgTime = 
          (existing.avgTime * (existing.totalRuns - 1) + result.execution_time_ms) / 
          existing.totalRuns;
      }
    }
  }

  return statsMap;
}

/**
 * Generate dashboard summary statistics
 * 
 * Calculates high-level metrics for overview cards:
 * total runs, average pass rate, problematic tests, etc.
 * 
 * @param runs - All eval runs (should be sorted newest first)
 * @returns Summary statistics for dashboard display
 */
export function getDashboardSummary(runs: EvalRunData[]): DashboardSummary {
  if (runs.length === 0) {
    return {
      totalRuns: 0,
      avgPassRate: 0,
      avgExecutionTime: 0,
      latestRun: null,
      uniqueTestCases: 0,
      problematicTests: [],
    };
  }

  const avgPassRate = runs.reduce((sum, r) => sum + r.passRate, 0) / runs.length;
  const avgExecutionTime = 
    runs.reduce((sum, r) => sum + r.avgExecutionTime, 0) / runs.length;

  const testCaseStats = getTestCaseStats(runs);
  const uniqueTestCases = testCaseStats.size;

  // Tests with pass rate < 80% are considered problematic
  const problematicTests = Array.from(testCaseStats.values())
    .filter(stat => stat.passRate < 80 && stat.totalRuns >= 3)
    .sort((a, b) => a.passRate - b.passRate);

  return {
    totalRuns: runs.length,
    avgPassRate,
    avgExecutionTime,
    latestRun: runs[0] || null,
    uniqueTestCases,
    problematicTests,
  };
}
