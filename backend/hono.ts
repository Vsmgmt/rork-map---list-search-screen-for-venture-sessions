// backend/hono.ts
import { Hono } from "hono";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

// ⬇️ IMPORT YOUR tRPC APP ROUTER
import { appRouter } from "./trpc/app-router";

const app = new Hono();

// Simple health check
app.get("/ping", (c) => c.text("pong"));

// Log every /trpc request (shows in Rork console)
app.use("/trpc/*", async (c, next) => {
  console.log("tRPC request:", c.req.method, c.req.url);
  await next();
});

// ★ Mount tRPC here (must be BEFORE the catch-all)
app.all("/trpc/*", (c) =>
  fetchRequestHandler({
    endpoint: "/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext: () => ({}),
  })
);

// Keep this LAST so it doesn’t swallow /trpc/*
app.all("*", (c) => {
  console.log("❓ Unhandled route:", c.req.method, c.req.url);
  return c.text(`Route not found: ${c.req.method} ${c.req.url}`, 404);
});

console.log("✅ Minimal Hono server ready");
export default app;
