# DLSC Funding Assistant

## Project Overview

En AI-drevet funding assistant til Danish Life Science Cluster (DLSC), der hjælper medlemmer med at finde relevante funding muligheder fra både danske og EU-kilder.

**Målgruppe**: Life science virksomheder, startups, forskningsinstitutioner og welfare tech organisationer i Danmark.

**Hovedfunktioner**:
1. **Chat Interface**: AI-drevet chat til spørgsmål om aktuelle calls, medfinansiering, de minimis regler mv.
2. **Call Søgning**: Søg og filtrer i aktuelle funding calls
3. **Premium Feature** (ikke i v1): Automatisk matching baseret på virksomhedens website

---

## Tech Stack

| Komponent | Teknologi |
|-----------|-----------|
| Frontend | Next.js 14+ (App Router) |
| Styling | Tailwind CSS |
| Backend | Next.js API Routes |
| Database | PostgreSQL (Hetzner-kompatibel) |
| ORM | Prisma |
| AI | OpenAI API (GPT-4o) |
| Embeddings | OpenAI text-embedding-3-small |
| Vector Store | pgvector (PostgreSQL extension) |

---

## Projektstruktur

```
funding-assistant/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # Landing page
│   ├── chat/
│   │   └── page.tsx                # Chat interface
│   ├── calls/
│   │   └── page.tsx                # Call søgning/listing
│   ├── calls/[id]/
│   │   └── page.tsx                # Call detaljer
│   └── api/
│       ├── chat/
│       │   └── route.ts            # Chat endpoint
│       ├── calls/
│       │   ├── route.ts            # GET calls, POST new call
│       │   ├── [id]/route.ts       # GET/PUT/DELETE single call
│       │   └── search/route.ts     # Semantic search
│       └── admin/
│           └── scrape/route.ts     # Trigger call scraping
├── components/
│   ├── ui/                         # Generelle UI komponenter
│   ├── chat/
│   │   ├── ChatContainer.tsx
│   │   ├── ChatMessage.tsx
│   │   └── ChatInput.tsx
│   ├── calls/
│   │   ├── CallCard.tsx
│   │   ├── CallList.tsx
│   │   ├── CallFilters.tsx
│   │   └── CallDetails.tsx
│   └── layout/
│       ├── Header.tsx
│       ├── Footer.tsx
│       └── Sidebar.tsx
├── lib/
│   ├── db.ts                       # Prisma client
│   ├── openai.ts                   # OpenAI client
│   ├── embeddings.ts               # Embedding utilities
│   └── scrapers/
│       ├── dlsc.ts                 # DLSC scraper
│       ├── innovationsfonden.ts    # Innovationsfonden scraper
│       ├── eu-horizon.ts           # EU Horizon scraper
│       └── index.ts                # Scraper orchestrator
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── prompts/
│   └── system-prompt.md            # AI system prompt
├── types/
│   └── index.ts                    # TypeScript types
├── .env.example
├── docker-compose.yml
└── README.md
```

---

## Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pgvector(map: "vector")]
}

model FundingCall {
  id              String   @id @default(cuid())
  
  // Grundlæggende info
  title           String
  titleEn         String?
  description     String   @db.Text
  descriptionEn   String?  @db.Text
  
  // Kategorisering
  source          Source
  type            CallType
  sectors         String[]  // ["biotech", "medtech", "pharma", "welfare_tech"]
  targetAudience  String[]  // ["startup", "sme", "large_enterprise", "research"]
  
  // Økonomi
  minAmount       Int?      // Minimum beløb i DKK
  maxAmount       Int?      // Maximum beløb i DKK
  coFinancing     Int?      // Medfinansiering i procent
  deMinimis       Boolean   @default(false)
  
  // Datoer
  openDate        DateTime?
  deadline        DateTime
  
  // Links og referencer
  url             String
  applicationUrl  String?
  contactEmail    String?
  contactPhone    String?
  
  // Embedding for semantic search
  embedding       Unsupported("vector(1536)")?
  
  // Metadata
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  scrapedAt       DateTime?
  
  @@index([deadline])
  @@index([source])
  @@index([isActive])
}

