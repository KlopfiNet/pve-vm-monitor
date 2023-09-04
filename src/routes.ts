import { Router } from 'express';
import { EXPECTED_ENV_VARS } from './constants'
import { Proxmox } from './proxmox'

const router = Router();
const proxmox = new Proxmox(
  process.env[EXPECTED_ENV_VARS["host"]] as string,
  process.env[EXPECTED_ENV_VARS["node"]] as string,
  process.env[EXPECTED_ENV_VARS["api_key"]] as string,
  process.env[EXPECTED_ENV_VARS["api_user"]] as string,
  process .env[EXPECTED_ENV_VARS["ssh_key"]] as string
);

router.get('/', (req, res) => {
  res.send('Hello, I am alive!');
});

// Start a watcher for this VM
router.get('/view/:id', async function(req, res){
  try {
    const status = await proxmox.GetVMStatus(req.params.id)
    res.send({
      "status": status
    })
  } catch (error) {
    res.status(500).send({ "error": `${error}` })
  }
})

export default router;