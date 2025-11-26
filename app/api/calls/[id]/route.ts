import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/calls/[id] - Get a single call
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const call = await db.fundingCall.findUnique({
      where: { id },
    });

    if (!call) {
      return NextResponse.json(
        { error: 'Call not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(call);
  } catch (error) {
    console.error('Error fetching call:', error);
    return NextResponse.json(
      { error: 'Failed to fetch call' },
      { status: 500 }
    );
  }
}

// PUT /api/calls/[id] - Update a call (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if call exists
    const existingCall = await db.fundingCall.findUnique({
      where: { id },
    });

    if (!existingCall) {
      return NextResponse.json(
        { error: 'Call not found' },
        { status: 404 }
      );
    }

    // Update the call
    const call = await db.fundingCall.update({
      where: { id },
      data: {
        title: body.title,
        titleEn: body.titleEn,
        description: body.description,
        descriptionEn: body.descriptionEn,
        source: body.source,
        type: body.type,
        sectors: body.sectors,
        targetAudience: body.targetAudience,
        minAmount: body.minAmount,
        maxAmount: body.maxAmount,
        coFinancing: body.coFinancing,
        deMinimis: body.deMinimis,
        openDate: body.openDate ? new Date(body.openDate) : null,
        deadline: body.deadline ? new Date(body.deadline) : existingCall.deadline,
        url: body.url,
        applicationUrl: body.applicationUrl,
        contactEmail: body.contactEmail,
        contactPhone: body.contactPhone,
        isActive: body.isActive !== undefined ? body.isActive : existingCall.isActive,
      },
    });

    // TODO: Regenerate embedding if content changed

    return NextResponse.json(call);
  } catch (error) {
    console.error('Error updating call:', error);
    return NextResponse.json(
      { error: 'Failed to update call' },
      { status: 500 }
    );
  }
}

// DELETE /api/calls/[id] - Delete a call (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if call exists
    const existingCall = await db.fundingCall.findUnique({
      where: { id },
    });

    if (!existingCall) {
      return NextResponse.json(
        { error: 'Call not found' },
        { status: 404 }
      );
    }

    // Delete the call
    await db.fundingCall.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting call:', error);
    return NextResponse.json(
      { error: 'Failed to delete call' },
      { status: 500 }
    );
  }
}
