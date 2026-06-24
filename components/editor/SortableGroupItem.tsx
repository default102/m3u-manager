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
    <div ref={setNodeRef} style={style} className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 mb-2 group relative ${isDragging ? 'shadow-2xl z-50 ring-2 ring-blue-500 bg-white dark:bg-slate-900 scale-[1.02]' : (isHidden ? 'bg-slate-50/50 dark:bg-slate-900/30' : 'bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:-translate-y-0.5')}`}>
       <div {...attributes} {...listeners} className="cursor-grab text-slate-300 dark:text-slate-600 p-1 hover:text-slate-600 dark:hover:text-slate-400 transition-colors shrink-0" style={{ touchAction: 'none' }}>
         <GripVertical size={16}/>
       </div>

       <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className={`truncate text-sm font-bold ${isHidden ? 'text-slate-400 dark:text-slate-500 line-through opacity-60' : 'text-slate-700 dark:text-slate-200'}`}>
            {label}
          </span>
       </div>

       <div className="flex items-center gap-0.5 shrink-0">
         {onToggleHide && (
           <button
             onClick={(e) => {
               e.stopPropagation();
               onToggleHide(id);
             }}
             className={`p-1.5 rounded-lg transition-all active:scale-90 ${isHidden ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30'}`}
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
             className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all active:scale-90"
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
             className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all active:scale-90"
             title="删除"
           >
             <Trash2 size={14} />
           </button>
         )}
       </div>
    </div>
  );
}
