#!/bin/bash

REMOTE_FILE_PATH="/home/ec2-user/templates"

check_aws_auth() {
  aws ec2 describe-instances --query 'Reservations[*].Instances[*].[InstanceId]' --output text
  if [ $? -ne 0 ]; then
    echo "Please configure your AWS CLI"
    exit 1
  fi
}

remove_all_template_files_from_ec2() {
  ssh -i $KEY_PAIR_PATH $EC2_USER@$EC2_IP << EOF
    sudo rm -rf $REMOTE_FILE_PATH/*
EOF
}

remove_all_template_snapshots() {
  aws ec2 describe-snapshots --filters Name=tag:type,Values=template --query 'Snapshots[*].SnapshotId' --output text | xargs -n 1 aws ec2 delete-snapshot --snapshot-id
}

remove_all_template_volumes() {
  aws ec2 describe-volumes --filters Name=tag:type,Values=template --query 'Volumes[*].VolumeId' --output text | xargs -n 1 aws ec2 delete-volume --volume-id
}

upload_file() {
  PATH_TO_UPLOAD=$REMOTE_FILE_PATH/$1
  scp -i $KEY_PAIR_PATH -r ./$1 $EC2_USER@$EC2_IP:$PATH_TO_UPLOAD
}

create_volume() {
  VOLUME_ID=$(aws ec2 create-volume --size 10 --region $REGION --availability-zone $AVAILABILITY_ZONE --volume-type gp2 --query 'VolumeId' --output text)
  aws ec2 create-tags --resources $VOLUME_ID --tags Key=type,Value=template
  echo $VOLUME_ID
}

attach_volume() {
  aws ec2 attach-volume --volume-id $VOLUME_ID --instance-id $INSTANCE_ID --device /dev/sdf
}

unzip_file() {
  ssh -i $KEY_PAIR_PATH $EC2_USER@$EC2_IP << EOF
    unzip $REMOTE_FILE_PATH/$1 -d $REMOTE_FILE_PATH/
EOF
}

move_files_to_volume() {
  FILE_NAME=$(echo $1 | cut -f 1 -d '.')

  ssh -i $KEY_PAIR_PATH $EC2_USER@$EC2_IP << EOF
    sudo rm -rf /mnt/new-volume
    sudo mkfs -t ext4 /dev/sdf
    sudo mkdir /mnt/new-volume
    sudo mount /dev/sdf /mnt/new-volume
    sudo rm -rf /mnt/new-volume/*
    sudo mv $REMOTE_FILE_PATH/$FILE_NAME/{.*,*} /mnt/new-volume/
    sudo umount /mnt/new-volume
    sudo rm -rf /mnt/new-volume
EOF
}

create_snapshot() {
  VOLUME_ID=$1
  VOLUME_TAG_ID=$2
  SNAPSHOT_ID=$(aws ec2 create-snapshot --volume-id $VOLUME_ID --description "Snapshot of $VOLUME_ID" --query 'SnapshotId' --output text)
  aws ec2 create-tags --resources $SNAPSHOT_ID --tags Key=type,Value=template Key=id,Value=$VOLUME_TAG_ID
}

generate_tag_id() {
  ID=$(bun generate_template_id.ts | xargs)
  echo $ID
}

delete_volume() {
  aws ec2 delete-volume --volume-id $1
}

create_ec2_directory() {
  ssh -i $KEY_PAIR_PATH $EC2_USER@$EC2_IP << EOF
    mkdir -p $REMOTE_FILE_PATH
EOF
}

detach_volume() {
  aws ec2 detach-volume --volume-id $1
}

step_print() {
  echo "--------------------------------------"
  echo "-> $1"
  echo "--------------------------------------"
}

delay() {
  sleep 10
}



# RUN
source .env
step_print "Checking environment variables"
LIST_OF_ENV_VARS="REGION AVAILABILITY_ZONE INSTANCE_ID EC2_IP EC2_USER KEY_PAIR_PATH"
for env_var in $LIST_OF_ENV_VARS; do
  if [ -z "${!env_var}" ]; then
    echo "$env_var is not set"
    exit 1
  fi
done

step_print "Removing all template from db"
bun run db.ts --type clean

step_print "Removing all template snapshots"
remove_all_template_snapshots

step_print "Removing all template volumes"
remove_all_template_volumes

step_print "Removing all template files from ec2"
remove_all_template_files_from_ec2

step_print "Creating ec2 directory"
create_ec2_directory

while IFS=, read -r name path
do
  if [[ $path == "path" ]]; then
     continue
  fi
  step_print "Processing $name"
  step_print "Uploading $path"
  upload_file $path

  step_print "Creating volume"
  VOLUME_ID=$(create_volume)

  delay

  step_print "Attaching volume"
  attach_volume

  step_print "Unzipping file"
  unzip_file $path

  step_print "Moving files to volume"
  move_files_to_volume $path

  step_print "Detaching volume"
  detach_volume $VOLUME_ID

  delay

  step_print "Creating snapshot"
  VOLUME_TAG_ID=$(generate_tag_id)
  create_snapshot $VOLUME_ID $VOLUME_TAG_ID

  step_print "Inserting into db"
  bun run db.ts --type insert --id $VOLUME_TAG_ID --name "$name"

  delay

  step_print "Deleting volume"
  delete_volume $VOLUME_ID

  delay
done < template.csv

step_print "Removing all template volumes"
remove_all_template_volumes

