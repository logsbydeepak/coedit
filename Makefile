all: prod

prod:
	@echo "-> BUILDING PRODUCTION IMAGE" 
	docker build --tag coedit:latest .

dev:
	@echo "-> BUILDING DEV IMAGE" 
	docker build -f dev.dockerfile --tag coedit:dev .

dev-start:
	@echo "-> DEV IMAGE START" 
	docker run --name coedit-dev --user root -it -v .:/root/coedit -p 3001:3001 -p 3002:3002 coedit:dev bash

dev-stop:
	@echo "-> DEV IMAGE STOP" 
	docker rm -f coedit-dev

