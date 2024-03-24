all: build clean-before run remove-output cp clean-after

build:
	@echo "-> Building node-pty"
	docker build --file dockerfile.build . -t node-pty:build

run:
	@echo "-> Running node-pty"
	docker run -dit --name node-pty-build node-pty:build

cp:
	@echo "-> Copying node-pty"
	docker cp node-pty-build:/home/coedit/node-pty/build/Release/ ./node-pty

remove-output:
	@echo "-> Removing output"
	rm -rf ./node-pty

clean-before clean-after clean:
	@echo "-> Cleaning node-pty-build"
	docker rm -f node-pty-build
