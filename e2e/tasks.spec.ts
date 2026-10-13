import { Page, expect, test } from '@playwright/test';

function uniqueUsername(): string {
  return `e2e.${Date.now()}.${Math.floor(Math.random() * 1e6)}`;
}

const PASSWORD = 'senha-e2e-123';

async function register(page: Page, username: string): Promise<void> {
  await page.goto('/register');
  await page.getByLabel('Usuário').fill(`  ${username.toUpperCase()} `);
  await page.getByLabel('Senha', { exact: true }).fill(PASSWORD);
  await page.getByLabel('Confirmar senha').fill(PASSWORD);
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page).toHaveURL(/\/tasks$/);
}

async function openNewTaskDialog(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Nova tarefa' }).locator('visible=true').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

test('anonymous users are sent to the login page', async ({ page }) => {
  await page.goto('/tasks');

  await expect(page).toHaveURL(/\/login\?returnUrl=%2Ftasks$/);
  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible();
});

test('registration validates the form before calling the API', async ({ page }) => {
  await page.goto('/register');
  await page.getByRole('button', { name: 'Criar conta' }).click();

  await expect(page.getByText('Informe o nome de usuário.')).toBeVisible();
  await expect(page.getByText('Informe a senha.')).toBeVisible();
  await expect(page.getByText('Repita a senha.')).toBeVisible();
  await expect(page).toHaveURL(/\/register$/);
});

test('full task lifecycle: register, create, complete, edit, delete, logout and login', async ({ page }) => {
  const username = uniqueUsername();
  await register(page, username);

  await expect(page.getByText('Nenhuma tarefa ainda. Crie a primeira!')).toBeVisible();

  await openNewTaskDialog(page);
  await page.getByLabel('Título').fill('    ');
  await page.getByRole('button', { name: 'Criar' }).click();
  await expect(page.getByText('O título é obrigatório.')).toBeVisible();

  await page.getByLabel('Título').fill('  Comprar    café ');
  await page.getByLabel('Descrição (opcional)').fill('  linha 1\n  linha 2  ');
  await page.getByRole('button', { name: 'Criar' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Comprar café', exact: true })).toBeVisible();

  await openNewTaskDialog(page);
  await page.getByLabel('Título').fill('2026');
  await page.getByLabel('Título').press('Enter');
  await expect(page.getByRole('heading', { name: '2026', exact: true })).toBeVisible();
  await expect(page.locator('.summary')).toHaveText('0 de 2 concluídas (2 pendentes)');

  await page.getByRole('checkbox', { name: /Comprar café/ }).check();
  await expect(page.locator('.summary')).toHaveText('1 de 2 concluídas (1 pendente)');
  await expect(page.locator('.stamp')).toHaveText('Concluída');
  await page.getByRole('button', { name: /^Concluídas/ }).click();
  await expect(page.getByRole('heading', { level: 3 })).toHaveText(['Comprar café']);
  await page.getByRole('button', { name: /^Todas/ }).click();

  await page.getByRole('button', { name: 'Ações da tarefa 2026' }).click();
  await page.getByRole('menuitem', { name: 'Editar' }).click();
  await page.getByLabel('Título').fill('Planejar 2026');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByRole('heading', { name: 'Planejar 2026', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Ações da tarefa Planejar 2026' }).click();
  await page.getByRole('menuitem', { name: 'Excluir' }).click();
  await page.getByRole('button', { name: 'Excluir' }).click();
  await expect(page.getByRole('heading', { name: 'Planejar 2026' })).toBeHidden();

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Comprar café', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Menu do usuário' }).click();
  await page.getByRole('menuitem', { name: 'Sair' }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel('Usuário').fill(username);
  await page.getByLabel('Senha', { exact: true }).fill('senha-errada-1');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('alert')).toContainText('Usuário ou senha inválidos.');

  await page.getByLabel('Senha', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/tasks$/);
  await expect(page.getByRole('heading', { name: 'Comprar café', exact: true })).toBeVisible();
});

test('users never see each other’s tasks', async ({ browser }) => {
  const firstUser = await browser.newPage();
  await register(firstUser, uniqueUsername());
  await openNewTaskDialog(firstUser);
  await firstUser.getByLabel('Título').fill('Tarefa privada da Ana');
  await firstUser.getByRole('button', { name: 'Criar' }).click();
  await expect(firstUser.getByRole('heading', { name: 'Tarefa privada da Ana' })).toBeVisible();

  const secondUser = await browser.newPage();
  await register(secondUser, uniqueUsername());
  await expect(secondUser.getByText('Nenhuma tarefa ainda. Crie a primeira!')).toBeVisible();
  await expect(secondUser.getByText('Tarefa privada da Ana')).toHaveCount(0);
});

test('an invalid session sends the user back to login with an explanation', async ({ page }) => {
  await register(page, uniqueUsername());

  await page.evaluate(() => {
    const token = localStorage.getItem('agu.token') ?? '';
    localStorage.setItem('agu.token', `${token.slice(0, -6)}AAAAAA`);
  });
  await page.reload();

  await expect(page).toHaveURL(/\/login\?returnUrl=%2Ftasks&expired=1$/);
  await expect(page.getByRole('status')).toContainText('Sua sessão expirou');
});

test('the page never scrolls horizontally', async ({ page }) => {
  await register(page, uniqueUsername());
  await openNewTaskDialog(page);
  await page.getByLabel('Título').fill('x'.repeat(255));
  await page.getByRole('button', { name: 'Criar' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
