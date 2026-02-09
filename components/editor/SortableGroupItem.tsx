'use client';

import { GripVertical, Trash2, Edit2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  id: string;
  label: string;
  count: number;
  onDelete?: (id: string) => void;
  onRename?: (oldName: string) => void;
}

export function SortableGroupItem({ id, label, count, onDelete, onRename }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const style = { 
    transform: CSS.Transform.toString(transform), 
    transition, 
    opacity: isDragging ? 0.5 : 1, 
    zIndex: isDragging ? 50 : 0 
  };
  
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-100 text-xs font-bold shadow-sm mb-1 text-black group">
       <div {...attributes} {...listeners} className="cursor-grab text-slate-300 p-1 hover:text-blue-500" style={{ touchAction: 'none' }}>
         <GripVertical size={14}/>
       </div>
       <span className="truncate flex-1">{label}</span>
       <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">{count}</span>
       
       <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
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
