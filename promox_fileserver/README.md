Fileserver to run on Proxmox node.  
Mounts `/opt/images`.

```bash
# Run first, or at least ensure .env is set
bash bootstrap.sh

set -o allexport
source .env
set +o allexport

UID_GID="${id_user}:${id_group}" docker compose up -d
```