import { createServer } from "http";
import { app } from "../server"; // import express app từ server.js của bạn

export default defineEventHandler((event) => {
  return new Promise((resolve, reject) => {
    const server = createServer(app);
    event.node.req.on("end", () => {
      server.close();
    });

    app(event.node.req, event.node.res);
  });
});
