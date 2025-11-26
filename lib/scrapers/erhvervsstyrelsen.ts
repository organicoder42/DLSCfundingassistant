import { load } from 'cheerio';
import { BaseScraper, ScrapedCall } from './base';
import { Source, CallType } from '@prisma/client';

export class ErhvervsstyrelsenScraper extends BaseScraper {
  source: Source = 'ERHVERVSSTYRELSEN';

  // Known Erhvervsstyrelsen programs
  private programs = [
    {
      title: 'Vækstpakken - SMV Vouchers',
      description: 'SMV vouchers giver små og mellemstore virksomheder op til 200.000 kr. til rådgivning og innovation.\n\nVoucherne kan bruges til at købe ekstern ekspertise inden for områder som digitalisering, bæredygtighed, eksport eller produktudvikling.\n\nSimpel ansøgningsproces og hurtig sagsbehandling. De minimis støtte, så tæller med i virksomhedens 300.000 EUR loft.',
      sectors: ['biotech', 'medtech', 'pharma', 'welfare_tech', 'digital_health'],
      targetAudience: ['startup', 'sme'],
      maxAmount: 200000,
      coFinancing: 0,
      deMinimis: true,
      deadline: new Date('2025-12-31'),
      url: 'https://erhvervsstyrelsen.dk/vaekstpakken',
      contactEmail: 'vaekst@erst.dk',
    },
    {
      title: 'Markedsmodningsfonden - Validering',
      description: 'Markedsmodningsfonden støtter validering af ny teknologi med kommercielt potentiale. Programmet hjælper virksomheder med at teste og dokumentere deres teknologi overfor potentielle kunder og investorer.\n\nOp til 2 mio. kr. til aktiviteter som kundevalidering, pilottest, certificering og markedsanalyser.\n\nKræver dokumentation for teknologisk modenhed (min. TRL 4).',
      sectors: ['biotech', 'medtech', 'pharma', 'digital_health'],
      targetAudience: ['startup', 'sme'],
      maxAmount: 2000000,
      coFinancing: 50,
      deMinimis: false,
      deadline: new Date('2025-10-01'),
      url: 'https://markedsmodningsfonden.dk/',
      contactEmail: 'info@markedsmodningsfonden.dk',
    },
    {
      title: 'Markedsmodningsfonden - Kommercialisering',
      description: 'Støtte til kommercialiseringsaktiviteter for teknologivirksomheder. Fokus på skalering, markedsintroduktion og partnerskaber.\n\nOp til 5 mio. kr. til aktiviteter som salgsetablering, markedsføring, regulatoriske godkendelser og strategiske partnerskaber.\n\nKræver dokumenteret produktmarkedsfit og klar go-to-market strategi.',
      sectors: ['biotech', 'medtech', 'pharma', 'digital_health'],
      targetAudience: ['sme', 'startup'],
      maxAmount: 5000000,
      coFinancing: 50,
      deMinimis: false,
      deadline: new Date('2025-10-01'),
      url: 'https://markedsmodningsfonden.dk/',
      contactEmail: 'info@markedsmodningsfonden.dk',
    },
    {
      title: 'Danmarks Grønne Fremtidsfond',
      description: 'Statsinvesteringsfond der investerer i grønne teknologier og bæredygtige løsninger. Relevant for life science virksomheder med fokus på bæredygtighed.\n\nInvesterer i skalérbare danske virksomheder med positiv miljøeffekt. Typisk investeringer på 10-100 mio. kr. som egenkapital.\n\nKræver robust forretningsmodel og dokumenteret miljøimpact.',
      sectors: ['biotech', 'pharma', 'welfare_tech'],
      targetAudience: ['sme'],
      minAmount: 10000000,
      maxAmount: 100000000,
      coFinancing: 0,
      deMinimis: false,
      deadline: new Date('2025-12-31'),
      url: 'https://danmarksgroennefremtidsfond.dk/',
    },
    {
      title: 'Eksportrådet - Markedsudviklingsbevis',
      description: 'Støtte til SMV\'er der vil etablere sig på nye eksportmarkeder. Relevant for life science virksomheder der vil internationalisere.\n\nOp til 200.000 kr. til markedsanalyser, messer, delegationsrejser og eksportrådgivning.\n\nDe minimis støtte. Kræver dokumenteret eksportpotentiale.',
      sectors: ['biotech', 'medtech', 'pharma', 'digital_health', 'welfare_tech'],
      targetAudience: ['sme', 'startup'],
      maxAmount: 200000,
      coFinancing: 25,
      deMinimis: true,
      deadline: new Date('2025-12-31'),
      url: 'https://eksportraadet.dk/tilskud',
      contactEmail: 'eksport@um.dk',
    },
  ];

  async scrape(): Promise<ScrapedCall[]> {
    this.log('Starting scrape...');
    const calls: ScrapedCall[] = [];

    for (const program of this.programs) {
      try {
        const call: ScrapedCall = {
          ...program,
          source: this.source,
          type: this.determineType(program),
        };
        calls.push(call);
      } catch (error) {
        this.error(`Failed to process program ${program.title}`, error);
      }
    }

    this.log(`Scraped ${calls.length} calls`);
    return calls;
  }

  private determineType(program: any): CallType {
    const title = program.title.toLowerCase();

    if (title.includes('voucher') || title.includes('bevis')) return 'VOUCHER';
    if (title.includes('fond') && (title.includes('fremtid') || title.includes('invester'))) return 'EQUITY';
    if (title.includes('lån') || title.includes('loan')) return 'LOAN';

    return 'GRANT';
  }
}
