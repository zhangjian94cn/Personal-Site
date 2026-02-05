import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Helper to recursively get all files
function getAllFiles(dirPath: string, arrayOfFiles: string[] = [], basePath: string = '') {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  
  const files = fs.readdirSync(dirPath);

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles, basePath + file + "/");
    } else {
      arrayOfFiles.push(path.join(basePath, "/", file));
    }
  });

  return arrayOfFiles.map(f => f.replace(/^\//, '')); // Remove leading slash
}

// Generate static params for export
export async function generateStaticParams() {
  const projectsDir = path.join(process.cwd(), 'content', 'projects');
  if (!fs.existsSync(projectsDir)) return [];
  
  const allFiles = getAllFiles(projectsDir);
  
  return allFiles.map((file) => ({
    path: file.split(path.sep),
  }));
}

// Serve static files from content/projects directory
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  const filePath = path.join(process.cwd(), 'content', 'projects', ...pathSegments);
  
  // Security check: ensure we're not escaping the project directory
  const normalizedPath = path.normalize(filePath);
  const projectDir = path.join(process.cwd(), 'content', 'projects');
  if (!normalizedPath.startsWith(projectDir)) {
    return new NextResponse('Forbidden', { status: 403 });
  }
  
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return new NextResponse('Not Found', { status: 404 });
    }
    
    const stat = fs.statSync(filePath);
    
    // If it's a directory, try to serve index.html
    let targetPath = filePath;
    if (stat.isDirectory()) {
      targetPath = path.join(filePath, 'index.html');
      if (!fs.existsSync(targetPath)) {
        return new NextResponse('Not Found', { status: 404 });
      }
    }
    
    // Determine content type
    const ext = path.extname(targetPath).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.pdf': 'application/pdf',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
    };
    
    const contentType = contentTypes[ext] || 'application/octet-stream';
    
    // Read file content
    const rawContent = fs.readFileSync(targetPath);
    
    // For HTML files, strip Jekyll front matter (--- ... ---)
    let responseBody: BodyInit;
    if (ext === '.html') {
      let htmlContent = rawContent.toString('utf-8');
      // Remove Jekyll front matter at the start of the file
      htmlContent = htmlContent.replace(/^---[\s\S]*?---\s*/, '');
      responseBody = htmlContent;
    } else {
      // Convert Buffer to Uint8Array for NextResponse compatibility
      responseBody = new Uint8Array(rawContent);
    }
    
    return new NextResponse(responseBody, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error serving project file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
