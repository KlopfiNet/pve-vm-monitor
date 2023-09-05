import { Router } from 'express';
import { PROXMOX } from './globals'
import { Watcher } from './watcher';
import { isNullishCoalesce } from 'typescript';
import { isNumber } from 'util';

const router = Router();
const watcher = new Watcher();

const permissibleActions: string[] = ["start", "stop"];

router.get('/', (req, res) => {
  res.send('Hello, I am alive!');
});

// ----------------------------[ VIEWERS ]

// Get current image of VM
router.get('/view/:id', async function(req, res){
  const vmid: string = req.params.id

  try {
    const status: boolean = await PROXMOX.GetVMStatus(vmid)
    if (status) {
      //res.send({ message: "VM is running"})
      await PROXMOX.ExecuteMonitorCommand(vmid, `screendump /opt/images/${vmid}.png -f png`)

      const image: any = await PROXMOX.RetrieveImage(vmid)
      image.pipe(res)
    } else {
      res.status(401).send({ error: "VM is not running" })
    }
  } catch (error) {
    res.status(500).send({ error: `${error}` })
  }
})

// ----------------------------[ WATCHERS ]

// Spawn or interact with watcher
router.post('/watcher/:id/:param', async function (req, res){
  const watcherId: string = req.params.id
  const param: string = req.params.param

  // 'param' can be either an int (vmId), or "start"/"stop" (action)
  const paramIsId: boolean = !isNaN(Number(param))
  const watcherExists: Boolean = watcher.DoesWatcherExist(+watcherId)

  try {
    if (paramIsId) {
      if (!watcherExists) {
        await watcher.StartWatcher(+watcherId, +param);
        res.send({ message: `Watcher with ID ${watcherId} has been created.` })
      }else {
        res.status(401).send({ error: `Watcher with ID ${watcherId} already exists.` })
      }
    } else {
      if (!permissibleActions.includes(param)) {
        throw new Error(`${param} is not a permissible action: ${permissibleActions}`)
      }

      if (!watcherExists) {
        res.send(404).send({ error: `Watcher with ID ${watcherId} does not exist.` })
      }

      // ToDo: Execute action
      res.send({ message: `Executed '${param}' on watcher ${watcherId}.` })
    }
  } catch (error) {
    res.status(500).send({ error: `${error}` })
  }
})

// Destroy watcher
router.delete('/watcher/:id', async function (req, res){
  const watcherId: string = req.params.id

  try {
    if (watcher.DoesWatcherExist(+watcherId)) {
      watcher.DestroyWatcher(+watcherId);
      res.send({ message: `Watcher with ID ${watcherId} has been destroyed.` })
    } else {
      res.status(401).send({ error: `Watcher with ID ${watcherId} does not exist.` })
    }
  } catch (error) {
    res.status(500).send({ error: `${error}` })
  }
})

// Get watcher status
router.get('/watcher/:id', (req, res) => {
  const watcherId: string = req.params.id

  if (!watcher.DoesWatcherExist(+watcherId)) {
    res.status(404).send({ error: `Watcher with ID ${watcherId} was not found.` })
  } else {
    res.send({ 
      active: watcher.GetWatcherStatus(+watcherId).active,
      vmid: watcher.GetWatcherStatus(+watcherId).vmid
    })
  }
});

// Get watchers
router.get('/watcher/', (req, res) => {
  try {
    res.send(watcher.GetWatchers())
  } catch (error) {
    res.status(500).send({ error: `${error}` })
  }
});

// Get watcher step image
router.get('/watcher/:id/:step', (req, res) => {
  const watcherId: string = req.params.id
  const watcherStep: string = req.params.step

  if (!watcher.DoesWatcherExist(+watcherId)) {
    res.status(404).send({ error: `Watcher with ID ${watcherId} was not found.` })
  }
  
  // ToDo: Get image of specific watcher step 

  res.send("NOT IMPLEMENTED")
});

// ----------------------------[ TEST ]

router.get('/test', async function(req, res){
  try {
    const image = await PROXMOX.RetrieveImage("cat")
    console.log("Sending cat")

    image.pipe(res)
  } catch (error) {
    res.status(500).send({ error: `${error}` })
  }
})

export default router;