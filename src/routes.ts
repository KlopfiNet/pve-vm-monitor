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
      proxmox.ExecuteMonitorCommand(vmid, "screendump /var/tmp/scr -f png")

      const image: any = proxmox.RetrieveImage(vmid)
      res.send(image)
    } else {
      res.status(401).send({ error: "VM is not running" })
    }
  } catch (error) {
    res.status(500).send({ error: `${error}` })
  }
})

export default router;