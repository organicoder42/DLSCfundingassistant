import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Source, CallType } from '@/types';

// GET /api/calls - List all calls with filters and pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const search = searchParams.get('search') || undefined;
    const sources = searchParams.getAll('source') as Source[];
    const types = searchParams.getAll('type') as CallType[];
    const sectors = searchParams.getAll('sector');
    const minAmount = searchParams.get('minAmount')
      ? parseInt(searchParams.get('minAmount')!)
      : undefined;
    const maxAmount = searchParams.get('maxAmount')
      ? parseInt(searchParams.get('maxAmount')!)
      : undefined;
    const deadlineAfter = searchParams.get('deadline_after')
      ? new Date(searchParams.get('deadline_after')!)
      : undefined;
    const deadlineBefore = searchParams.get('deadline_before')
      ? new Date(searchParams.get('deadline_before')!)
      : undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    // Build where clause
    const where: any = {
      isActive: true,
    };

    // Text search
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Source filter
    if (sources.length > 0) {
      where.source = { in: sources };
    }

    // Type filter
    if (types.length > 0) {
      where.type = { in: types };
    }

    // Sector filter
    if (sectors.length > 0) {
      where.sectors = { hasSome: sectors };
    }

    // Amount filters
    if (minAmount !== undefined || maxAmount !== undefined) {
      where.AND = where.AND || [];

      if (minAmount !== undefined) {
        where.AND.push({
          OR: [
            { maxAmount: { gte: minAmount } },
            { maxAmount: null },
          ],
        });
      }

      if (maxAmount !== undefined) {
        where.AND.push({
          OR: [
            { minAmount: { lte: maxAmount } },
            { minAmount: null },
          ],
        });
      }
    }

    // Deadline filters
    if (deadlineAfter || deadlineBefore) {
      where.deadline = {};
      if (deadlineAfter) {
        where.deadline.gte = deadlineAfter;
      }
      if (deadlineBefore) {
        where.deadline.lte = deadlineBefore;
      }
    }

    // Get total count
    const total = await db.fundingCall.count({ where });

    // Get paginated results
    const calls = await db.fundingCall.findMany({
      where,
      orderBy: [
        { deadline: 'asc' },
        { createdAt: 'desc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calculate pages
    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      calls,
      total,
      page,
      pages,
    });
  } catch (error) {
    console.error('Error fetching calls:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calls' },
      { status: 500 }
    );
  }
}

// POST /api/calls - Create a new call (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { title, description, source, type, sectors, targetAudience, deadline, url } = body;

    if (!title || !description || !source || !type || !sectors || !targetAudience || !deadline || !url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the call
    const call = await db.fundingCall.create({
      data: {
        title,
        titleEn: body.titleEn,
        description,
        descriptionEn: body.descriptionEn,
        source,
        type,
        sectors,
        targetAudience,
        minAmount: body.minAmount,
        maxAmount: body.maxAmount,
        coFinancing: body.coFinancing,
        deMinimis: body.deMinimis || false,
        openDate: body.openDate ? new Date(body.openDate) : null,
        deadline: new Date(deadline),
        url,
        applicationUrl: body.applicationUrl,
        contactEmail: body.contactEmail,
        contactPhone: body.contactPhone,
      },
    });

    // TODO: Generate embedding for the call in the background
    // This would typically be done via a background job

    return NextResponse.json(call, { status: 201 });
  } catch (error) {
    console.error('Error creating call:', error);
    return NextResponse.json(
      { error: 'Failed to create call' },
      { status: 500 }
    );
  }
}
