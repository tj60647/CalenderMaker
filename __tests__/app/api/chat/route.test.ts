/**
 * Chat API Route Tests
 * 
 * Tests the OpenRouter API integration including request handling,
 * response parsing, and error scenarios. Uses mocked API calls for
 * speed and reliability.
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-08
 */

import { POST } from '@/app/api/chat/route';
import type { NextRequest } from 'next/server';

// Mock fetch globally
global.fetch = jest.fn();

/**
 * Create a mock NextRequest for testing
 * 
 * NextRequest is hard to instantiate in tests, so we create a mock
 * object that has the methods our route handler uses.
 */
function createMockRequest(body: Record<string, unknown>): Request {
  return {
    json: async () => body,
    headers: new Map(),
    url: 'http://localhost:3000/api/chat',
    method: 'POST'
  } as unknown as Request;
}

describe('Chat API Route', () => {
  const originalEnv = process.env.OPENROUTER_CALENDARMAKER_API_KEY;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Set up default environment variable
    process.env.OPENROUTER_CALENDARMAKER_API_KEY = 'test-api-key-12345';
  });

  afterEach(() => {
    // Restore original environment
    if (originalEnv) {
      process.env.OPENROUTER_CALENDARMAKER_API_KEY = originalEnv;
    } else {
      delete process.env.OPENROUTER_CALENDARMAKER_API_KEY;
    }
  });

  describe('POST /api/chat', () => {
    /**
     * Test successful API call with valid response
     * 
     * This tests the happy path where OpenRouter returns a valid
     * chat completion with actions in the expected format.
     */
    it('returns AI response for valid request', async () => {
      // Mock successful OpenRouter response with JSON format
      const mockResponse = {
        id: 'gen-123',
        model: 'openai/gpt-5.2-20251211',
        choices: [
          {
            message: {
              role: 'assistant',
              content: JSON.stringify({
                message: 'I can help with that!',
                actions: [{"type":"add","date":"2026-01-15","notes":"Team meeting"}]
              })
            }
          }
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // Create mock request with messages
      const request = createMockRequest({
        messages: [
          { role: 'user', content: 'Add a team meeting on January 15th' }
        ]
      });

      // Call the API
      const response = await POST(request as unknown as NextRequest);
      const data = await response.json();

      // Verify response
      expect(response.status).toBe(200);
      expect(data.message).toContain('I can help with that!');
      
      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key-12345',
            'Content-Type': 'application/json'
          })
        })
      );
    });

    /**
     * Test request validation
     * 
     * The API should reject requests without a messages array.
     */
    it('returns 500 for missing messages', async () => {
      const request = createMockRequest({});

      const response = await POST(request as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    /**
     * Test API key validation
     * 
     * The API should fail gracefully when API key is missing.
     */
    it('returns 500 when API key is missing', async () => {
      delete process.env.OPENROUTER_CALENDARMAKER_API_KEY;

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }]
      });

      const response = await POST(request as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('OpenRouter API key not configured');
    });

    /**
     * Test OpenRouter API error handling
     * 
     * When OpenRouter returns an error, we should return a
     * user-friendly message and appropriate status code.
     */
    it('handles OpenRouter API errors', async () => {
      // Ensure API key is set for this test
      process.env.OPENROUTER_CALENDARMAKER_API_KEY = 'test-api-key-12345';
      
      // Mock failed OpenRouter response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({ error: 'Rate limit exceeded' })
      });

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }]
      });

      const response = await POST(request as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe('Failed to get AI response');
    });

    /**
     * Test network error handling
     * 
     * If fetch throws an error (network failure, timeout, etc.),
     * we should catch it and return a user-friendly error.
     */
    it('handles network errors', async () => {
      // Ensure API key is set for this test
      process.env.OPENROUTER_CALENDARMAKER_API_KEY = 'test-api-key-12345';
      
      // Mock network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error: ECONNREFUSED')
      );

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }]
      });

      const response = await POST(request as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    /**
     * Test system prompt injection
     * 
     * Verify that the API adds the system prompt with calendar
     * instructions before sending to OpenRouter.
     */
    it('includes system prompt in API call', async () => {
      const mockResponse = {
        choices: [{ message: { role: 'assistant', content: JSON.stringify({message: 'Hello!', actions: []}) } }]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hi' }]
      });

      await POST(request as unknown as NextRequest);

      // Get the fetch call arguments
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      // Verify system prompt is first message
      expect(requestBody.messages[0].role).toBe('system');
      expect(requestBody.messages[0].content).toContain('calendar application');
      expect(requestBody.messages[0].content).toContain('JSON');
      
      // Verify user message is included
      expect(requestBody.messages[1].role).toBe('user');
      expect(requestBody.messages[1].content).toBe('Hi');
    });

    /**
     * Test model configuration
     * 
     * Verify correct model and parameters are sent to OpenRouter.
     */
    it('uses correct model and parameters', async () => {
      const mockResponse = {
        choices: [{ message: { role: 'assistant', content: JSON.stringify({message: 'Test', actions: []}) } }]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Test' }]
      });

      await POST(request as unknown as NextRequest);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.model).toBe('openai/gpt-5.2-20251211');
      expect(requestBody.temperature).toBe(0);
      expect(requestBody.response_format).toEqual({ type: 'json_object' });
      expect(requestBody.max_tokens).toBeUndefined();
    });

    /**
     * Test response with multiple actions
     * 
     * AI can return multiple calendar actions in one response.
     */
    it('handles responses with multiple actions', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: JSON.stringify({
                message: 'Added both events!',
                actions: [
                  {"type":"add","date":"2026-01-10","notes":"Meeting"},
                  {"type":"add","date":"2026-01-12","notes":"Review"}
                ]
              })
            }
          }
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Add two meetings' }]
      });

      const response = await POST(request as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('Added both events!');
    });

    /**
     * Test empty response handling
     * 
     * If OpenRouter returns empty choices, handle gracefully.
     */
    it('handles empty response from OpenRouter', async () => {
      const mockResponse = {
        choices: []
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }]
      });

      const response = await POST(request as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('No response from AI');
    });

    /**
     * Test missing choices property
     * 
     * If OpenRouter response doesn't have choices property at all.
     */
    it('handles missing choices property', async () => {
      const mockResponse = {
        id: 'gen-456',
        model: 'openai/gpt-5.2-20251211'
        // No choices property
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }]
      });

      const response = await POST(request as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('No response from AI');
    });

    /**
     * Test null message in response
     * 
     * If choices[0].message is null or undefined.
     */
    it('handles null message in response', async () => {
      const mockResponse = {
        choices: [
          {
            message: null
          }
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }]
      });

      const response = await POST(request as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('No response from AI');
    });

    /**
     * Test null content in message
     * 
     * If message.content is null or undefined.
     */
    it('handles null content in message', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: null
            }
          }
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }]
      });

      const response = await POST(request as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('No response from AI');
    });

    /**
     * Test empty string content
     * 
     * If message.content is an empty string.
     */
    it('handles empty string content', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: ''
            }
          }
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }]
      });

      const response = await POST(request as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('No response from AI');
    });

    /**
     * Test multiple choices (uses first)
     * 
     * If OpenRouter returns multiple choices, we only use the first one.
     * This documents expected behavior.
     */
    it('uses first choice when multiple choices returned', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'First response'
            }
          },
          {
            message: {
              role: 'assistant',
              content: 'Second response'
            }
          }
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }]
      });

      const response = await POST(request as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('First response');
    });

    /**
     * Test malformed JSON response
     * 
     * If OpenRouter returns invalid JSON structure.
     */
    it('handles completely malformed response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => null
      });

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }]
      });

      const response = await POST(request as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('No response from AI');
    });
  });
});
