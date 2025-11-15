import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

// Detect deployment commands
function isDeploymentCommand(message: string): boolean {
  const deployKeywords = [
    'deploy this',
    'deploy html',
    'deploy it',
    'deploy this plis',
    'deploy file',
    'tolong deploy',
    'deploy please',
    'deploy',
  ];
  const lowerMessage = message.toLowerCase();
  return deployKeywords.some(keyword => lowerMessage.includes(keyword));
}

// Detect search commands
function isSearchCommand(message: string): boolean {
  const searchKeywords = [
    'cari di browser',
    'search in browser',
    'apa itu',
    'what is',
    'siapa',
    'who is',
    'bagaimana',
    'how to',
    'kenapa',
    'why'
  ];
  const lowerMessage = message.toLowerCase();
  return searchKeywords.some(keyword => lowerMessage.includes(keyword));
}

// Extract search query
function extractSearchQuery(message: string): string {
  const patterns = [
    /apa itu (.+)/i,
    /what is (.+)/i,
    /cari di browser (.+)/i,
    /search (?:in browser )?(.+)/i,
    /siapa (.+)/i,
    /who is (.+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) return match[1].trim();
  }
  
  return message.trim();
}

export async function POST(request: NextRequest) {
  try {
    const { messages, enableSearch = false, files = [] } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google API key not configured' },
        { status: 500 }
      );
    }

    const lastMessage = messages[messages.length - 1]?.content || '';
    
    // Check if this is a deployment command with files
    const hasFiles = files && files.length > 0;
    const isDeployCommand = isDeploymentCommand(lastMessage);
    
    if (hasFiles && isDeployCommand) {
      // Handle file deployment
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const file = files[0];
            const fileName = file.name;
            const fileType = fileName.split('.').pop()?.toLowerCase();
            
            // Check if file type is supported
            if (!['html', 'txt', 'zip'].includes(fileType || '')) {
              controller.enqueue(encoder.encode(JSON.stringify({ 
                token: `Sorry, I can only deploy HTML, TXT, and ZIP files. The file you uploaded is ${fileType}.` 
              }) + '\n'));
              controller.close();
              return;
            }

            // Show deploying message
            controller.enqueue(encoder.encode(JSON.stringify({ 
              token: `Deploying ${fileName}...\n\n` 
            }) + '\n'));
            await new Promise(resolve => setTimeout(resolve, 500));

            // Deploy the file
            const deployResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/deploy`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                fileName: fileName,
                fileContent: file.content,
                fileType: fileType,
              }),
            });

            if (!deployResponse.ok) {
              throw new Error('Deployment failed');
            }

            const deployData = await deployResponse.json();
            const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
            let finalUrl = '';

            if (fileType === 'zip') {
              finalUrl = `https://zipper-file.id/${deployData.randomCode}`;
              controller.enqueue(encoder.encode(JSON.stringify({ 
                token: `File deployed successfully!\n\n` 
              }) + '\n'));
              controller.enqueue(encoder.encode(JSON.stringify({ 
                token: `URL: ${finalUrl}\n\n` 
              }) + '\n'));
              controller.enqueue(encoder.encode(JSON.stringify({ 
                token: `When someone visits this link, the ZIP file will be automatically downloaded.\n\n` 
              }) + '\n'));
              controller.enqueue(encoder.encode(JSON.stringify({ 
                token: `Note: For demo purposes, the actual URL is ${baseUrl}${deployData.url}` 
              }) + '\n'));
            } else if (fileType === 'html') {
              finalUrl = `https://swampy-ai-advanced.vercel.app/file/html/${fileName}`;
              controller.enqueue(encoder.encode(JSON.stringify({ 
                token: `File deployed successfully!\n\n` 
              }) + '\n'));
              controller.enqueue(encoder.encode(JSON.stringify({ 
                token: `URL: ${finalUrl}\n\n` 
              }) + '\n'));
              controller.enqueue(encoder.encode(JSON.stringify({ 
                token: `You can access your HTML file at the link above.\n\n` 
              }) + '\n'));
              controller.enqueue(encoder.encode(JSON.stringify({ 
                token: `Note: For demo purposes, the actual URL is ${baseUrl}${deployData.url}` 
              }) + '\n'));
            } else if (fileType === 'txt') {
              finalUrl = `https://swampy-ai-advanced.vercel.app/file/txt/${fileName}`;
              controller.enqueue(encoder.encode(JSON.stringify({ 
                token: `File deployed successfully!\n\n` 
              }) + '\n'));
              controller.enqueue(encoder.encode(JSON.stringify({ 
                token: `URL: ${finalUrl}\n\n` 
              }) + '\n'));
              controller.enqueue(encoder.encode(JSON.stringify({ 
                token: `You can access your text file at the link above.\n\n` 
              }) + '\n'));
              controller.enqueue(encoder.encode(JSON.stringify({ 
                token: `Note: For demo purposes, the actual URL is ${baseUrl}${deployData.url}` 
              }) + '\n'));
            }
            
            controller.close();
          } catch (error) {
            console.error('Deployment error:', error);
            controller.enqueue(encoder.encode(JSON.stringify({ 
              token: `Error deploying file: ${error instanceof Error ? error.message : 'Unknown error'}` 
            }) + '\n'));
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
        },
      });
    }

    // Initialize Google GenAI client
    const ai = new GoogleGenAI({
      apiKey: apiKey,
    });

    // Convert messages to Gemini format with proper content structure
    const contents = messages.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    // Configure grounding with Google Search if enabled or if search command detected
    const config: any = {
      temperature: 0.7,
      maxOutputTokens: 2048,
    };

    const shouldEnableSearch = enableSearch || isSearchCommand(lastMessage);
    const tools = shouldEnableSearch ? [{ googleSearch: {} }] : undefined;

    // Stream response using generateContentStream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // If search is enabled, show search status
          if (shouldEnableSearch) {
            const query = extractSearchQuery(lastMessage);
            const searchStatuses = [
              `Mencari ${query}...`,
              `Searching for information about ${query}...`,
              `Looking up ${query}...`
            ];
            
            for (const status of searchStatuses) {
              controller.enqueue(encoder.encode(JSON.stringify({ token: status + '\n\n' }) + '\n'));
              await new Promise(resolve => setTimeout(resolve, 300));
            }
          }

          const responseStream = await ai.models.generateContentStream({
            model: 'gemini-2.0-flash',
            contents: contents,
            config: config,
            tools: tools,
          });

          for await (const chunk of responseStream) {
            const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (text) {
              const data = JSON.stringify({ token: text });
              controller.enqueue(encoder.encode(data + '\n'));
            }
          }
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}