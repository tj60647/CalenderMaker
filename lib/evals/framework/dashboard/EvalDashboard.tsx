/**
 * Eval Dashboard Component
 * 
 * Generic, reusable dashboard for visualizing eval results.
 * Works with any AI domain - calendar, chatbot, code gen, etc.
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-08
 */

'use client';

import { useState } from 'react';
import { Box, Card, CardContent, Typography, Chip, Button, Collapse, Grid } from '@mui/material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts';
import type { DashboardSummary, TrendDataPoint, EvalRunData } from './types';
import { exportRunToCSV, exportRunToJSON, exportAggregatedCSV } from './export';

interface EvalDashboardProps {
  /** Summary statistics for overview cards */
  summary: DashboardSummary;
  
  /** Time series data for trend charts */
  trendData: TrendDataPoint[];
  
  /** Recent runs for the runs table */
  recentRuns: EvalRunData[];
  
  /** Title for the dashboard (e.g., "Calendar AI Evals") */
  title?: string;
}

/**
 * Format timestamp for display
 * 
 * Converts ISO timestamp to readable format: "Jan 8, 2:30 PM"
 */
function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Format execution time for display
 * 
 * Shows ms for fast operations, seconds for slower ones
 */
function formatTime(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Main dashboard component
 * 
 * Displays:
 * - Overview cards with key metrics
 * - Pass rate trend chart
 * - Execution time trend chart
 * - Recent runs table
 * - Problematic tests list
 */
export function EvalDashboard({ 
  summary, 
  trendData, 
  recentRuns,
  title = 'AI Eval Dashboard'
}: EvalDashboardProps) {
  const [showPrompt, setShowPrompt] = useState(false);

  return (
    <Box sx={{ p: 3 }}>
      {/* Title and Metrics Row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4">
          {title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Export Buttons */}
          {summary.latestRun && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                size="small" 
                variant="outlined"
                onClick={() => exportRunToCSV(summary.latestRun!)}
              >
                Export Latest CSV
              </Button>
              <Button 
                size="small" 
                variant="outlined"
                onClick={() => exportRunToJSON(summary.latestRun!)}
              >
                Download JSON
              </Button>
              {recentRuns.length > 1 && (
                <Button 
                  size="small" 
                  variant="outlined"
                  onClick={() => exportAggregatedCSV(recentRuns.slice(0, 10))}
                >
                  Export All Runs CSV
                </Button>
              )}
            </Box>
          )}
          {/* Metrics */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Total Runs
            </Typography>
            <Typography variant="h6">
              {summary.totalRuns}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Pass Rate
            </Typography>
            <Typography variant="h6">
              {summary.avgPassRate.toFixed(1)}%
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Avg Time
            </Typography>
            <Typography variant="h6">
              {formatTime(summary.avgExecutionTime)}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Tests
            </Typography>
            <Typography variant="h6">
              {summary.uniqueTestCases}
            </Typography>
          </Box>
        </Box>
        </Box>
      </Box>

      {/* Latest Run Details */}
      {summary.latestRun && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ py: 2 }}>
            <Typography variant="h6" gutterBottom>
              Latest Run
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{xs: 12, sm: 6}}>
                <Typography variant="body2" color="text.secondary">
                  Run ID
                </Typography>
                <Typography variant="body1" fontFamily="monospace">
                  {summary.latestRun.runId}
                </Typography>
              </Grid>
              <Grid size={{xs: 12, sm: 6}}>
                <Typography variant="body2" color="text.secondary">
                  Timestamp
                </Typography>
                <Typography variant="body1">
                  {summary.latestRun.timestamp.toLocaleString()}
                </Typography>
              </Grid>
              <Grid size={{xs: 12, sm: 4}}>
                <Typography variant="body2" color="text.secondary">
                  Pass Rate
                </Typography>
                <Typography variant="body1">
                  {summary.latestRun.passedTests}/{summary.latestRun.totalTests} 
                  ({summary.latestRun.passRate.toFixed(1)}%)
                </Typography>
              </Grid>
              <Grid size={{xs: 12, sm: 4}}>
                <Typography variant="body2" color="text.secondary">
                  Model
                </Typography>
                <Typography variant="body1">
                  {summary.latestRun.metadata.agent_config.model}
                </Typography>
              </Grid>
              <Grid size={{xs: 12, sm: 4}}>
                <Typography variant="body2" color="text.secondary">
                  Git Commit
                </Typography>
                <Typography variant="body1" fontFamily="monospace" fontSize="0.9rem">
                  {summary.latestRun.metadata.environment.git_commit?.substring(0, 8) || 'N/A'}
                </Typography>
              </Grid>
              <Grid size={{xs: 12, sm: 4}}>
                <Typography variant="body2" color="text.secondary">
                  Temperature
                </Typography>
                <Typography variant="body1">
                  {summary.latestRun.metadata.agent_config.temperature ?? 'N/A'}
                </Typography>
              </Grid>
              <Grid size={{xs: 12, sm: 4}}>
                <Typography variant="body2" color="text.secondary">
                  Avg Execution Time
                </Typography>
                <Typography variant="body1">
                  {formatTime(summary.latestRun.avgExecutionTime)}
                </Typography>
              </Grid>
              <Grid size={{xs: 12, sm: 4}}>
                <Typography variant="body2" color="text.secondary">
                  Failed Tests
                </Typography>
                <Typography variant="body1" color={summary.latestRun.failedTests > 0 ? 'error.main' : 'text.primary'}>
                  {summary.latestRun.failedTests}
                </Typography>
              </Grid>
              <Grid size={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Prompt Hash
                    </Typography>
                    <Typography variant="caption" fontFamily="monospace">
                      {summary.latestRun.metadata.agent_config.system_prompt_hash?.substring(0, 12) || 'N/A'}
                    </Typography>
                  </Box>
                  <Button 
                    size="small" 
                    onClick={() => setShowPrompt(!showPrompt)}
                  >
                    {showPrompt ? 'Hide Prompt' : 'View Prompt'}
                  </Button>
                </Box>
                <Collapse in={showPrompt}>
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1, maxHeight: 300, overflow: 'auto' }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      System Prompt:
                    </Typography>
                    <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {summary.latestRun.metadata.agent_config.system_prompt || 'N/A'}
                    </Typography>
                  </Box>
                </Collapse>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Trend Charts */}
      {trendData.length > 0 && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h6" gutterBottom>
                Pass Rate Over Time
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatTimestamp}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    label={{ value: 'Pass Rate (%)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    labelFormatter={formatTimestamp}
                    formatter={(value: number | undefined) => value !== undefined ? [`${value.toFixed(1)}%`, 'Pass Rate'] : ['N/A', 'Pass Rate']}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="passRate" 
                    stroke="#2e7d32" 
                    strokeWidth={2}
                    name="Pass Rate"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h6" gutterBottom>
                Execution Time Over Time
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatTimestamp}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    label={{ value: 'Avg Time (ms)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    labelFormatter={formatTimestamp}
                    formatter={(value: number | undefined) => value !== undefined ? [formatTime(value), 'Avg Time'] : ['N/A', 'Avg Time']}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="avgTime" 
                    stroke="#1976d2" 
                    strokeWidth={2}
                    name="Avg Time"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}

      {/* Problematic Tests */}
      {summary.problematicTests.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Tests Needing Attention
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Tests with pass rate {'<'} 80% (minimum 3 runs)
            </Typography>
            {summary.problematicTests.map((test) => (
              <Box 
                key={test.id}
                sx={{ 
                  mb: 2, 
                  p: 2, 
                  border: 1, 
                  borderColor: 'divider',
                  borderRadius: 1 
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1" fontWeight="medium">
                    {test.id}
                  </Typography>
                  <Chip 
                    label={`${test.passRate.toFixed(0)}% pass rate`}
                    color={test.passRate < 50 ? 'error' : 'warning'}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {test.description}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {test.passes}/{test.totalRuns} passed • 
                  Avg time: {formatTime(test.avgTime)}
                </Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Runs Table */}
      {recentRuns.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Runs
            </Typography>
            <Box sx={{ overflowX: 'auto' }}>
              {recentRuns.slice(0, 10).map((run, index) => {
                // Calculate delta from previous run
                const previousRun = recentRuns[index + 1];
                const delta = previousRun ? run.passRate - previousRun.passRate : null;
                const promptChanged = previousRun && 
                  run.metadata.agent_config.system_prompt_hash !== previousRun.metadata.agent_config.system_prompt_hash;
                
                return (
                  <Box 
                    key={run.runId}
                    sx={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 2,
                      borderBottom: 1,
                      borderColor: 'divider',
                      '&:last-child': { borderBottom: 0 }
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontFamily="monospace">
                        {run.runId}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {run.timestamp.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 60 }}>
                        {run.metadata.agent_config.model}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 90 }}>
                        <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                          {run.metadata.agent_config.system_prompt_hash?.substring(0, 8) || 'N/A'}
                        </Typography>
                        {promptChanged && (
                          <Chip label="Prompt Changed" size="small" color="warning" sx={{ height: 16, fontSize: '0.6rem' }} />
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary" fontFamily="monospace" sx={{ minWidth: 60 }}>
                        {run.metadata.environment.git_commit?.substring(0, 7) || 'N/A'}
                      </Typography>
                      <Chip 
                        label={`${run.passRate.toFixed(0)}%`}
                        color={run.passRate === 100 ? 'success' : run.passRate >= 80 ? 'primary' : 'warning'}
                        size="small"
                      />
                      {delta !== null && (
                        <Typography 
                          variant="caption" 
                          color={delta > 0 ? 'success.main' : delta < 0 ? 'error.main' : 'text.secondary'}
                          sx={{ minWidth: 40, textAlign: 'right' }}
                        >
                          {delta > 0 ? '↑' : delta < 0 ? '↓' : ''}{Math.abs(delta).toFixed(1)}%
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 60 }}>
                        {run.passedTests}/{run.totalTests}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 50 }}>
                        {formatTime(run.avgExecutionTime)}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {summary.totalRuns === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" align="center" color="text.secondary">
              No eval runs found
            </Typography>
            <Typography variant="body2" align="center" color="text.secondary" sx={{ mt: 1 }}>
              Run your eval suite to see results here
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
