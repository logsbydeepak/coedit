create-bucket:
	@echo "-> CREATE BUCKET"
	aws s3 mb s3://coedit-dev

delete-bucket:
	@echo "-> DELETE BUCKET"
	aws s3 rb s3://coedit-dev --force

list-buckets:
	@echo "-> LIST BUCKETS"
	aws s3 ls
