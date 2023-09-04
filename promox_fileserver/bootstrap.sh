#!/bin/bash
# Prepare proxmox host for fileserver

FS_USER=fileserver
FS_GROUP=fileserver-images
TARGET_PATH=/opt/images

mkdir $TARGET_PATH
useradd $FS_USER
groupadd $FS_GROUP

usermod -a -G $FS_GROUP $FS_USER

# Required, as qemu creates files as root:root
chown -R $FS_USER:$FS_GROUP $TARGET_PATH
chgrp $FS_GROUP $TARGET_PATH
chmod g+s $TARGET_PATH

printf "id_user=$(id -u $FS_USER)\n" > .env
printf "id_group=$(id -g $FS_GROUP)\n" >> .env
