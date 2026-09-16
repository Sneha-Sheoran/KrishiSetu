import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const commodity = searchParams.get('commodity') || 'Tomato';
  
  // Simulated Agmarknet / Market API response
  // In production, this fetches from the actual Gov API using the backend key
  try {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Simulated stale/live status logic
    const isLive = process.env.AGMARKNET_API_KEY ? true : false;

    const data = [
      {
        market: 'APMC Vashi',
        district: 'Mumbai',
        state: 'Maharashtra',
        variety: 'Desi',
        min_price: 1100,
        max_price: 1300,
        modal_price: 1200,
        arrival_date: new Date().toISOString().split('T')[0]
      },
      {
        market: 'APMC Pune',
        district: 'Pune',
        state: 'Maharashtra',
        variety: 'Hybrid',
        min_price: 1400,
        max_price: 1800,
        modal_price: 1600,
        arrival_date: new Date().toISOString().split('T')[0]
      }
    ];

    return NextResponse.json({
      status: 'SUCCESS',
      source: 'Agmarknet',
      isLive,
      last_updated: new Date().toISOString(),
      data
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'ERROR', message: 'Market data temporarily unavailable.' },
      { status: 503 }
    );
  }
}
