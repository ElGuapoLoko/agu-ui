import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '../../core/api/api-url.token';
import { Task, TaskInput, TaskUpdate } from '../../shared/models/task';

@Injectable({ providedIn: 'root' })
export class TasksApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_URL)}/tasks`;

  list(): Observable<Task[]> {
    return this.http.get<Task[]>(this.baseUrl);
  }

  create(input: TaskInput): Observable<Task> {
    return this.http.post<Task>(this.baseUrl, input);
  }

  update(id: number, update: TaskUpdate): Observable<Task> {
    return this.http.put<Task>(`${this.baseUrl}/${id}`, update);
  }

  setDone(id: number, done: boolean): Observable<Task> {
    return this.http.patch<Task>(`${this.baseUrl}/${id}`, { done });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
