# DLSC Funding Assistant

En AI-drevet funding assistant til Danish Life Science Cluster (DLSC), der hjælper medlemmer med at finde relevante funding muligheder fra både danske og EU-kilder.

## Tech Stack

- **Frontend**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL med pgvector extension
- **ORM**: Prisma
- **AI**: OpenAI GPT-4o med RAG (Retrieval-Augmented Generation)

## Getting Started

### Prerequisites

- Node.js 18+
- Docker og Docker Compose
- OpenAI API key

### Setup

1. Clone repository og installer dependencies:
```bash
npm install
```

2. Kopier environment variables:
```bash
cp .env.example .env
```

3. Opdater `.env` med dine credentials:
   - `DATABASE_URL`: Update hvis du ikke bruger Docker
   - `OPENAI_API_KEY`: Tilføj din OpenAI API key

4. Start PostgreSQL database med Docker:
```bash
docker-compose up -d
```

5. Push Prisma schema til database:
```bash
npm run db:push
```

6. Generate Prisma client:
```bash
npm run db:generate
```

7. (Optional) Seed database med test data:
```bash
npm run db:seed
```

8. Start development server:
```bash
npm run dev
```

Åbn [http://localhost:3000](http://localhost:3000) i din browser.

## Project Structure

```
├── app/                  # Next.js App Router pages
│   ├── api/             # API routes
│   ├── calls/           # Call listing & details pages
│   ├── chat/            # Chat interface page
│   └── page.tsx         # Landing page
├── components/          # React components
│   ├── calls/           # Call-related components
│   ├── chat/            # Chat interface components
│   ├── layout/          # Layout components
│   └── ui/              # Reusable UI components
├── lib/                 # Utility functions
│   ├── db.ts            # Prisma client
│   ├── openai.ts        # OpenAI client
│   ├── embeddings.ts    # Embedding & RAG utilities
│   └── utils.ts         # Helper functions
├── prisma/              # Database schema & migrations
├── prompts/             # AI system prompts
└── types/               # TypeScript type definitions
```

## Features

### v1 (Current)
- ✅ Browse and search funding calls
- ✅ AI chat assistant with funding expertise
- ✅ Semantic search med embeddings
- ✅ Filter calls by source, type, sector, amount, deadline

### v2 (Planned)
- 🔄 Web scrapers for automatic call updates
- 🔄 Company website matching
- 🔄 Email notifications for new calls
- 🔄 User accounts and saved searches

## Database

Database bruger PostgreSQL med pgvector extension for semantic search.

### Environment Variable

Opdater `DATABASE_URL` i `.env`:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/funding_assistant"
```

### Migrations

```bash
# Push schema changes
npm run db:push

# Generate Prisma Client
npm run db:generate

# Seed database
npm run db:seed
```

## API Endpoints

### Calls
- `GET /api/calls` - List all calls med pagination og filters
- `POST /api/calls` - Create new call (admin)
- `GET /api/calls/[id]` - Get single call
- `PUT /api/calls/[id]` - Update call (admin)
- `DELETE /api/calls/[id]` - Delete call (admin)
- `GET /api/calls/search` - Semantic search

### Chat
- `POST /api/chat` - Stream chat responses med RAG

## Development Commands

```bash
# Development
npm run dev           # Start dev server
npm run build         # Build for production
npm run start         # Start production server
npm run lint          # Run linter

# Database
npm run db:push       # Push schema changes
npm run db:generate   # Generate Prisma client
npm run db:seed       # Seed database

# Docker
docker-compose up -d  # Start database
docker-compose down   # Stop database
docker-compose logs   # View logs
```

## Contributing

Dette er et internt DLSC projekt. For spørgsmål, kontakt udviklingsteamet.

## License

Private - Danish Life Science Cluster
