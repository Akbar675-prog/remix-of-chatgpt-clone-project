export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
  url?: string;
}

const ALLOWED_FILE_TYPES = [
  '.txt', '.html', '.js', '.css', '.json', '.md', '.xml', '.csv',
  '.zip', '.tar', '.gz', '.tar.gz', '.rar',
  '.pdf', '.doc', '.docx',
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
  '.mp3', '.mp4', '.wav', '.avi', '.mov',
  '.ts', '.tsx', '.jsx', '.py', '.java', '.c', '.cpp', '.h', '.hpp',
  '.sh', '.bat', '.yaml', '.yml', '.toml', '.ini', '.conf'
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function isFileTypeAllowed(filename: string): boolean {
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return ALLOWED_FILE_TYPES.some(type => extension.endsWith(type));
}

export function isFileSizeAllowed(size: number): boolean {
  return size <= MAX_FILE_SIZE;
}

export async function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    // Check if file is text-based or binary
    const textTypes = ['.txt', '.html', '.js', '.css', '.json', '.md', '.xml', '.csv', '.ts', '.tsx', '.jsx', '.py', '.java', '.c', '.cpp', '.h', '.hpp', '.sh', '.bat', '.yaml', '.yml', '.toml', '.ini', '.conf'];
    const isTextFile = textTypes.some(type => file.name.toLowerCase().endsWith(type));
    
    if (isTextFile) {
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    } else {
      // For binary files, read as data URL
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    }
  });
}

export async function processFile(file: File): Promise<FileAttachment> {
  if (!isFileTypeAllowed(file.name)) {
    throw new Error(`File type not allowed: ${file.name}`);
  }
  
  if (!isFileSizeAllowed(file.size)) {
    throw new Error(`File size exceeds limit (50MB): ${file.name}`);
  }
  
  const content = await readFileContent(file);
  
  return {
    id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
    name: file.name,
    type: file.type || 'application/octet-stream',
    size: file.size,
    content,
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
