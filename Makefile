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
		-it \
		-v .:/root/coedit \
		-v /root/coedit/node_modules/ \
		-p 4000:4000 \
		-p 4001:4001 \
		-p 5000:5000 \
		-p 5001:5001 \
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
