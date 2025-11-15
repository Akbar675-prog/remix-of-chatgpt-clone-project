import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const { fileName, fileContent, fileType } = await request.json();

    if (!fileName || !fileContent || !fileType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Determine the file directory based on type
    let fileDir = '';
    let deployUrl = '';
    
    if (fileType === 'html') {
      fileDir = join(process.cwd(), 'public', 'file', 'html');
      deployUrl = `/file/html/${fileName}`;
    } else if (fileType === 'txt') {
      fileDir = join(process.cwd(), 'public', 'file', 'txt');
      deployUrl = `/file/txt/${fileName}`;
    } else if (fileType === 'zip') {
      // For ZIP files, generate a random code
      const randomCode = Math.random().toString(36).substring(2, 10);
      fileDir = join(process.cwd(), 'public', 'file', 'zip');
      
      // Update fileName to include random code
      const newFileName = `${randomCode}.zip`;
      
      // Create directory if it doesn't exist
      if (!existsSync(fileDir)) {
        await mkdir(fileDir, { recursive: true });
      }
      
      // Decode base64 content and write file
      const buffer = Buffer.from(fileContent.split(',')[1] || fileContent, 'base64');
      await writeFile(join(fileDir, newFileName), buffer);
      
      return NextResponse.json({
        success: true,
        url: `/download/zip/${randomCode}`,
        fileUrl: `/file/zip/${randomCode}.zip`,
        fileName: newFileName,
        randomCode
      });
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Only HTML, TXT, and ZIP are supported.' },
        { status: 400 }
      );
    }

    // Create directory if it doesn't exist
    if (!existsSync(fileDir)) {
      await mkdir(fileDir, { recursive: true });
    }

    // Write the file
    const filePath = join(fileDir, fileName);
    
    // For HTML and TXT, write as plain text
    if (fileType === 'html' || fileType === 'txt') {
      await writeFile(filePath, fileContent, 'utf-8');
    }

    return NextResponse.json({
      success: true,
      url: deployUrl,
      fileName
    });
  } catch (error) {
    console.error('File deployment error:', error);
    return NextResponse.json(
      { error: 'Failed to deploy file' },
      { status: 500 }
    );
  }
}