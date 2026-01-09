/**
 * Dashboard Module Exports
 * 
 * Clean exports for the eval dashboard components and utilities.
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-08
 */

export { EvalDashboard } from './EvalDashboard';
export { 
  loadAllRuns, 
  getTrendData, 
  getTestCaseStats,
  getDashboardSummary 
} from './data-loader';
export { 
  exportRunToCSV,
  exportRunToJSON,
  exportAggregatedCSV 
} from './export';
export type { 
  EvalRunData, 
  TrendDataPoint, 
  TestCaseStats,
  DashboardSummary 
} from './types';
