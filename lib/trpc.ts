import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../backend/trpc/app-router"; // ← relative from lib/ to backend/

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:8081";
};

export const createTRPCClient = () => {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/api/trpc`;
  console.log("🌐 tRPC Client connecting to:", url);
  console.log("🌐 Base URL:", baseUrl);

  return trpc.createClient({
    links: [
      httpBatchLink({
        url,
        fetch: (u, options) => {
          return fetch(u, options).then(async (res) => {
            if (!res.ok) {
              const text = await res.text();
              
              if (text.includes('<!DOCTYPE') || text.includes('<html')) {
                throw new Error(`tRPC endpoint not found. Got HTML response instead of JSON. Check if /api/trpc route is properly configured.`);
              }
              
              throw new Error(`tRPC request failed: ${res.status} ${res.statusText}. Body: ${text.substring(0, 200)}`);
            }
            return res;
          });
        },
      }),
    ],
  });
};

// Pre-initialized client for non-React usage
export const trpcClient = createTRPCClient();
