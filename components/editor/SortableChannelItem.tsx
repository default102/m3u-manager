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
    <div ref={setNodeRef} style={style} className={`bg-white ${selected ? 'ring-2 ring-blue-500 bg-blue-50/10' : 'hover:bg-slate-50'} p-3 md:p-4 rounded-xl flex items-center gap-3 md:gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group relative text-slate-900`}>
      <div 
        {...attributes} 
        {...listeners} 
        className={`p-1 text-slate-300 transition-colors z-10 ${isAllView ? 'cursor-not-allowed opacity-10' : 'cursor-grab hover:text-slate-500'}`} 
        style={{ touchAction: isAllView ? 'auto' : 'none' }}
      >
        <GripVertical size={16} />
      </div>
      
      <button onClick={() => onToggleSelect(channel.id)} className={`p-1 rounded-md hover:bg-slate-100 transition-colors ${selected ? 'text-blue-600' : 'text-slate-300'}`}>
         {selected ? <CheckSquare size={20} /> : <Square size={20} />}
      </button>

      <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden shrink-0 shadow-inner p-1">
         {channel.tvgLogo ? (
            <img src={channel.tvgLogo} alt="" className="w-full h-full object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
         ) : (
            <span className="text-[10px] font-bold text-slate-300">TV</span>
         )}
      </div>

      <div className="flex-1 min-w-0 flex items-center gap-4">
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
                <div className={`font-bold text-sm md:text-base truncate ${isHidden ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{channel.name}</div>
                {isHidden && <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">隐藏</span>}
            </div>
            <div className="text-xs text-slate-400 truncate font-mono mt-0.5 opacity-60 group-hover:opacity-100 transition-opacity">{channel.url}</div>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all px-2">
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
