start-minio:
	@echo "-> START MINIO"
	docker run -d \
		-p 9000:9000 \
		-p 9001:9001 \
		--name minio \
		-e MINIO_ROOT_USER=minioadmin \
		-e MINIO_ROOT_PASSWORD=minioadmin \
		-v ./temp/minio:/data \
		minio/minio server /data --console-address ":9001"

stop-minio:
	@echo "-> STOP MINIO"
	docker stop minio
	docker rm minio

