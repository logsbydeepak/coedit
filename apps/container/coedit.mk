DOCKER_FILE=dockerfile.coedit
DOCKER_IMAGE=coedit:latest
DOCKER_CONTAINER=coedit

all: build clean

build:
	@echo "-> Building image"
	docker build --file $(DOCKER_FILE) . -t $(DOCKER_IMAGE)

clean:
	@echo "-> Removing container"
	docker rm -f $(DOCKER_CONTAINER)
