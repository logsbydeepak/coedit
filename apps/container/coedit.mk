DOCKER_FILE=coedit.dockerfile
DOCKER_IMAGE=coedit:latest
DOCKER_CONTAINER=coedit

all: build

build:
	@echo "-> Building image"
	docker build --file $(DOCKER_FILE) . -t $(DOCKER_IMAGE)

