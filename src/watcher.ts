import { EXPECTED_ENV_VARS, PROXMOX } from './globals'

type watcherObject = {
    [id: number]: {
        vmid: number,
        active: boolean,
        step: number,
        lastExec: number
    }
}

type watcherStatusObject = {
    active: boolean,
    vmid: number
}

export class Watcher {
    interval: number;
    watchers: watcherObject;
    loop: ReturnType<typeof setTimeout>

    // ------------------------------------------------------------

    constructor(interval: number = 5) {
        this.watchers = {};
        this.interval = interval

        // Start watcher loop
        this.loop = setTimeout(() => this.triggerWatchers(), 500)
    }
    
    public DoesWatcherExist(id: number): boolean {
        return this.watchers.hasOwnProperty(id);
    }

    public GetWatcherStatus(id: number): watcherStatusObject {
        if (this.DoesWatcherExist(id)) {
            const returnObj: watcherStatusObject = {
                active: this.watchers[id].active,
                vmid: this.watchers[id].vmid
            }

            return returnObj
        } else {
            throw new Error(`Watcher with ID ${id} does not exist.`)
        }
    }

    public async StartWatcher(id: number, vmid: number): Promise<boolean> {
        console.log(`[i] Creating watcher with ID ${id} on VM ${vmid}...`)

        try {
            if (this.DoesWatcherExist(id)) {
                throw new Error(`Watcher with ID ${id} already exists.`)
            }
            if (!await PROXMOX.GetVMStatus(vmid.toString())) {
                throw new Error(`VM does not exist or is not running.`)
            }
    
            console.log(`[i] Registering watcher with ID ${id}...`)
            this.watchers[id] = {
                vmid: vmid,
                active: true,
                step: 1,
                lastExec: Date.now()
            }
    
            return true
        } catch (error) {
            console.error("Registering watcher has failed:", error)
            throw error
        }
    }

    public StopWatcher(id: number) {
        if (!this.DoesWatcherExist(id)) {
            throw new Error(`Watcher with ID ${id} does not exist.`)
        }

        let state: Boolean = this.watchers[id].active
        if (state) {
            this.watchers[id].active = !state
        } else {
            throw new Error(`Watcher with ID ${id} is already stopped.`)
        }
    }

    public DestroyWatcher(id: number) {
        if (!this.DoesWatcherExist(id)) {
            throw new Error(`Watcher with ID ${id} does not exist.`)
        }

        delete this.watchers[id]
    }

    // ------------------------------------------------------------

    private async executeWatcher(id: number): Promise<boolean> {
        if (!this.DoesWatcherExist(id)) {
            throw new Error(`Watcher with ID ${id} does not exist.`)
        }

        const vmid: number = this.watchers[id].vmid
        const step: number = this.watchers[id].step

        await PROXMOX.ExecuteMonitorCommand(vmid.toString(), `screendump /opt/images/${vmid}_${id}_${step}.png -f png`)
        this.watchers[id].step++

        return true
    }

    private async triggerWatcher(id: number): Promise<boolean> {
        if (!this.DoesWatcherExist(id)) {
            throw new Error(`Watcher with ID ${id} does not exist.`)
        }
        if (!this.GetWatcherStatus(id).active) {
            console.log(`[i] Watcher with ID ${id} was triggered, but is inactive.`)
            return false
        }

        const time_now: number = Date.now()
        const time_diff: number = time_now - this.watchers[id].lastExec

        if (time_diff < this.interval) {
            console.log(`[i] Watcher with ID ${id} has not yet reached target interval of ${this.interval}`)
            return false
        }

        console.log(`[i] Executing watcher with ID ${id}`)
        return await this.executeWatcher(id)
    }

    private async triggerWatchers() {
        for (const key in Object.keys(this.watchers)) {
            console.log(`[i] Triggering watcher ${key}...`)
            try {
                await this.triggerWatcher(+key)
            } catch {
                console.log("[x] Trigger failed:", key)
            }
        }
    }
}