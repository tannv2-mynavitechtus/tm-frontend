import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Filter, Search, User, LogOut, LayoutDashboard,
  CheckCircle2, Clock, PlayCircle, MoreVertical, GripVertical,
  X, AlertCircle, Loader2
} from 'lucide-react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { authService } from '../services/auth.service';
import { tasksService } from '../services/tasks.service';
import type { Task, TaskStatus, TaskPriority } from '../types';

// --- Create Task Modal Component ---
const CreateTaskModal = ({
  isOpen,
  onClose,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await tasksService.create({ title, description, priority });
      onSuccess();
      onClose();
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="glass-card w-full max-w-lg overflow-hidden border border-white/10 shadow-2xl"
        >
          <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
            <h3 className="text-xl font-bold text-text">Create New Task</h3>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-surface-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                <AlertCircle className="w-5 h-5" />
                {Array.isArray(error) ? error[0] : error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-surface-400 ml-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                placeholder="What needs to be done?"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-surface-400 ml-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field min-h-[120px] py-3 resize-none"
                placeholder="Add more details about this task..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-surface-400 ml-1">Priority</label>
              <div className="grid grid-cols-4 gap-3">
                {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as TaskPriority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`text-[10px] font-bold py-2 rounded-lg border transition-all ${priority === p
                        ? 'bg-accent/20 border-accent text-accent shadow-lg shadow-accent/10'
                        : 'bg-surface-900 border-white/5 text-surface-500 hover:border-white/10'
                      }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-xl bg-surface-900 border border-white/10 text-sm font-bold text-surface-400 hover:bg-surface-800 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] btn-primary py-3 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" /> Create Task</>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// --- Droppable Column Component ---
const KanbanColumn = ({
  id,
  label,
  icon: Icon,
  color,
  tasks
}: {
  id: TaskStatus;
  label: string;
  icon: any;
  color: string;
  tasks: Task[]
}) => {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className="min-w-[350px] max-w-[400px] flex-1 flex flex-col bg-surface-900/20 rounded-2xl p-4 border border-white/5"
    >
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 ${color}`} />
          <h3 className="font-bold text-text text-sm uppercase tracking-widest">{label}</h3>
          <span className="bg-surface-800 text-surface-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-white/5">
            {tasks.length}
          </span>
        </div>
        <button className="p-1 hover:bg-white/5 rounded-md text-surface-400 cursor-pointer transition-colors">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
        <SortableContext
          items={tasks.map(t => t.id.toString())}
          strategy={verticalListSortingStrategy}
        >
          <AnimatePresence>
            {tasks.map((task) => (
              <SortableTaskCard key={task.id} task={task} />
            ))}
          </AnimatePresence>
        </SortableContext>
        {tasks.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-xl p-8 text-center bg-white/[0.02]">
            <Plus className="w-8 h-8 text-surface-600 mb-2 opacity-20" />
            <p className="text-surface-500 text-xs">Drop task here</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Sortable Task Card Component ---
const SortableTaskCard = ({ task }: { task: Task }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id.toString(),
    data: {
      type: 'Task',
      task,
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`glass-card p-4 group relative border border-white/5 hover:border-accent/30 cursor-default transition-all duration-300 ${isDragging ? 'z-50 ring-2 ring-accent/50 shadow-2xl scale-105' : ''
        }`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${task.priority === 'URGENT' ? 'bg-red-500/20 text-red-500' :
            task.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-500' :
              task.priority === 'MEDIUM' ? 'bg-blue-500/20 text-blue-500' :
                'bg-surface-500/20 text-surface-400'
          }`}>
          {task.priority}
        </span>
        <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing p-1 hover:bg-white/5 rounded text-surface-400">
          <GripVertical className="w-4 h-4" />
        </div>
      </div>

      <h4 className="text-text font-medium mb-2 group-hover:text-accent transition-colors">{task.title}</h4>
      <p className="text-surface-400 text-xs line-clamp-2 mb-4">
        {task.description || 'No description provided.'}
      </p>

      <div className="flex items-center justify-between border-t border-white/5 pt-3">
        <div className="flex -space-x-2">
          <div className="w-6 h-6 rounded-full bg-primary border border-background flex items-center justify-center text-[10px] text-text font-bold">
            {task.assignee?.fullName.charAt(0) || task.reporter?.fullName.charAt(0) || 'U'}
          </div>
        </div>
        <div className="flex items-center gap-2 text-surface-400 text-[10px]">
          <Clock className="w-3 h-3" /> {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'Just now'}
        </div>
      </div>
    </div>
  );
};

// --- Main Dashboard Page ---
const DashboardPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [originalStatus, setOriginalStatus] = useState<TaskStatus | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const response = await tasksService.getAll();
      setTasks(response.data);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    authService.getMe().then(setUser).catch(() => setUser({ fullName: 'Developer', role: 'ADMIN' }));
    fetchTasks();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const columns: { id: TaskStatus; label: string; icon: any; color: string }[] = [
    { id: 'TODO', label: 'To Do', icon: Clock, color: 'text-surface-400' },
    { id: 'DOING', label: 'In Progress', icon: PlayCircle, color: 'text-accent' },
    { id: 'RESOLVED', label: 'Completed', icon: CheckCircle2, color: 'text-green-500' },
  ];

  const handleDragStart = (event: any) => {
    const { active } = event;
    setActiveId(active.id);

    const task = tasks.find(t => t.id.toString() === active.id.toString());
    if (task) {
      setOriginalStatus(task.status);
    }
  };

  const handleDragOver = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === 'Task';
    const isOverColumn = columns.some(col => col.id === overId);

    // Dynamic move during drag for UI feedback
    if (isActiveTask && isOverColumn) {
      setTasks((prev) => {
        const activeTaskIndex = prev.findIndex(t => t.id.toString() === activeId);
        if (activeTaskIndex !== -1 && prev[activeTaskIndex].status !== overId) {
          const newTasks = [...prev];
          newTasks[activeTaskIndex] = { ...newTasks[activeTaskIndex], status: overId as TaskStatus };
          return newTasks;
        }
        return prev;
      });
    } else if (isActiveTask) {
      // Dragging over another task
      const overTask = tasks.find(t => t.id.toString() === overId);
      if (overTask && tasks.find(t => t.id.toString() === activeId)?.status !== overTask.status) {
        setTasks((prev) => {
          const activeTaskIndex = prev.findIndex(t => t.id.toString() === activeId);
          const newTasks = [...prev];
          newTasks[activeTaskIndex] = { ...newTasks[activeTaskIndex], status: overTask.status };
          return newTasks;
        });
      }
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      setOriginalStatus(null);
      return;
    }

    const activeIdStr = active.id.toString();
    const overIdStr = over.id.toString();

    const activeTask = tasks.find(t => t.id.toString() === activeIdStr);

    // Call API if status changed
    if (activeTask && originalStatus && activeTask.status !== originalStatus) {
      try {
        console.log(`Updating task ${activeTask.id} status to ${activeTask.status}`);
        await tasksService.update(activeTask.id, { status: activeTask.status });
      } catch (err) {
        console.error('Failed to update task status in backend', err);
        fetchTasks(); // Rollback from server
      }
    }

    if (activeIdStr !== overIdStr) {
      const activeIndex = tasks.findIndex(t => t.id.toString() === activeIdStr);
      const overIndex = tasks.findIndex(t => t.id.toString() === overIdStr);

      if (activeIndex !== -1 && overIndex !== -1) {
        setTasks((prev) => arrayMove(prev, activeIndex, overIndex));
      }
    }

    setActiveId(null);
    setOriginalStatus(null);
  };

  const activeTask = tasks.find(t => t.id.toString() === activeId);

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTasks}
      />

      {/* Header */}
      <header className="glass border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg transform hover:rotate-3 transition-transform cursor-pointer">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-surface-400">
            TaskControl
          </span>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              className="bg-surface-900 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 w-64 transition-all"
            />
          </div>

          <div className="flex items-center gap-4 border-l border-white/10 pl-6">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-text">{user?.fullName}</p>
              <p className="text-xs text-surface-400 uppercase tracking-tighter">{user?.role}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-surface-800 border-2 border-accent/20 flex items-center justify-center overflow-hidden cursor-pointer hover:border-accent transition-colors">
              <User className="w-6 h-6 text-surface-400" />
            </div>
            <button
              onClick={() => authService.logout()}
              className="p-2 hover:bg-red-500/10 rounded-lg text-surface-400 hover:text-red-500 transition-all cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-hidden flex flex-col max-w-[1600px] mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-text mb-1 tracking-tight">Project Board</h2>
            <p className="text-surface-400 text-sm">Visualize and manage your team workflow.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-900 border border-white/10 text-sm text-surface-300 hover:bg-surface-800 transition-colors cursor-pointer">
              <Filter className="w-4 h-4" /> Filter
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary flex items-center gap-2 py-2.5"
            >
              <Plus className="w-5 h-5" /> Create Task
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-accent" />
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex-1 flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
              {columns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  id={column.id}
                  label={column.label}
                  icon={column.icon}
                  color={column.color}
                  tasks={tasks.filter(t => t.status === column.id)}
                />
              ))}
            </div>

            <DragOverlay dropAnimation={{
              sideEffects: defaultDropAnimationSideEffects({
                styles: {
                  active: {
                    opacity: '0.5',
                  },
                },
              }),
            }}>
              {activeId && activeTask ? (
                <div className="glass-card p-4 ring-2 ring-accent border-accent/30 shadow-2xl scale-105 pointer-events-none">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${activeTask.priority === 'URGENT' ? 'bg-red-500/20 text-red-500' :
                        activeTask.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-500' :
                          activeTask.priority === 'MEDIUM' ? 'bg-blue-500/20 text-blue-500' :
                            'bg-surface-500/20 text-surface-400'
                      }`}>
                      {activeTask.priority}
                    </span>
                    <GripVertical className="w-4 h-4 text-surface-400" />
                  </div>
                  <h4 className="text-text font-medium mb-2">{activeTask.title}</h4>
                  <p className="text-surface-400 text-xs line-clamp-2">{activeTask.description}</p>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
