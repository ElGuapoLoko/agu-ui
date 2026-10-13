# AGU Tarefas: frontend (Angular)

Interface do teste técnico (To-Do List). O enunciado está no [README.md](README.md), que não foi alterado. Todos os comandos citados nele funcionam: `ng serve`, `ng generate`, `ng build`, `ng test` e `ng e2e`.

## Como rodar

Este repositório é independente do backend. Os dois se comunicam quando os dois estão no ar.

**Com Docker (só precisa de Docker):**

```bash
cd agu-angular
make up          # build de produção servido por nginx em http://localhost:4200
make help        # lista todos os comandos
```

O `make up` cria a rede Docker `agu-tasks-net` se ela não existir e sobe o container. O nginx do container encaminha `/api` para `http://agu-api:8080`, que é a API do repositório `agu-php` (`make up` lá). Se a API ainda não estiver no ar, a aplicação abre normalmente e avisa que o servidor está indisponível. Para outro endereço de API, defina `API_UPSTREAM` no `.env` (veja o `.env.example`).

**Para desenvolver (Node 20 + recarga automática):**

```bash
make install     # npm ci
make dev         # ng serve em http://localhost:4200, com proxy /api → http://localhost:8080
```

O `make dev` usa a mesma porta do container. Rode `make down` antes.

## Qualidade

```bash
make lint                # angular-eslint + @ngrx/eslint-plugin (OnPush, sem any, acessibilidade) + Prettier
make test                # 156 testes unitários (Karma/Jasmine, ChromeHeadless), ~98% de cobertura de linhas
make build               # bundle inicial ~407 kB (~101 kB comprimido)
make e2e                 # Playwright: 6 cenários × desktop e celular, contra o app no ar (make up aqui e no agu-php)
npx ng e2e               # o mesmo, mas subindo o servidor de desenvolvimento (porta 4200 livre)
```

O CI (`.github/workflows/ci.yml`) roda lint, formatação, testes unitários e build.

## Requisitos do enunciado

| Exigido | Como foi feito |
|---|---|
| Angular 17 | Angular 17.3, componentes standalone, novo control flow (`@if`, `@for`) |
| Angular Material ou PrimeNG | Angular Material 17, com tema próprio claro e escuro automático |
| Formulários reativos | `NonNullableFormBuilder` tipado nos três formulários |
| NgRx | Store + Effects + Entity (`createFeature`, efeitos funcionais) |
| TypeScript 5.4/5.5, SASS | TypeScript 5.4.5, SCSS |
| JWT | Token no header `Authorization`, renovação de sessão e logout automático quando expira |
| Interface intuitiva e responsiva | Identidade visual própria (“Pauta”), testada em desktop e celular (390 px), sem rolagem horizontal |

## Identidade visual

A direção visual se chama **Pauta**: a lista de tarefas é tratada como a pauta do dia de um órgão jurídico.
- **Paleta:** azul-tinta `#14284B`, fundo papel `#F3F5F8`, azul institucional `#1F4FA3` e verde-carimbo `#2E7D5B`. O tema do Material usa paletas próprias, e o modo escuro é automático.
- **Tipografia:** Literata (serifa) nos títulos e Public Sans na interface, servidas localmente.
- **Tarefas:** ficam numa folha única com divisórias. O progresso do dia aparece numa barra.
- **Tarefa concluída:** recebe um carimbo "Concluída" com uma animação curta, que é desligada quando o sistema pede redução de movimento.

## Arquitetura

```
src/app/
  core/
    api/        API_URL (token de injeção)
    auth/       TokenStorage, AuthApi, interceptors, guards, safeReturnUrl, restauração da sessão, store/
    http/       toApiError (qualquer falha HTTP vira mensagem segura em português)
    layout/     ShellComponent (toolbar + menu do usuário)
    notify/     NotificationService (snackbar)
  features/
    auth/       LoginPage, RegisterPage, AuthCardComponent
    tasks/      TasksPage, TaskItemComponent, TaskFormDialog, TasksApi, store/, tasks.routes.ts
  shared/
    models/     Task, User
    ui/         ConfirmDialog
    validation/ LIMITS (iguais aos do backend), normalize, validators, form-errors
```

**Fluxo NgRx:** a página dispara uma ação (`TasksPageActions.create`). O efeito chama a `TasksApi` e responde com `TasksApiActions.createSuccess` ou `createFailure`. O reducer, com `@ngrx/entity`, atualiza a lista. Os componentes leem o estado com `selectSignal`.

