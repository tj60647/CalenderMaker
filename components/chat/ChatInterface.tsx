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
import { Box, Paper, TextField, Button, Typography, Avatar, CircularProgress, IconButton, Dialog, DialogTitle, DialogContent, Collapse, Switch, FormControlLabel, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import { Send, Settings, ChevronDown, ChevronRight, X, Activity, Paperclip, Mic, Volume2, Square } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { usePdfParser } from '@/lib/hooks/use-pdf-parser';
import { useSpeech } from '@/lib/hooks/use-speech';
import { parseAIResponse, isValidAction } from '@/lib/ai-actions';
import { notesRepo } from '@/lib/repositories';
import { AGENT_CONFIG } from '@/lib/agent-config';

interface FileAttachment {
  name: string;
  type: string;
  size: number;
  content: string; // Extracted text
}

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
  const [loadingStatus, setLoadingStatus] = useState<string>(''); // Detailed status
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [showModelCard, setShowModelCard] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false); // New state for auto-read
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastSpokenTimestampRef = useRef<number>(0); 

  const { parsePdf, isParsing: isPdfParsing, error: pdfError } = usePdfParser();
  const { 
    isListening, 
    transcript, 
    startListening, 
    stopListening, 
    speak, 
    isSpeaking, 
    cancelSpeech, 
    hasSupport: hasSpeechSupport,
    setTranscript,
    voices,
    selectedVoice,
    setVoiceByName
  } = useSpeech();

  // State to hold the input text before listening started
  const [baseInput, setBaseInput] = useState('');

  // When listening starts, capture the current input so we can append to it
  useEffect(() => {
    if (isListening) {
      setBaseInput(input);
    }
  }, [isListening]);

  // Sync speech transcript with input (appending to base text)
  useEffect(() => {
    // Only update if we are listening and have something to show
    // Or if we just finished (transcript might still be there) - primarily rely on isListening for the active update cycle
    if (isListening && transcript) {
        const separator = baseInput && !baseInput.endsWith(' ') ? ' ' : '';
        setInput(baseInput + separator + transcript);
    }
  }, [transcript, isListening, baseInput]);

  // Handle auto-speak for new assistant messages
  useEffect(() => {
    if (autoSpeak && messages.length > 0 && !isLoading) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
         const msgTime = lastMessage.timestamp.getTime();
         if (msgTime > lastSpokenTimestampRef.current) {
            // Only speak recent messages (within 10s)
            if (Date.now() - msgTime < 10000) {
                speak(lastMessage.content);
            }
            lastSpokenTimestampRef.current = msgTime;
         }
      }
    }
  }, [messages, autoSpeak, isLoading, speak]);

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
  /**
   * Handle file selection
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        alert('Currently only PDF files are supported.');
        return;
      }
      setSelectedFile(file);
    }
  };

  /**
   * Clear selected file
   */
  const handleClearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Send message to AI
   * 
   * POSTs the conversation history to /api/chat endpoint.
   * The API calls OpenRouter and returns the AI response.
   * 
   * @param userMessage - Message text from user
   */
  async function handleSendMessage(userMessage: string) {
    if ((!userMessage.trim() && !selectedFile) || isLoading) return;

    const clientRequestId = `client_${Date.now()}`;
    
    // Add user message to chat immediately
    let displayContent = userMessage;
    if (selectedFile) {
        displayContent += `\n\n[Attached File: ${selectedFile.name}]`;
    }

    const newUserMessage: ChatMessage = {
      role: 'user',
      content: displayContent,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newUserMessage]);
    
    setInput('');
    setIsLoading(true);
    setLoadingStatus('Initializing...');

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

      let finalMessage = userMessage;

      // Step 1: Process File if exists
      if (selectedFile) {
        setLoadingStatus(`Reading ${selectedFile.name}...`);
        
        // Use client-side PDF parser
        const text = await parsePdf(selectedFile);
        
        if (!text) {
           throw new Error(pdfError || 'Failed to read file content');
        }

        // Append file content to the user message as context
        finalMessage = `${userMessage}\n\n--- DOCUMENT CONTENT (${selectedFile.name}) ---\n${text}\n--- END DOCUMENT ---`;
        
        // Clear file after successful read
        handleClearFile();
      }

      // Step 2: Send to Chat Agent
      setLoadingStatus('AI is thinking...');

      // Best Practice: Send a "sliding window" of recent context (last 20 messages)
      const HISTORY_LIMIT = 20;
      // We need to inject the potentially modified finalMessage into the history
      // The last message in 'messages' state has the display version (with [Attached File...])
      // But for the user context sent to AI, we must send the full text
      
      const conversationHistory = [...messages, { role: 'user', content: finalMessage }]
        .slice(-HISTORY_LIMIT)
        .map(m => ({ 
          role: m.role, 
          content: m.content 
        }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationHistory,
          userId,
          clientTime,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      // Handle streamed response (NDJSON)
      if (!response.body) throw new Error('No response body');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let aiContent = '';
      let aiActions: any[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Process complete lines
        buffer = lines.pop() || ''; // Keep the last incomplete line in buffer
        
        for (const line of lines) {
          if (!line.trim()) continue;
          
          try {
            const data = JSON.parse(line);
            
            if (data.type === 'status') {
               setLoadingStatus(data.content);
            } else if (data.type === 'result') {
               aiContent = data.content || ''; // Fallback for safety
               // We don't use 'toolCalls' from result yet, as we parse actions from message text
            } else if (data.type === 'error') {
               throw new Error(data.error);
            }
          } catch (e) {
            console.error('Error parsing stream chunk:', e);
          }
        }
      }

      // Final processing of the accumulator
      if (!aiContent) throw new Error('No content received from AI');
      
      // Step 3: Handle Response
      setLoadingStatus('Updating calendar...');

      // Parse AI response for actions
      const { message: displayMessage, actions } = parseAIResponse(aiContent);
      
      const aiResponse: ChatMessage = {
        role: 'assistant',
        content: displayMessage,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);

      // Execute calendar actions
      let madeChanges = false;
      
      for (const action of actions) {
        if (!isValidAction(action)) continue;
        
        console.log(`[${clientRequestId}] Executing action:`, action.type);

        try {
          if (action.type === 'add' && action.date && action.notes) {
            await notesRepo.create({
              date: action.date,
              notes: action.notes,
              summary: action.summary,
              category: action.category,
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
        } catch (error) {
          console.error(`[${clientRequestId}] Failed to execute action:`, action, error);
        }
      }

      if (madeChanges && onCalendarUpdate) {
        onCalendarUpdate();
      }

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: errorMessage.includes('Failed to read file') 
          ? `I couldn't read that file. ${errorMessage}`
          : 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
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

          {hasSpeechSupport && (
             <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle2">Voice Output</Typography>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={autoSpeak}
                        onChange={(e) => setAutoSpeak(e.target.checked)}
                        size="small"
                      />
                    }
                    label="Auto-read responses"
                  />
                </Box>
                
                <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                  <InputLabel id="voice-select-label">Preferred Voice</InputLabel>
                  <Select
                    labelId="voice-select-label"
                    value={selectedVoice?.name || ''}
                    label="Preferred Voice"
                    onChange={(e) => setVoiceByName(e.target.value)}
                  >
                    {voices.map((voice) => (
                      <MenuItem key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
             </Box>
          )}

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
              <Typography variant="caption" sx={{ opacity: 0.7, mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                
                {/* Text-to-Speech Button (Only for Assistant) */}
                {message.role === 'assistant' && hasSpeechSupport && (
                  <IconButton 
                    size="small" 
                    onClick={() => speak(message.content)}
                    sx={{ width: 20, height: 20, ml: 1, opacity: 0.6 }}
                    title="Read aloud"
                  >
                    <Volume2 size={14} />
                  </IconButton>
                )}
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
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <CircularProgress size={16} />
              <Typography variant="body2" color="text.secondary">
                 {loadingStatus || 'Thinking...'}
              </Typography>
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
          flexDirection: 'column',
          gap: 1
        }}
      >
        {selectedFile && (
           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 0.5, bgcolor: 'grey.100', borderRadius: 1, width: 'fit-content' }}>
              <Typography variant="caption" noWrap sx={{ maxWidth: 200 }}>
                 {selectedFile.name}
              </Typography>
              <IconButton size="small" onClick={handleClearFile}>
                 <X size={14} />
              </IconButton>
           </Box>
        )}
        <Box sx={{ display: 'flex', gap: 1 }}>
           <input
             type="file"
             ref={fileInputRef}
             style={{ display: 'none' }}
             accept=".pdf"
             onChange={handleFileSelect}
           />
           <IconButton 
             onClick={() => fileInputRef.current?.click()}
             disabled={isLoading}
             color={selectedFile ? "primary" : "default"}
             title="Attach PDF"
           >
             <Paperclip size={20} />
           </IconButton>

           {/* Voice Input Button */}
           {hasSpeechSupport && (
             <IconButton
               onMouseDown={startListening}
               onMouseUp={stopListening}
               onMouseLeave={stopListening} // Handle dragging out
               disabled={isLoading}
               color={isListening ? "secondary" : "default"}
               sx={{ 
                 position: 'relative',
                 bgcolor: isListening ? 'action.hover' : 'transparent',
                 animation: isListening ? 'pulse 1.5s infinite' : 'none',
                 '@keyframes pulse': {
                   '0%': { boxShadow: '0 0 0 0 rgba(255, 0, 0, 0.4)' },
                   '70%': { boxShadow: '0 0 0 10px rgba(255, 0, 0, 0)' },
                   '100%': { boxShadow: '0 0 0 0 rgba(255, 0, 0, 0)' }
                 }
               }}
               title="Hold to Speak"
             >
               {isListening ? <Square size={20} fill="currentColor" /> : <Mic size={20} />}
             </IconButton>
           )}

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
              disabled={(!input.trim() && !selectedFile) || isLoading}
              sx={{ minWidth: '44px', px: 1.5 }}
            >
              <Send size={20} />
            </Button>
        </Box>
      </Box>
    </Paper>
  );
}
