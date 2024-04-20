all: build-image

build-image:
	@echo "-> BUILDING IMAGE" 
	docker build --tag coedit:latest .
