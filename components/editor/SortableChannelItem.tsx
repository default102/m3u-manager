'use client';

import { GripVertical, Edit2, Trash2, CheckSquare, Square, Eye, EyeOff } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Channel } from '@/types';

interface Props {
  id: string;
  channel: Channel;
  selected: boolean;
  isHidden: boolean;
  isAllView: boolean;
  onEdit: (c: Channel) => void;
  onDelete: (id: number) => void;
  onToggleSelect: (id: number) => void;
  onToggleHide: (id: number) => void;
}

export function SortableChannelItem({ 
    id, 
    channel, 
    onEdit, 
    onDelete, 
    selected, 
    isHidden,
    onToggleSelect,
    onToggleHide,
    isAllView
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const style = { 
    transform: CSS.Transform.toString(transform), 
    transition, 
    opacity: isDragging ? 0.5 : (isHidden ? 0.6 : 1), 
    zIndex: isDragging ? 50 : 0,
    filter: isHidden ? 'grayscale(100%)' : 'none'
  };

  return (
    <div ref={setNodeRef} style={style} className={`bg-white border ${selected ? 'border-blue-500 bg-blue-50/5' : 'border-slate-200'} p-2 md:p-2.5 rounded-xl flex items-center gap-2 md:gap-3 shadow-sm hover:border-blue-200 hover:shadow transition-all group relative text-slate-900`}>
      <div 
        {...attributes} 
        {...listeners} 
        className={`p-2 -ml-1 text-slate-300 transition-colors z-10 ${isAllView ? 'cursor-not-allowed opacity-10' : 'cursor-grab hover:text-blue-400'}`} 
        style={{ touchAction: isAllView ? 'auto' : 'none' }}
      >
        <GripVertical size={18} />
      </div>
      
      <button onClick={() => onToggleSelect(channel.id)} className={`p-1 rounded hover:bg-slate-50 ${selected ? 'text-blue-500' : 'text-slate-400'}`}>
         {selected ? <CheckSquare size={18} /> : <Square size={18} />}
      </button>

      <div className="w-8 h-8 md:w-9 md:h-9 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
         {channel.tvgLogo ? (
            <img src={channel.tvgLogo} alt="" className="w-full h-full object-contain p-1" onError={(e) => (e.currentTarget.style.display = 'none')} />
         ) : (
            <span className="text-[10px] font-bold text-slate-300">TV</span>
         )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
            <div className={`font-semibold text-[13px] truncate ${isHidden ? 'text-slate-400 line-through' : 'text-slate-600'}`}>{channel.name}</div>
            {isHidden && <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">隐藏</span>}
        </div>
        <div className="text-[10px] md:text-xs text-slate-400 truncate font-mono mt-0.5">{channel.url}</div>
      </div>

      <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all">
         <button 
           onClick={() => onToggleHide(channel.id)} 
           className={`inline-flex items-center justify-center p-2 rounded-lg transition-all active:scale-90 ${isHidden ? 'text-blue-600 bg-blue-100' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-100'}`}
           title={isHidden ? "取消隐藏" : "隐藏频道"}
         >
            {isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
         </button>
         <button onClick={() => onEdit(channel)} className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-lg transition-all active:scale-90" title="编辑频道">
            <Edit2 size={16} />
         </button>
         <button onClick={() => onDelete(channel.id)} className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-red-500 hover:bg-red-100 rounded-lg transition-all active:scale-90" title="删除频道">
            <Trash2 size={16} />
         </button>
      </div>
    </div>
  );
}
