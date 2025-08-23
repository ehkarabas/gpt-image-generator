/**
 * Database Types with Soft Delete Support
 * All tables include deletedAt column for soft delete mechanism
 */

export interface BaseRecord {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null; // Soft delete timestamp
}

export interface Profile extends BaseRecord {
  email: string;
  display_name: string;
  avatar_url?: string | null;
  // Soft delete: When user deletes account, set deleted_at timestamp
}

export interface Conversation extends BaseRecord {
  user_id: string; // Foreign key to profiles
  title: string;
  message_count?: number;
  // Soft delete: When conversation is deleted, set deleted_at timestamp
  // Cascade: If user is soft deleted, their conversations remain but become inaccessible
}

export interface Message extends BaseRecord {
  conversation_id: string; // Foreign key to conversations  
  role: 'user' | 'assistant';
  content: string;
  metadata?: Record<string, unknown> | null;
  // Soft delete: When message is deleted, set deleted_at timestamp
  // Cascade: If conversation is soft deleted, messages become inaccessible
}

/**
 * Soft Delete Query Patterns
 * All queries must filter out soft-deleted records
 */
export type SoftDeleteFilter<T extends BaseRecord> = T & {
  deleted_at: null;
};

/**
 * API Response Types
 */
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Soft Delete Operations
 */
export interface SoftDeleteOperation {
  id: string;
  deleted_at: string;
  deleted_by?: string; // Optional: track who performed the deletion
}

export interface BulkSoftDeleteOperation {
  ids: string[];
  deleted_at: string;
  deleted_by?: string;
}

/**
 * Recovery Operations (for admin/support)
 */
export interface RecoveryOperation {
  id: string;
  recovered_at: string;
  recovered_by: string;
}