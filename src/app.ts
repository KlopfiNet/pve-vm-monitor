import express from 'express';
import routes from './routes';

import { EXPECTED_ENV_VARS } from './constants'

const app = express();
const port = 3000;

// Sanity checks
let isFail: boolean = false;
let k: keyof typeof EXPECTED_ENV_VARS;
for (k in EXPECTED_ENV_VARS) {
    const v = EXPECTED_ENV_VARS[k]
    if (process.env[v] === null || process.env[v] === undefined) {
        console.log(`> Env var ${v} is not set.`);
        isFail = true;
    }
}

if (isFail) throw new Error("Not all expected env vars have been set.");

app.use(express.json());
app.use(routes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});