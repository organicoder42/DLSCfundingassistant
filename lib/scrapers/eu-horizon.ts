import { load } from 'cheerio';
import { BaseScraper, ScrapedCall } from './base';
import { Source, CallType } from '@prisma/client';

export class EUHorizonScraper extends BaseScraper {
  source: Source = 'EUHORIZEN';

  // Predefined high-value health/life science calls
  // Note: The EU portal requires complex API integration for full scraping
  // This implementation provides key relevant calls
  private knownCalls = [
    {
      title: 'Horizon Europe - Health Cluster',
      titleEn: 'Horizon Europe - Health Cluster',
      description: 'EU\'s største forsknings- og innovationsprogram med fokus på sundhed og life science. Støtter projekter fra grundforskning (TRL 1-3) til innovation nær markedet (TRL 7-8). Samarbejdsprojekter skal involvere partnere fra mindst 3 forskellige EU-lande.',
      descriptionEn: 'EU\'s largest research and innovation program focusing on health and life sciences. Supports projects from basic research (TRL 1-3) to near-market innovation (TRL 7-8).',
      sectors: ['biotech', 'medtech', 'pharma', 'digital_health'],
      targetAudience: ['research', 'large_enterprise', 'sme'],
      minAmount: 3000000,
      maxAmount: 50000000,
      coFinancing: 30,
      deadline: new Date('2025-09-15'),
      url: 'https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-search',
    },
    {
      title: 'EIC Pathfinder - Open',
      titleEn: 'EIC Pathfinder - Open',
      description: 'Støtte til højrisiko, højpotentiale forskningsprojekter i tidlig fase. Fokus på radikal innovation og nye teknologier med potentiale til at skabe fremtidige markeder.',
      descriptionEn: 'Support for high-risk, high-potential early-stage research projects. Focus on radical innovation and emerging technologies.',
      sectors: ['biotech', 'medtech', 'digital_health'],
      targetAudience: ['research', 'startup', 'sme'],
      minAmount: 3000000,
      maxAmount: 4000000,
      coFinancing: 0, // 100% funding
      deadline: new Date('2025-10-04'),
      url: 'https://eic.ec.europa.eu/eic-funding-opportunities/eic-pathfinder_en',
    },
    {
      title: 'EIC Transition',
      titleEn: 'EIC Transition',
      description: 'Bro mellem forskning og markedsintroduktion. Støtter validering af teknologi, IPR-strategi og business development. Bygger videre på tidligere forskningsresultater.',
      descriptionEn: 'Bridge between research and market introduction. Supports technology validation, IPR strategy, and business development.',
      sectors: ['biotech', 'medtech', 'pharma', 'digital_health'],
      targetAudience: ['startup', 'sme', 'research'],
      minAmount: 2500000,
      maxAmount: 2500000,
      coFinancing: 0, // 100% funding
      deadline: new Date('2025-10-04'),
      url: 'https://eic.ec.europa.eu/eic-funding-opportunities/eic-transition_en',
    },
    {
      title: 'Eurostars',
      titleEn: 'Eurostars',
      description: 'EU-program for SMV-ledede internationale samarbejdsprojekter. Støtter marked-nære innovations projekter med deltagelse fra mindst 2 lande. Særligt egnet til life science virksomheder.',
      descriptionEn: 'EU program for SME-led international R&D projects. Supports near-market innovation projects with participation from at least 2 countries.',
      sectors: ['biotech', 'medtech', 'pharma', 'digital_health'],
      targetAudience: ['sme', 'startup'],
      minAmount: 3750000, // €500k * 7.5
      maxAmount: 15000000, // €2M * 7.5
      coFinancing: 40,
      deadline: new Date('2025-09-18'),
      url: 'https://www.eurostars-eureka.eu/',
    },
    {
      title: 'Marie Skłodowska-Curie Actions - Postdoctoral Fellowships',
      titleEn: 'Marie Skłodowska-Curie Actions - Postdoctoral Fellowships',
      description: 'Støtte til individuelle forskere til ophold ved værtsorganisationer i Europa. Særligt relevant for life science forskere der ønsker at udvikle deres karriere.',
      descriptionEn: 'Support for individual researchers for stays at host organizations in Europe. Particularly relevant for life science researchers.',
      sectors: ['biotech', 'medtech', 'pharma', 'life_science'],
      targetAudience: ['research'],
      minAmount: 1500000,
      maxAmount: 3000000,
      coFinancing: 0, // 100% funding
      deadline: new Date('2025-09-11'),
      url: 'https://marie-sklodowska-curie-actions.ec.europa.eu/',
    },
  ];

  async scrape(): Promise<ScrapedCall[]> {
    this.log('Starting scrape...');
    const calls: ScrapedCall[] = [];

    for (const callData of this.knownCalls) {
      try {
        const call: ScrapedCall = {
          ...callData,
          source: this.determineSource(callData.title),
          type: 'GRANT' as CallType,
          deMinimis: false,
        };
        calls.push(call);
      } catch (error) {
        this.error(`Failed to process call ${callData.title}`, error);
      }
    }

    this.log(`Scraped ${calls.length} calls`);
    return calls;
  }

  private determineSource(title: string): Source {
    if (title.includes('EIC')) return 'EIC';
    if (title.includes('Eurostars')) return 'EUROSTARS';
    return 'EUHORIZEN';
  }
}
