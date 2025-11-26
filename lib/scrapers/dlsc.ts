import { load } from 'cheerio';
import { BaseScraper, ScrapedCall } from './base';
import { Source, CallType } from '@prisma/client';

export class DLSCScraper extends BaseScraper {
  source: Source = 'DLSC';

  // DLSC curated/promoted calls
  private curatedCalls = [
    {
      title: 'DLSC Innovation Sprint',
      description: 'En accelereret udviklingssprint for life science startups med fokus på teknologivalidering og markedsmodning. Programmet inkluderer mentoring, workshopper og adgang til DLSCs netværk.\n\nDeltagere får mulighed for at pitch for investorer og samarbejdspartnere. Programmet kører over 3 måneder med intensive aktiviteter.\n\nÅben for alle life science startups i DLSCs netværk.',
      sectors: ['biotech', 'medtech', 'pharma', 'digital_health'],
      targetAudience: ['startup'],
      maxAmount: 200000,
      coFinancing: 0,
      deadline: new Date('2025-08-01'),
      url: 'https://www.danishlifesciencecluster.dk/innovation-sprint',
      contactEmail: 'innovation@dlsc.dk',
    },
    {
      title: 'DLSC Startup Voucher',
      description: 'Voucher-program der giver startups adgang til specialiseret rådgivning og faciliteter. Kan bruges til regulatorisk rådgivning, IP-strategi, klinisk design eller markedsanalyse.\n\nVoucheren dækker op til 150.000 kr. i ekspertbistand fra DLSCs netværk af rådgivere.\n\nFørste-kom-først-tjent basis.',
      sectors: ['biotech', 'medtech', 'pharma', 'digital_health'],
      targetAudience: ['startup'],
      maxAmount: 150000,
      coFinancing: 20,
      deadline: new Date('2025-11-30'),
      url: 'https://www.danishlifesciencecluster.dk/voucher',
      contactEmail: 'voucher@dlsc.dk',
    },
  ];

  async scrape(): Promise<ScrapedCall[]> {
    this.log('Starting scrape...');
    const calls: ScrapedCall[] = [];

    // Add curated calls
    for (const callData of this.curatedCalls) {
      try {
        const call: ScrapedCall = {
          ...callData,
          source: this.source,
          type: this.determineCallType(callData.title),
          deMinimis: callData.maxAmount! <= 2000000, // Under ~€266k
        };
        calls.push(call);
      } catch (error) {
        this.error(`Failed to process call ${callData.title}`, error);
      }
    }

    // Try to scrape additional calls from website
    try {
      const scrapedCalls = await this.scrapeWebsite();
      calls.push(...scrapedCalls);
    } catch (error) {
      this.error('Failed to scrape DLSC website', error);
    }

    this.log(`Scraped ${calls.length} calls`);
    return calls;
  }

  private async scrapeWebsite(): Promise<ScrapedCall[]> {
    const calls: ScrapedCall[] = [];

    try {
      // Try to scrape news/events page for funding opportunities
      const html = await this.fetchPage('https://www.danishlifesciencecluster.dk/');
      const $ = load(html);

      // Look for funding-related news or events
      // This is a basic implementation - would need to be customized based on actual HTML structure
      $('.news-item, .event-item').each((i, elem) => {
        const title = $(elem).find('h2, h3').first().text().trim();
        const description = $(elem).find('p').first().text().trim();
        const link = $(elem).find('a').first().attr('href');

        // Check if it's funding-related
        const isFunding =
          title.toLowerCase().includes('funding') ||
          title.toLowerCase().includes('støtte') ||
          title.toLowerCase().includes('tilskud') ||
          description.toLowerCase().includes('funding') ||
          description.toLowerCase().includes('ansøg');

        if (isFunding && title && description && link) {
          // Extract basic info
          calls.push({
            title: title,
            description: description,
            source: this.source,
            type: this.determineCallType(title + ' ' + description),
            sectors: ['biotech', 'medtech', 'pharma', 'digital_health'],
            targetAudience: ['startup', 'sme'],
            deMinimis: true,
            deadline: this.extractDeadlineFromText(description) || new Date('2025-12-31'),
            url: link.startsWith('http') ? link : `https://www.danishlifesciencecluster.dk${link}`,
          });
        }
      });
    } catch (error) {
      this.error('Error scraping DLSC website', error);
    }

    return calls;
  }

  private extractDeadlineFromText(text: string): Date | undefined {
    const patterns = [
      /deadline.*?(\d{1,2}\.?\s*\w+\s*\d{4})/i,
      /ansøgningsfrist.*?(\d{1,2}\.?\s*\w+\s*\d{4})/i,
      /senest.*?(\d{1,2}\.?\s*\w+\s*\d{4})/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const date = this.parseDate(match[1]);
        if (date) return date;
      }
    }

    return undefined;
  }
}
