DC := docker compose
# Angular 17 needs Node 20; nvm is loaded when available so targets work from any shell.
NODE := . "$$HOME/.nvm/nvm.sh" >/dev/null 2>&1 && nvm use >/dev/null 2>&1; true &&

.DEFAULT_GOAL := help
.PHONY: help network up down logs install dev test lint format build e2e

help: ## List available targets
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-9s %s\n", $$1, $$2}'

network: ## Create the Docker network shared with the backend repository (if missing)
	@docker network inspect agu-tasks-net >/dev/null 2>&1 || docker network create agu-tasks-net >/dev/null

up: network ## Build and start the app in Docker on http://localhost:4200 (waits until healthy)
	$(DC) up -d --build --wait
	@echo "App ready at http://localhost:$${FRONTEND_PORT:-4200} (needs the API: 'make up' in agu-php)"

down: ## Stop the container
	$(DC) down

logs: ## Follow container logs
	$(DC) logs -f

install: ## Install npm dependencies (Node 20)
	@$(NODE) npm ci

dev: ## Dev server with live reload on http://localhost:4200 (stop 'make up' first: same port)
	@$(NODE) npx ng serve

test: ## Unit tests (ChromeHeadless, with coverage)
	@$(NODE) npm run test:ci

lint: ## ESLint + Prettier check
	@$(NODE) npm run lint && npm run format:check

format: ## Apply Prettier
	@$(NODE) npm run format

build: ## Production build into dist/
	@$(NODE) npm run build

e2e: ## Playwright end-to-end tests against the running app (make up here and in agu-php)
	@$(NODE) PLAYWRIGHT_TEST_BASE_URL=http://localhost:$${FRONTEND_PORT:-4200} npx playwright test
