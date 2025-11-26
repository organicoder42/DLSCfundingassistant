import { Source, CallType } from '@prisma/client';
import { parse, isValid } from 'date-fns';
import { da } from 'date-fns/locale';

export interface ScrapedCall {
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  source: Source;
  type: CallType;
  sectors: string[];
  targetAudience: string[];
  minAmount?: number;
  maxAmount?: number;
  coFinancing?: number;
  deMinimis: boolean;
  openDate?: Date;
  deadline: Date;
  url: string;
  applicationUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export abstract class BaseScraper {
  abstract source: Source;
  abstract scrape(): Promise<ScrapedCall[]>;

  /**
   * Fetch HTML content from a URL
   */
  protected async fetchPage(url: string): Promise<string> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DLSCFundingBot/1.0)',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      throw error;
    }
  }

  /**
   * Parse Danish/EU date formats
   * Handles: "15. marts 2025", "15-03-2025", "2025-03-15", "March 15, 2025"
   */
  protected parseDate(dateStr: string): Date | undefined {
    if (!dateStr) return undefined;

    // Clean the string
    const cleaned = dateStr.trim();

    // Try different date formats
    const formats = [
      'dd. MMMM yyyy',     // 15. marts 2025
      'dd-MM-yyyy',        // 15-03-2025
      'yyyy-MM-dd',        // 2025-03-15
      'dd/MM/yyyy',        // 15/03/2025
      'MMMM dd, yyyy',     // March 15, 2025
      'dd MMMM yyyy',      // 15 marts 2025
    ];

    for (const format of formats) {
      try {
        const date = parse(cleaned, format, new Date(), { locale: da });
        if (isValid(date)) {
          return date;
        }
      } catch {
        continue;
      }
    }

    // Try native Date parsing as fallback
    try {
      const date = new Date(cleaned);
      if (isValid(date)) {
        return date;
      }
    } catch {
      // Ignore
    }

    console.warn(`Could not parse date: ${dateStr}`);
    return undefined;
  }

  /**
   * Parse amount strings
   * Handles: "5 mio. kr.", "€500.000", "500000 DKK", "5.000.000 kr."
   */
  protected parseAmount(amountStr: string): number | undefined {
    if (!amountStr) return undefined;

    // Clean the string
    let cleaned = amountStr
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');

    // Extract number and check for millions
    const millionMatch = cleaned.match(/(\d+(?:[.,]\d+)?)\s*(?:mio|mill)/i);
    if (millionMatch) {
      const value = parseFloat(millionMatch[1].replace(',', '.'));
      return Math.round(value * 1_000_000);
    }

    // Extract EUR and convert to DKK (approximate rate: 7.5)
    const eurMatch = cleaned.match(/€?\s*(\d+(?:[.,]\d+)?)/);
    if (cleaned.includes('eur') || cleaned.includes('€')) {
      if (eurMatch) {
        const value = parseFloat(eurMatch[1].replace(/\./g, '').replace(',', '.'));
        return Math.round(value * 7.5); // Convert EUR to DKK
      }
    }

    // Extract DKK amount
    const dkkMatch = cleaned.match(/(\d+(?:[.,]\d+)?)/);
    if (dkkMatch) {
      const value = parseFloat(dkkMatch[1].replace(/\./g, '').replace(',', '.'));
      return Math.round(value);
    }

    console.warn(`Could not parse amount: ${amountStr}`);
    return undefined;
  }

  /**
   * Extract email from text
   */
  protected extractEmail(text: string): string | undefined {
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    return emailMatch ? emailMatch[0] : undefined;
  }

  /**
   * Extract phone number from text (Danish format)
   */
  protected extractPhone(text: string): string | undefined {
    const phoneMatch = text.match(/(?:\+45\s?)?(?:\d{2}\s?){4}/);
    return phoneMatch ? phoneMatch[0].trim() : undefined;
  }

  /**
   * Normalize sector names
   */
  protected normalizeSector(sector: string): string {
    const normalized = sector.toLowerCase().trim();

    const mapping: Record<string, string> = {
      'biotech': 'biotech',
      'biotechnology': 'biotech',
      'medtech': 'medtech',
      'medical technology': 'medtech',
      'pharma': 'pharma',
      'pharmaceutical': 'pharma',
      'digital health': 'digital_health',
      'e-health': 'digital_health',
      'welfare': 'welfare_tech',
      'welfare tech': 'welfare_tech',
      'health': 'health',
      'life science': 'life_science',
    };

    return mapping[normalized] || normalized;
  }

  /**
   * Determine call type from keywords
   */
  protected determineCallType(text: string): CallType {
    const lower = text.toLowerCase();

    if (lower.includes('tilskud') || lower.includes('grant')) return 'GRANT';
    if (lower.includes('lån') || lower.includes('loan')) return 'LOAN';
    if (lower.includes('equity') || lower.includes('investment')) return 'EQUITY';
    if (lower.includes('voucher')) return 'VOUCHER';
    if (lower.includes('prize') || lower.includes('pris')) return 'PRIZE';

    return 'GRANT'; // Default
  }

  /**
   * Log scraping progress
   */
  protected log(message: string) {
    console.log(`[${this.source}] ${message}`);
  }

  /**
   * Log scraping errors
   */
  protected error(message: string, error?: unknown) {
    console.error(`[${this.source}] ERROR: ${message}`, error);
  }
}