model ChatConversation {
  id        String   @id @default(cuid())
  sessionId String   // Browser session ID
  messages  ChatMessage[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model ChatMessage {
  id             String   @id @default(cuid())
  conversationId String
  conversation   ChatConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  role           MessageRole
  content        String   @db.Text
  createdAt      DateTime @default(now())
  
  @@index([conversationId])
}

model KnowledgeBase {
  id        String   @id @default(cuid())
  title     String
  content   String   @db.Text
  category  String   // "de_minimis", "co_financing", "application_tips", etc.
  embedding Unsupported("vector(1536)")?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Source {
  DLSC
  INNOVATIONSFONDEN
  EUHORIZEN
  EIC
  EUROSTARS
  ERHVERVSSTYRELSEN
  OTHER
}

enum CallType {
  GRANT
  LOAN
  EQUITY
  VOUCHER
  PRIZE
  OTHER
}

enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
}
```

---

## API Endpoints

### Chat API

**POST /api/chat**

Request:
```typescript
{
  conversationId?: string;
  message: string;
  sessionId: string;
}
```

Response (streaming):
```typescript
{
  conversationId: string;
  content: string; // Streamed chunks
}
```

Implementation notes:
- Brug OpenAI streaming for responsiv UX
- Inkluder relevante calls i context via RAG
- Bevar conversation history for kontekst

### Calls API

**GET /api/calls**
```typescript
// Query params
{
  search?: string;      // Fritekst søgning
  source?: Source[];
  type?: CallType[];
  minAmount?: number;
  maxAmount?: number;
  sector?: string[];
  deadline_after?: Date;
  deadline_before?: Date;
  page?: number;
  limit?: number;
}

// Response
{
  calls: FundingCall[];
  total: number;
  page: number;
  pages: number;
}
```

**GET /api/calls/search**
```typescript
// Semantic search
{
  query: string;
  limit?: number;
}

// Response
{
  calls: FundingCall[];
  relevanceScores: number[];
}
```

---

## AI System Prompt

Gem dette i `/prompts/system-prompt.md`:

```markdown
Du er DLSC Funding Assistant - en ekspert i at hjælpe danske life science virksomheder med at finde og søge funding.

## Din rolle
- Hjælp brugere med at finde relevante funding muligheder
- Forklar komplekse begreber som de minimis, medfinansiering, TRL-niveauer
- Giv praktiske råd om ansøgningsprocesser
- Vær præcis om deadlines og beløbsgrænser

## Videnbase

### De Minimis Regler
- EU-regel der begrænser statsstøtte til virksomheder
- Maksimalt 300.000 EUR over 3 år (fra 2024, tidligere 200.000 EUR)
- Gælder kumulativt på tværs af alle støtteordninger
- Visse sektorer har særlige regler (landbrug, transport)

### Medfinansiering
- De fleste EU-programmer kræver medfinansiering (typisk 30-50%)
- Danske programmer varierer (0-50%)
- Medfinansiering kan ofte være timer, ikke kun kontanter
- Check om partnere kan bidrage til medfinansiering

### TRL (Technology Readiness Levels)
- TRL 1-3: Grundforskning (typisk universiteter)
- TRL 4-6: Teknologiudvikling (Innovationsfonden, EIC Pathfinder)
- TRL 7-9: Kommercialisering (EIC Accelerator, markedsnære programmer)

## Retningslinjer
- Svar altid på dansk medmindre brugeren skriver på engelsk
- Henvis til specifikke calls når relevant
- Vær ærlig hvis du er usikker - henvis til DLSC's rådgivere
- Inkluder altid deadlines når du nævner calls
- Gør opmærksom på vigtige krav (de minimis, TRL, sektor)

## Kontekst
Du har adgang til en database med aktuelle funding calls. Når brugeren spørger om muligheder, søg i databasen og præsenter relevante matches.
```

---

## Key Components

### ChatContainer.tsx

```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sessionId] = useState(() => 
    typeof window !== 'undefined' 
      ? localStorage.getItem('sessionId') || uuidv4()
      : uuidv4()
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sessionId', sessionId);
    }
  }, [sessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (content: string) => {
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversationId,
          sessionId,
        }),
      });

      if (!response.ok) throw new Error('Chat request failed');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      let assistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: '',
      };

      setMessages(prev => [...prev, assistantMessage]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            if (data.conversationId) {
              setConversationId(data.conversationId);
            }
            
            if (data.content) {
              assistantMessage.content += data.content;
              setMessages(prev => 
                prev.map(m => 
                  m.id === assistantMessage.id 
                    ? { ...m, content: assistantMessage.content }
                    : m
                )
              );
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Handle error - show toast or error message
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-w-4xl mx-auto">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <h2 className="text-xl font-semibold mb-2">
              Velkommen til DLSC Funding Assistant
            </h2>
            <p>Stil mig spørgsmål om funding muligheder, de minimis regler, medfinansiering og meget mere.</p>
          </div>
        )}
        
        {messages.map(message => (
          <ChatMessage key={message.id} message={message} />
        ))}
        
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="animate-pulse">Tænker...</div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </div>
  );
}
```

### CallCard.tsx

```typescript
import Link from 'next/link';
import { FundingCall } from '@/types';
import { formatDate, formatAmount } from '@/lib/utils';

