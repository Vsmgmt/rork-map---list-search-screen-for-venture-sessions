// app/api/[...trpc]+api.ts
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../../backend/trpc/app-router";

function createContext() {
  return {};
}

const handler = async (req: Request) => {
  console.log('🔧 API Route Handler Called:', req.method, req.url);
  
  try {
    const response = await fetchRequestHandler({
      endpoint: "/api/trpc",
      req,
      router: appRouter,
      createContext,
    });
    console.log('✅ API Route Handler Success');
    return response;
  } catch (error) {
    console.error('❌ API Route Handler Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export { handler as GET, handler as POST, handler as OPTIONS };
