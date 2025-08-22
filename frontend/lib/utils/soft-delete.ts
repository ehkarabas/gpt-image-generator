import { BaseRecord, SoftDeleteFilter } from "@/lib/types/database";

/**
 * Soft Delete Utilities
 * Provides helper functions for implementing soft delete pattern
 */

/**
 * Check if a record is soft deleted
 */
export function isSoftDeleted<T extends BaseRecord>(record: T): boolean {
  return record.deleted_at !== null && record.deleted_at !== undefined;
}

/**
 * Filter out soft deleted records from an array
 */
export function filterActive<T extends BaseRecord>(records: T[]): SoftDeleteFilter<T>[] {
  return records.filter(record => !isSoftDeleted(record)) as SoftDeleteFilter<T>[];
}

/**
 * Get only soft deleted records from an array
 */
export function filterDeleted<T extends BaseRecord>(records: T[]): T[] {
  return records.filter(record => isSoftDeleted(record));
}

/**
 * Create soft delete timestamp
 */
export function createSoftDeleteTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Soft delete a single record (returns updated record)
 */
export function applySoftDelete<T extends BaseRecord>(record: T): T {
  return {
    ...record,
    deleted_at: createSoftDeleteTimestamp(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Soft delete multiple records
 */
export function applySoftDeleteBulk<T extends BaseRecord>(records: T[]): T[] {
  const timestamp = createSoftDeleteTimestamp();
  const updatedAt = new Date().toISOString();
  
  return records.map(record => ({
    ...record,
    deleted_at: timestamp,
    updated_at: updatedAt,
  }));
}

/**
 * Restore a soft deleted record (removes deleted_at timestamp)
 */
export function restoreSoftDeleted<T extends BaseRecord>(record: T): SoftDeleteFilter<T> {
  const { deleted_at, ...restoredRecord } = record;
  return {
    ...restoredRecord,
    deleted_at: null,
    updated_at: new Date().toISOString(),
  } as SoftDeleteFilter<T>;
}

/**
 * Generate SQL WHERE clause for filtering active records
 * Use this in your database queries
 */
export function getActiveRecordFilter(tableName = ''): string {
  const prefix = tableName ? `${tableName}.` : '';
  return `${prefix}deleted_at IS NULL`;
}

/**
 * Generate SQL WHERE clause for filtering deleted records
 * Use this for admin/recovery queries
 */
export function getDeletedRecordFilter(tableName = ''): string {
  const prefix = tableName ? `${tableName}.` : '';
  return `${prefix}deleted_at IS NOT NULL`;
}

/**
 * Generate SQL for soft delete operation
 */
export function generateSoftDeleteSQL(
  tableName: string, 
  idColumn = 'id', 
  whereClause = ''
): string {
  const timestamp = createSoftDeleteTimestamp();
  const baseSQL = `UPDATE ${tableName} SET deleted_at = '${timestamp}', updated_at = '${timestamp}'`;
  
  if (whereClause) {
    return `${baseSQL} WHERE ${whereClause}`;
  }
  
  return `${baseSQL} WHERE ${idColumn} = $1`;
}

/**
 * Example Query Patterns (for documentation)
 */
export const QUERY_EXAMPLES = {
  // Get all active conversations for a user
  activeConversations: `
    SELECT * FROM conversations 
    WHERE user_id = $1 AND deleted_at IS NULL 
    ORDER BY updated_at DESC
  `,
  
  // Get all active messages for a conversation
  activeMessages: `
    SELECT m.* FROM messages m
    JOIN conversations c ON m.conversation_id = c.id
    WHERE c.id = $1 
      AND m.deleted_at IS NULL 
      AND c.deleted_at IS NULL
    ORDER BY m.created_at ASC
  `,
  
  // Soft delete a conversation (cascades accessibility, not actual deletion)
  softDeleteConversation: `
    UPDATE conversations 
    SET deleted_at = NOW(), updated_at = NOW() 
    WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
  `,
  
  // Soft delete user account (makes all data inaccessible)
  softDeleteUser: `
    UPDATE profiles 
    SET deleted_at = NOW(), updated_at = NOW() 
    WHERE id = $1 AND deleted_at IS NULL
  `,
  
  // Count active vs deleted records (for admin dashboard)
  recordStats: `
    SELECT 
      COUNT(*) FILTER (WHERE deleted_at IS NULL) as active_count,
      COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as deleted_count,
      COUNT(*) as total_count
    FROM profiles
  `,
};