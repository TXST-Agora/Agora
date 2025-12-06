import http from 'http';
import app from './app.js';
import { ENV } from './config/env.js';
import { attachSockets } from './sockets/index.js';
import { updateAllActionTimeMargins } from './services/sessionService.js';
import mongoose from 'mongoose';

const server = http.createServer(app);
attachSockets(server);
server.listen(Number(ENV.PORT), () => console.log(`[backend] http://localhost:${ENV.PORT}`));

// Update timeMargin for all actions every 5 seconds
const TIME_MARGIN_UPDATE_INTERVAL = 5000;

const startTimeMarginUpdates = () => {
  const startUpdates = () => {
    // Run once immediately
    updateAllActionTimeMargins().catch((error) => {
      console.error('Error in timeMargin update:', error instanceof Error ? error.message : String(error));
    });

    // Set up interval
    setInterval(async () => {
      try {
        await updateAllActionTimeMargins();
      } catch (error) {
        console.error('Error in timeMargin update:', error instanceof Error ? error.message : String(error));
      }
    }, TIME_MARGIN_UPDATE_INTERVAL);
  };

  if (mongoose.connection.readyState === 1) {
    startUpdates();
  } else {
    mongoose.connection.once('connected', startUpdates);
  }
};

startTimeMarginUpdates();
