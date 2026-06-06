// Type declarations for non-code imports (assets, etc.)
// Expo bundles these as-is at build time — TypeScript just needs to know
// that the import is valid.

declare module "*.png" {
  const source: number;
  export default source;
}

declare module "*.jpg" {
  const source: number;
  export default source;
}

declare module "*.jpeg" {
  const source: number;
  export default source;
}

declare module "*.webp" {
  const source: number;
  export default source;
}

declare module "*.gif" {
  const source: number;
  export default source;
}

declare module "*.svg" {
  const React: unknown;
  const source: React.FC<{ width?: number; height?: number; fill?: string }>;
  export default source;
}
