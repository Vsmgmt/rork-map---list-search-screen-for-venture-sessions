import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/backend/trpc/app-router";

function createContext() {
  return {};
}

const handler = async (req: Request) => {
  console.log('🔧 tRPC API Handler:', req.method, req.url);
  
  try {
    const response = await fetchRequestHandler({
      endpoint: "/api/trpc",
      req,
      router: appRouter,
      createContext,
    });
    console.log('✅ tRPC Handler Success');
    return response;
  } catch (error) {
    console.error('❌ tRPC Handler Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : String(error) 
      }), 
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  }
};

export { handler as GET, handler as POST, handler as OPTIONS };
