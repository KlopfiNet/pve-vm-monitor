import { Proxmox } from "./proxmox";

export const EXPECTED_ENV_VARS = {
    "host": "PM_HOST",
    "node": "PM_NODE",
    "api_key": "PM_API_KEY",
    "api_user": "PM_API_USER",
    "host_webserver_port": "PM_WEBSERVER_PORT",
}

export const PROXMOX = new Proxmox(
    process.env[EXPECTED_ENV_VARS["host"]] as string,
    process.env[EXPECTED_ENV_VARS["node"]] as string,
    process.env[EXPECTED_ENV_VARS["api_key"]] as string,
    process.env[EXPECTED_ENV_VARS["api_user"]] as string,
    process.env[EXPECTED_ENV_VARS["host_webserver_port"]] as string
);