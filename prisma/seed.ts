import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Clear existing data
  await prisma.chatMessage.deleteMany();
  await prisma.chatConversation.deleteMany();
  await prisma.knowledgeBase.deleteMany();
  await prisma.fundingCall.deleteMany();

  console.log('Cleared existing data');

  // Seed Funding Calls
  const calls = await prisma.fundingCall.createMany({
    data: [
      {
        title: 'InnoBooster',
        description: `InnoBooster giver små og mellemstore virksomheder mulighed for at få op til 5 mio. kr. i tilskud til innovations- og udviklingsprojekter.

Programmet støtter projekter, der udvikler nye produkter, services eller forretningsmodeller med kommercielt potentiale. Der stilles krav om medfinansiering på minimum 50%.

Ansøgninger vurderes på innovation, marked, gennemførlighed og virksomhedens kapacitet.`,
        source: 'INNOVATIONSFONDEN',
        type: 'GRANT',
        sectors: ['biotech', 'medtech', 'pharma', 'digital_health'],
        targetAudience: ['startup', 'sme'],
        minAmount: 100000,
        maxAmount: 5000000,
        coFinancing: 50,
        deMinimis: false,
        deadline: new Date('2025-03-15'),
        url: 'https://innovationsfonden.dk/da/programmer/innobooster',
        applicationUrl: 'https://innovationsfonden.dk/da/ansoeg',
        contactEmail: 'innobooster@innofond.dk',
      },
      {
        title: 'EIC Accelerator',
        titleEn: 'EIC Accelerator',
        description: `EIC Accelerator støtter højvækst-startups og SMV'er med banebrydende innovationer, der har potentiale til at skabe nye markeder eller disrupte eksisterende.

Programmet tilbyder blended finance med både tilskud (op til 2,5 mio. EUR) og egenkapitalinvestering (op til 15 mio. EUR).

Der er særligt fokus på deep tech, green tech og digital technologies. Virksomheder skal være i TRL 5-8 fasen.`,
        descriptionEn: 'The EIC Accelerator supports high-growth startups and SMEs with breakthrough innovations that have the potential to create new markets or disrupt existing ones.',
        source: 'EIC',
        type: 'EQUITY',
        sectors: ['biotech', 'medtech', 'digital_health'],
        targetAudience: ['startup', 'sme'],
        maxAmount: 17500000 * 7.5, // ~130M DKK
        coFinancing: 30,
        deMinimis: false,
        deadline: new Date('2025-06-01'),
        url: 'https://eic.ec.europa.eu/eic-funding-opportunities/eic-accelerator_en',
      },
      {
        title: 'Grand Solutions',
        description: `Grand Solutions støtter store, tværfaglige innovations- og forskningsprojekter, der løser samfundsmæssige udfordringer.

Tilskud på op til 60 mio. kr. til projekter med bred deltagelse fra virksomheder, universiteter og offentlige institutioner.

Aktuelle temaer inkluderer sundhedsteknologi, grøn omstilling og digitalisering. Projekterne skal have høj TRL (7-9) og klart kommercielt potentiale.`,
        source: 'INNOVATIONSFONDEN',
        type: 'GRANT',
        sectors: ['biotech', 'medtech', 'welfare_tech'],
        targetAudience: ['sme', 'large_enterprise', 'research'],
        minAmount: 20000000,
        maxAmount: 60000000,
        coFinancing: 40,
        deMinimis: false,
        deadline: new Date('2025-04-30'),
        url: 'https://innovationsfonden.dk/da/programmer/grand-solutions',
        contactEmail: 'grand@innofond.dk',
      },
      {
        title: 'Markedsmodningsstøtte',
        description: `Markedsmodningsstøtte fra Innovationsfonden hjælper virksomheder med at bringe nye teknologier tættere på markedet.

Op til 15 mio. kr. til aktiviteter som kliniske tests, regulatorisk godkendelse, pilotkunder og markedsvalidering.

Særligt relevant for medtech og pharma virksomheder, der står overfor regulatory hurdles. Kræver dokumentation for teknisk modenhed.`,
        source: 'INNOVATIONSFONDEN',
        type: 'GRANT',
        sectors: ['medtech', 'pharma', 'biotech'],
        targetAudience: ['startup', 'sme'],
        maxAmount: 15000000,
        coFinancing: 50,
        deMinimis: false,
        deadline: new Date('2025-05-20'),
        url: 'https://innovationsfonden.dk/da/programmer/markedsmodning',
      },
      {
        title: 'Vækstpakken - SMV Vouchers',
        description: `SMV vouchers giver små og mellemstore virksomheder op til 200.000 kr. til rådgivning og innovation.

Voucherne kan bruges til at købe ekstern ekspertise inden for områder som digitalisering, bæredygtighed, eksport eller produktudvikling.

Simpel ansøgningsproces og hurtig sagsbehandling. De minimis støtte, så tæller med i virksomhedens 300.000 EUR loft.`,
        source: 'ERHVERVSSTYRELSEN',
        type: 'VOUCHER',
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
        title: 'Horizon Europe - Health Cluster',
        titleEn: 'Horizon Europe - Health Cluster',
        description: `EU's største forsknings- og innovationsprogram med fokus på sundhed og life science.

Støtter projekter fra grundforskning (TRL 1-3) til innovation nær markedet (TRL 7-8). Samarbejdsprojekter skal involvere partnere fra mindst 3 forskellige EU-lande.

Calls udgives løbende gennem året med forskellige temaer. Høj konkurrence, men også store beløb til rådighed.`,
        descriptionEn: 'EU largest research and innovation program focusing on health and life sciences.',
        source: 'EUHORIZEN',
        type: 'GRANT',
        sectors: ['biotech', 'medtech', 'pharma', 'digital_health'],
        targetAudience: ['research', 'large_enterprise', 'sme'],
        minAmount: 3000000,
        maxAmount: 50000000,
        coFinancing: 30,
        deMinimis: false,
        deadline: new Date('2025-09-15'),
        url: 'https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-search',
      },
    ],
  });

  console.log(`Created ${calls.count} funding calls`);

  // Seed Knowledge Base
  const knowledge = await prisma.knowledgeBase.createMany({
    data: [
      {
        title: 'De Minimis Regler',
        category: 'de_minimis',
        content: `De minimis reglerne er EU's regelsæt for statsstøtte til virksomheder. Hovedpunkter:

- Maksimalt 300.000 EUR over 3 år (tidligere 200.000 EUR)
- Gælder kumulativt på tværs af ALLE støtteordninger
- Tæller rullende 3-års periode fra udbetaling
- Særlige regler for landbrug (25.000 EUR) og fiskeri (30.000 EUR)
- Transport sektor har særlige begrænsninger

Virksomheder SKAL føre regnskab over al modtaget de minimis støtte. Manglende dokumentation kan føre til tilbagebetalingskrav.

De minimis støtte kræver ikke EU-godkendelse, hvilket gør processen hurtigere end ordinær statsstøtte.`,
      },
      {
        title: 'Medfinansiering - Hvad du skal vide',
        category: 'co_financing',
        content: `Medfinansiering er den del af projektomkostningerne, som virksomheden selv skal dække. Vigtige pointer:

- EU-programmer kræver typisk 30-50% medfinansiering
- Danske programmer varierer fra 0-50%
- Medfinansiering kan være kontant eller "in-kind" (timer, udstyr)
- Eget arbejde tæller ofte som medfinansiering
- Partnere kan bidrage til medfinansieringen
- Private investorer og andre offentlige midler kan ofte tælle med

Fordele ved medfinansiering:
- Viser commitment til projektet
- Øger succesraten i ansøgningen
- Sikrer fokus på kommerciel værdi
- Giver ejerskab til resultaterne

Husk at budgettere realistisk - for lav medfinansiering kan diskvalificere ansøgningen.`,
      },
      {
        title: 'TRL - Technology Readiness Levels',
        category: 'trl',
        content: `TRL er en skala fra 1-9, der beskriver teknologiens modenhed:

TRL 1-3: Grundforskning
- TRL 1: Grundlæggende principper observeret
- TRL 2: Teknologisk koncept formuleret
- TRL 3: Proof of concept i laboratorium
Programmer: Horizon Europe Basic Research

TRL 4-6: Teknologiudvikling
- TRL 4: Validering i laboratoriemiljø
- TRL 5: Validering i relevant miljø
- TRL 6: Demonstration i relevant miljø
Programmer: Innovationsfonden, EIC Pathfinder

TRL 7-9: Kommercialisering
- TRL 7: Demonstration i operationelt miljø
- TRL 8: System komplet og kvalificeret
- TRL 9: System bevist i operationelt miljø
Programmer: EIC Accelerator, Markedsmodning, InnoBooster

Vælg programmer der matcher din TRL. For lavt TRL = afvisning. For højt TRL = du er for langt i markedet.`,
      },
      {
        title: 'Ansøgningstips - Best Practices',
        category: 'application_tips',
        content: `Sådan laver du en stærk funding ansøgning:

FORBEREDELSE (1-3 måneder før):
- Læs guidelines grundigt - følg formatering nøje
- Identificer relevante evaluators og tilpas sprog
- Byg konsortium tidligt (hvis partnerskab kræves)
- Sørg for commitment letters fra alle parter

INDHOLD:
- Fokuser på impact og innovation, ikke kun teknologi
- Vær konkret om marked og kunder
- Inkluder solide markedsdata og validering
- Beskriv competitive advantage tydeligt
- Vis teamets erfaring og track record

BUDGET:
- Vær realistisk - for lavt budget diskvalificerer
- Inkluder overhead (typisk 20-30%)
- Husk administration og disseminering
- Dokumenter alle omkostninger
- Check medfinansieringskrav

REVIEW:
- Få eksterne reviewers til at læse før indsendelse
- Test om ikke-eksperter forstår værdien
- Check stavning og grammatik grundigt
- Vær sikker på at alle bilag er inkluderet

EFTER INDSENDELSE:
- Nogle programmer tilbyder interview - forbered dig
- Vær klar til at svare på tekniske spørgsmål
- Hvis afvist: læs feedback og forbedre til næste gang`,
      },
    ],
  });

  console.log(`Created ${knowledge.count} knowledge base entries`);

  console.log('✅ Database seeded successfully!');
  console.log('\nNext steps:');
  console.log('1. Add your OpenAI API key to .env file');
  console.log('2. Run embeddings generation (requires OpenAI key):');
  console.log('   npm run dev (then visit /api/generate-embeddings)');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
