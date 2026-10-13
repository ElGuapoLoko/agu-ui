export interface Task {
  id: number;
  title: string;
  description: string | null;
  done: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskInput {
  title: string;
  description: string | null;
}

export interface TaskUpdate extends TaskInput {
  done: boolean;
}

export type TaskFilter = 'all' | 'open' | 'done';
