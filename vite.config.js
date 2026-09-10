import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { pathToFileURL } from "node:url";

// Vite's dev server only serves the frontend, so /api/*.js (Vercel serverless
// functions) return the SPA's index.html instead of running. This dev-only
// plugin lets `npm run dev` actually invoke those handlers, matching
// production behavior (where Vercel routes /api/<name> to api/<name>.js).
function apiMiddlewarePlugin() {
  const moduleCache = new Map(); // fnName -> imported module (keeps in-memory state, e.g. rate limit counters, alive across requests)

  return {
    name: "local-api-middleware",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, "http://localhost");
        if (!url.pathname.startsWith("/api/")) return next();

        const fnName = url.pathname.slice("/api/".length);
        const filePath = path.join(process.cwd(), "api", `${fnName}.js`);

        let handlerModule = moduleCache.get(fnName);
        if (!handlerModule) {
          try {
            handlerModule = await import(pathToFileURL(filePath).href);
            moduleCache.set(fnName, handlerModule);
          } catch {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: "Not found" }));
            return;
          }
        }

        const query = Object.fromEntries(url.searchParams.entries());
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const rawBody = Buffer.concat(chunks).toString("utf8");

        const shimRes = {
          statusCode: 200,
          status(code) {
            this.statusCode = code;
            return this;
          },
          setHeader(key, value) {
            res.setHeader(key, value);
            return this;
          },
          json(payload) {
            res.statusCode = this.statusCode;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(payload));
            return this;
          },
        };

        try {
          const shimReq = {
            method: req.method,
            headers: req.headers,
            socket: req.socket,
            query,
            body: rawBody,
          };
          await handlerModule.default(shimReq, shimRes);
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), apiMiddlewarePlugin()],
});
