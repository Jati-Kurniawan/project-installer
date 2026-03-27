import { existsSync, readdir } from 'fs-extra';
import { resolve } from 'path';

export async function isDirectoryEmpty(dirPath: string): Promise<boolean> {
  try {
    if (!existsSync(dirPath)) {
      return true;
    }
    
    const files = await readdir(dirPath);
    // Filter out hidden files and common development directories
    const visibleFiles = files.filter(file => 
      !file.startsWith('.') && 
      !['node_modules', 'dist', 'build'].includes(file)
    );
    
    return visibleFiles.length === 0;
  } catch {
    return true;
  }
}

export function resolveProjectPath(projectName: string, basePath?: string): string {
  const base = basePath || process.cwd();
  return resolve(base, projectName);
}