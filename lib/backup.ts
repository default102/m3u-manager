import fs from 'fs/promises';
import path from 'path';
import prisma from './prisma';

const BACKUP_DIR = path.join(process.cwd(), 'backups');

const getDbPath = () => {
  const dbUrl = process.env.DATABASE_URL;
  // Default fallback if env not set
  if (!dbUrl) {
      return path.join(process.cwd(), 'prisma/dev.db');
  }
  
  if (dbUrl.startsWith('file:')) {
      const relativePath = dbUrl.replace('file:', '');
      return path.resolve(process.cwd(), relativePath);
  }
  
  // If absolute path or other format, return as is (cleanup might be needed)
  return path.resolve(process.cwd(), dbUrl);
};

export async function ensureBackupDir() {
    try {
        await fs.access(BACKUP_DIR);
    } catch {
        await fs.mkdir(BACKUP_DIR, { recursive: true });
    }
}

export async function listBackups() {
    await ensureBackupDir();
    const files = await fs.readdir(BACKUP_DIR);
    const backups = [];
    for (const file of files) {
        if (!file.endsWith('.db') && !file.endsWith('.sqlite')) continue;
        
        try {
            const stat = await fs.stat(path.join(BACKUP_DIR, file));
            backups.push({
                name: file,
                createdAt: stat.birthtime, // or mtime
                size: stat.size
            });
        } catch (e) {
            console.error(`Failed to stat file ${file}`, e);
        }
    }
    return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function createBackup() {
    await ensureBackupDir();
    const dbPath = getDbPath();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-${timestamp}.db`;
    const backupPath = path.join(BACKUP_DIR, backupName);
    
    // Check if DB exists
    try {
        await fs.access(dbPath);
    } catch {
        throw new Error(`Database file not found at ${dbPath}`);
    }

    await fs.copyFile(dbPath, backupPath);
    return { name: backupName };
}

export async function restoreBackup(filename: string) {
    await ensureBackupDir();
    const dbPath = getDbPath();
    const backupPath = path.join(BACKUP_DIR, filename);
    
    // Security check for directory traversal
    const resolvedBackupPath = path.resolve(backupPath);
    if (!resolvedBackupPath.startsWith(BACKUP_DIR)) {
        throw new Error('Invalid backup path');
    }
    
    // Verify backup exists
    await fs.access(backupPath);

    // Close connection if possible (best effort)
    // Prisma usually recovers, but dropping connection helps avoid locks on some OSs (like Windows)
    try {
        await prisma.$disconnect();
    } catch (e) {
        console.warn('Failed to disconnect prisma before restore', e);
    }

    await fs.copyFile(backupPath, dbPath);
    
    // Note: The next request will reconnect prisma.
}

export async function deleteBackup(filename: string) {
    await ensureBackupDir();
    const backupPath = path.join(BACKUP_DIR, filename);
    
    // Security check
    const resolvedBackupPath = path.resolve(backupPath);
    if (!resolvedBackupPath.startsWith(BACKUP_DIR)) {
        throw new Error('Invalid backup path');
    }

    await fs.unlink(backupPath);
}
