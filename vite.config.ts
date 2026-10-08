import type { ServerResponse } from "node:http";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { referralsHttp } from "./server/notion";

// Serves /api/referrals during `vite dev` / `vite preview` using the same code as the
// production serverless function (api/referrals.ts). NOTION_* vars are read from .env.
function referralsApi(mode: string): Plugin {
  const env = loadEnv(mode, process.cwd(), "");
  const handler = async (req: { url?: string }, res: ServerResponse, next: () => void) => {
    if (req.url?.split("?")[0] !== "/api/referrals") return next();
    const { status, headers, body } = await referralsHttp(env);
    res.writeHead(status, headers);
    res.end(body);
  };
  return {
    name: "referrals-api",
    configureServer: (server) => void server.middlewares.use(handler),
    configurePreviewServer: (server) => void server.middlewares.use(handler),
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: [".modal.host"],
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), referralsApi(mode)],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
