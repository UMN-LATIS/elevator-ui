export function delay(ms = 100): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}