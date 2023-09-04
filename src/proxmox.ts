import axios, { AxiosResponse } from 'axios';

// TESTING - allows absolutely any cert
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export class Proxmox {
    host: string;
    node: string;
    host_webserver_port: string;
    auth_token: string;

    host_ip: string;
    host_port: number;

    constructor(host: string, node: string, api_token: string, api_user: string, host_webserver_port: string) {
        this.host = host;
        this.node = node;
        this.auth_token = `PVEAPIToken=${api_user}=${api_token}`

        this.host_webserver_port = host_webserver_port;

        const host_url = new URL(host)
        this.host_ip = host_url.hostname;
        this.host_port = parseInt(host_url.port);
    }

    private async axiosCaller<T>(
        method: 'get' | 'post' | 'put' | 'delete',
        url: string,
        data?: any
      ): Promise<T> {
        try {
            const headers: Record<string, string> = {};
            headers['Authorization'] = this.auth_token;

            const response: AxiosResponse = await axios({
                method,
                url,
                data,
                headers
            });
        
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.log("Request failed with auth token:", this.auth_token, "on url:", url)
                throw new Error(error.message);
            } else {
                throw error;
            }
        }
      }

    public async ExecuteMonitorCommand(vmid: string, command: string) {
        console.log(`[i] Calling monitor on ${vmid} with '${command}'`)
        const url = this.host + `/nodes/${this.node}/qemu/${vmid}/monitor?command=${command}`

        try {
            const result = await this.axiosCaller('post', url);
            console.log("[i] Monitor command was a success")
            return result;
        } catch (error) {
            console.error("[x] Monitor command has failed")
            throw error;
        }
    }

    public async GetVMStatus(vmid: string) {
        console.log(`[i] Getting vm status for ${vmid}..`)
        const url = this.host + `/nodes/${this.node}/qemu/${vmid}/status/current`
        
        try {
            const result = await this.axiosCaller<any>('get', url);
            return (result["data"]["status"] === "running")
        } catch (error) {
            throw error;
        }
    }

    public async RetrieveImage(vmid: string) {
        const url = `http://${this.host_ip}:${this.host_webserver_port}/${vmid}.png`
        
        // ToDo: Get image from proxmox fileserver
    }
}