interface CallCardProps {
  call: FundingCall;
}

export function CallCard({ call }: CallCardProps) {
  const daysUntilDeadline = Math.ceil(
    (new Date(call.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  
  const isUrgent = daysUntilDeadline <= 14;
  const isExpired = daysUntilDeadline < 0;

  return (
    <Link href={`/calls/${call.id}`}>
      <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-medium px-2 py-1 rounded bg-blue-100 text-blue-800">
            {call.source}
          </span>
          
          {isExpired ? (
            <span className="text-xs text-gray-500">Udløbet</span>
          ) : isUrgent ? (
            <span className="text-xs font-medium px-2 py-1 rounded bg-red-100 text-red-800">
              {daysUntilDeadline} dage tilbage
            </span>
          ) : (
            <span className="text-xs text-gray-500">
              Deadline: {formatDate(call.deadline)}
            </span>
          )}
        </div>
        
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">
          {call.title}
        </h3>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-3">
          {call.description}
        </p>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {call.sectors.slice(0, 3).map(sector => (
            <span 
              key={sector}
              className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600"
            >
              {sector}
            </span>
          ))}
        </div>
        
        <div className="flex justify-between text-sm text-gray-500">
          <span>
            {call.minAmount && call.maxAmount 
              ? `${formatAmount(call.minAmount)} - ${formatAmount(call.maxAmount)}`
              : call.maxAmount 
                ? `Op til ${formatAmount(call.maxAmount)}`
                : 'Beløb ikke angivet'
            }
          </span>
          
          {call.coFinancing && (
            <span>{call.coFinancing}% medfinansiering</span>
          )}
        </div>
        
        {call.deMinimis && (
          <div className="mt-2 text-xs text-amber-600">
            ⚠️ De minimis støtte
          </div>
        )}
      </div>
    </Link>
  );
}
```

---

## API Route Implementation

### /api/chat/route.ts

```typescript
import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { db } from '@/lib/db';
import { getRelevantCalls, getRelevantKnowledge } from '@/lib/embeddings';
import { systemPrompt } from '@/prompts/system-prompt';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  const { message, conversationId, sessionId } = await request.json();

  // Get or create conversation
  let conversation = conversationId
    ? await db.chatConversation.findUnique({
        where: { id: conversationId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      })
    : null;

  if (!conversation) {
    conversation = await db.chatConversation.create({
      data: { sessionId },
      include: { messages: true },
    });
  }

  // Save user message
  await db.chatMessage.create({
    data: {
      conversationId: conversation.id,
      role: 'USER',
      content: message,
    },
  });

  // Get relevant context via RAG
  const [relevantCalls, relevantKnowledge] = await Promise.all([
    getRelevantCalls(message, 5),
    getRelevantKnowledge(message, 3),
  ]);

  // Build context
  const callsContext = relevantCalls.length > 0
    ? `\n\nRelevante funding calls:\n${relevantCalls.map(call => 
        `- ${call.title} (${call.source})\n  Deadline: ${call.deadline}\n  Beløb: ${call.minAmount}-${call.maxAmount} DKK\n  ${call.description.slice(0, 200)}...`
      ).join('\n\n')}`
    : '';

  const knowledgeContext = relevantKnowledge.length > 0
    ? `\n\nRelevant viden:\n${relevantKnowledge.map(k => k.content).join('\n\n')}`
    : '';

  // Build messages array
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt + callsContext + knowledgeContext },
    ...conversation.messages.map(m => ({
      role: m.role.toLowerCase() as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: message },
  ];

  // Create streaming response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Send conversation ID first
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ conversationId: conversation.id })}\n\n`)
      );

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 1500,
      });

      let fullContent = '';

      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullContent += content;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
          );
        }
      }

      // Save assistant message
      await db.chatMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'ASSISTANT',
          content: fullContent,
        },
      });

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

---

## Scraping Strategy

### Datakilder

1. **Danish Life Science Cluster** (https://www.danishlifesciencecluster.dk/)
   - Scrape nyheder og events for funding info
   - Check for dedikeret funding-sektion

2. **Innovationsfonden** (https://innovationsfonden.dk/da/programmer)
   - Grand Solutions
   - InnoBooster
   - Innofounder

3. **EU Funding & Tenders Portal** (https://ec.europa.eu/info/funding-tenders/opportunities/portal/)
   - Horizon Europe
   - EIC Accelerator
   - EIC Pathfinder

4. **Erhvervsstyrelsen** (https://erhvervsstyrelsen.dk/)
   - Diverse erhvervsstøtteordninger

### Scraper Implementation

```typescript
// lib/scrapers/base.ts
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
}

