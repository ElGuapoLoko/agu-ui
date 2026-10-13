export interface Task {
  id: number;
  title: string;
  description: string | null;
  done: boolean;
  /** ISO 8601 */
  createdAt: string;
  /** ISO 8601 */
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
