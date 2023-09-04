let globalConsts = require('consts.ts')
let expectedVars: string[] = globalConsts.expectedVars;

class Proxmox {
    host: string;
    api_token: string;
    api_user; string;

    constructor() {
        this.host = process.env[expectedVars[0]];
        this.api_token = message;
        this.api_user = message;
    }

    greet() {
        return "Hello, " + this.greeting;
    }
}