import { NextRequest } from 'next/server';
import { openai, CHAT_MODEL } from '@/lib/openai';
import { db } from '@/lib/db';
import { getRelevantCalls, getRelevantKnowledge } from '@/lib/embeddings';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load system prompt
const systemPromptPath = join(process.cwd(), 'prompts', 'system-prompt.md');
const systemPrompt = readFileSync(systemPromptPath, 'utf-8');

export async function POST(request: NextRequest) {
  try {
    const { message, conversationId, sessionId } = await request.json();

    if (!message || !sessionId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      );
    }

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

    // Build context for calls
    const callsContext =
      relevantCalls.length > 0
        ? `\n\nRelevante funding calls:\n${relevantCalls
            .map(
              (call) =>
                `- ${call.title} (${call.source})\n  Deadline: ${new Date(
                  call.deadline
                ).toLocaleDateString('da-DK')}\n  Beløb: ${call.minAmount ? call.minAmount + '-' : ''}${call.maxAmount ? call.maxAmount + ' DKK' : 'Ikke angivet'}\n  ${call.description.slice(0, 200)}...`
            )
            .join('\n\n')}`
        : '';

    // Build context for knowledge
    const knowledgeContext =
      relevantKnowledge.length > 0
        ? `\n\nRelevant viden:\n${relevantKnowledge.map((k) => k.content).join('\n\n')}`
        : '';

    // Build messages array for OpenAI
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      {
        role: 'system',
        content: systemPrompt + callsContext + knowledgeContext,
      },
      ...conversation.messages.map((m) => ({
        role: m.role.toLowerCase() as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send conversation ID first
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ conversationId: conversation.id })}\n\n`
            )
          );

          // Create OpenAI stream
          const response = await openai.chat.completions.create({
            model: CHAT_MODEL,
            messages,
            stream: true,
            temperature: 0.7,
            max_tokens: 1500,
          });

          let fullContent = '';

          // Stream chunks
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullContent += content;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
              );
            }
          }

          // Save assistant message to database
          await db.chatMessage.create({
            data: {
              conversationId: conversation.id,
              role: 'ASSISTANT',
              content: fullContent,
            },
          });

          controller.close();
        } catch (error) {
          console.error('Error in chat stream:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}
