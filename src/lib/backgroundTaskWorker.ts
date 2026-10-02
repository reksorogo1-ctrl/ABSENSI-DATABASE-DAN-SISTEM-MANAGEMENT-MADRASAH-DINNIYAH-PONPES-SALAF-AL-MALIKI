/**
 * BACKGROUND TASK & ASYNC QUEUE WORKER
 * SIM Pondok Pesantren Salaf Al-Maliki
 * 
 * Mengelola proses berat (upload file besar, export chunked, backup snapshot,
 * kompresi gambar massal) di latar belakang sehingga UI tetap lancar 60 FPS
 * di HP, Tablet, dan Komputer.
 */

import { BackgroundTask } from '../types';

type TaskListener = (tasks: BackgroundTask[]) => void;

class BackgroundTaskManager {
  private tasks: BackgroundTask[] = [];
  private listeners: Set<TaskListener> = new Set();

  constructor() {
    // Muat task yang masih tersimpan di session jika ada
    try {
      const saved = sessionStorage.getItem('sim_bg_tasks');
      if (saved) {
        this.tasks = JSON.parse(saved);
      }
    } catch {}
  }

  private notify() {
    try {
      sessionStorage.setItem('sim_bg_tasks', JSON.stringify(this.tasks.slice(0, 20)));
    } catch {}
    this.listeners.forEach(cb => cb([...this.tasks]));
  }

  subscribe(listener: TaskListener): () => void {
    this.listeners.add(listener);
    listener([...this.tasks]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getTasks(): BackgroundTask[] {
    return [...this.tasks];
  }

  createTask(title: string, type: BackgroundTask['type']): string {
    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newTask: BackgroundTask = {
      id,
      title,
      type,
      status: 'running',
      progress: 0,
      startedAt: new Date().toISOString()
    };
    this.tasks = [newTask, ...this.tasks];
    this.notify();
    return id;
  }

  updateProgress(
    id: string, 
    progress: number, 
    extras?: { bytesTransferred?: number; totalBytes?: number; speedKBps?: number }
  ) {
    this.tasks = this.tasks.map(t => {
      if (t.id === id) {
        return {
          ...t,
          progress: Math.min(100, Math.max(0, progress)),
          bytesTransferred: extras?.bytesTransferred ?? t.bytesTransferred,
          totalBytes: extras?.totalBytes ?? t.totalBytes,
          speedKBps: extras?.speedKBps ?? t.speedKBps
        };
      }
      return t;
    });
    this.notify();
  }

  completeTask(id: string) {
    this.tasks = this.tasks.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: 'completed',
          progress: 100,
          completedAt: new Date().toISOString()
        };
      }
      return t;
    });
    this.notify();
  }

  failTask(id: string, errorMessage: string) {
    this.tasks = this.tasks.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: 'failed',
          errorMessage,
          completedAt: new Date().toISOString()
        };
      }
      return t;
    });
    this.notify();
  }

  clearCompleted() {
    this.tasks = this.tasks.filter(t => t.status === 'running');
    this.notify();
  }
}

export const backgroundTaskManager = new BackgroundTaskManager();
