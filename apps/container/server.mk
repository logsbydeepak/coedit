WORKING_DIR = ./terminal-server

all: install build

install:
	@echo "-> Installing dependencies"
	bun install --cwd $(WORKING_DIR)

build:
	@echo "-> Bundling file"
	bun run --cwd $(WORKING_DIR) build

