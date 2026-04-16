import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Filter, Search, User, LogOut, LayoutDashboard, 
  CheckCircle2, Clock, PlayCircle, MoreVertical, GripVertical 
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
import type { Task, TaskStatus } from '../types';

// --- Sortable Task Card Component ---
const SortableTaskCard = ({ task }: { task: Task }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`glass-card p-4 group relative border border-white/5 hover:border-accent/30 cursor-default transition-all duration-300 ${
        isDragging ? 'z-50 ring-2 ring-accent/50 shadow-2xl scale-105' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
          task.priority === 'URGENT' ? 'bg-red-500/20 text-red-500' :
          task.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-500' :
          'bg-blue-500/20 text-blue-500'
        }`}>
          {task.priority}
        </span>
        <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing p-1 hover:bg-white/5 rounded text-surface-400">
           <GripVertical className="w-4 h-4" />
        </div>
      </div>
      
      <h4 className="text-text font-medium mb-2 group-hover:text-accent transition-colors">{task.title}</h4>
      <p className="text-surface-400 text-xs line-clamp-2 mb-4">
        {task.description}
      </p>
      
      <div className="flex items-center justify-between border-t border-white/5 pt-3">
        <div className="flex -space-x-2">
          <div className="w-6 h-6 rounded-full bg-primary border border-background flex items-center justify-center text-[10px] text-text font-bold">
            {task.assignee?.fullName.charAt(0) || 'U'}
          </div>
        </div>
        <div className="flex items-center gap-2 text-surface-400 text-[10px]">
          <Clock className="w-3 h-3" /> 2 days ago
        </div>
      </div>
    </div>
  );
};

// --- Main Dashboard Page ---
const DashboardPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    authService.getMe().then(setUser).catch(() => setUser({ fullName: 'Nal Developer', role: 'ADMIN' }));

    const mockTasks: Task[] = [
      {
        id: 1, title: 'Thiết kế giao diện login', description: 'Tạo form login với glassmorphism effect và DM Sans font',
        status: 'DOING', priority: 'HIGH', createdAt: '', updatedAt: ''
      },
      {
        id: 2, title: 'Cấu hình JWT Backend', description: 'Implement passport strategy và guards bảo vệ API',
        status: 'TODO', priority: 'URGENT', createdAt: '', updatedAt: ''
      },
      {
        id: 3, title: 'Database Migration', description: 'Cập nhật schema cho bảng tasks và users',
        status: 'RESOLVED', priority: 'MEDIUM', createdAt: '', updatedAt: ''
      },
      {
          id: 4, title: 'Setup CI/CD Pipeline', description: 'Cấu hình GitHub Actions cho auto deploy railway',
          status: 'TODO', priority: 'HIGH', createdAt: '', updatedAt: ''
      }
    ];
    setTasks(mockTasks);
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
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.sortable?.containerId === undefined;
    const isOverColumn = columns.some(col => col.id === overId);

    // If dragging over a column, move task to that column
    if (isActiveTask && isOverColumn) {
        setTasks((prev) => {
            const activeTask = prev.find(t => t.id.toString() === activeId);
            if (activeTask && activeTask.status !== overId) {
                return prev.map(t => t.id.toString() === activeId ? { ...t, status: overId as TaskStatus } : t);
            }
            return prev;
        });
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over) {
        setActiveId(null);
        return;
    }

    if (active.id !== over.id) {
        const activeIndex = tasks.findIndex(t => t.id.toString() === active.id);
        const overIndex = tasks.findIndex(t => t.id.toString() === over.id);
        
        if (activeIndex !== -1 && overIndex !== -1) {
            setTasks((prev) => arrayMove(prev, activeIndex, overIndex));
        }
    }
    setActiveId(null);
  };

  const activeTask = tasks.find(t => t.id.toString() === activeId);

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
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
            <button className="btn-primary flex items-center gap-2 py-2.5">
              <Plus className="w-5 h-5" /> Create Task
            </button>
          </div>
        </div>

        {/* Kanban Board with DndContext */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {columns.map((column) => (
              <div key={column.id} className="min-w-[350px] max-w-[400px] flex-1 flex flex-col bg-surface-900/20 rounded-2xl p-4 border border-white/5">
                <div className="flex items-center justify-between mb-6 px-2">
                  <div className="flex items-center gap-3">
                    <column.icon className={`w-5 h-5 ${column.color}`} />
                    <h3 className="font-bold text-text text-sm uppercase tracking-widest">{column.label}</h3>
                    <span className="bg-surface-800 text-surface-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-white/5">
                      {tasks.filter(t => t.status === column.id).length}
                    </span>
                  </div>
                  <button className="p-1 hover:bg-white/5 rounded-md text-surface-400 cursor-pointer transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
                  <SortableContext
                    items={tasks.filter(t => t.status === column.id).map(t => t.id.toString())}
                    strategy={verticalListSortingStrategy}
                  >
                    <AnimatePresence>
                      {tasks.filter(t => t.status === column.id).map((task) => (
                        <SortableTaskCard key={task.id} task={task} />
                      ))}
                    </AnimatePresence>
                  </SortableContext>
                </div>
              </div>
            ))}
          </div>

          {/* Drag Overlay for smooth preview */}
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
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    activeTask.priority === 'URGENT' ? 'bg-red-500/20 text-red-500' :
                    activeTask.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-500' :
                    'bg-blue-500/20 text-blue-500'
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
      </main>
    </div>
  );
};

export default DashboardPage;
