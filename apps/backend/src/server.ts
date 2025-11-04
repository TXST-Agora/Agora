import http from 'http';
import app from './app.js';
import { ENV } from './config/env.js';
import { attachSockets } from './sockets/index.js';

const server = http.createServer(app);
attachSockets(server);
server.listen(Number(ENV.PORT), () => console.log(`[backend] http://localhost:${ENV.PORT}`));
