import { Router } from 'express';
import { PROXMOX } from './globals'
import { Watcher } from './watcher';
import {v4 as uuidv4} from 'uuid';
import * as fs from 'fs';
import sharp from 'sharp';
import tar from 'tar';

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
      image.data.pipe(res)
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
        res.status(400).send({ error: `Watcher with ID ${watcherId} already exists.` })
        return
      }
    } else {
      if (!permissibleActions.includes(param)) {
        throw new Error(`${param} is not a permissible action: ${permissibleActions}`)
      }

      if (!watcherExists) {
        res.send(404).send({ error: `Watcher with ID ${watcherId} does not exist.` })
        return
      }

      if (param === "start") {
        watcher.ResumeWatcher(+watcherId)
      } else if (param === "stop") {
        watcher.StopWatcher(+watcherId)
      }

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
      res.status(404).send({ error: `Watcher with ID ${watcherId} does not exist.` })
    }
  } catch (error) {
    res.status(500).send({ error: `${error}` })
  }
})

// Get watcher archive
router.get('/watcher/:id/archive', async function(req, res){
  const watcherId: string = req.params.id

  console.log(`[i] Getting watcher archive (${watcherId}...`)
  const existingFilenames = [];

  const uuidPart = uuidv4().split('-')[0];
  const imagesArchiveName: string = `images-${uuidPart}.tar.bz2`

  try {
    if (!watcher.DoesWatcherExist(+watcherId)) {
      res.status(404).send({ error: `Watcher with ID ${watcherId} was not found.` })
      return
    }

    const watcherObj = watcher.GetWatcher(+watcherId);
    console.log(`> Preparing archive of ${watcherObj.step} steps...`)

    // Parallel download of images    
    const downloadPromises: Promise<void>[] = [];
    const filesDownloaded: string[] = [];
    for (let i = 1; i <= watcherObj.step; i++) {
      downloadPromises.push(downloadImage(watcherId, watcherObj.vmid, i.toString()));
      filesDownloaded.push(`${watcherId}_${watcherObj.vmid}_${i}.png`)
    }
    
    console.log(`> Awaiting download promises...`)
    await Promise.all(downloadPromises);

    // Check for existing files before archiving
    console.log(`> Awaiting archival...`)
    
    for (const filename of filesDownloaded) {
      if (fs.existsSync(filename)) {
        existingFilenames.push(filename);
      } else {
        console.warn(`> File ${filename} not found. Skipping.`);
      }
    }

    await tar.c(
      {
        file: imagesArchiveName,
        gzip: true,
        sync: true,
        cwd: './',
      },
      filesDownloaded
    );

    console.log(`> Returning archive...`)

    // Destroy archive on events
    res.on('finish', () => { fs.unlinkSync(imagesArchiveName);  });
    res.on('close', () => {
      if (fs.existsSync(imagesArchiveName)) fs.unlinkSync(imagesArchiveName);
    });

    res.download(imagesArchiveName, imagesArchiveName, (err) => {
      if (err) {
        console.error('> Error sending the archive:', err);
        res.status(500).send({ error: `Could not send archive: ${err}` })
      }
    });
  } catch (error) {
    console.error("[x] Process has failed.")
    res.status(500).send({ error: `${error}` })
  } finally {
    // Cleanup
    console.log("Executing cleanup...")

    //[imagesArchiveName, ...existingFilenames]; <- results in 404 on imagesArchiveName
    const filenamesToDelete = existingFilenames;
    for (const filename of filenamesToDelete) {
      fs.unlinkSync(filename);
    }
  }
})

// Get watcher step image
router.get('/watcher/:id/:step', async function(req, res){
  const watcherId: string = req.params.id
  const watcherStep: number = +req.params.step

  console.log(`[i] Getting watcher step image (${watcherId}, ${watcherStep})`)
  
  try {
    if (!watcher.DoesWatcherExist(+watcherId)) {
      res.status(404).send({ error: `Watcher with ID ${watcherId} was not found.` })
      return
    }
    
    // Sanity checks
    const watcherObj = watcher.GetWatcher(+watcherId)
    if (watcherStep > watcherObj.step || watcherStep < 1) {
      res.status(400).send({
        error: `Watcher step is out of bounds`,
        steps: { min: 1, max: watcherObj.step }
      })
      return
    }
  
    const vmId = watcherObj.vmid
    const filename: string = `${watcherId}_${vmId}_${watcherStep}`
  
    const image = await PROXMOX.RetrieveImage(filename)
    image.data.pipe(res)
  } catch (error) {
    res.status(500).send({ error: `${error}` })
  }
});

// Get watcher
router.get('/watcher/:id', (req, res) => {
  const watcherId: string = req.params.id

  if (!watcher.DoesWatcherExist(+watcherId)) {
    res.status(404).send({ error: `Watcher with ID ${watcherId} was not found.` })
  } else {
    res.send(watcher.GetWatcher(+watcherId))
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

// -----------------------------[ FUNCTIONS ]
const downloadImage = async (watcherId: string, vmId: string, step: string): Promise<void> => {
  const filename: string = `${watcherId}_${vmId}_${step}`
  const image = await PROXMOX.RetrieveImage(filename)
  
  // Resize and locally store image
  const localFilename = `${filename}.png`
  const buffer = Buffer.from(image.data)
  await sharp(buffer)
    .resize({ width: Math.floor(0.5 * 1920), withoutEnlargement: true }) // 30% reduction in size
    .toFile(localFilename);
}

export default router;