import { db } from '@/lib/db';
import { generateEmbedding } from '@/lib/embeddings';
import { InnovationsfondenScraper } from './innovationsfonden';
import { EUHorizonScraper } from './eu-horizon';
import { DLSCScraper } from './dlsc';
import { ErhvervsstyrelsenScraper } from './erhvervsstyrelsen';
import { ScrapedCall } from './base';

export interface ScrapeResult {
  success: boolean;
  stats: {
    total: number;
    created: number;
    updated: number;
    failed: number;
  };
  errors: string[];
}

/**
 * Run all scrapers and save results to database
 */
export async function runAllScrapers(): Promise<ScrapeResult> {
  console.log('🚀 Starting scraping process...');

  const scrapers = [
    new InnovationsfondenScraper(),
    new EUHorizonScraper(),
    new DLSCScraper(),
    new ErhvervsstyrelsenScraper(),
  ];

  const stats = {
    total: 0,
    created: 0,
    updated: 0,
    failed: 0,
  };

  const errors: string[] = [];

  for (const scraper of scrapers) {
    try {
      console.log(`\n📡 Running ${scraper.source} scraper...`);
      const calls = await scraper.scrape();
      stats.total += calls.length;

      for (const call of calls) {
        try {
          await saveCall(call);
          stats.created++;
        } catch (error) {
          stats.failed++;
          const errorMsg = `Failed to save call: ${call.title} - ${error}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = `Scraper ${scraper.source} failed: ${error}`;
      errors.push(errorMsg);
      console.error(errorMsg);
    }
  }

  console.log('\n✅ Scraping complete!');
  console.log(`📊 Stats: ${stats.created} created, ${stats.updated} updated, ${stats.failed} failed`);

  return {
    success: stats.failed < stats.total,
    stats,
    errors,
  };
}

/**
 * Save a scraped call to database
 */
async function saveCall(call: ScrapedCall): Promise<void> {
  // Check if call already exists (by URL)
  const existing = await db.fundingCall.findFirst({
    where: { url: call.url },
  });

  // Generate embedding for the call
  const embeddingText = `${call.title} ${call.titleEn || ''} ${call.description}`;
  let embedding: number[] | undefined;

  try {
    embedding = await generateEmbedding(embeddingText);
  } catch (error) {
    console.warn(`Failed to generate embedding for ${call.title}:`, error);
  }

  const embeddingString = embedding ? `[${embedding.join(',')}]` : null;

  if (existing) {
    // Update existing call - use raw query if embedding needs to be updated
    if (embeddingString) {
      await db.$executeRaw`
        UPDATE "FundingCall"
        SET title = ${call.title},
            "titleEn" = ${call.titleEn},
            description = ${call.description},
            "descriptionEn" = ${call.descriptionEn},
            source = ${call.source}::"Source",
            type = ${call.type}::"CallType",
            sectors = ${call.sectors}::text[],
            "targetAudience" = ${call.targetAudience}::text[],
            "minAmount" = ${call.minAmount},
            "maxAmount" = ${call.maxAmount},
            "coFinancing" = ${call.coFinancing},
            "deMinimis" = ${call.deMinimis},
            "openDate" = ${call.openDate},
            deadline = ${call.deadline},
            "applicationUrl" = ${call.applicationUrl},
            "contactEmail" = ${call.contactEmail},
            "contactPhone" = ${call.contactPhone},
            embedding = ${embeddingString}::vector,
            "scrapedAt" = NOW(),
            "updatedAt" = NOW()
        WHERE id = ${existing.id}
      `;
    } else {
      await db.fundingCall.update({
        where: { id: existing.id },
        data: {
          title: call.title,
          titleEn: call.titleEn,
          description: call.description,
          descriptionEn: call.descriptionEn,
          source: call.source,
          type: call.type,
          sectors: call.sectors,
          targetAudience: call.targetAudience,
          minAmount: call.minAmount,
          maxAmount: call.maxAmount,
          coFinancing: call.coFinancing,
          deMinimis: call.deMinimis,
          openDate: call.openDate,
          deadline: call.deadline,
          applicationUrl: call.applicationUrl,
          contactEmail: call.contactEmail,
          contactPhone: call.contactPhone,
          scrapedAt: new Date(),
        },
      });
    }

    console.log(`  ✓ Updated: ${call.title}`);
  } else {
    // Create new call
    if (embeddingString) {
      // Use raw query for embedding insertion
      await db.$executeRaw`
        INSERT INTO "FundingCall" (
          id, title, "titleEn", description, "descriptionEn",
          source, type, sectors, "targetAudience",
          "minAmount", "maxAmount", "coFinancing", "deMinimis",
          "openDate", deadline, url, "applicationUrl",
          "contactEmail", "contactPhone", embedding,
          "isActive", "createdAt", "updatedAt", "scrapedAt"
        ) VALUES (
          gen_random_uuid()::text,
          ${call.title},
          ${call.titleEn},
          ${call.description},
          ${call.descriptionEn},
          ${call.source}::"Source",
          ${call.type}::"CallType",
          ${call.sectors}::text[],
          ${call.targetAudience}::text[],
          ${call.minAmount},
          ${call.maxAmount},
          ${call.coFinancing},
          ${call.deMinimis},
          ${call.openDate},
          ${call.deadline},
          ${call.url},
          ${call.applicationUrl},
          ${call.contactEmail},
          ${call.contactPhone},
          ${embeddingString}::vector,
          true,
          NOW(),
          NOW(),
          NOW()
        )
      `;
    } else {
      // Create without embedding
      await db.fundingCall.create({
        data: {
          title: call.title,
          titleEn: call.titleEn,
          description: call.description,
          descriptionEn: call.descriptionEn,
          source: call.source,
          type: call.type,
          sectors: call.sectors,
          targetAudience: call.targetAudience,
          minAmount: call.minAmount,
          maxAmount: call.maxAmount,
          coFinancing: call.coFinancing,
          deMinimis: call.deMinimis,
          openDate: call.openDate,
          deadline: call.deadline,
          url: call.url,
          applicationUrl: call.applicationUrl,
          contactEmail: call.contactEmail,
          contactPhone: call.contactPhone,
          scrapedAt: new Date(),
        },
      });
    }

    console.log(`  ✓ Created: ${call.title}`);
  }
}

/**
 * Run a specific scraper by source
 */
export async function runScraper(source: string): Promise<ScrapeResult> {
  let scraper;

  switch (source.toUpperCase()) {
    case 'INNOVATIONSFONDEN':
      scraper = new InnovationsfondenScraper();
      break;
    case 'EUHORIZEN':
    case 'EIC':
    case 'EUROSTARS':
      scraper = new EUHorizonScraper();
      break;
    case 'DLSC':
      scraper = new DLSCScraper();
      break;
    case 'ERHVERVSSTYRELSEN':
      scraper = new ErhvervsstyrelsenScraper();
      break;
    default:
      throw new Error(`Unknown scraper source: ${source}`);
  }

  const stats = {
    total: 0,
    created: 0,
    updated: 0,
    failed: 0,
  };

  const errors: string[] = [];

  try {
    const calls = await scraper.scrape();
    stats.total = calls.length;

    for (const call of calls) {
      try {
        await saveCall(call);
        stats.created++;
      } catch (error) {
        stats.failed++;
        const errorMsg = `Failed to save call: ${call.title} - ${error}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }
  } catch (error) {
    const errorMsg = `Scraper ${source} failed: ${error}`;
    errors.push(errorMsg);
    console.error(errorMsg);
  }

  return {
    success: stats.failed < stats.total,
    stats,
    errors,
  };
}
