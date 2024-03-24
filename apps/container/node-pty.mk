DOCKER_FILE=dockerfile.node-pty
DOCKER_IMAGE=node-pty:build
DOCKER_CONTAINER=node-pty-build
OUTPUT_DIR=./node-pty

all: build run remove-output cp clean

build:
	@echo "-> Building image"
	docker build --file $(DOCKER_FILE) . -t $(DOCKER_IMAGE)

run:
	@echo "-> Running container"
	docker run -dit --name $(DOCKER_CONTAINER) $(DOCKER_IMAGE)

cp:
	@echo "-> Copying from container to host"
	docker cp $(DOCKER_CONTAINER):/home/coedit/node-pty/build/Release/ $(OUTPUT_DIR)

remove-output:
	@echo "-> Removing output"
	rm -rf $(OUTPUT_DIR)

clean:
	@echo "-> Removing container"
	docker rm -f $(DOCKER_CONTAINER)

