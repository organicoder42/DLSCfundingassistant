import { NextRequest, NextResponse } from 'next/server';
import { getRelevantCalls } from '@/lib/embeddings';

// GET /api/calls/search - Semantic search for funding calls
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    // Perform semantic search using embeddings
    const calls = await getRelevantCalls(query, limit);

    return NextResponse.json({
      calls,
      query,
    });
  } catch (error) {
    console.error('Error searching calls:', error);
    return NextResponse.json(
      { error: 'Failed to search calls' },
      { status: 500 }
    );
  }
}
