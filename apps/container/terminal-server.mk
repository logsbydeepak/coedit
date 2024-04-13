DOCKER_FILE=terminal-server.dockerfile
DOCKER_IMAGE=terminal-server:build
DOCKER_CONTAINER=terminal-server-build
OUTPUT_DIR=./dist

all: clean build run remove-output cp clean

build:
	@echo "-> Building image"
	docker build --file $(DOCKER_FILE) . -t $(DOCKER_IMAGE)

run:
	@echo "-> Running container"
	docker run -dit --name $(DOCKER_CONTAINER) $(DOCKER_IMAGE)

cp:
	@echo "-> Copying from container to host"
	docker cp $(DOCKER_CONTAINER):/home/coedit/terminal-server/dist $(OUTPUT_DIR)

remove-output:
	@echo "-> Removing output"
	rm -rf $(OUTPUT_DIR)

clean:
	@echo "-> Removing container"
	docker rm -f $(DOCKER_CONTAINER)