- **Carregamento sob demanda:** login, cadastro, shell e toda a área de tarefas (incluindo o store e os efeitos dela) só carregam quando são usados. O bundle inicial não leva o Angular Material.
- **Concluir uma tarefa é otimista:** a interface muda na hora e desfaz se a API falhar.
- **Ordem das gravações:** criar e editar rodam em sequência (`concatMap`), então uma edição posterior nunca chega antes da anterior.
- **Diálogo de criar/editar:** cada envio leva um `requestId`. O diálogo só fecha quando a sua própria requisição é confirmada e mostra no lugar os erros de validação da API.

## Como a interface evita erros do usuário

- **Entrada limpa antes de validar e enviar**, com as mesmas regras do backend:
  - espaços extras são removidos;
  - o username fica em minúsculas;
  - um número digitado no título é aceito como texto.
- **Erros de validação:**
  - aparecem embaixo de cada campo, em português;
  - no envio, o foco vai para o primeiro campo com erro;
  - os erros 409 e 422 da API aparecem no campo correspondente.
- **Limites dos campos:**
  - `maxlength` e contador de caracteres;
  - aviso quando o limite é atingido.
- **Envios e perda de dados:**
  - o botão fica desabilitado durante o envio, o que evita tarefas duplicadas por duplo clique;
  - excluir pede confirmação;
  - fechar o diálogo com alterações pede confirmação.
- **Sessão:**
  - se expirar, o usuário volta ao login com a explicação e depois retorna à página em que estava;
  - o `returnUrl` só aceita caminhos internos, o que bloqueia redirecionamentos para outros sites.
- **API fora do ar ou sem conexão:** mensagem clara. Nenhum erro técnico chega ao usuário.
- **Estados de tela:** carregando, vazio, vazio por filtro e erro com o botão "Tentar novamente".
- **Filtro na URL** (`?filter=open|done`): dá para salvar o link e usar o botão voltar.
- **Acessibilidade:**
  - labels em todos os campos e `aria-label` nos botões de ícone;
  - foco visível e link "Pular para o conteúdo";
  - suporte a `prefers-reduced-motion`;
  - revisão com as Vercel Web Interface Guidelines.

## Decisões técnicas

| Decisão | Motivo |
|---|---|
| Token no `localStorage`, acessado só pelo `TokenStorage` | É simples e suficiente aqui. Um cookie httpOnly seria mais resistente a XSS, mas exige proteção contra CSRF. A troca ficaria isolada num único serviço. |
| Aviso de sessão expirada na tela de login (`?expired=1`) | Evita carregar o snackbar e o overlay do Material no bundle inicial. |
| Redux DevTools só no build de desenvolvimento | Nada de devtools em produção; `password` e `token` aparecem mascarados. |
| Fontes servidas localmente (npm) | Sem chamadas ao Google Fonts: mais privacidade, funciona offline e é compatível com CSP. |
| Tema só com os componentes Material usados | O CSS global caiu de 174 kB para 89 kB. |
| Imagem Docker com nginx sem root e CSP estrita | O build crítico de CSS inline (`inlineCritical`) foi desligado, porque o atributo `onload` que ele injeta seria bloqueado pela CSP. |

## Segurança

- **Conteúdo do usuário é sempre escapado:** o app só interpola texto. Não há `innerHTML` nem `bypassSecurityTrust*`, e um teste confirma que HTML no título aparece como texto.
- **Token:** só vai para requisições à própria API, nunca para outros domínios nem para `/login` e `/register`.
- **Análises feitas:**
  - CodeQL (`javascript-security-extended`): 0 achados em 67 arquivos;
  - osv-scanner e `npm audit`;
  - Trivy no Dockerfile: 0 achados.
- **Risco aceito: Angular 17 fora de suporte.** O `npm audit` aponta advisories no `@angular/*` 17.3, todos corrigidos só a partir do Angular 19 ou 20. Como o enunciado exige o Angular 17, analisamos cada um e nenhum se aplica a este app:
  - `HttpTransferCache`, hidratação e SSR: não usados (o app só roda no navegador);
  - XSS via i18n: o app não usa atributos i18n;
  - XSS via SVG, MathML e namespaces: nenhum valor do usuário entra em atributos SVG ou em templates dinâmicos;
  - vazamento de token XSRF: o app não usa o XSRF do `HttpClient`;
  - DoS em `formatDate` e `digitsInfo`: os formatos são fixos e não vêm do usuário.
  - As demais ocorrências são de ferramentas de build e do servidor de desenvolvimento, que não vão para o navegador. O `npm audit fix` já atualizou o que era possível sem mudar de versão maior.
