all: prod

prod:
	@echo "-> BUILDING PRODUCTION IMAGE" 
	docker build --tag coedit:latest .

dev:
	@echo "-> BUILDING DEV IMAGE" 
	docker build -f dev.dockerfile --tag coedit:dev .

dev-start:
	@echo "-> DEV IMAGE START" 
	docker run --name coedit-dev \
		--user root \
		-it -v .:/root/coedit \
		-e API_PORT=4000 \
		-e WS_PORT=4001 \
		-p 4001:4001 \
		-p 4002:4002 \
		coedit:dev bash

dev-stop:
	@echo "-> DEV IMAGE STOP" 
	docker rm -f coedit-dev

