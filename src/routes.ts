import { Router } from 'express';
import { EXPECTED_ENV_VARS } from './constants'
import { Proxmox } from './proxmox'

const router = Router();
const proxmox = new Proxmox(
  process.env[EXPECTED_ENV_VARS["host"]] as string,
  process.env[EXPECTED_ENV_VARS["node"]] as string,
  process.env[EXPECTED_ENV_VARS["api_key"]] as string,
  process.env[EXPECTED_ENV_VARS["api_user"]] as string,
  process.env[EXPECTED_ENV_VARS["host_webserver_port"]] as string
);

router.get('/', (req, res) => {
  res.send('Hello, I am alive!');
});

// Get current image of VM
router.get('/view/:id', async function(req, res){
  const vmid: string = req.params.id

  try {
    const status: boolean = await proxmox.GetVMStatus(vmid)
    if (status) {
      //res.send({ message: "VM is running"})
      await proxmox.ExecuteMonitorCommand(vmid, `screendump /opt/images/${vmid}.png -f png`)

      const image: any = await proxmox.RetrieveImage(vmid)
      image.pipe(res)
    } else {
      res.status(401).send({ error: "VM is not running" })
    }
  } catch (error) {
    res.status(500).send({ error: `${error}` })
  }
})

router.get('/test', async function(req, res){
  try {
    const image = await proxmox.RetrieveImage("cat")
    console.log("Sending cat")

    image.pipe(res)
  } catch (error) {
    res.status(500).send({ error: `${error}` })
  }
})

export default router;