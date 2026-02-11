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

/**
 * Format date to compact format YYYYMMDD
 */
export function formatDateCompact(date?: string | Date): string {
    const d = date ? new Date(date) : new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

/**
 * Generate M3U download filename
 * @param playlistName - Playlist name
 * @param isFull - Whether to include hidden content (full version)
 */
export function getM3UFilename(playlistName: string, isFull: boolean = false): string {
    const dateStr = formatDateCompact();
    const versionLabel = isFull ? '完整版' : '当前版';
    // Sanitize filename
    const safeName = playlistName.replace(/[<>:"/\\|?*]/g, '_');
    return `${safeName}_${dateStr}_${versionLabel}.m3u`;
}
