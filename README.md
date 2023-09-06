# Proxmox VM monitor
API that provides (live) images of a VM console running on a Proxmox host.  
Also has a concept called **watchers** that will periodically create such pictures.  

Pictures are stored on the Proxmox host as `<vmId>.png`.  
Pictures created by a watcher are stored in the following format: `<watcherId>_<vmId>_<step>.png`.

## Requirements
For this to work, the Proxmox host must serve the pictures folder over HTTP.  
To that extend, a containerized solution is offered in `proxmox_fileserver/`.

## Usage
The following API endpoints are available, further described in the wiki:  
- `/watcher/:id/:param` - `GET`/`POST`/`DELETE`
- `/watcher/:id/:archive` - `GET`
   - Interacts with watchers
- `/view/:id` - `GET`
   - Generates a current picture of the console
   - `:id` represents a VM ID on the Proxmox host.


### Watchers
Endpoint: `/watcher/:id/:param` - `GET`/`POST`/`DELETE`  
**Note:** `:param` is only available with `POST`.  

#### GET
Retrieves the status of the watcher with `:id`.  
If Getting just `/watcher`, will return an array of all registered watchers.

#### POST
If POSTing, `:param` can be either a VM ID or an action (`start`|`stop`).  
- If `:param` is a VM ID, a new watcher will be created.
- IF `:param` is an action, said action will be executed on the watcher.
   - I.e. start/stop

#### DELETE
Destroys the watcher with `:id`.

### Archivin
Endpoint: `/watcher/:id/archive` - `GET`  
Returns a bz2 archive of all pictures that this watcher `:id` has made.  
Depending on the amount of pictures (steps), the endpoint is slow to respond.

## Usage
- `.env` file
```
api_user=...
api_key=...
```
- `docker compose up -d`

## Testing
```bash
set -o allexport
source .env
set +o allexport

export PM_HOST=https://10.0.1.10:8006/api2/json # Without terminating /
export PM_NODE=hv
export PM_WEBSERVER_PORT=8080 # see proxmox_fileserver/
export PM_API_USER=${api_user}
export PM_API_KEY=${api_key}

npm test
```

### Image
```bash
docker build . -t pve-vm-monitor:test
docker run pve-vm-monitor:test
```