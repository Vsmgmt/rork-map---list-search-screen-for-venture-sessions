// app/api/[...trpc]+api.ts
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../../backend/trpc/app-router"; // ← relative path from app/api/

export const runtime = "edge"; // OK for Expo web; delete if your env complains

function createContext() {
  return {};
}

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc", // Expo Router API base path
    req,
    router: appRouter,
    createContext,
  });

export { handler as GET, handler as POST, handler as OPTIONS };
