import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  
  if (!lat || !lon) {
    return NextResponse.json({ error: 'Latitude and Longitude required' }, { status: 400 });
  }

  try {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Simulated IMD weather response
    const isLive = process.env.IMD_WEATHER_API_KEY ? true : false;

    return NextResponse.json({
      status: 'SUCCESS',
      source: 'IMD / OpenWeather',
      isLive,
      last_updated: new Date().toISOString(),
      data: {
        current: {
          temp: 28.5,
          humidity: 65,
          condition: 'Partly Cloudy',
          wind_speed: 12,
          rain_prob: 20
        },
        forecast: [
          { date: 'Tomorrow', condition: 'Rain', rain_prob: 80, temp_min: 24, temp_max: 29 },
          { date: 'Day 3', condition: 'Cloudy', rain_prob: 40, temp_min: 25, temp_max: 30 }
        ],
        alerts: []
      }
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'ERROR', message: 'Weather data temporarily unavailable.' },
      { status: 503 }
    );
  }
}
