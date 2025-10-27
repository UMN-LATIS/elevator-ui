export async function onImagesLoaded(selector: string, callback: () => void) {
  const container = document.querySelector(selector);
  if (!container) {
    throw new Error("Container not found");
  }

  const images = container.querySelectorAll("img");
  await Promise.all(
    Array.from(images).map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.addEventListener("load", () => resolve());
        img.addEventListener("error", () => resolve());
      });
    })
  );

  return callback();
}
