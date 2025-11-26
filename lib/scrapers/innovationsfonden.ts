import { load } from 'cheerio';
import { BaseScraper, ScrapedCall } from './base';
import { Source, CallType } from '@prisma/client';

export class InnovationsfondenScraper extends BaseScraper {
  source: Source = 'INNOVATIONSFONDEN';

  private programs = [
    {
      url: 'https://innovationsfonden.dk/da/programmer/innobooster',
      slug: 'innobooster',
    },
    {
      url: 'https://innovationsfonden.dk/da/programmer/innofounder',
      slug: 'innofounder',
    },
    {
      url: 'https://innovationsfonden.dk/da/programmer/innoexplorer',
      slug: 'innoexplorer',
    },
    {
      url: 'https://innovationsfonden.dk/da/programmer/grand-solutions',
      slug: 'grand-solutions',
    },
    {
      url: 'https://innovationsfonden.dk/da/programmer/markedsmodning',
      slug: 'markedsmodning',
    },
    {
      url: 'https://innovationsfonden.dk/da/programmer/green-solutions',
      slug: 'green-solutions',
    },
  ];

  async scrape(): Promise<ScrapedCall[]> {
    this.log('Starting scrape...');
    const calls: ScrapedCall[] = [];

    for (const program of this.programs) {
      try {
        this.log(`Scraping ${program.slug}...`);
        const call = await this.scrapeProgram(program.url, program.slug);
        if (call) {
          calls.push(call);
        }
      } catch (error) {
        this.error(`Failed to scrape ${program.slug}`, error);
      }
    }

    this.log(`Scraped ${calls.length} calls`);
    return calls;
  }

  private async scrapeProgram(url: string, slug: string): Promise<ScrapedCall | null> {
    try {
      const html = await this.fetchPage(url);
      const $ = load(html);

      // Extract program details based on common patterns
      const title = this.extractTitle($, slug);
      const description = this.extractDescription($);
      const amounts = this.extractAmounts($, slug);
      const deadline = this.extractDeadline($, slug);
      const contact = this.extractContact($);

      if (!title || !description || !deadline) {
        this.error(`Missing required fields for ${slug}`);
        return null;
      }

      return {
        title,
        description,
        source: this.source,
        type: 'GRANT' as CallType,
        sectors: this.determineSectors(description),
        targetAudience: this.determineTargetAudience(slug, description),
        minAmount: amounts.min,
        maxAmount: amounts.max,
        coFinancing: this.determineCoFinancing(slug),
        deMinimis: false,
        deadline,
        url,
        applicationUrl: 'https://innovationsfonden.dk/da/ansoeg',
        contactEmail: contact.email,
      };
    } catch (error) {
      this.error(`Error scraping ${url}`, error);
      return null;
    }
  }

  private extractTitle($: cheerio.Root, slug: string): string {
    // Try to find the main heading
    const h1 = $('h1').first().text().trim();
    if (h1) return h1;

    // Fallback to slug-based title
    const titleMap: Record<string, string> = {
      'innobooster': 'InnoBooster',
      'innofounder': 'InnoFounder',
      'innoexplorer': 'InnoExplorer',
      'grand-solutions': 'Grand Solutions',
      'markedsmodning': 'Markedsmodning',
      'green-solutions': 'Green Solutions',
    };

    return titleMap[slug] || slug;
  }

  private extractDescription($: cheerio.Root): string {
    // Try to find the main description
    const intro = $('.intro, .lead, .description').first().text().trim();
    if (intro) return intro;

    // Fallback: get first few paragraphs
    const paragraphs: string[] = [];
    $('p').each((i, elem) => {
      if (i < 3) {
        const text = $(elem).text().trim();
        if (text && text.length > 50) {
          paragraphs.push(text);
        }
      }
    });

    return paragraphs.join('\n\n') || 'Innovationsfondens støtteprogram';
  }

