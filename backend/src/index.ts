import { createServer } from "node:http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { initIo } from "./realtime/io.js";
import { startScheduler } from "./scheduler.js";

const app = createApp();
const httpServer = createServer(app);

// Attach the Socket.IO real-time layer to the same HTTP server.
initIo(httpServer);

httpServer.listen(env.PORT, () => {
  console.log(`🚀 Smart Football Hub API listening on http://localhost:${env.PORT}`);
  console.log(`   Environment: ${env.NODE_ENV}`);
  console.log(`   Real-time:   Socket.IO ready`);

  // Kick off the football-data sync jobs (no-op without a key).
  startScheduler();
});
