/**
 * Dashboard Types
 * 
 * Type definitions for the eval dashboard data structures.
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-08
 */

import type { EvalRunMetadata, EvalTestResult } from '../types';

/**
 * Data for a single eval run loaded from disk
 * 
 * Combines metadata (configuration) with test results for display
 */
export interface EvalRunData {
  /** Unique folder name for this run (e.g., "2026-01-08T12-34-56-abc123") */
  runId: string;
  
  /** Full path to the run folder on disk */
  folderPath: string;
  
  /** When this run was executed */
  timestamp: Date;
  
  /** Configuration and metadata for this run */
  metadata: EvalRunMetadata;
  
  /** All test results from this run */
  results: EvalTestResult[];
  
  /** Pass rate percentage (0-100) */
  passRate: number;
  
  /** Average execution time in ms */
  avgExecutionTime: number;
  
  /** Total number of test cases */
  totalTests: number;
  
  /** Number of passing tests */
  passedTests: number;
  
  /** Number of failing tests */
  failedTests: number;
}

/**
 * Time series data point for trend charts
 * 
 * Used for displaying pass rate and execution time trends over time
 */
export interface TrendDataPoint {
  /** ISO timestamp of the run */
  timestamp: string;
  
  /** Pass rate as percentage (0-100) */
  passRate: number;
  
  /** Average execution time in ms */
  avgTime: number;
  
  /** Total number of tests in this run */
  testCount: number;
  
  /** Short identifier for tooltip (e.g., "run-abc123") */
  runId: string;
}

/**
 * Statistics for a test case across multiple runs
 * 
 * Used to identify frequently failing tests that need attention
 */
export interface TestCaseStats {
  /** Test case ID from the JSONL file */
  id: string;
  
  /** Human-readable test description */
  description: string;
  
  /** Number of times this test has run */
  totalRuns: number;
  
  /** Number of times this test passed */
  passes: number;
  
  /** Number of times this test failed */
  failures: number;
  
  /** Pass rate as percentage (0-100) */
  passRate: number;
  
  /** Average execution time in ms */
  avgTime: number;
}

/**
 * Summary statistics across all runs
 * 
 * High-level metrics for the dashboard overview cards
 */
export interface DashboardSummary {
  /** Total number of eval runs */
  totalRuns: number;
  
  /** Average pass rate across all runs (0-100) */
  avgPassRate: number;
  
  /** Average execution time across all runs in ms */
  avgExecutionTime: number;
  
  /** Most recent run data */
  latestRun: EvalRunData | null;
  
  /** Number of unique test cases */
  uniqueTestCases: number;
  
  /** Tests that fail more than 20% of the time */
  problematicTests: TestCaseStats[];
}
