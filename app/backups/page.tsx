'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trash2, Plus, Database, RefreshCw, ArrowLeft, Clock, HardDrive } from 'lucide-react';

interface Backup {
  name: string;
  createdAt: string;
  size: number;
}

export default function BackupsPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchBackups();
  }, []);

  const fetchBackups = () => {
    setLoading(true);
    fetch('/api/backup')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setBackups(data);
        } else {
          console.error('Expected array of backups, got:', data);
          setBackups([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch backups:', err);
        setLoading(false);
      });
  };

  const handleCreateBackup = async () => {
    setProcessing(true);
    try {
      const res = await fetch('/api/backup', { method: 'POST' });
      if (!res.ok) throw new Error('Backup failed');
      fetchBackups();
    } catch (e) {
      alert('备份失败');
    } finally {
      setProcessing(false);
    }
  };

  const handleRestore = async (filename: string) => {
    if (!confirm(`确定要恢复备份 ${filename} 吗？当前数据将被覆盖！`)) return;
    
    setProcessing(true);
    try {
      const res = await fetch(`/api/backup/${filename}/restore`, { method: 'POST' });
      if (!res.ok) throw new Error('Restore failed');
      alert('恢复成功！');
    } catch (e) {
      alert('恢复失败');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm(`确定要删除备份 ${filename} 吗？`)) return;
    
    try {
      const res = await fetch(`/api/backup/${filename}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setBackups(prev => prev.filter(b => b.name !== filename));
    } catch (e) {
      alert('删除失败');
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '未知时间';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleString();
    } catch (e) {
      return dateStr;
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
             <Link href="/" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                <ArrowLeft size={20} className="text-slate-600" />
             </Link>
             <div>
                <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Database className="text-blue-600" /> 数据备份与恢复
                </h1>
                <p className="text-slate-500 text-sm mt-1">管理您的数据库备份快照</p>
             </div>
          </div>
          
          <button 
            onClick={handleCreateBackup}
            disabled={processing}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? <RefreshCw className="animate-spin" size={18} /> : <Plus size={18} />}
            {processing ? '处理中...' : '创建新备份'}
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p>正在加载备份列表...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
             {backups.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                    <Database size={48} className="mx-auto mb-4 text-slate-200" />
                    <p>暂无备份记录</p>
                </div>
             ) : (
                <div className="divide-y divide-slate-100">
                   {backups.map((backup) => (
                      <div key={backup.name} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                          <div className="flex items-start gap-4">
                             <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                <Database size={20} />
                             </div>
                             <div className="min-w-0">
                                <h3 className="font-bold text-slate-800 break-all">{backup.name}</h3>
                                <div className="flex flex-wrap gap-4 mt-1 text-xs text-slate-500">
                                   <span className="flex items-center gap-1">
                                      <Clock size={14} /> {formatDate(backup.createdAt)}
                                   </span>
                                   <span className="flex items-center gap-1">
                                      <HardDrive size={14} /> {formatSize(backup.size)}
                                   </span>
                                </div>
                             </div>
                          </div>
                          
                          <div className="flex items-center gap-2 self-end md:self-center">
                             <button 
                                onClick={() => handleRestore(backup.name)}
                                disabled={processing}
                                className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all flex items-center gap-2"
                             >
                                <RefreshCw size={16} /> 恢复
                             </button>
                             
                             <button 
                                onClick={() => handleDelete(backup.name)}
                                disabled={processing}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="删除备份"
                             >
                                <Trash2 size={18} />
                             </button>
                          </div>
                      </div>
                   ))}
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}