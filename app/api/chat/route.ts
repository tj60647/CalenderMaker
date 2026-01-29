/**
 * Chat API Route
 * 
 * Handles AI conversation via OpenRouter API with function calling.
 * The AI can call tools to check the calendar before making decisions.
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-08
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  searchCalendar, 
  getWeekNotes, 
  searchByKeyword, 
  getDateNotes 
} from '@/lib/tools/calendar-tools';
import { AGENT_CONFIG } from '@/lib/agent-config';
import { runAgent, ChatMessage } from '@/lib/chat-agent';

/**
 * Request body format
 */
interface ChatRequest {
  messages: ChatMessage[];
  userId: string;
  clientTime?: string;
}

/**
 * Execute a tool call
 * 
 * This function routes tool calls to the appropriate calendar tool.
 */
async function executeRealTool(toolName: string, args: Record<string, unknown>, userId: string): Promise<string> {
  try {
    switch (toolName) {
      case 'search_calendar':
        const searchResults = await searchCalendar(userId, args.startDate as string, args.endDate as string);
        return JSON.stringify({ notes: searchResults });

      case 'get_week_notes':
        const weekResults = await getWeekNotes(userId, args.dateInWeek as string);
        return JSON.stringify(weekResults);

      case 'search_by_keyword':
        const keywordResults = await searchByKeyword(userId, args.keyword as string);
        return JSON.stringify({ notes: keywordResults });

      case 'get_date_notes':
        const dateResults = await getDateNotes(userId, args.date as string);
        return JSON.stringify({ notes: dateResults });

      default:
        return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    }
  } catch (error) {
    console.error(`Tool execution error (${toolName}):`, error);
    return JSON.stringify({ 
      error: `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    });
  }
}

/**
 * POST /api/chat
 * 
 * Sends conversation to OpenRouter and returns AI response.
 * Uses Claude Sonnet 4.5 for intelligent calendar management.
 * Supports function calling for calendar queries.
 * 
 * @param request - HTTP request with messages array
 * @returns AI response message
 */
export async function POST(request: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`[${requestId}] Chat API request started`);
    
    const body: ChatRequest = await request.json();
    const { messages, userId, clientTime } = body;
    
    // Validate API key
    const apiKey = process.env.OPENROUTER_CALENDARMAKER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 500 }
      );
    }

    // System prompt setup
    const systemPrompt = AGENT_CONFIG.baseSystemPrompt.replace(
      'You are a helpful AI assistant for a calendar application called "TimeTwin".', 
      `You are a helpful AI assistant for a calendar application called "TimeTwin".\nCURRENT TIME FOR USER: ${clientTime || new Date().toISOString()} (Use this as "now" or "today")`
    );

    // Create a stream for real-time updates
    const encoder = new TextEncoder();
    
    // Create a TransformStream or just a ReadableStream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Run the agent with progress callback
          const result = await runAgent({
            messages,
            apiKey,
            model: AGENT_CONFIG.model,
            systemPrompt,
            requestId,
            toolExecutor: (name, args) => executeRealTool(name, args, userId),
            onProgress: (status) => {
              // Send status update
              const chunk = JSON.stringify({ type: 'status', content: status }) + '\n';
              controller.enqueue(encoder.encode(chunk));
            }
          });

          // Send final result
          const finalChunk = JSON.stringify({ 
            type: 'result', 
            content: result.message,
            toolCalls: result.toolCalls 
          }) + '\n';
          controller.enqueue(encoder.encode(finalChunk));
          
          controller.close();
        } catch (error) {
          console.error(`[${requestId}] Error in stream:`, error);
          const errorChunk = JSON.stringify({ 
            type: 'error', 
            error: error instanceof Error ? error.message : 'Unknown error' 
          }) + '\n';
          controller.enqueue(encoder.encode(errorChunk));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error(`[${requestId}] Error:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
