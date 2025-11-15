import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { conversations, messages } from '@/db/schema';
import { eq, asc, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const id = params.id;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid ID is required',
          code: 'INVALID_ID'
        },
        { status: 400 }
      );
    }

    // Verify conversation belongs to user
    const conversation = await db
      .select()
      .from(conversations)
      .where(and(
        eq(conversations.id, parseInt(id)),
        eq(conversations.userId, userId)
      ))
      .limit(1);

    if (conversation.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, parseInt(id)))
      .orderBy(asc(messages.timestamp));

    return NextResponse.json({
      conversation: conversation[0],
      messages: conversationMessages
    });
  } catch (error: any) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const id = params.id;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid ID is required',
          code: 'INVALID_ID'
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, updatedAt } = body;

    // Build update object dynamically
    const updateData: { title?: string; updatedAt: string } = {
      updatedAt: updatedAt || new Date().toISOString()
    };

    // Only update title if provided
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        return NextResponse.json(
          { 
            error: 'Title must be a non-empty string',
            code: 'INVALID_TITLE'
          },
          { status: 400 }
        );
      }
      updateData.title = title.trim();
    }

    // Verify conversation belongs to user and update
    const updated = await db
      .update(conversations)
      .set(updateData)
      .where(and(
        eq(conversations.id, parseInt(id)),
        eq(conversations.userId, userId)
      ))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updated[0]);
  } catch (error: any) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const id = params.id;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid ID is required',
          code: 'INVALID_ID'
        },
        { status: 400 }
      );
    }

    // Verify conversation belongs to user and delete
    const deleted = await db
      .delete(conversations)
      .where(and(
        eq(conversations.id, parseInt(id)),
        eq(conversations.userId, userId)
      ))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Conversation deleted successfully',
      id: deleted[0].id
    });
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}