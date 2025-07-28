import { type NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } },
) {
  try {
    const path = params.path ? params.path.join('/') : 'capture';
    const url = new URL(request.url);
    const body = await request.text();

    // Construct the PostHog URL
    const posthogUrl = new URL(`https://us.i.posthog.com/${path}/`);

    // Forward all search parameters
    url.searchParams.forEach((value, key) => {
      posthogUrl.searchParams.append(key, value);
    });

    console.log('PostHog POST proxy:', posthogUrl.toString());

    const response = await fetch(posthogUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': request.headers.get('user-agent') || '',
      },
      body,
    });

    const data = await response.text();

    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type':
          response.headers.get('content-type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('PostHog proxy POST error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } },
) {
  try {
    const path = params.path ? params.path.join('/') : '';
    const url = new URL(request.url);

    // Construct the PostHog URL
    const posthogUrl = new URL(`https://us.i.posthog.com/${path}`);

    // Forward all search parameters
    url.searchParams.forEach((value, key) => {
      posthogUrl.searchParams.append(key, value);
    });

    console.log('PostHog GET proxy:', posthogUrl.toString());

    const response = await fetch(posthogUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': request.headers.get('user-agent') || '',
      },
    });

    const data = await response.text();

    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type':
          response.headers.get('content-type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('PostHog proxy GET error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
