#!/usr/bin/env tsx

import 'dotenv/config';
import { runAllScrapers, runScraper } from '../lib/scrapers';

async function main() {
  const args = process.argv.slice(2);
  const source = args[0];

  console.log('╔════════════════════════════════════════╗');
  console.log('║  DLSC Funding Assistant - Scraper CLI  ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    let result;

    if (source) {
      console.log(`🎯 Running scraper for: ${source}\n`);
      result = await runScraper(source);
    } else {
      console.log('🌐 Running all scrapers\n');
      result = await runAllScrapers();
    }

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║           Scraping Summary              ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(`\n📊 Total calls found:    ${result.stats.total}`);
    console.log(`✅ Successfully created: ${result.stats.created}`);
    console.log(`🔄 Updated:             ${result.stats.updated}`);
    console.log(`❌ Failed:              ${result.stats.failed}`);

    if (result.errors.length > 0) {
      console.log(`\n⚠️  Errors:\n`);
      result.errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }

    if (result.success) {
      console.log('\n✨ Scraping completed successfully!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Scraping completed with errors');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Fatal error during scraping:');
    console.error(error);
    process.exit(1);
  }
}

// Show usage if --help is provided
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
DLSC Funding Assistant - Scraper CLI

Usage:
  npm run scrape                    Run all scrapers
  npm run scrape [SOURCE]           Run specific scraper

Available sources:
  - INNOVATIONSFONDEN
  - EUHORIZEN
  - DLSC
  - ERHVERVSSTYRELSEN

Examples:
  npm run scrape
  npm run scrape INNOVATIONSFONDEN
  npm run scrape EUHORIZEN

Environment variables required:
  - DATABASE_URL: PostgreSQL connection string
  - OPENAI_API_KEY: OpenAI API key for embeddings
  `);
  process.exit(0);
}

main();
