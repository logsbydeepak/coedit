all: prod

prod:
	@echo "-> BUILDING PRODUCTION IMAGE"
	docker build -f ./dockerfile --tag coedit:latest ./../../

dev:
	@echo "-> BUILDING DEV IMAGE"
	docker build -f ./dev.dockerfile --tag coedit:dev ./../../

dev-start:
	@echo "-> DEV IMAGE START"
	docker run --name coedit-dev \
		--rm \
		--user root \
		-it \
		-v ./../../.:/root/coedit \
		-v /root/coedit/node_modules/ \
		-p 4000:8000 \
		-p 3000:3000 \
		--add-host host.docker.internal:host-gateway \
		coedit:dev bash

dev-attach:
	@echo "-> DEV ATTACH"
	docker exec \
		--user root \
		-it \
		coedit-dev bash

dev-stop:
	@echo "-> DEV IMAGE STOP"
	docker rm -f coedit-dev

prod-start:
	@echo "-> PROD IMAGE START"
	docker run --name coedit-prod \
		--rm \
		-p 4000:80 \
		-p 3000:3000 \
		--add-host host.docker.internal:host-gateway \
		-e USER_API="http://host.docker.internal:5000" \
		-e CORS_ORIGIN='http://localhost:5001' \
		coedit:latest /root/coedit/coedit-container-process

prod-stop:
	@echo "-> PROD IMAGE STOP"
	docker rm -f coedit-prod

