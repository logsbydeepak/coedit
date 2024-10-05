build:
	@echo "-> BUILD coedit-proxy"
	xcaddy build --output dist/coedit-proxy --with example.com/coedit-proxy=.

dev-start:
	@echo "-> DEV START coedit-proxy"
	./dist/coedit-proxy run --config Caddyfile.dev --adapter caddyfile

format:
	caddy fmt Caddyfile.dev --overwrite
	go fmt ./...

