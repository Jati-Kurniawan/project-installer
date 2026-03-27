export function isValidProjectName(name: string): boolean {
  // Check for valid directory name characters
  const validNameRegex = /^[a-zA-Z0-9_-]+$/;
  return validNameRegex.test(name) && name.length > 0 && name.length <= 255;
}

export function sanitizeProjectName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}