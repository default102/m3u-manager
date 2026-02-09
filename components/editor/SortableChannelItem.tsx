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
    <div ref={setNodeRef} style={style} className={`bg-white border ${selected ? 'border-blue-500 bg-blue-50/10' : 'border-slate-200'} mb-3 p-3 md:p-4 rounded-xl flex items-center gap-3 md:gap-4 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group relative text-black`}>
      <div 
        {...attributes} 
        {...listeners} 
        className={`p-3 -ml-3 text-slate-300 transition-colors z-10 ${isAllView ? 'cursor-not-allowed opacity-10' : 'cursor-grab hover:text-blue-500'}`} 
        style={{ touchAction: isAllView ? 'auto' : 'none' }}
      >
        <GripVertical size={20} />
      </div>
      
      <button onClick={() => onToggleSelect(channel.id)} className={`p-1 rounded hover:bg-slate-100 ${selected ? 'text-blue-600' : 'text-slate-300'}`}>
         {selected ? <CheckSquare size={20} /> : <Square size={20} />}
      </button>

      <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
         {channel.tvgLogo ? (
            <img src={channel.tvgLogo} alt="" className="w-full h-full object-contain p-1" onError={(e) => (e.currentTarget.style.display = 'none')} />
         ) : (
            <span className="text-[10px] font-bold text-slate-300">TV</span>
         )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
            <div className={`font-bold text-sm md:text-base truncate ${isHidden ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{channel.name}</div>
            {isHidden && <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-bold">隐藏</span>}
        </div>
        <div className="text-[10px] md:text-xs text-slate-400 truncate font-mono mt-0.5 opacity-60">{channel.url}</div>
      </div>

      <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
         <button 
           onClick={() => onToggleHide(channel.id)} 
           className={`p-2 rounded-lg transition-colors ${isHidden ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-blue-600 hover:bg-slate-50'}`}
           title={isHidden ? "取消隐藏" : "隐藏频道"}
         >
            {isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
         </button>
         <button onClick={() => onEdit(channel)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <Edit2 size={16} />
         </button>
         <button onClick={() => onDelete(channel.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 size={16} />
         </button>
      </div>
    </div>
  );
}
