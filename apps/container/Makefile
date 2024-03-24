build-final-image: build-node-pty build-server build-coedit-image

build-node-pty:
	@echo "-> RUN:node-pty.mk"
	make -f node-pty.mk

build-server:
	@echo "-> RUN:server.mk"
	make -f server.mk

build-coedit-image:
	@echo "-> RUN:final-image.mk"
	make -f coedit.mk

