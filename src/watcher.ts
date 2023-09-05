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
    loop: ReturnType<typeof setInterval>

    // ------------------------------------------------------------

    constructor(interval: number = 5) {
        this.watchers = {};
        this.interval = interval

        // Start watcher loop
        //this.loop = setTimeout(() => , 500)
        this.loop = setInterval(async () => {
            await this.triggerWatchers()
        }, 500)
    }

    private delay(ms: number) {
        return new Promise<void>((resolve) => setTimeout(resolve, ms));
    }
    
    public DoesWatcherExist(id: number): boolean {
        return this.watchers.hasOwnProperty(id);
    }

    public GetWatcher(id: number): any {
        if (this.DoesWatcherExist(id)) {
            const returnObj: watcherObject = this.watchers[id]
            return returnObj
        } else {
            throw new Error(`Watcher with ID ${id} does not exist.`)
        }
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

    public GetWatchers(): watcherObject {
        return this.watchers
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
                step: 0,
                lastExec: Date.now() - (this.interval * 1000)
            }
    
            return true
        } catch (error) {
            console.error("Registering watcher has failed:", error)
            throw error
        }
    }

    public ResumeWatcher(id: number) {
        if (!this.DoesWatcherExist(id)) {
            throw new Error(`Watcher with ID ${id} does not exist.`)
        }

        this.watchers[id].active = true;
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
        const filename: string = `${id}_${vmid}_${step}.png`

        await PROXMOX.ExecuteMonitorCommand(vmid.toString(), `screendump /opt/images/${filename} -f png`)

        this.watchers[id].step++
        this.watchers[id].lastExec = Date.now()

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

        // this.interval is in milliseconds
        if (time_diff < (this.interval * 1000)) {
            //console.log(`[i] Watcher with ID ${id} has not yet reached target interval of ${this.interval}`)
            return false
        }

        //console.log(`[i] Executing watcher with ID ${id}`)
        return await this.executeWatcher(id)
    }

    private async triggerWatchers() {
        for (const key in this.watchers) {
            //console.log(`[i] Triggering watcher ${key}...`)
            try {
                await this.triggerWatcher(+key)
            } catch (error) {
                console.log(`> Trigger failed: ${error}`)
            }
        }
    }
}