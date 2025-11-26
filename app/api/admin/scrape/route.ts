import { NextRequest, NextResponse } from 'next/server';
import { runAllScrapers, runScraper } from '@/lib/scrapers';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    const secret = process.env.SCRAPE_CRON_SECRET;

    if (!secret) {
      return NextResponse.json(
        { error: 'SCRAPE_CRON_SECRET not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { source } = body;

    // Run scraper(s)
    let result;
    if (source) {
      console.log(`Running scraper for source: ${source}`);
      result = await runScraper(source);
    } else {
      console.log('Running all scrapers');
      result = await runAllScrapers();
    }

    return NextResponse.json({
      success: result.success,
      stats: result.stats,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in scrape endpoint:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Allow GET requests to check status
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const secret = process.env.SCRAPE_CRON_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: 'SCRAPE_CRON_SECRET not configured' },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    status: 'ready',
    message: 'Scrape endpoint is ready. Send POST request to trigger scraping.',
    availableSources: [
      'INNOVATIONSFONDEN',
      'EUHORIZEN',
      'DLSC',
      'ERHVERVSSTYRELSEN',
    ],
  });
}
