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

/**
 * Message format for chat
 */
interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

/**
 * Tool call from AI
 */
interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * Request body format
 */
interface ChatRequest {
  messages: ChatMessage[];
  userId: string;
}

/**
 * Tool definitions for OpenRouter
 * These tell the AI what tools are available and how to use them.
 */
const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'search_calendar',
      description: 'Search for calendar notes within a date range. Use this to check what events exist before adding/modifying/deleting notes.',
      parameters: {
        type: 'object',
        properties: {
          startDate: {
            type: 'string',
            description: 'Start date in ISO format (YYYY-MM-DD)',
          },
          endDate: {
            type: 'string',
            description: 'End date in ISO format (YYYY-MM-DD)',
          },
        },
        required: ['startDate', 'endDate'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_week_notes',
      description: 'Get all notes for a calendar week (Sunday-Saturday) containing the specified date. Use this when user mentions "week of" a date.',
      parameters: {
        type: 'object',
        properties: {
          dateInWeek: {
            type: 'string',
            description: 'Any date in the desired week (YYYY-MM-DD)',
          },
        },
        required: ['dateInWeek'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_by_keyword',
      description: 'Search notes by keyword (case-insensitive). Use this to find notes about specific topics.',
      parameters: {
        type: 'object',
        properties: {
          keyword: {
            type: 'string',
            description: 'Text to search for in notes',
          },
        },
        required: ['keyword'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_date_notes',
      description: 'Get all notes for a specific date. Use this to check what\'s scheduled on a particular day.',
      parameters: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            description: 'Date in ISO format (YYYY-MM-DD)',
          },
        },
        required: ['date'],
      },
    },
  },
];

/**
 * Execute a tool call
 * 
 * This function routes tool calls to the appropriate calendar tool.
 * 
 * @param toolName - Name of the tool to execute
 * @param args - Tool arguments (parsed JSON)
 * @param userId - ID of the user
 * @returns Tool result as JSON string
 */
