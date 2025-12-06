import React, { useState, useEffect } from 'react';
import { KanbanColumn, Task, Attachment } from '../types';
import { Plus, X, MoreHorizontal, AlignLeft, Calendar, User, Clock, Trash2, Smile, Palette, Paperclip, File as FileIcon, Check } from 'lucide-react';

interface Props {
  data: KanbanColumn[];
  onChange: (newData: KanbanColumn[]) => void;
}

interface TaskModalProps {
  task: Task;
  columnTitle: string;
  onClose: (updatedTask: Task) => void;
  onDelete: () => void;
}

const COLUMN_COLORS = [
    'transparent',
    '#EF4444', // Red
    '#F59E0B', // Amber
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#8B5CF6', // Violet
    '#EC4899', // Pink
];

const TaskModal: React.FC<TaskModalProps> = ({ task, columnTitle, onClose, onDelete }) => {
  const [content, setContent] = useState(task.content);
  const [desc, setDesc] = useState(task.description || '');
  const [assignee, setAssignee] = useState(task.assignee || '');
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  const [icon, setIcon] = useState(task.icon || '');
  const [attachments, setAttachments] = useState<Attachment[]>(task.attachments || []);

  const handleClose = () => {
    onClose({
      ...task,
      content,
      description: desc,
      assignee,
      dueDate,
      icon,
      attachments
    });
  };

  const handleIconClick = () => {
      const newIcon = prompt("Digite um emoji para esta tarefa:", icon || '📄');
      if (newIcon) setIcon(newIcon);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
           const newAttachment: Attachment = {
             id: crypto.randomUUID(),
             name: file.name,
             url: event.target.result as string,
             type: file.type.startsWith('image/') ? 'image' : 'file'
           };
           setAttachments([...attachments, newAttachment]);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm" 
      onClick={handleClose}
    >
      <div 
        className="bg-[#202020] w-[650px] max-h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-[#333] animate-in fade-in zoom-in-95 duration-200" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header Image Area */}
        <div className="h-32 bg-gradient-to-r from-neutral-800 to-neutral-900 w-full relative group shrink-0">
            <button onClick={handleClose} className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 p-1 rounded-md transition-colors">
                 <X size={20} />
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto relative">
             <div className="px-8">
                 {/* Icon - Overlapping Banner */}
                 <div className="-mt-9 mb-4">
                     <button 
                        onClick={handleIconClick}
                        className="text-5xl flex items-center justify-center w-[72px] h-[72px] bg-[#202020] hover:bg-[#2C2C2C] rounded-md transition-colors cursor-pointer select-none shadow-sm group border border-transparent hover:border-[#444]"
                     >
                         {icon ? icon : <span className="text-notion-muted opacity-50 group-hover:opacity-100"><Smile size={32}/></span>}
                     </button>
                 </div>

                 {/* Title */}
                 <div className="mb-6">
                     <input 
                        className="text-3xl font-bold bg-transparent border-none outline-none w-full text-white placeholder-gray-500"
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        placeholder="Título da Tarefa"
                     />
                     <div className="text-sm text-notion-muted mt-2 flex items-center gap-2">
                        na lista <span className="bg-[#2C2C2C] px-1.5 py-0.5 rounded text-gray-300 text-xs">{columnTitle}</span>
                     </div>
                 </div>
                 
                 {/* Properties Grid */}
                 <div className="grid grid-cols-[120px_1fr] gap-y-4 mb-8">
                     {/* Assignee */}
                     <div className="text-sm text-notion-muted flex items-center gap-2">
                         <User size={16} /> Responsável
                     </div>
                     <div className="">
                         <input 
                            className="bg-transparent hover:bg-[#2C2C2C] rounded px-2 py-1 -ml-2 border-none outline-none text-sm text-gray-200 w-full cursor-pointer transition-colors placeholder-gray-600" 
                            placeholder="Vazio"
                            value={assignee}
                            onChange={e => setAssignee(e.target.value)}
                         />
                     </div>

                     {/* Due Date */}
                     <div className="text-sm text-notion-muted flex items-center gap-2">
                         <Calendar size={16} /> Prazo
                     </div>
                     <div className="">
                         <input 
                            type="date"
                            className="bg-transparent hover:bg-[#2C2C2C] rounded px-2 py-1 -ml-2 border-none outline-none text-sm text-gray-200 cursor-pointer color-scheme-dark transition-colors" 
                            value={dueDate}
                            onChange={e => setDueDate(e.target.value)}
                         />
                     </div>

                     {/* Attachments */}
                     <div className="text-sm text-notion-muted flex items-center gap-2 pt-1 self-start">
                         <Paperclip size={16} /> Anexos
                     </div>
                     <div className="">
                        <div className="flex flex-wrap gap-2">
                            {attachments.map(att => (
                                <div key={att.id} className="group relative w-20 h-20 bg-[#2C2C2C] border border-[#333] rounded-md overflow-hidden flex flex-col items-center justify-center hover:bg-[#333] transition-colors cursor-pointer" title={att.name}>
                                    {att.type === 'image' ? (
                                        <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-2 text-center">
                                            <FileIcon size={20} className="text-gray-400 mb-1" />
                                            <span className="text-[9px] text-gray-500 truncate w-full">{att.name}</span>
                                        </div>
                                    )}
                                    {/* Delete Button Overlay */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setAttachments(attachments.filter(a => a.id !== att.id)); }}
                                            className="text-white hover:text-red-400 p-1"
                                            title="Remover anexo"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    {/* Link to open (optional) */}
                                    <a 
                                        href={att.url} 
                                        download={att.name}
                                        onClick={e => e.stopPropagation()}
                                        className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 text-white bg-black/50 rounded p-0.5 hover:bg-black/80 z-20"
                                        title="Baixar"
                                    >
                                        <Paperclip size={10} />
                                    </a>
                                </div>
                            ))}
                            <label className="w-20 h-20 border border-dashed border-[#444] rounded-md flex flex-col items-center justify-center text-notion-muted hover:text-white hover:bg-[#2C2C2C] hover:border-gray-500 cursor-pointer transition-all">
                                <Plus size={20} className="mb-1 opacity-50"/>
                                <span className="text-[10px] opacity-70">Adic.</span>
                                <input type="file" className="hidden" onChange={handleFileSelect} />
                            </label>
                        </div>
                     </div>
                 </div>

                 <div className="h-[1px] bg-[#333] w-full mb-8"></div>

                 {/* Description */}
                 <div className="mb-8">
                      <div className="flex items-center gap-2 text-lg font-semibold text-white mb-3">
                          <AlignLeft size={20} />
                          <h3>Descrição</h3>
                      </div>
                      <textarea
                        className="w-full min-h-[200px] bg-[#2C2C2C] rounded-md p-4 text-sm text-gray-200 outline-none resize-none focus:ring-1 focus:ring-notion-muted/50 border border-transparent placeholder-gray-500 leading-relaxed"
                        placeholder="Adicione uma descrição mais detalhada..."
                        value={desc}
                        onChange={e => setDesc(e.target.value)}
                      />
                 </div>
                 
                 {/* Actions */}
                 <div className="flex justify-end pb-8">
                     <button 
                        onClick={onDelete}
                        className="flex items-center gap-2 text-red-400 hover:bg-red-400/10 px-3 py-1.5 rounded text-sm transition-colors"
                     >
                         <Trash2 size={14} /> Excluir Tarefa
                     </button>
                 </div>
             </div>
        </div>
      </div>
    </div>
  );
};

