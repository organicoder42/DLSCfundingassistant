import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateEmbedding } from '@/lib/embeddings';

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

    console.log('🔄 Starting embedding generation...');

    // Get all funding calls without embeddings
    const callsWithoutEmbeddings = await db.fundingCall.findMany({
      where: {
        embedding: null,
      },
    });

    console.log(`Found ${callsWithoutEmbeddings.length} calls without embeddings`);

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (const call of callsWithoutEmbeddings) {
      try {
        // Generate embedding text
        const embeddingText = `${call.title} ${call.titleEn || ''} ${call.description}`;
        const embedding = await generateEmbedding(embeddingText);
        const embeddingString = `[${embedding.join(',')}]`;

        // Update call with embedding using raw query
        await db.$executeRaw`
          UPDATE "FundingCall"
          SET embedding = ${embeddingString}::vector,
              "updatedAt" = NOW()
          WHERE id = ${call.id}
        `;

        successCount++;
        console.log(`  ✓ Generated embedding for: ${call.title}`);
      } catch (error) {
        failCount++;
        const errorMsg = `Failed to generate embedding for ${call.title}: ${error}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }

      // Add small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Also generate embeddings for knowledge base entries without them
    const knowledgeWithoutEmbeddings = await db.knowledgeBase.findMany({
      where: {
        embedding: null,
      },
    });

    console.log(`\nFound ${knowledgeWithoutEmbeddings.length} knowledge base entries without embeddings`);

    for (const entry of knowledgeWithoutEmbeddings) {
      try {
        const embeddingText = `${entry.title} ${entry.content}`;
        const embedding = await generateEmbedding(embeddingText);
        const embeddingString = `[${embedding.join(',')}]`;

        await db.$executeRaw`
          UPDATE "KnowledgeBase"
          SET embedding = ${embeddingString}::vector,
              "updatedAt" = NOW()
          WHERE id = ${entry.id}
        `;

        successCount++;
        console.log(`  ✓ Generated embedding for knowledge: ${entry.title}`);
      } catch (error) {
        failCount++;
        const errorMsg = `Failed to generate embedding for knowledge ${entry.title}: ${error}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log('\n✅ Embedding generation complete!');
    console.log(`📊 Stats: ${successCount} successful, ${failCount} failed`);

    return NextResponse.json({
      success: true,
      stats: {
        callsProcessed: callsWithoutEmbeddings.length,
        knowledgeProcessed: knowledgeWithoutEmbeddings.length,
        successful: successCount,
        failed: failCount,
      },
      errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in generate-embeddings endpoint:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

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

  // Get count of calls and knowledge without embeddings
  const callsWithoutEmbeddings = await db.fundingCall.count({
    where: { embedding: null },
  });

  const knowledgeWithoutEmbeddings = await db.knowledgeBase.count({
    where: { embedding: null },
  });

  const totalCalls = await db.fundingCall.count();
  const totalKnowledge = await db.knowledgeBase.count();

  return NextResponse.json({
    status: 'ready',
    pending: {
      calls: callsWithoutEmbeddings,
      knowledge: knowledgeWithoutEmbeddings,
    },
    total: {
      calls: totalCalls,
      knowledge: totalKnowledge,
    },
    coverage: {
      calls: totalCalls > 0 ? ((totalCalls - callsWithoutEmbeddings) / totalCalls * 100).toFixed(1) + '%' : 'N/A',
      knowledge: totalKnowledge > 0 ? ((totalKnowledge - knowledgeWithoutEmbeddings) / totalKnowledge * 100).toFixed(1) + '%' : 'N/A',
    },
  });
}
