# Proxmox VM monitor

## Testing
- `.env` file
```
api_user=...
api_key=...
```

```bash
set -o allexport
source .env
set +o allexport

export PM_HOST=https://10.0.1.10:8006/api2/json # Without terminating /
export PM_NODE=hv
export PM_API_USER=${api_user}
export PM_API_KEY=${api_key}
export PM_SSH_KEY=blabla

npm start
```