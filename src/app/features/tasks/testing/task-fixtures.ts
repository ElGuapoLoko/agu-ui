import { Task } from '../../../shared/models/task';

export function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 1,
    title: 'Tarefa',
    description: null,
    done: false,
    createdAt: '2026-10-13T12:00:00+00:00',
    updatedAt: '2026-10-13T12:00:00+00:00',
    ...overrides,
  };
}
