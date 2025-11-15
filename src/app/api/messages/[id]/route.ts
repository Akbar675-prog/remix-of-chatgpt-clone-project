import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { messages } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validate ID is a valid integer
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        {
          error: 'Valid ID is required',
          code: 'INVALID_ID',
        },
        { status: 400 }
      );
    }

    const messageId = parseInt(id);

    // Delete the message
    const deleted = await db
      .delete(messages)
      .where(eq(messages.id, messageId))
      .returning();

    // Check if message was found and deleted
    if (deleted.length === 0) {
      return NextResponse.json(
        {
          error: 'Message not found',
        },
        { status: 404 }
      );
    }

    // Return success response
    return NextResponse.json(
      {
        message: 'Message deleted successfully',
        id: deleted[0].id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    );
  }
}