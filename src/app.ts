import express from 'express';
import routes from './routes';

let globalConsts = require('consts.ts')

const app = express();
const port = 3000;

// Sanity checks
let expectedVars = globalConsts.expectedVars
let isFail: boolean = true;
for (const variable of expectedVars) {
    if (process.env[variable] === null || process.env[variable] === undefined) {
        console.log(`> Env var ${variable} is not set.`);
        isFail = true;
    }
}

if (isFail) throw new Error("Not all expected env vars have been set.");

app.use(express.json());
app.use(routes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});