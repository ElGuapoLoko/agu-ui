import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { TaskItemComponent } from './task-item.component';
import { makeTask } from './testing/task-fixtures';

describe('TaskItemComponent', () => {
  let fixture: ComponentFixture<TaskItemComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    registerLocaleData(localePt);
    await TestBed.configureTestingModule({
      imports: [TaskItemComponent],
      providers: [provideNoopAnimations(), { provide: LOCALE_ID, useValue: 'pt-BR' }],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskItemComponent);
    element = fixture.nativeElement;
  });

  function render(overrides = {}, busy = false): void {
    fixture.componentRef.setInput('task', makeTask(overrides));
    fixture.componentRef.setInput('busy', busy);
    fixture.detectChanges();
  }

  it('renders title, description with line breaks and dates', () => {
    render({ title: 'Comprar café', description: 'linha 1\nlinha 2', updatedAt: '2026-10-13T13:00:00+00:00' });
    expect(element.querySelector('.stamp')).toBeNull();

    expect(element.querySelector('.title')?.textContent).toBe('Comprar café');
    expect(element.querySelector('.description')?.textContent).toBe('linha 1\nlinha 2');
    expect(element.querySelector('.meta')?.textContent).toContain('editada em');
  });

  it('escapes HTML in user content', () => {
    render({ title: '<img src=x onerror=alert(1)>' });

    expect(element.querySelector('.title img')).toBeNull();
    expect(element.querySelector('.title')?.textContent).toBe('<img src=x onerror=alert(1)>');
  });

  it('marks done tasks with a stamp and hides missing descriptions', () => {
    render({ done: true });

    expect(element.querySelector('.item')?.classList).toContain('done');
    expect(element.querySelector('.stamp')?.textContent?.trim()).toBe('Concluída');
    expect(element.querySelector('.description')).toBeNull();
    expect(element.querySelector('.meta')?.textContent).not.toContain('editada em');
  });

  it('emits the new done value', () => {
    render();
    const emitted: boolean[] = [];
    fixture.componentInstance.toggle.subscribe((value) => emitted.push(value));

    element.querySelector<HTMLInputElement>('input[type=checkbox]')!.click();

    expect(emitted).toEqual([true]);
  });

  it('disables actions while busy', () => {
    render({}, true);

    expect(element.querySelector<HTMLInputElement>('input[type=checkbox]')!.disabled).toBeTrue();
    expect(element.querySelector<HTMLButtonElement>('button[mat-icon-button]')!.disabled).toBeTrue();
    expect(element.querySelector('.item')?.getAttribute('aria-busy')).toBe('true');
  });
});