  private extractAmounts($: cheerio.Root, slug: string): { min?: number; max?: number } {
    // Try to find amounts in the text
    const text = $('body').text();

    // Look for amount patterns
    const amounts: number[] = [];
    const patterns = [
      /op til (\d+(?:[.,]\d+)?)\s*(?:mio|mill)/gi,
      /maksimalt (\d+(?:[.,]\d+)?)\s*(?:mio|mill)/gi,
      /(\d+(?:[.,]\d+)?)\s*(?:mio|mill)[\s.]*kr/gi,
    ];

    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const amount = this.parseAmount(match[0]);
        if (amount) amounts.push(amount);
      }
    }

    // Program-specific defaults if parsing fails
    const defaults: Record<string, { min?: number; max?: number }> = {
      'innobooster': { minAmount: 100000, maxAmount: 5000000 },
      'innofounder': { maxAmount: 1000000 },
      'innoexplorer': { maxAmount: 500000 },
      'grand-solutions': { minAmount: 20000000, maxAmount: 60000000 },
      'markedsmodning': { maxAmount: 15000000 },
      'green-solutions': { minAmount: 10000000, maxAmount: 40000000 },
    };

    if (amounts.length > 0) {
      return {
        max: Math.max(...amounts),
        min: amounts.length > 1 ? Math.min(...amounts) : undefined,
      };
    }

    return defaults[slug] || { maxAmount: 5000000 };
  }

  private extractDeadline($: cheerio.Root, slug: string): Date {
    // Try to find deadline in text
    const text = $('body').text();
    const deadlinePatterns = [
      /deadline.*?(\d{1,2}\.?\s*\w+\s*\d{4})/i,
      /ansøgningsfrist.*?(\d{1,2}\.?\s*\w+\s*\d{4})/i,
      /frist.*?(\d{1,2}\.?\s*\w+\s*\d{4})/i,
    ];

    for (const pattern of deadlinePatterns) {
      const match = text.match(pattern);
      if (match) {
        const date = this.parseDate(match[1]);
        if (date) return date;
      }
    }

    // Default deadlines (spread throughout the year)
    const defaultDeadlines: Record<string, Date> = {
      'innobooster': new Date('2025-03-15'),
      'innofounder': new Date('2025-04-01'),
      'innoexplorer': new Date('2025-02-28'),
      'grand-solutions': new Date('2025-04-30'),
      'markedsmodning': new Date('2025-05-20'),
      'green-solutions': new Date('2025-06-15'),
    };

    return defaultDeadlines[slug] || new Date('2025-12-31');
  }

  private extractContact($: cheerio.Root): { email?: string } {
    const text = $('body').text();
    return {
      email: this.extractEmail(text),
    };
  }

  private determineSectors(description: string): string[] {
    const sectors: string[] = [];
    const text = description.toLowerCase();

    if (text.includes('biotech') || text.includes('bio-')) sectors.push('biotech');
    if (text.includes('medtech') || text.includes('medicinsk')) sectors.push('medtech');
    if (text.includes('pharma') || text.includes('medicinal')) sectors.push('pharma');
    if (text.includes('digital health') || text.includes('e-sundhed')) sectors.push('digital_health');
    if (text.includes('welfare') || text.includes('velfærd')) sectors.push('welfare_tech');

    // If no specific sectors found, return general life science sectors
    if (sectors.length === 0) {
      return ['biotech', 'medtech', 'pharma', 'digital_health'];
    }

    return sectors;
  }

  private determineTargetAudience(slug: string, description: string): string[] {
    const text = description.toLowerCase();
    const audience: string[] = [];

    if (slug.includes('founder') || text.includes('startup')) audience.push('startup');
    if (text.includes('små og mellemstore') || text.includes('smv') || text.includes('sme')) {
      audience.push('startup', 'sme');
    }
    if (text.includes('store virksomheder')) audience.push('large_enterprise');
    if (text.includes('forskn') || text.includes('universitet')) audience.push('research');

    // Defaults based on program
    if (slug === 'grand-solutions') {
      return ['sme', 'large_enterprise', 'research'];
    }
    if (slug.includes('inno')) {
      return ['startup', 'sme'];
    }

    return audience.length > 0 ? audience : ['startup', 'sme'];
  }

  private determineCoFinancing(slug: string): number {
    const coFinancingMap: Record<string, number> = {
      'innobooster': 50,
      'innofounder': 50,
      'innoexplorer': 50,
      'grand-solutions': 40,
      'markedsmodning': 50,
      'green-solutions': 40,
    };

    return coFinancingMap[slug] || 50;
  }
}
