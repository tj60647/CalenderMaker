/**
 * Chat Interface Component
 * 
 * Conversational UI for interacting with AI to manage calendar notes.
 * Users can type natural language queries and the AI will:
 * - Add notes to dates
 * - Update existing notes
 * - Delete notes
 * - Answer questions about the calendar
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-08
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Box, Paper, TextField, Button, Typography, Avatar, CircularProgress, IconButton, Dialog, DialogTitle, DialogContent, Collapse } from '@mui/material';
import { Send, Settings, ChevronDown, ChevronRight, X, Activity } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { parseAIResponse, isValidAction } from '@/lib/ai-actions';
import { notesRepo } from '@/lib/repositories';
import { AGENT_CONFIG } from '@/lib/agent-config';

/**
 * Represents a single message in the chat
 */
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/**
 * Props for ChatInterface component
 */
interface ChatInterfaceProps {
  userId: string;
  onCalendarUpdate?: () => void;  // Called when AI makes calendar changes
}

/**
 * Chat interface for AI conversation
 * 
 * Displays message history and input field.
 * Sends user messages to OpenRouter API and displays responses.
 * 
 * @param props - Component props
 * @returns Chat interface
 */
export function ChatInterface({ userId, onCalendarUpdate }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I can help you manage your calendar. Try saying "Add a meeting on January 15th" or "What do I have next week?"',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showModelCard, setShowModelCard] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * Scroll to bottom of chat
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  /**
   * Send message to AI
   * 
   * POSTs the conversation history to /api/chat endpoint.
   * The API calls OpenRouter and returns the AI response.
   * 
   * @param userMessage - Message text from user
   */
  async function handleSendMessage(userMessage: string) {
    if (!userMessage.trim() || isLoading) return;

    const clientRequestId = `client_${Date.now()}`;
    console.log(`[${clientRequestId}] Sending chat request`, {
      messageCount: messages.length + 1,
      userMessage: userMessage.substring(0, 100)
    });

    // Add user message to chat
    const newUserMessage: ChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Get current client time with timezone
      const clientTime = new Date().toLocaleString([], { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: 'numeric', 
        minute: '2-digit',
        timeZoneName: 'short' 
      });

      // Best Practice: Send a "sliding window" of recent context (last 20 messages)
      // This preserves context for follow-up questions ("move that meeting") 
      // while preventing token limits and reducing cost.
      const HISTORY_LIMIT = 20;
      const conversationHistory = [...messages, { role: 'user', content: userMessage }]
        .slice(-HISTORY_LIMIT)
        .map(m => ({ 
          role: m.role, 
          content: m.content 
        }));

      // Call OpenRouter API via our backend
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: conversationHistory,
          userId,
          clientTime,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[${clientRequestId}] API Error:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      const data = await response.json();
      
      console.log(`[${clientRequestId}] Response received:`, {
        messageLength: data.message?.length || 0,
        hasActions: data.message?.includes('[ACTIONS]')
      });
      
      // Parse AI response for actions
      const { message: displayMessage, actions } = parseAIResponse(data.message);
      
      console.log(`[${clientRequestId}] Parsed response:`, {
        displayLength: displayMessage.length,
        actionCount: actions.length,
        actionTypes: actions.map(a => a.type)
      });
      
      const aiResponse: ChatMessage = {
        role: 'assistant',
        content: displayMessage,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);

      // Execute calendar actions
      let madeChanges = false;
      
      if (actions.length > 0) {
        console.log(`[${clientRequestId}] Executing ${actions.length} actions`);
      }
      
      for (const action of actions) {
        if (!isValidAction(action)) {
          console.warn(`[${clientRequestId}] Invalid action:`, action);
          continue;
        }
        
        console.log(`[${clientRequestId}] Executing action:`, {
          type: action.type,
          noteId: action.noteId,
          date: action.date
        });

        try {
          if (action.type === 'add' && action.date && action.notes) {
            await notesRepo.create({
              date: action.date,
              notes: action.notes,
              summary: action.summary,
              category: action.category,
              // Default to blue if no color provided
              color: action.color || '#3b82f6',
              time: action.time,
              duration: action.duration,
            }, userId);
            madeChanges = true;
          } else if (action.type === 'update' && action.noteId) {
            const updates: Record<string, unknown> = {};
            if (action.date) updates.date = action.date;
            if (action.notes) updates.notes = action.notes;
            if (action.summary) updates.summary = action.summary;
            if (action.category) updates.category = action.category;
            if (action.color) updates.color = action.color;
            if (action.time) updates.time = action.time;
            if (action.duration !== undefined) updates.duration = action.duration;
            
            await notesRepo.update(action.noteId, updates, userId);
            madeChanges = true;
          } else if (action.type === 'delete' && action.noteId) {
            await notesRepo.delete(action.noteId, userId);
            madeChanges = true;
          }
          console.log(`[${clientRequestId}] Action completed:`, action.type);
        } catch (error) {
          console.error(`[${clientRequestId}] Failed to execute action:`, action, error);
        }
      }

      // Notify parent if changes were made
      if (madeChanges && onCalendarUpdate) {
        console.log(`[${clientRequestId}] Calendar updated, notifying parent`);
        onCalendarUpdate();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[${clientRequestId}] Failed to send message:`, {
        name: error instanceof Error ? error.name : 'Unknown',
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Handle Enter key in input field
   */
  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage(input);
    }
  }

  return (
    <Paper
      elevation={2}
      sx={{
        height: '500px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Chat header */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box>
          <Typography variant="h6">AI Calendar Assistant</Typography>
          <Typography variant="caption" sx={{ display: 'block', opacity: 0.9 }}>
            Ask me to add notes, check your schedule, or answer questions
          </Typography>
        </Box>
        <IconButton size="small" onClick={() => setShowConfig(true)} sx={{ color: 'inherit' }}>
          <Settings size={20} />
        </IconButton>
      </Box>

      {/* Helper Dialog for Agent Info */}
      <Dialog open={showConfig} onClose={() => setShowConfig(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 2 }}>
          Agent Configuration
          <IconButton onClick={() => setShowConfig(false)} size="small" aria-label="close">
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2">Agent Name</Typography>
            <Button 
              component={Link} 
              href="/evals" 
              target="_blank"
              size="small"
              startIcon={<Activity size={16} />}
              sx={{ textTransform: 'none', color: 'text.secondary' }}
            >
              View Eval Suite
            </Button>
          </Box>
          <Typography variant="body2" paragraph sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
            {AGENT_CONFIG.name}
          </Typography>

          <Typography variant="subtitle2" gutterBottom>Active Model</Typography>
          <Typography variant="body2" paragraph sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
            {AGENT_CONFIG.model}
          </Typography>

          {AGENT_CONFIG.modelCard && (
            <Box sx={{ mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
              <Box 
                onClick={() => setShowModelCard(!showModelCard)}
                sx={{ 
                  p: 1.5, 
                  bgcolor: 'background.paper', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'grey.50' }
                }}
              >
                <Typography variant="subtitle2" color="primary">Model Card</Typography>
                {showModelCard ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </Box>
              
              <Collapse in={showModelCard}>
                <Box sx={{ p: 2, pt: 0, bgcolor: 'background.paper' }}>
                  <Typography variant="body2" paragraph sx={{ fontSize: '0.875rem' }}>
                    {AGENT_CONFIG.modelCard.description}
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">Context Window</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {AGENT_CONFIG.modelCard.contextWindow.toLocaleString()} tokens
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">Provider</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {AGENT_CONFIG.modelCard.provider}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">Input Cost</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {AGENT_CONFIG.modelCard.pricing.input}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">Output Cost</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {AGENT_CONFIG.modelCard.pricing.output}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Collapse>
            </Box>
          )}

          <Typography variant="subtitle2" gutterBottom>System Instructions</Typography>
          <Box sx={{ bgcolor: 'grey.900', color: 'common.white', p: 2, borderRadius: 1, maxHeight: 400, overflow: 'auto' }}>
            <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
              {AGENT_CONFIG.baseSystemPrompt}
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Message list */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {messages.map((message, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              gap: 1.5,
              alignItems: 'flex-start',
              flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
            }}
          >
            {/* Avatar */}
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: message.role === 'user' ? 'primary.main' : 'secondary.main',
                fontSize: '0.875rem',
              }}
            >
              {message.role === 'user' ? 'U' : 'AI'}
            </Avatar>

            {/* Message bubble */}
            <Box
              sx={{
                maxWidth: '70%',
                p: 1.5,
                borderRadius: 2,
                bgcolor: message.role === 'user' ? 'primary.light' : 'grey.100',
                color: message.role === 'user' ? 'primary.contrastText' : 'text.primary',
              }}
            >
              {message.role === 'assistant' ? (
                <Box
                  sx={{
                    '& p': { m: 0, mb: 1, '&:last-child': { mb: 0 } },
                    '& ul, & ol': { m: 0, pl: 2, mb: 1, '&:last-child': { mb: 0 } },
                    '& li': { mb: 0.5 },
                    '& code': {
                      bgcolor: 'grey.200',
                      px: 0.5,
                      py: 0.25,
                      borderRadius: 0.5,
                      fontSize: '0.875em',
                      fontFamily: 'monospace',
                    },
                    '& pre': {
                      bgcolor: 'grey.200',
                      p: 1,
                      borderRadius: 1,
                      overflow: 'auto',
                      '& code': { bgcolor: 'transparent', p: 0 },
                    },
                    '& strong': { fontWeight: 600 },
                    '& em': { fontStyle: 'italic' },
                  }}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                </Box>
              ) : (
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {message.content}
                </Typography>
              )}
              <Typography variant="caption" sx={{ opacity: 0.7, mt: 0.5, display: 'block' }}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Box>
          </Box>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: 'secondary.main', fontSize: '0.875rem' }}>
              AI
            </Avatar>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'grey.100',
              }}
            >
              <CircularProgress size={20} />
            </Box>
          </Box>
        )}
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input area */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          gap: 1,
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Type a message... (e.g., 'Add dentist appointment on Jan 15th')"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          multiline
          maxRows={3}
        />
        <Button
          variant="contained"
          onClick={() => handleSendMessage(input)}
          disabled={!input.trim() || isLoading}
          sx={{ minWidth: '44px', px: 1.5 }}
        >
          <Send size={20} />
        </Button>
      </Box>
    </Paper>
  );
}
