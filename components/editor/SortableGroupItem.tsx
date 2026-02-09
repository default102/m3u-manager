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
    <div ref={setNodeRef} style={style} className={`flex flex-col gap-2 p-3 rounded-2xl border transition-all duration-200 mb-2 ${isHidden ? 'bg-slate-50/50 border-slate-100' : 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200'}`}>
       {/* Top Row: Drag Handle + Label + Count */}
       <div className="flex items-center gap-2 min-w-0">
          <div {...attributes} {...listeners} className="cursor-grab text-slate-300 p-1 hover:text-blue-500 transition-colors shrink-0" style={{ touchAction: 'none' }}>
            <GripVertical size={14}/>
          </div>
          <span className={`truncate flex-1 text-xs font-bold ${isHidden ? 'text-slate-400 line-through opacity-60' : 'text-slate-700'}`}>
            {label}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-lg shrink-0 font-bold ${isHidden ? 'bg-slate-100 text-slate-300' : 'bg-blue-50 text-blue-500'}`}>
            {count}
          </span>
       </div>
       
       {/* Bottom Row: Action Buttons */}
       <div className="flex items-center justify-end gap-1 border-t border-slate-50 pt-2 mt-1">
         {onToggleHide && (
           <button 
             onClick={(e) => {
               e.stopPropagation();
               onToggleHide(id);
             }}
             className={`p-1.5 rounded-lg transition-all ${isHidden ? 'text-blue-500 bg-blue-50' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
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
             className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
             title="重命名"
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
             className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
             title="删除"
           >
             <Trash2 size={14} />
           </button>
         )}
       </div>
    </div>
  );
}
