'use client';

import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';
import { Channel } from '@/types';

interface Props {
  channel: Channel;
  allGroups: string[];
  onClose: () => void;
  onUpdate: (updatedChannel: Channel) => void;
}

export function EditChannelModal({ channel, allGroups, onClose, onUpdate }: Props) {
  const [group, setGroup] = useState(channel.groupTitle || '');
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowGroupDropdown(false);
        setIsTyping(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredGroups = isTyping 
    ? allGroups.filter(g => g.toLowerCase().includes(group.toLowerCase()))
    : allGroups;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updated: Channel = {
      ...channel,
      name: formData.get('name') as string,
      groupTitle: group,
      tvgLogo: formData.get('tvgLogo') as string,
      url: formData.get('url') as string,
    };
    onUpdate(updated);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-visible border border-slate-100 animate-in zoom-in-95 duration-200 text-slate-900 flex flex-col max-h-[90vh]">
        <div className="px-8 py-6 border-b flex justify-between items-center bg-white shrink-0 rounded-t-[2rem]">
          <h3 className="text-xl font-extrabold text-slate-800">频道设置</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">频道名称</label>
              <input 
                name="name" 
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all shadow-sm focus:bg-white" 
                defaultValue={channel.name} 
                required
              />
            </div>
            
            <div className="space-y-2 relative" ref={dropdownRef}>
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">所属分组</label>
              <div className="relative">
                <input 
                  type="text"
                  value={group}
                  onChange={(e) => {
                    setGroup(e.target.value);
                    setShowGroupDropdown(true);
                    setIsTyping(true);
                  }}
                  onFocus={() => setShowGroupDropdown(true)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all shadow-sm focus:bg-white pr-10" 
                  placeholder="输入或选择分组"
                />
                <div 
                    className="absolute right-3 top-3.5 text-slate-400 cursor-pointer hover:text-blue-500"
                    onClick={() => {
                        setShowGroupDropdown(!showGroupDropdown);
                        setIsTyping(false);
                    }}
                >
                    <ChevronDown size={20} className={`transition-transform duration-200 ${showGroupDropdown ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {showGroupDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl max-h-48 overflow-y-auto z-10 custom-scrollbar p-1">
                   {filteredGroups.length > 0 ? (
                       filteredGroups.map(g => (
                           <button
                             key={g}
                             type="button"
                             onClick={() => {
                                 setGroup(g);
                                 setShowGroupDropdown(false);
                                 setIsTyping(false);
                             }}
                             className="w-full text-left px-4 py-2.5 rounded-lg hover:bg-blue-50 hover:text-blue-600 font-medium text-sm transition-colors flex items-center justify-between group"
                           >
                               <span>{g}</span>
                               {group === g && <Check size={16} className="text-blue-600" />}
                           </button>
                       ))
                   ) : (
                       <div className="px-4 py-3 text-sm text-slate-400 text-center">
                           无匹配分组，将创建新分组
                       </div>
                   )}
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Logo 地址</label>
            <input name="tvgLogo" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-xs text-slate-600 focus:ring-2 focus:ring-blue-500 transition-all shadow-sm focus:bg-white" defaultValue={channel.tvgLogo || ''} />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase ml-1">直播源 (URL)</label>
            <textarea name="url" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-mono text-xs h-28 resize-none text-slate-600 focus:ring-2 focus:ring-blue-500 transition-all shadow-sm focus:bg-white" defaultValue={channel.url} required />
          </div>
          
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all text-sm">取消</button>
            <button type="submit" className="px-10 py-3 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 text-sm">保存更改</button>
          </div>
        </form>
      </div>
    </div>
  );
}
