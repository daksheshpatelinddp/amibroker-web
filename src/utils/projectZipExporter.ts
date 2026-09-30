import JSZip from 'jszip';

export interface ProjectFileEntry {
  path: string;
  name: string;
  folder: string;
  content: string;
  description: string;
}

// Dynamically gather all source files
const srcModules = import.meta.glob(
  ['/src/**/*.{tsx,ts,css}'],
  { query: '?raw', import: 'default', eager: true }
) as Record<string, string>;

export function getAllProjectFiles(): ProjectFileEntry[] {
  const files: ProjectFileEntry[] = [];
  for (const [rawPath, moduleContent] of Object.entries(srcModules)) {
    const cleanPath = rawPath.startsWith('/') ? rawPath.slice(1) : rawPath;
    const parts = cleanPath.split('/');
    const name = parts[parts.length - 1];
    const folder = parts.slice(0, parts.length - 1).join('/') || 'src';

    files.push({
      path: cleanPath,
      name,
      folder,
      content: typeof moduleContent === 'string' ? moduleContent : String(moduleContent),
      description: `Source: ${cleanPath}`,
    });
  }
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

export async function downloadCompleteProjectZip(
  onProgress?: (percent: number, currentFile: string) => void
): Promise<void> {
  const zip = new JSZip();
  const allFiles = getAllProjectFiles();
  const total = allFiles.length;

  for (let i = 0; i < total; i++) {
    const file = allFiles[i];
    zip.file(file.path, file.content);
    if (onProgress) {
      onProgress(Math.round(((i + 1) / total) * 70), file.path);
    }
  }

  const content = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
  });

  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'amibroker-web-project.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  }
