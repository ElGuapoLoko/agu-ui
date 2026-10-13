import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_URL } from '../../core/api/api-url.token';
import { TasksApi } from './tasks.api';
import { makeTask } from './testing/task-fixtures';

describe('TasksApi', () => {
  let api: TasksApi;
  let backend: HttpTestingController;
  const task = makeTask({ id: 7 });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api' }],
    });
    api = TestBed.inject(TasksApi);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('maps each operation to the REST contract', () => {
    api.list().subscribe();
    backend.expectOne({ method: 'GET', url: '/api/tasks' }).flush([task]);

    api.create({ title: 'a', description: null }).subscribe();
    const create = backend.expectOne({ method: 'POST', url: '/api/tasks' });
    expect(create.request.body).toEqual({ title: 'a', description: null });
    create.flush(task);

    api.update(7, { title: 'b', description: 'c', done: true }).subscribe();
    const update = backend.expectOne({ method: 'PUT', url: '/api/tasks/7' });
    expect(update.request.body).toEqual({ title: 'b', description: 'c', done: true });
    update.flush(task);

    api.setDone(7, true).subscribe();
    const patch = backend.expectOne({ method: 'PATCH', url: '/api/tasks/7' });
    expect(patch.request.body).toEqual({ done: true });
    patch.flush(task);

    api.delete(7).subscribe();
    backend.expectOne({ method: 'DELETE', url: '/api/tasks/7' }).flush(null, { status: 204, statusText: 'No Content' });
  });
});
