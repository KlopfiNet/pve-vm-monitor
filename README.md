# Proxmox VM monitor

## Testing
- `.env` file
```
api_user=...
api_key=...
```

- Test
```bash
set -o allexport
source .env
set +o allexport

export PM_HOST=https://10.0.1.10:8006/api2/json # Without terminating /
export PM_NODE=hv
export PM_WEBSERVER_PORT=8080 # see proxmox_fileserver/
export PM_API_USER=${api_user}
export PM_API_KEY=${api_key}

npm start
```