async function executeTool(toolName: string, args: Record<string, unknown>, userId: string): Promise<string> {
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
    const { messages, userId } = body;
    
    console.log(`[${requestId}] Request body:`, {
      messageCount: messages?.length || 0,
      userId: userId || 'undefined',
      lastUserMessage: messages?.[messages.length - 1]?.content?.substring(0, 100)
    });

    // Validate API key
    const apiKey = process.env.OPENROUTER_CALENDARMAKER_API_KEY;
    console.log(`[${requestId}] Environment check:`, {
      hasKey: !!apiKey,
      keyLength: apiKey?.length || 0,
      keyPrefix: apiKey?.substring(0, 10) || 'none',
      allEnvKeys: Object.keys(process.env).filter(k => k.includes('OPENROUTER')).join(', ') || 'none'
    });
    
    if (!apiKey) {
      console.error(`[${requestId}] API key not configured in environment`);
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 500 }
      );
    }
    
    console.log(`[${requestId}] API key found, length: ${apiKey.length}`);

    // System prompt for calendar management with tool usage
    const systemPrompt: ChatMessage = {
      role: 'system',
      content: 'You are a helpful AI assistant for a calendar application. Help users:\\n' +
        '- Add notes to specific dates (format: YYYY-MM-DD)\\n' +
        '- Update existing calendar notes\\n' +
        '- Delete notes\\n' +
        '- Answer questions about their schedule\\n' +
        '- Organize and categorize events\\n\\n' +
        'IMPORTANT CONVERSATIONAL BEHAVIOR:\\n' +
        '- ALWAYS use tools to check the calendar before taking actions\\n' +
        '- If user mentions "week of [date]", use get_week_notes to understand Sun-Sat range\\n' +
        '- If user wants to cancel/modify classes, check existing schedule first\\n' +
        '- Ask clarifying questions if the user\'s intent is ambiguous\\n' +
        '- Be proactive: "I see you have Physics on Mon/Wed/Fri that week. Should I cancel all three?"\\n\\n' +
        'AVAILABLE TOOLS:\\n' +
        '- search_calendar: Check date range for existing notes\\n' +
        '- get_week_notes: Get Sun-Sat week containing a date\\n' +
        '- search_by_keyword: Find notes about specific topics\\n' +
        '- get_date_notes: Check what\'s on a specific date\\n\\n' +
        'RESPONSE FORMAT:\\n' +
        'You must respond with valid JSON in this exact structure:\\n' +
        '{\\n' +
        '  "message": "Your friendly response with **Markdown** formatting",\\n' +
        '  "actions": [\\n' +
        '    {"type":"add","date":"YYYY-MM-DD","notes":"text","category":"optional","time":"HH:MM","duration":60}\\n' +
        '  ]\\n' +
        '}\\n\\n' +
        'Action types:\\n' +
        '- "add": Create new note (requires date, notes). Optional: category, time, duration (in minutes), color\\n' +
        '- "update": Modify note (requires noteId, plus fields to change)\\n' +
        '- "delete": Remove note (requires noteId)\\n\\n' +
        'Duration examples: 30 (half hour), 60 (1 hour), 90 (1.5 hours), 120 (2 hours), 180 (3 hours)\\n\\n' +
        'If no calendar actions are needed, use an empty actions array: "actions": []\\n\\n' +
        'EXAMPLES:\\n' +
        'User: "Add dentist on Jan 15 at 2pm"\\n' +
        'You (after checking calendar): {"message":"I will add that **dentist appointment** for you!","actions":[{"type":"add","date":"2026-01-15","notes":"Dentist appointment","time":"14:00","duration":60}]}\\n\\n' +
        'User: "No class week of March 24"\\n' +
        'You: Call get_week_notes("2026-03-24"), see recurring classes, then ask:\\n' +
        '{"message":"I see you have **Physics Lab** on Mon/Wed/Fri that week (3/24, 3/26, 3/28). Should I cancel all three classes?","actions":[]}\\n\\n' +
        `Current date: ${new Date().toISOString().split('T')[0]}\\n` +
        `User ID: ${userId}\\n\\n` +
        'Keep responses concise and friendly. The message supports Markdown formatting.',
    };

    // Combine system prompt with conversation
    const fullMessages = [systemPrompt, ...messages];
    
    console.log(`[${requestId}] Calling OpenRouter API with ${fullMessages.length} messages`);

    // Function calling loop
    // Allow up to 5 iterations to prevent infinite loops
    const MAX_LOOPS = 5;
    let loopCount = 0;
    const currentMessages = fullMessages;
    
    while (loopCount < MAX_LOOPS) {
      loopCount++;
      console.log(`[${requestId}] Function calling loop iteration ${loopCount}/${MAX_LOOPS}`);

      // Call OpenRouter API
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
          'X-Title': 'AI Calendar Generator',
        },
        body: JSON.stringify({
          model: 'openai/gpt-5.2-20251211',
          messages: currentMessages,
          temperature: 0,
          response_format: { type: 'json_object' },
          tools: TOOL_DEFINITIONS,
          tool_choice: 'auto', // Let AI decide when to use tools
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[${requestId}] OpenRouter API error:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        return NextResponse.json(
          { error: 'Failed to get AI response', details: errorData },
          { status: response.status }
        );
      }

      const data = await response.json();
      
      console.log(`[${requestId}] ===== RAW OPENROUTER RESPONSE (Loop ${loopCount}) =====`);
      console.log(JSON.stringify(data, null, 2));
      console.log(`[${requestId}] ===== END RAW RESPONSE =====`);

      const assistantMessage = data?.choices?.[0]?.message;

      if (!assistantMessage) {
        console.error(`[${requestId}] No message in response:`, data);
        return NextResponse.json(
          { error: 'No response from AI' },
          { status: 500 }
        );
      }

      // Check if AI wants to call tools
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        console.log(`[${requestId}] AI requested ${assistantMessage.tool_calls.length} tool calls`);
        
        // Add assistant's message to conversation (with tool calls)
        currentMessages.push({
          role: 'assistant',
          content: assistantMessage.content || '',
          tool_calls: assistantMessage.tool_calls,
        });

        // Execute each tool call
        for (const toolCall of assistantMessage.tool_calls) {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);
          
          console.log(`[${requestId}] Executing tool: ${toolName}`, toolArgs);
          
          const toolResult = await executeTool(toolName, toolArgs, userId);
          
          console.log(`[${requestId}] Tool result:`, toolResult);

          // Add tool result to conversation
          currentMessages.push({
            role: 'tool',
            content: toolResult,
            tool_call_id: toolCall.id,
          });
        }

        // Continue loop to get AI's response after seeing tool results
        continue;
      }

      // No tool calls - AI has final response
      const finalContent = assistantMessage.content;
      
      if (!finalContent) {
        console.error(`[${requestId}] No content in final message:`, assistantMessage);
        return NextResponse.json(
          { error: 'No response from AI' },
          { status: 500 }
        );
      }
      
      console.log(`[${requestId}] ===== AI MESSAGE CONTENT =====`);
      console.log(finalContent);
      console.log(`[${requestId}] ===== END MESSAGE CONTENT =====`);
      console.log(`[${requestId}] Success - returning message (${finalContent.length} chars)`);

      return NextResponse.json({
        message: finalContent,
        model: data.model,
      });
    }

    // If we hit max loops, return error
    console.error(`[${requestId}] Hit max function calling loops (${MAX_LOOPS})`);
    return NextResponse.json(
      { error: 'Too many tool calls - please try rephrasing your question' },
      { status: 500 }
    );
  } catch (error) {
    console.error(`[${requestId}] Chat API error:`, {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
