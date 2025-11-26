// lib/embeddings.ts
import { openai, EMBEDDING_MODEL } from './openai';
import { db } from './db';
import { FundingCall } from '@/types';

/**
 * Generate an embedding vector for a given text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });

  return response.data[0].embedding;
}

/**
 * Generate embedding for a funding call
 */
export async function generateCallEmbedding(call: {
  title: string;
  description: string;
  sectors: string[];
  type: string;
}): Promise<number[]> {
  // Combine relevant fields for embedding
  const text = `${call.title} ${call.description} ${call.sectors.join(' ')} ${call.type}`;
  return generateEmbedding(text);
}

/**
 * Find relevant funding calls using semantic search
 */
export async function getRelevantCalls(
  query: string,
  limit: number = 5
): Promise<FundingCall[]> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    const embeddingString = `[${queryEmbedding.join(',')}]`;

    // Perform vector similarity search
    // Using pgvector's <=> operator for cosine distance
    const calls = await db.$queryRaw<FundingCall[]>`
      SELECT
        id, title, "titleEn", description, "descriptionEn",
        source, type, sectors, "targetAudience",
        "minAmount", "maxAmount", "coFinancing", "deMinimis",
        "openDate", deadline, url, "applicationUrl",
        "contactEmail", "contactPhone", "isActive",
        "createdAt", "updatedAt", "scrapedAt",
        1 - (embedding <=> ${embeddingString}::vector) as similarity
      FROM "FundingCall"
      WHERE embedding IS NOT NULL
        AND "isActive" = true
        AND deadline > NOW()
      ORDER BY embedding <=> ${embeddingString}::vector
      LIMIT ${limit}
    `;

    return calls;
  } catch (error) {
    console.error('Error getting relevant calls:', error);
    // Fallback to text search if vector search fails
    return db.fundingCall.findMany({
      where: {
        isActive: true,
        deadline: { gte: new Date() },
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { deadline: 'asc' },
    });
  }
}

/**
 * Find relevant knowledge base entries using semantic search
 */
export async function getRelevantKnowledge(
  query: string,
  limit: number = 3
): Promise<Array<{ title: string; content: string; category: string }>> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    const embeddingString = `[${queryEmbedding.join(',')}]`;

    // Perform vector similarity search
    const knowledge = await db.$queryRaw<Array<{
      title: string;
      content: string;
      category: string;
    }>>`
      SELECT
        title, content, category,
        1 - (embedding <=> ${embeddingString}::vector) as similarity
      FROM "KnowledgeBase"
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${embeddingString}::vector
      LIMIT ${limit}
    `;

    return knowledge;
  } catch (error) {
    console.error('Error getting relevant knowledge:', error);
    // Fallback to returning empty array
    return [];
  }
}

/**
 * Update embedding for a funding call
 */
export async function updateCallEmbedding(callId: string): Promise<void> {
  const call = await db.fundingCall.findUnique({
    where: { id: callId },
    select: {
      title: true,
      description: true,
      sectors: true,
      type: true,
    },
  });

  if (!call) {
    throw new Error(`Call not found: ${callId}`);
  }

  const embedding = await generateCallEmbedding(call);
  const embeddingString = `[${embedding.join(',')}]`;

  // Update the call with the new embedding
  await db.$executeRaw`
    UPDATE "FundingCall"
    SET embedding = ${embeddingString}::vector
    WHERE id = ${callId}
  `;
}

/**
 * Update embedding for a knowledge base entry
 */
export async function updateKnowledgeEmbedding(knowledgeId: string): Promise<void> {
  const knowledge = await db.knowledgeBase.findUnique({
    where: { id: knowledgeId },
    select: {
      title: true,
      content: true,
    },
  });

  if (!knowledge) {
    throw new Error(`Knowledge base entry not found: ${knowledgeId}`);
  }

  const text = `${knowledge.title} ${knowledge.content}`;
  const embedding = await generateEmbedding(text);
  const embeddingString = `[${embedding.join(',')}]`;

  // Update the knowledge base entry with the new embedding
  await db.$executeRaw`
    UPDATE "KnowledgeBase"
    SET embedding = ${embeddingString}::vector
    WHERE id = ${knowledgeId}
  `;
}

/**
 * Batch update embeddings for all funding calls without embeddings
 */
export async function updateAllCallEmbeddings(): Promise<number> {
  const calls = await db.fundingCall.findMany({
    where: {
      embedding: null,
    },
    select: {
      id: true,
      title: true,
      description: true,
      sectors: true,
      type: true,
    },
  });

  console.log(`Updating embeddings for ${calls.length} calls...`);

  for (const call of calls) {
    try {
      await updateCallEmbedding(call.id);
      console.log(`✓ Updated embedding for: ${call.title}`);
    } catch (error) {
      console.error(`✗ Failed to update embedding for ${call.id}:`, error);
    }
  }

  return calls.length;
}
