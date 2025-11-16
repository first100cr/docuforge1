// server/vite.js
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { nanoid } from "nanoid";
import { cartographer, devBanner } from "@replit/vite-plugin-cartographer"; // optional; plugin usage depends on env

import viteConfigDefault from "../vite.config.js";

const viteLogger = createLogger();

function log(message, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

export default async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true,
  };

  const vite = await createViteServer({
    ...viteConfigDefault,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path.resolve(process.cwd(), "client", "index.html");
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(`src="/src/main.tsx"`, `src="/src/main.tsx?v=${nanoid()}"`);
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}

export function serveStatic(app) {
  const distPath = path.resolve(process.cwd(), "dist", "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(`Could not find the build directory: ${distPath}, make sure to build the client first`);
  }
  app.use(require("express").static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
