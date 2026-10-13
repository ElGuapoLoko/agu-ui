DC := docker compose
NODE := . "$$HOME/.nvm/nvm.sh" >/dev/null 2>&1 && nvm use >/dev/null 2>&1; true &&

.DEFAULT_GOAL := help
.PHONY: help network up down logs install dev test lint format build e2e

help:
	@printf '  %-10s %s\n' 'up' 'Build and start the app in Docker on http://localhost:4200'
	@printf '  %-10s %s\n' 'down' 'Stop the container'
	@printf '  %-10s %s\n' 'logs' 'Follow container logs'
	@printf '  %-10s %s\n' 'install' 'Install npm dependencies (Node 20)'
	@printf '  %-10s %s\n' 'dev' 'Dev server with live reload on http://localhost:4200'
	@printf '  %-10s %s\n' 'test' 'Unit tests (ChromeHeadless, with coverage)'
	@printf '  %-10s %s\n' 'lint' 'ESLint and Prettier check'
	@printf '  %-10s %s\n' 'format' 'Apply Prettier'
	@printf '  %-10s %s\n' 'build' 'Production build into dist/'
	@printf '  %-10s %s\n' 'e2e' 'Playwright tests against the running app'
	@printf '  %-10s %s\n' 'network' 'Create the network shared with the backend'

network:
	@docker network inspect agu-tasks-net >/dev/null 2>&1 || docker network create agu-tasks-net >/dev/null

up: network
	$(DC) up -d --build --wait
	@echo "App ready at http://localhost:$${FRONTEND_PORT:-4200} (needs the API: 'make up' in agu-php)"

down:
	$(DC) down

logs:
	$(DC) logs -f

install:
	@$(NODE) npm ci

dev:
	@$(NODE) npx ng serve

test:
	@$(NODE) npm run test:ci

lint:
	@$(NODE) npm run lint && npm run format:check

format:
	@$(NODE) npm run format

build:
	@$(NODE) npm run build

e2e:
	@$(NODE) PLAYWRIGHT_TEST_BASE_URL=http://localhost:$${FRONTEND_PORT:-4200} npx playwright test
