import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../backend/trpc/app-router"; // ← relative from lib/ to backend/

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () =>
  typeof window !== "undefined" ? window.location.origin : "http://localhost:8081";

export const createTRPCClient = () => {
  const url = `${getBaseUrl()}/api/trpc`; // ← must match the API route above
  console.log("🌐 tRPC Client URL:", url);

  return trpc.createClient({
    links: [
      httpBatchLink({
        url,
        fetch: (u, options) => {
          console.log("➡️ tRPC Request:", u, options?.method, options?.body ? 'with body' : 'no body');
          return fetch(u, options).then(async (res) => {
            console.log("⬅️ tRPC Response:", res.status, res.statusText);
            if (!res.ok) {
              const text = await res.text();
              console.error("❌ tRPC Error Response Body:", text.substring(0, 500));
              
              // Check if we got HTML instead of JSON (common routing issue)
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
