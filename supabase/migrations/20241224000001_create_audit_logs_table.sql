-- Migration: Create audit_logs table
-- Description: Creates a comprehensive audit trail table for tracking all critical operations
-- Date: 2024-12-24
-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE
    SET NULL,
        user_email TEXT,
        action TEXT NOT NULL,
        resource TEXT NOT NULL,
        resource_id TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        old_values JSONB,
        new_values JSONB,
        metadata JSONB,
        ip_address INET,
        user_agent TEXT,
        unidade_id UUID REFERENCES unidades(id) ON DELETE
    SET NULL,
        timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        success BOOLEAN DEFAULT true NOT NULL,
        error_message TEXT,
        -- Indexes for performance
        CONSTRAINT audit_logs_action_check CHECK (
            action IN (
                'META_CREATED',
                'META_UPDATED',
                'META_DELETED',
                'META_ACTIVATED',
                'META_DEACTIVATED',
                'APPOINTMENT_CREATED',
                'APPOINTMENT_UPDATED',
                'APPOINTMENT_CANCELLED',
                'APPOINTMENT_CONFIRMED',
                'APPOINTMENT_STARTED',
                'APPOINTMENT_FINISHED',
                'CLIENT_CREATED',
                'CLIENT_UPDATED',
                'CLIENT_DEACTIVATED',
                'CLIENT_REACTIVATED',
                'PAYMENT_CREATED',
                'PAYMENT_PROCESSED',
                'PAYMENT_REFUNDED',
                'QUEUE_ITEM_ADDED',
                'QUEUE_ITEM_REMOVED',
                'QUEUE_ITEM_PROCESSED',
                'USER_LOGIN',
                'USER_LOGOUT',
                'USER_PASSWORD_CHANGED',
                'USER_PROFILE_UPDATED',
                'SYSTEM_CONFIG_CHANGED',
                'BACKUP_CREATED',
                'MAINTENANCE_MODE_TOGGLED',
                'UNAUTHORIZED_ACCESS'
            )
        ),
        CONSTRAINT audit_logs_resource_check CHECK (
            resource IN (
                'META',
                'APPOINTMENT',
                'CLIENT',
                'PAYMENT',
                'QUEUE_ITEM',
                'USER',
                'SYSTEM'
            )
        )
);
-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_unidade_id ON audit_logs(unidade_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON audit_logs(success);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON audit_logs(user_email);
-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_timestamp ON audit_logs(resource, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_unidade_timestamp ON audit_logs(unidade_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_timestamp ON audit_logs(action, timestamp DESC);
-- Create GIN indexes for JSON fields
CREATE INDEX IF NOT EXISTS idx_audit_logs_old_values_gin ON audit_logs USING GIN (old_values);
CREATE INDEX IF NOT EXISTS idx_audit_logs_new_values_gin ON audit_logs USING GIN (new_values);
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata_gin ON audit_logs USING GIN (metadata);
-- Enable Row Level Security (RLS)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
-- Create RLS policies
-- Users can only see audit logs from their own unidade
CREATE POLICY "Users can view audit logs from their unidade" ON audit_logs FOR
SELECT USING (
        unidade_id IN (
            SELECT unidade_id
            FROM user_unidades
            WHERE user_id = auth.uid()
        )
    );
-- Only system admins can insert audit logs
CREATE POLICY "System can insert audit logs" ON audit_logs FOR
INSERT WITH CHECK (true);
-- Only system admins can update audit logs
CREATE POLICY "System can update audit logs" ON audit_logs FOR
UPDATE USING (true);
-- Only system admins can delete audit logs
CREATE POLICY "System can delete audit logs" ON audit_logs FOR DELETE USING (true);
-- Create function to automatically clean old audit logs
CREATE OR REPLACE FUNCTION clean_old_audit_logs() RETURNS void AS $$ BEGIN -- Delete audit logs older than 2 years
DELETE FROM audit_logs
WHERE timestamp < NOW() - INTERVAL '2 years';
-- Log the cleanup operation
INSERT INTO audit_logs (
        user_id,
        action,
        resource,
        resource_id,
        resource_type,
        metadata,
        success,
        timestamp
    )
VALUES (
        NULL,
        'SYSTEM_CLEANUP',
        'SYSTEM',
        'audit_logs',
        'SYSTEM',
        '{"operation": "cleanup", "deleted_before": "' || (NOW() - INTERVAL '2 years')::text || '"}',
        true,
        NOW()
    );
END;
$$ LANGUAGE plpgsql;
-- Create a scheduled job to clean old audit logs (runs monthly)
-- Note: This requires pg_cron extension to be enabled
-- SELECT cron.schedule('clean-audit-logs', '0 2 1 * *', 'SELECT clean_old_audit_logs();');
-- Create view for audit logs with user information
CREATE OR REPLACE VIEW audit_logs_with_users AS
SELECT al.*,
    u.email as user_email,
    u.raw_user_meta_data->>'name' as user_name,
    un.name as unidade_name
FROM audit_logs al
    LEFT JOIN auth.users u ON al.user_id = u.id
    LEFT JOIN unidades un ON al.unidade_id = un.id;
-- Grant permissions
GRANT SELECT ON audit_logs TO authenticated;
GRANT SELECT ON audit_logs_with_users TO authenticated;
GRANT INSERT,
    UPDATE,
    DELETE ON audit_logs TO service_role;
-- Create comment
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for tracking all critical operations in the system';
COMMENT ON COLUMN audit_logs.user_id IS 'ID of the user who performed the action';
COMMENT ON COLUMN audit_logs.action IS 'Type of action performed';
COMMENT ON COLUMN audit_logs.resource IS 'Type of resource affected';
COMMENT ON COLUMN audit_logs.resource_id IS 'ID of the specific resource affected';
COMMENT ON COLUMN audit_logs.old_values IS 'Previous values before the change (JSON)';
COMMENT ON COLUMN audit_logs.new_values IS 'New values after the change (JSON)';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context about the operation (JSON)';
COMMENT ON COLUMN audit_logs.success IS 'Whether the operation was successful';
COMMENT ON COLUMN audit_logs.error_message IS 'Error message if the operation failed';