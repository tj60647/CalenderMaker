/**
 * Dashboard Export Utilities
 * 
 * Client-side functions for exporting eval data to CSV/JSON.
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-09
 */

import type { EvalRunData } from './types';
import type { EvalTestResult } from '../types';

/**
 * Convert eval results to CSV format
 * 
 * Handles dynamic fields by extracting all unique keys from results.
 * Properly escapes strings and handles arrays.
 * 
 * @param results - Array of test results to export
 * @returns CSV string ready for download
 */
export function resultsToCSV(results: EvalTestResult[]): string {
  if (results.length === 0) return '';

  // Get all unique keys from all results (handles domain-specific fields)
  const allKeys = new Set<string>();
  results.forEach(r => Object.keys(r).forEach(k => allKeys.add(k)));
  const headers = Array.from(allKeys);

  const rows = results.map(r => 
    headers.map(key => {
      const value = (r as unknown as Record<string, unknown>)[key];
      if (Array.isArray(value)) {
        return `"${value.join(', ')}"`;
      }
      if (typeof value === 'string') {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? '';
    })
  );

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Download data as a file
 * 
 * Creates a temporary download link and triggers download.
 * Works client-side without server round-trip.
 * 
 * @param content - File content as string
 * @param filename - Name for downloaded file
 * @param mimeType - MIME type (default: text/plain)
 */
export function downloadFile(
  content: string, 
  filename: string, 
  mimeType: string = 'text/plain'
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export a single run's results to CSV
 * 
 * @param run - The run to export
 */
export function exportRunToCSV(run: EvalRunData): void {
  const csv = resultsToCSV(run.results);
  const filename = `${run.runId}-results.csv`;
  downloadFile(csv, filename, 'text/csv');
}

/**
 * Export a single run's full data to JSON
 * 
 * @param run - The run to export
 */
export function exportRunToJSON(run: EvalRunData): void {
  const json = JSON.stringify({
    metadata: run.metadata,
    results: run.results,
    summary: {
      runId: run.runId,
      totalTests: run.totalTests,
      passedTests: run.passedTests,
      failedTests: run.failedTests,
      passRate: run.passRate,
      avgExecutionTime: run.avgExecutionTime,
    },
  }, null, 2);
  
  const filename = `${run.runId}-full.json`;
  downloadFile(json, filename, 'application/json');
}

/**
 * Export multiple runs aggregated into one CSV
 * 
 * Useful for comparing results across multiple eval runs.
 * 
 * @param runs - Array of runs to aggregate
 */
export function exportAggregatedCSV(runs: EvalRunData[]): void {
  const allResults = runs.flatMap(run => 
    run.results.map(result => ({
      ...result,
      run_id: run.runId,
      run_timestamp: run.timestamp.toISOString(),
    }))
  );
  
  const csv = resultsToCSV(allResults);
  const filename = `eval-results-aggregated-${runs.length}-runs.csv`;
  downloadFile(csv, filename, 'text/csv');
}
