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
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Box, Card, CardContent, Typography, Chip, Button, Collapse, Grid,
  Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
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
import type { EvalCase } from '../types';
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
  
  /** List of test cases for the "Test Suite" view */
  testCases?: EvalCase[];

  /** Results from Promptfoo JSON output */
  promptfooResults?: any;
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
  title = 'AI Eval Dashboard',
  testCases = [],
  promptfooResults
}: EvalDashboardProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(summary.latestRun?.runId || null);

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

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} aria-label="eval dashboard tabs">
          <Tab label="Statistics" />
          <Tab label="Run History" />
          <Tab label="Test Suite Definitions" />
          <Tab label="Methodology" />
          <Tab label="Promptfoo Results" />
        </Tabs>
      </Box>

      {/* STATISTICS VIEW */}
      {activeTab === 0 && (
        <>
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
      </>
      )}

      {/* RUN HISTORY VIEW */}
      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Run History
            </Typography>
            <Box sx={{ overflowX: 'auto' }}>
              {recentRuns.map((run, index) => {
                // Calculate delta from previous run
                const previousRun = recentRuns[index + 1];
                const delta = previousRun ? run.passRate - previousRun.passRate : null;
                const isExpanded = selectedRunId === run.runId;

                return (
                  <Box 
                    key={run.runId}
                    sx={{ 
                      mb: 2,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      overflow: 'hidden'
                    }}
                  >
                    <Box 
                      onClick={() => setSelectedRunId(isExpanded ? null : run.runId)}
                      sx={{ 
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 2,
                        bgcolor: isExpanded ? 'grey.50' : 'background.paper',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'grey.100' }
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontFamily="monospace" fontWeight={isExpanded ? 'bold' : 'normal'}>
                          {run.timestamp.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {run.runId}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                         <Typography variant="body2" color="text.secondary" sx={{ minWidth: 60 }}>
                          {run.metadata.agent_config.model}
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
                      </Box>
                    </Box>
                    
                    {/* EXPANDED RESULT VIEW */}
                    <Collapse in={isExpanded}>
                       <Box sx={{ p: 2, pt: 0, bgcolor: 'grey.50' }}>
                         <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Run Results</Typography>
                         <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ bgcolor: 'white' }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Prompt</TableCell>
                                <TableCell>Tags</TableCell>
                                <TableCell>Expected</TableCell>
                                <TableCell>Actual</TableCell>
                                <TableCell align="right">Score</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {testCases.map((testCase) => {
                                const result = run.results?.find(r => r.test_id === testCase.id);
                                if (!result) return null;
                                
                                return (
                                  <TableRow key={testCase.id} hover sx={result.passed ? {} : { bgcolor: '#fff5f5' }}>
                                    <TableCell component="th" scope="row" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                      {testCase.id}
                                    </TableCell>
                                    <TableCell sx={{ fontSize: '0.875rem' }}>{testCase.prompt}</TableCell>
                                    <TableCell>
                                       <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                        {testCase.tags.slice(0, 2).map(tag => (
                                          <Chip key={tag} label={tag} size="small" sx={{ fontSize: '0.65rem', height: 20 }} />
                                        ))}
                                      </Box>
                                    </TableCell>
                                    <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {((testCase.design as Record<string, unknown>)?.notes as string) || '-'}
                                    </TableCell>
                                    <TableCell sx={{ fontSize: '0.75rem', color: result.error ? 'error.main' : 'text.secondary' }}>
                                      {result.error ? `Error: ${result.error}` : 'Success'}
                                    </TableCell>
                                    <TableCell align="right">
                                      <Chip 
                                        label={result.passed ? "1.0" : "0.0"} 
                                        color={result.passed ? "success" : "error"} 
                                        size="small" 
                                        sx={{ fontSize: '0.65rem', height: 20, fontWeight: 'bold' }}
                                      />
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                       </Box>
                    </Collapse>
                  </Box>
                );
              })}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* TEST SUITE DEFINITIONS VIEW */}
      {activeTab === 2 && (
        <Card>
           <CardContent>
            <Typography variant="h6" gutterBottom>Test Suite Definitions</Typography>
            {testCases && testCases.length > 0 ? (
              <TableContainer component={Paper} elevation={0} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Prompt</TableCell>
                      <TableCell>Tags</TableCell>
                      <TableCell width="30%">Expected Behavior</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {testCases.map((testCase) => (
                      <TableRow key={testCase.id} hover>
                        <TableCell component="th" scope="row" sx={{ fontFamily: 'monospace', fontWeight: 'medium' }}>
                          {testCase.id}
                        </TableCell>
                        <TableCell>{testCase.prompt}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {testCase.tags.map(tag => (
                              <Chip key={tag} label={tag} size="small" sx={{ fontSize: '0.7rem' }} />
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                          {((testCase.design as Record<string, unknown>)?.notes as string) || 'No design notes'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
               <Typography color="text.secondary" align="center" sx={{py: 4}}>
                 No test cases found.
               </Typography>
            )}
           </CardContent>
        </Card>
      )}

      {/* METHODOLOGY VIEW */}
      {activeTab === 3 && (
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Evaluation Methodology
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              This evaluation system connects design-authored intent to repeatable behavioral evidence using <strong>Promptfoo</strong>.
            </Typography>

            <Grid container spacing={4} sx={{ mt: 2 }}>
              <Grid size={{ md: 6 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Core Architecture
                </Typography>
                <Box component="ul" sx={{ pl: 2, color: 'text.secondary' }}>
                  <Box component="li" sx={{ mb: 1 }}>
                    <strong>YAML (Specification):</strong> Declares evaluation intent, scenarios, and assertions. These are version-controlled and reviewed by design.
                  </Box>
                  <Box component="li" sx={{ mb: 1 }}>
                    <strong>Promptfoo (Engine):</strong> Expands these scenarios into executable cases (Scenario × Variant × Parameters).
                  </Box>
                  <Box component="li" sx={{ mb: 1 }}>
                    <strong>JSONL (Evidence):</strong> Records what actually happened. These are immutable logs of behavior.
                  </Box>
                </Box>
              </Grid>

              <Grid size={{ md: 6 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Evaluation Criteria
                </Typography>
                 <Box component="ul" sx={{ pl: 2, color: 'text.secondary' }}>
                  <Box component="li" sx={{ mb: 1 }}>
                    <strong>Rule-Based Assertions:</strong> Strict checks (e.g., "Must call `get_date_notes`").
                  </Box>
                  <Box component="li" sx={{ mb: 1 }}>
                    <strong>LLM-as-a-Judge:</strong> Semantic grading using a stronger model (GPT-4o) to assess qualities like "Tone", "Clarity", or "Helpfulness" based on the Design Notes rubrics.
                  </Box>
                </Box>
              </Grid>

              <Grid size={12}>
                <Typography variant="h6" gutterBottom color="primary">
                  Workflow
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2" component="div" fontFamily="monospace">
                      1. Author Scenarios (YAML) <br/>
                      &nbsp;&nbsp;&nbsp;↳ Define what "Good" looks like (Design Intent)<br/><br/>
                      2. Configure Variants<br/>
                      &nbsp;&nbsp;&nbsp;↳ Prompt V1 vs V2, Model A vs B<br/><br/>
                      3. Process Expansion (Promptfoo)<br/>
                      &nbsp;&nbsp;&nbsp;↳ Generates executable test matrix<br/><br/>
                      4. Execution (Stateless Provider)<br/>
                      &nbsp;&nbsp;&nbsp;↳ Mocks DB state → Runs Agent → Captures Output<br/><br/>
                      5. Analysis (Dashboard)<br/>
                      &nbsp;&nbsp;&nbsp;↳ Review Pass Rates, Regressions, and Semantic Grades
                    </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* PROMPTFOO RESULTS VIEW */}
      {activeTab === 4 && (
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Latest Promptfoo Run
            </Typography>
            {promptfooResults && promptfooResults.results && promptfooResults.results.results ? (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell>Status</TableCell>
                      <TableCell>ID</TableCell>
                      <TableCell>User Prompt</TableCell>
                      <TableCell>Initial Calendar</TableCell>
                      <TableCell>Agent Output</TableCell>
                      <TableCell>Grading & Evidence</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {promptfooResults.results.results.map((result: any, idx: number) => {
                      const vars = result.testCase?.vars || result.vars || {};
                      const initialCalendar = vars.initial_calendar || [];
                      const grading = result.gradingResult;
                      
                      return (
                        <TableRow key={idx} hover>
                          {/* Status */}
                          <TableCell>
                            {result.success ? (
                              <Chip label="PASS" color="success" size="small" />
                            ) : (
                              <Chip label="FAIL" color="error" size="small" />
                            )}
                          </TableCell>
                          
                          {/* ID */}
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                            {vars.id || `test-${idx}`}
                          </TableCell>

                           {/* User Prompt */}
                           <TableCell>
                            <Typography variant="body2">{vars.user_prompt}</Typography>
                          </TableCell>

                          {/* Initial Calendar */}
                          <TableCell>
                            {Array.isArray(initialCalendar) && initialCalendar.length > 0 ? (
                               <Box sx={{ maxHeight: 150, overflowY: 'auto', fontSize: '0.75rem' }}>
                                 <pre style={{ margin: 0 }}>
                                   {JSON.stringify(initialCalendar, null, 2)}
                                 </pre>
                               </Box>
                            ) : (
                              <Typography variant="caption" color="text.secondary">Empty / Not Array</Typography>
                            )}
                          </TableCell>

                           {/* Agent Output */}
                           <TableCell>
                            <Box sx={{ 
                              maxHeight: 250, 
                              maxWidth: 350,
                              overflowY: 'auto', 
                              fontSize: '0.75rem', 
                              bgcolor: 'background.paper',
                              p: 1,
                              borderRadius: 1,
                              border: '1px solid #e0e0e0',
                              '& p': { m: 0, mb: 0.5 },
                              '& pre': { m: 0, p: 1, bgcolor: '#f5f5f5', borderRadius: 1, overflowX: 'auto' }
                            }}>
                               {typeof result.response?.output === 'string' ? (
                                 <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                   {result.response.output}
                                 </ReactMarkdown>
                               ) : (
                                 <pre style={{ margin: 0, fontFamily: 'monospace' }}>
                                   {JSON.stringify(result.response?.output, null, 2)}
                                 </pre>
                               )}
                            </Box>
                          </TableCell>

                          {/* Grading Evidence */}
                          <TableCell>
                           <Box sx={{ maxWidth: 350 }}>
                             {grading?.componentResults?.map((comp: any, cIdx: number) => (
                               <Box key={cIdx} sx={{ mb: 1, p: 1, border: 1, borderColor: comp.pass ? 'success.light' : 'error.light', borderRadius: 1, bgcolor: comp.pass ? 'rgba(76, 175, 80, 0.04)' : 'rgba(211, 47, 47, 0.04)' }}>
                                 <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="caption" fontWeight="bold">
                                      {comp.assertion?.type === 'llm-rubric' ? 'LLM Judge' : comp.assertion?.type || 'Assertion'}
                                    </Typography>
                                    {comp.pass ? (
                                      <Typography variant="caption" color="success.main" fontWeight="bold">✔ Pass</Typography>
                                    ) : (
                                      <Typography variant="caption" color="error.main" fontWeight="bold">✘ Fail</Typography>
                                    )}
                                 </Box>
                                 <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5, fontFamily: 'monospace', fontSize: '0.7rem' }}>
                                   Rule: {String(comp.assertion?.value || '').substring(0, 150)}
                                   {String(comp.assertion?.value || '').length > 150 ? '...' : ''}
                                 </Typography>
                                  {comp.reason && (
                                     <Box sx={{ mt: 0.5, p: 0.5, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: 1 }}>
                                       <Typography variant="caption" display="block" sx={{ fontStyle: 'italic', fontWeight: 500 }}>
                                         "{comp.reason}"
                                       </Typography>
                                     </Box>
                                  )}
                               </Box>
                             ))}
                           </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
                <Typography color="text.secondary">No promptfoo results found. Run `npx promptfoo eval` to generate.</Typography>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
