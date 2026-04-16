import api from './api';
import type { TaskStatus, TaskPriority } from '../types';

export interface CreateTaskData {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: number;
}

export const tasksService = {
  async getAll(params?: any) {
    const response = await api.get('/tasks', { params });
    return response.data;
  },

  async create(data: CreateTaskData) {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  async update(id: number, data: any) {
    const response = await api.patch(`/tasks/${id}`, data);
    return response.data;
  },

  async delete(id: number) {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  }
};
