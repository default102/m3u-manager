/**
 * Utility Functions
 * 通用工具函数
 */

/**
 * Format date to locale string
 */
export function formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString();
}

/**
 * Generate backup filename with timestamp
 */
export function generateBackupFilename(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `backup-${timestamp}.db`;
}

/**
 * Format file size in bytes to human readable format
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Truncate string to specified length
 */
export function truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
}

/**
 * Generate export URL for a playlist
 */
export function getExportUrl(baseUrl: string, playlistId: number): string {
    return `${baseUrl}/api/export/${playlistId}`;
}
