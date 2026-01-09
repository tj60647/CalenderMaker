/**
 * TypeScript Type Definitions
 * 
 * Central location for all TypeScript interfaces and types used throughout
 * the application. These match the Supabase schema for easy migration.
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-08
 */

/**
 * Represents a single calendar note/event
 * 
 * This structure matches the Supabase calendar_notes table exactly,
 * enabling seamless migration from localStorage to Supabase.
 */
export interface CalendarNote {
  /** UUID primary key */
  id: string;
  
  /** User who owns this note (matches auth.users.id) */
  user_id: string;
  
  /** Date in ISO format: "2025-11-16" */
  date: string;
  
  /** Note content/description */
  notes: string;
  
  /** Optional custom color (hex format: "#ff0000") */
  color?: string;
  
  /** Optional category for grouping (user-defined string) */
  category?: string;
  
  /** Optional time in 24h format: "14:00" */
  time?: string;
  
  /** Optional duration in minutes (e.g., 60 for 1 hour, 90 for 1.5 hours) */
  duration?: number;
  
  /** When this note was created (ISO timestamp) */
  created_at: string;
  
  /** When this note was last updated (ISO timestamp) */
  updated_at: string;
}

/**
 * Color scheme configuration for calendar display
 * 
 * Allows users to customize how different date types are colored.
 */
export interface ColorScheme {
  /** Default color for dates with notes (if no category/custom color) */
  default: string;
  
  /** Color for weekend dates */
  weekend: string;
  
  /** Color for first month in range */
  month1: string;
  
  /** Color for second month in range */
  month2: string;
  
  /** Color for dates outside the selected range */
  outOfRange: string;
  
  /** Custom colors for specific dates (ISO date -> hex color) */
  specialDates: Record<string, string>;
  
  /** Colors for note categories (category name -> hex color) */
  categories: Record<string, string>;
}

/**
 * User's calendar configuration and preferences
 * 
 * Stores the date range, title, and customization for a user's calendar.
 */
export interface CalendarConfig {
  /** UUID primary key */
  id: string;
  
  /** User who owns this config */
  user_id: string;
  
  /** First date to display (ISO format) */
  start_date: string;
  
  /** Last date to display (ISO format) */
  end_date: string;
  
  /** Calendar title */
  title: string;
  
  /** Color scheme for calendar (stored as JSON in Supabase) */
  color_scheme: ColorScheme;
  
  /** Selected OpenRouter model ID */
  selected_model: string;
  
  /** When this config was created */
  created_at: string;
  
  /** When this config was last updated */
  updated_at: string;
}

/**
 * Chat message in the AI conversation
 */
export interface ChatMessage {
  /** Unique message ID */
  id: string;
  
  /** Message role: user or AI assistant */
  role: 'user' | 'assistant';
  
  /** Message content */
  content: string;
  
  /** When message was sent */
  timestamp: string;
}

/**
 * Result of an operation
 * 
 * Provides consistent error handling across the application.
 * 
 * @template T The type of data returned on success
 */
export interface OperationResult<T = void> {
  /** Whether the operation succeeded */
  success: boolean;
  
  /** Data returned on success */
  data?: T;
  
  /** Error message on failure */
  error?: string;
}

/**
 * OpenRouter AI model information
 */
export interface AIModel {
  /** Model ID used in API calls */
  id: string;
  
  /** Human-readable model name */
  name: string;
  
  /** Model description */
  description: string;
  
  /** Pricing per million tokens */
  pricing: {
    prompt: number;
    completion: number;
  };
  
  /** Maximum context window size */
  contextLength: number;
}

/**
 * Export options for calendar download
 */
export interface ExportOptions {
  /** Export format */
  format: 'svg' | 'png';
  
  /** Whether to include notes in export */
  includeNotes: boolean;
  
  /** PNG resolution multiplier (1x, 2x, 3x) */
  resolution?: number;
  
  /** Custom dimensions (overrides default) */
  width?: number;
  height?: number;
}
