build:
	@echo "-> BUILD coedit-proxy"
	xcaddy build --output dist/coedit-proxy --with example.com/coedit-proxy=.

dev-start:
	@echo "-> DEV START coedit-proxy"
	./dist/coedit-proxy run --config Caddyfile.dev --adapter caddyfile

format:
	caddy fmt Caddyfile.dev --overwrite
	go fmt ./...

container-dev-build:
	@echo "-> BUILD COEDIT DEV PROXY"
	docker build -f ./dev.dockerfile --tag coedit-dev-proxy:latest ./../../

container-prod-build:
	@echo "-> BUILD COEDIT PROD PROXY"
	docker build -f ./dockerfile --tag coedit-proxy:latest ./../../

container-dev-create-network:
	docker network create coedit-dev-proxy-network

container-prod-start:
	@echo "-> START COEDIT PROD PROXY"
	docker run --name coedit-proxy \
		--rm \
		-p 80:80 \
		-e ROOT_DOMAIN='localhost' \
		-e REDIS_URL='' \
		coedit-proxy

container-prod-stop:
	@echo "-> STOP COEDIT PROD PROXY"
	docker rm -f coedit-dev-proxy

container-dev-start:
	@echo "-> START COEDIT DEV PROXY"
	docker run --name coedit-dev-proxy \
		--rm \
		-it \
		-v ./../../.:/root/coedit \
		-p 80:80 \
		-w /root/coedit/ \
		--network coedit-dev-proxy-network \
		coedit-dev-proxy sh

container-dev-attach:
	@echo "-> ATTACH COEDIT DEV PROXY"
	docker exec \
		-it \
		coedit-dev-proxy sh

container-dev-stop:
	@echo "-> STOP COEDIT DEV PROXY"
	docker rm -f coedit-dev-proxy
