'use client';

import { GripVertical, Trash2, Edit2, Eye, EyeOff } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  id: string;
  label: string;
  count: number;
  isHidden?: boolean;
  onDelete?: (id: string) => void;
  onRename?: (oldName: string) => void;
  onToggleHide?: (id: string) => void;
}

export function SortableGroupItem({ id, label, count, isHidden, onDelete, onRename, onToggleHide }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const style = { 
    transform: CSS.Transform.toString(transform), 
    transition, 
    opacity: isDragging ? 0.5 : 1, 
    zIndex: isDragging ? 50 : 0 
  };
  
  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold shadow-sm mb-1 group transition-colors ${isHidden ? 'bg-slate-50 border-slate-100 text-slate-400' : 'bg-white border-slate-100 text-black'}`}>
       <div {...attributes} {...listeners} className="cursor-grab text-slate-300 p-1 hover:text-blue-500" style={{ touchAction: 'none' }}>
         <GripVertical size={14}/>
       </div>
       <span className={`truncate flex-1 ${isHidden ? 'line-through opacity-60' : ''}`}>{label}</span>
       <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">{count}</span>
       
       <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
         {onToggleHide && (
           <button 
             onClick={(e) => {
               e.stopPropagation();
               onToggleHide(id);
             }}
             className={`p-1 rounded ${isHidden ? 'text-blue-500 hover:bg-blue-50' : 'text-slate-300 hover:text-blue-500 hover:bg-blue-50'}`}
             title={isHidden ? "显示分类" : "隐藏分类"}
           >
             {isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
           </button>
         )}

         {onRename && label !== '未分类' && (
           <button 
             onClick={(e) => {
               e.stopPropagation();
               onRename(label);
             }}
             className="p-1 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded"
           >
             <Edit2 size={14} />
           </button>
         )}
         
         {onDelete && label !== '未分类' && (
           <button 
             onClick={(e) => {
               e.stopPropagation();
               onDelete(id);
             }}
             className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded"
           >
             <Trash2 size={14} />
           </button>
         )}
       </div>
    </div>
  );
}
