/**
 * Shared type definitions for offline data and sync operations
 */

export interface OfflineContact {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string | null;
    company?: string | null;
    job_title?: string | null;
    relationship_type?: string | null;
    is_favorite: boolean;
    updated_at: string;
}

export interface OfflineConversation {
    id: string;
    profile_id: string;
    title: string | null;
    last_message: string | null;
    last_message_at: string;
    unread_count: number;
    updated_at: string;
}

export interface OfflineAlert {
    id: string;
    profile_id: string;
    alert_type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    created_at: string;
    is_read: boolean;
}

export interface PendingMutation {
    id: string;
    type: 'create' | 'update' | 'delete';
    table: string;
    data: Record<string, unknown>;
    created_at: string;
    retry_count?: number;
    max_retries?: number;
    error_message?: string;
}

export interface SyncConflict {
    id: string;
    table: string;
    record_id: string;
    local_data: Record<string, unknown>;
    server_data: Record<string, unknown>;
    detected_at: string;
    resolved: boolean;
    resolution?: 'local' | 'server' | 'merged';
}

export interface SyncResult {
    succeeded: number;
    failed: number;
    conflicts: number;
}
