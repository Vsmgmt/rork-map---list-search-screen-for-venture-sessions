export async function GET(request: Request) {
  console.log('✅ Test API route working!', request.url);
  return Response.json({ 
    message: 'API routes are working!',
    url: request.url,
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: Request) {
  console.log('✅ Test API POST route working!', request.url);
  return Response.json({ 
    message: 'API routes POST is working!',
    url: request.url,
    timestamp: new Date().toISOString()
  });
}
