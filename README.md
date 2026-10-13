# Atenção
Não crie PR ou faça commit neste repositório. Faça o download do skeleton, implemente sua solução, coloque no seu github e compartilhe conosco uma PR para revisão do código, em seguida iremos entrar em contato para uma segunda conversa para que nos explique o seu código.


# Requisitos para Teste Técnico de Desenvolvedor AGU
## Descrição do Projeto
Você será responsável por desenvolver uma aplicação simples de gerenciamento de tarefas (To-Do List) que permita ao usuário adicionar, editar, remover e listar tarefas. A aplicação deverá ser desenvolvida utilizando a stack especificada. A interface deve ser intuitiva e responsiva. A comunicação entre o frontend e o backend deve ser realizada via REST API.
Este teste pode ser melhorado, porém é necessário que seja respeitado as tecnologias listas.

## Requisitos Funcionais
### Autenticação:

O usuário deve ser capaz de se autenticar utilizando JWT.
A autenticação deve ser implementada no backend com PHP e Symfony.

### Gerenciamento de Tarefas:

- Adicionar uma nova tarefa.
- Editar uma tarefa existente.
- Remover uma tarefa.
- Listar todas as tarefas.
As tarefas devem ser armazenadas em um banco de dados MySQL.

### Interface de Usuário:

- Desenvolver a interface em Angular 17.
- Utilizar Angular Material ou PrimeNG para componentes UI.
- Implementar formulários reativos com Angular Forms.
- Utilizar NgRx para gerenciamento de estado.
- Requisitos Não Funcionais

## Tecnologias Utilizadas
### Frontend:

- Angular 17
- Rxjs ou Ngrx ou Signals
- TypeScript 5.4/5.5
- SASS
- HTML 5.2
- CSS 2.1
- JWT
- WebSocket/SSE (opcional)

--- 


# Frontend

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.3.8.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

---

## Run with Docker

Passo a passo para subir a **interface** num computador que nunca rodou o projeto. Ela roda em container: não é preciso instalar Node nem Angular.

### 1. Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (ou Docker Engine + Docker Compose v2) **aberto e rodando**
- Git
- `make` (já vem no macOS e no Linux; no Windows use o WSL2 ou os comandos da opção B)
- Porta livre: `4200`
- A API rodando: repositório [agu-api](https://github.com/ElGuapoLoko/agu-api), seção "Run with Docker" do README dele. A ordem não importa: sem a API, a tela abre e avisa que o servidor está indisponível.

### 2. Baixar o projeto

```bash
git clone https://github.com/ElGuapoLoko/agu-ui.git
cd agu-ui
```

### 3. Criar o arquivo de configuração (`.env`)

```bash
cp .env.example .env
```

O frontend não tem senhas. O `.env` só define a porta (`FRONTEND_PORT=4200`) e o endereço da API dentro do Docker (`API_UPSTREAM=http://agu-api:8080`). Os valores padrão funcionam sem mudança.

### 4. Subir

**Opção A, com make (recomendado):**

```bash
make up
```

**Opção B, sem make:**

```bash
docker network create agu-tasks-net
docker compose up -d --build --wait
```

> Se a rede já existir (porque a API subiu antes), o primeiro comando mostra `Error response from daemon: network with name agu-tasks-net already exists`. Pode ignorar e seguir.

A primeira subida leva alguns minutos, porque compila o Angular dentro do container.

### 5. Usar

Abra **http://localhost:4200** e entre com **admin / admin**, ou crie uma conta em "Criar conta".

O frontend e a API se comunicam pela rede Docker `agu-tasks-net`: o navegador só acessa `localhost:4200`, e as chamadas `/api` são repassadas para a API.

### Comandos úteis

| Comando | O que faz |
|---|---|
| `make down` / `docker compose down` | Para o container |
| `make logs` | Mostra os logs |
| `make e2e` | Roda os testes de ponta a ponta contra o app no ar (precisa de Node 20) |
| `make help` | Lista todos os comandos |

### Problemas comuns

- **`Cannot connect to the Docker daemon`:** o Docker Desktop não está aberto.
- **`network agu-tasks-net declared as external, but could not be found`:** rode `docker network create agu-tasks-net` (ou use `make up`).
- **A tela mostra "O servidor está indisponível":** a API não está rodando. Suba o `agu-api`.
- **Porta 4200 em uso:** troque `FRONTEND_PORT` no `.env`.