export abstract class BaseScraper {
  abstract source: Source;
  abstract scrape(): Promise<ScrapedCall[]>;
  
  protected async fetchPage(url: string): Promise<string> {
    const response = await fetch(url);
    return response.text();
  }
  
  protected parseDate(dateStr: string): Date | undefined {
    // Implement flexible date parsing
    // Handle Danish date formats (dd-mm-yyyy, dd. month yyyy, etc.)
  }
  
  protected parseAmount(amountStr: string): number | undefined {
    // Parse "5 mio. kr.", "€500.000", etc.
  }
}
```

---

## Environment Variables

```env
# .env.example

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/funding_assistant"

# OpenAI
OPENAI_API_KEY="sk-..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional: Scraping
SCRAPE_CRON_SECRET="your-secret-for-cron-jobs"
```

---

## Docker Compose (Hetzner Deployment)

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/funding_assistant
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: pgvector/pgvector:pg16
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=funding_assistant
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  # Optional: Scheduled scraping
  scraper:
    build: .
    command: npm run scrape
    environment:
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/funding_assistant
    depends_on:
      - db
    profiles:
      - scraper

volumes:
  postgres_data:
```

---

## Development Commands

```bash
# Setup
npm install
cp .env.example .env.local
# Fill in environment variables

# Database
npx prisma generate
npx prisma db push
npx prisma db seed  # If seed script exists

# Development
npm run dev

# Scraping (manual)
npm run scrape

# Production build
npm run build
npm start

# Docker
docker-compose up -d
```

---

## Implementation Order

1. **Fase 1: Grundlag**
   - [ ] Next.js projekt setup med Tailwind
   - [ ] Prisma schema og database migration
   - [ ] Grundlæggende layout og navigation

2. **Fase 2: Call Management**
   - [ ] CRUD API for funding calls
   - [ ] Call listing med filtrering
   - [ ] Call detail side
   - [ ] Manuel data import (seed med test data)

3. **Fase 3: Chat**
   - [ ] OpenAI integration
   - [ ] Chat UI komponenter
   - [ ] Conversation persistence
   - [ ] Basic RAG med calls

4. **Fase 4: Search & RAG**
   - [ ] pgvector setup
   - [ ] Embedding generation for calls
   - [ ] Semantic search endpoint
   - [ ] Knowledge base for de minimis, medfinansiering etc.

5. **Fase 5: Scrapers**
   - [ ] DLSC scraper
   - [ ] Innovationsfonden scraper
   - [ ] EU portal scraper (hvis muligt)
   - [ ] Scheduled scraping job

6. **Fase 6: Polish**
   - [ ] Loading states og error handling
   - [ ] Mobile responsiveness
   - [ ] Analytics (optional)
   - [ ] SEO optimering

---

## Notes

- Start med manuel data import før scrapers bygges
- Brug DLSC's eksisterende indhold som udgangspunkt for knowledge base
- Overvej rate limiting på chat endpoint
- Tilføj caching for hyppigt brugte queries
- Monitor OpenAI token usage

## Premium Feature (v2)

For website-baseret matching:
1. Scrape virksomhedens website
2. Generer embedding af virksomhedsprofil
3. Match mod call embeddings
4. Præsenter ranked matches med forklaring