const KanbanBoard: React.FC<Props> = ({ data, onChange }) => {
  const [draggedItem, setDraggedItem] = useState<{ taskId: string, colId: string } | null>(null);
  const [editingTask, setEditingTask] = useState<{ colId: string, task: Task } | null>(null);
  const [openColorMenu, setOpenColorMenu] = useState<string | null>(null);
  
  // Quick Add State
  const [addingColumnId, setAddingColumnId] = useState<string | null>(null);
  const [newItemText, setNewItemText] = useState('');

  const handleDragStart = (taskId: string, colId: string) => {
    setDraggedItem({ taskId, colId });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetColId: string) => {
    if (!draggedItem) return;

    const sourceColIndex = data.findIndex(c => c.id === draggedItem.colId);
    const targetColIndex = data.findIndex(c => c.id === targetColId);

    if (sourceColIndex === -1 || targetColIndex === -1) return;

    const newData = [...data];
    const sourceCol = { ...newData[sourceColIndex] };
    const targetCol = { ...newData[targetColIndex] };

    const taskIndex = sourceCol.tasks.findIndex(t => t.id === draggedItem.taskId);
    if (taskIndex === -1) return;
    
    const [task] = sourceCol.tasks.splice(taskIndex, 1);

    if (sourceCol.id === targetCol.id) {
       sourceCol.tasks.push(task);
       newData[sourceColIndex] = sourceCol;
    } else {
       targetCol.tasks.push(task);
       newData[sourceColIndex] = sourceCol;
       newData[targetColIndex] = targetCol;
    }

    onChange(newData);
    setDraggedItem(null);
  };

  const confirmAddTask = () => {
    if (!addingColumnId || !newItemText.trim()) {
        setAddingColumnId(null);
        return;
    }
    
    const newData = data.map(col => {
      if (col.id === addingColumnId) {
        return {
          ...col,
          tasks: [...col.tasks, { id: crypto.randomUUID(), content: newItemText }]
        };
      }
      return col;
    });
    onChange(newData);
    setNewItemText('');
    // Optional: Keep input open for rapid entry
    // setAddingColumnId(null); 
  };

  const removeTask = (colId: string, taskId: string) => {
     const newData = data.map(col => {
      if (col.id === colId) {
        return {
          ...col,
          tasks: col.tasks.filter(t => t.id !== taskId)
        };
      }
      return col;
    });
    onChange(newData);
  };

  const updateTask = (colId: string, updatedTask: Task) => {
    const newData = data.map(col => {
        if (col.id === colId) {
            return {
                ...col,
                tasks: col.tasks.map(t => t.id === updatedTask.id ? updatedTask : t)
            };
        }
        return col;
    });
    onChange(newData);
  };

  const updateColumnColor = (colId: string, color: string) => {
      const newData = data.map(col => {
          if (col.id === colId) {
              return { ...col, color };
          }
          return col;
      });
      onChange(newData);
      setOpenColorMenu(null);
  };

  return (
    <>
      <div className="flex space-x-4 overflow-x-auto pb-4 h-full items-start">
        {data.map(column => (
          <div 
            key={column.id}
            className="min-w-[280px] w-[280px] rounded-md flex flex-col max-h-full border border-[#333] transition-colors relative"
            style={{ backgroundColor: '#202020e6' }} // Slight transparency for background
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(column.id)}
          >
            {/* Color Strip if colored */}
            <div 
                className="h-1 w-full rounded-t-md"
                style={{ backgroundColor: column.color === 'transparent' ? 'transparent' : column.color }}
            />

            <div className="p-3 flex justify-between items-center border-b border-[#333]">
              <h3 className="font-semibold text-sm text-gray-300 flex items-center gap-2">
                <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: column.color && column.color !== 'transparent' ? column.color : '#2383E2' }}
                ></div>
                {column.title} 
                <span className="text-notion-muted font-normal ml-1 text-xs">{column.tasks.length}</span>
              </h3>
              <div className="flex gap-1 text-notion-muted cursor-pointer hover:text-white relative">
                  <Plus size={16} onClick={() => { setAddingColumnId(column.id); setNewItemText(''); }}/>
                  <div onClick={() => setOpenColorMenu(openColorMenu === column.id ? null : column.id)}>
                      <MoreHorizontal size={16} />
                  </div>
                  
                  {/* Column Menu */}
                  {openColorMenu === column.id && (
                      <div className="absolute top-6 left-0 z-20 bg-[#2C2C2C] border border-[#444] rounded shadow-xl p-2 min-w-[120px]">
                          <div className="text-xs text-notion-muted mb-2 font-semibold">COR DO CABEÇALHO</div>
                          <div className="flex gap-1 flex-wrap w-[120px]">
                              {COLUMN_COLORS.map(c => (
                                  <div 
                                    key={c}
                                    onClick={(e) => { e.stopPropagation(); updateColumnColor(column.id, c); }}
                                    className="w-5 h-5 rounded-full cursor-pointer hover:scale-110 transition-transform border border-white/10"
                                    style={{ backgroundColor: c === 'transparent' ? '#333' : c }}
                                    title={c}
                                  >
                                      {c === 'transparent' && <div className="w-full h-full flex items-center justify-center text-[8px] text-white">/</div>}
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}
              </div>
            </div>

            <div className="p-2 flex-1 overflow-y-auto space-y-2 min-h-[100px]">
              {column.tasks.map(task => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => handleDragStart(task.id, column.id)}
                  onClick={() => setEditingTask({ colId: column.id, task })}
                  className="bg-notion-card p-3 rounded shadow-sm hover:bg-notion-hover cursor-pointer active:cursor-grabbing border border-transparent hover:border-[#444] group relative"
                >
                  <div className="flex items-start gap-2 mb-1">
                      {task.icon && <span className="text-base leading-snug">{task.icon}</span>}
                      <span className="text-sm text-gray-200 leading-snug">{task.content}</span>
                  </div>
                  
                  {/* Task Metadata Badges */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {task.description && (
                        <div className="text-notion-muted" title="Possui descrição">
                             <AlignLeft size={14} />
                        </div>
                    )}
                    {task.attachments && task.attachments.length > 0 && (
                        <div className="flex items-center gap-1 text-[11px] text-notion-muted bg-[#383838] px-1.5 py-0.5 rounded" title={`${task.attachments.length} anexos`}>
                             <Paperclip size={11} />
                             {task.attachments.length}
                        </div>
                    )}
                    {task.dueDate && (
                        <div className="flex items-center gap-1 text-[11px] text-notion-muted bg-[#383838] px-1.5 py-0.5 rounded">
                             <Clock size={11} /> 
                             {new Date(task.dueDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                        </div>
                    )}
                    {task.assignee && (
                        <div className="flex items-center gap-1 text-[11px] text-notion-muted bg-[#383838] px-1.5 py-0.5 rounded ml-auto">
                             <User size={11} />
                             <span className="max-w-[60px] truncate">{task.assignee}</span>
                        </div>
                    )}
                  </div>

                  <button 
                    onClick={(e) => { e.stopPropagation(); removeTask(column.id, task.id); }}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-notion-muted hover:text-red-400 transition-opacity p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {column.tasks.length === 0 && !addingColumnId && (
                  <div className="text-xs text-notion-muted text-center py-4 italic">Solte itens aqui</div>
              )}
            </div>
            
             {addingColumnId === column.id ? (
                 <div className="p-2 m-2 mt-0 bg-[#2C2C2C] rounded border border-blue-500 shadow-lg animate-in fade-in zoom-in-95 duration-200">
                     <input
                        autoFocus
                        className="w-full bg-transparent text-sm text-white outline-none placeholder-gray-500 mb-2"
                        placeholder="Digite o título da tarefa..."
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') confirmAddTask();
                            if (e.key === 'Escape') setAddingColumnId(null);
                        }}
                     />
                     <div className="flex items-center gap-2">
                         <button 
                            onClick={confirmAddTask}
                            className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-2 py-1 rounded transition-colors"
                         >
                             Adicionar
                         </button>
                         <button 
                            onClick={() => setAddingColumnId(null)}
                            className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded transition-colors"
                         >
                             <X size={14}/>
                         </button>
                     </div>
                 </div>
             ) : (
                <div 
                    onClick={() => { setAddingColumnId(column.id); setNewItemText(''); }}
                    className="p-2 m-2 mt-0 text-notion-muted hover:bg-notion-hover rounded cursor-pointer text-sm flex items-center gap-2 transition-colors"
                >
                    <Plus size={14}/> Novo
                </div>
             )}
          </div>
        ))}
         <div className="min-w-[280px] h-[50px] border border-dashed border-[#444] rounded-md flex items-center justify-center text-notion-muted cursor-pointer hover:bg-notion-hover/50 bg-[#202020]/50">
              <Plus size={16} className="mr-2"/> Adicionar Coluna
         </div>
      </div>

      {editingTask && (
        <TaskModal 
            task={editingTask.task} 
            columnTitle={data.find(c => c.id === editingTask.colId)?.title || ''}
            onClose={(updated) => {
                updateTask(editingTask.colId, updated);
                setEditingTask(null);
            }}
            onDelete={() => {
                removeTask(editingTask.colId, editingTask.task.id);
                setEditingTask(null);
            }}
        />
      )}
    </>
  );
};

export default KanbanBoard;