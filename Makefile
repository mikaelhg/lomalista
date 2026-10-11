LOMALISTA_DB         ?= /var/lib/lomalista/db.sqlite
LOMALISTA_BIND       ?= 0.0.0.0:3000
LOMALISTA_STATIC_DIR ?= ../frontend/dist

.PHONY: help install dev-backend dev-frontend test test-backend test-frontend lint \
        build build-frontend build-backend run clean

help:
	@echo "Targets:"
	@echo "  install        install frontend dependencies (pnpm install)"
	@echo "  dev-backend    run API on 127.0.0.1:3000"
	@echo "  dev-frontend   run frontend dev server (proxies /api to the backend)"
	@echo "  test           backend and frontend tests, typecheck, biome, clippy"
	@echo "  build          production build of frontend and backend"
	@echo "  run            run the release build (LOMALISTA_DB, LOMALISTA_BIND, LOMALISTA_STATIC_DIR)"
	@echo "  clean          remove build outputs"

install:
	cd frontend && pnpm install

dev-backend:
	cd backend && cargo run

dev-frontend: install
	cd frontend && pnpm dev

test: test-backend test-frontend lint

test-backend:
	cd backend && cargo test

test-frontend:
	cd frontend && pnpm test && pnpm typecheck && pnpm check

lint:
	cd backend && cargo clippy --all-targets -- -D warnings

build: build-frontend build-backend

build-frontend: install
	cd frontend && pnpm build

build-backend:
	cd backend && cargo build --release

run: build
	cd backend && LOMALISTA_DB=$(LOMALISTA_DB) LOMALISTA_BIND=$(LOMALISTA_BIND) \
	LOMALISTA_STATIC_DIR=$(LOMALISTA_STATIC_DIR) ./target/release/lomalista

clean:
	cd backend && cargo clean
	rm -rf frontend/dist
