/**
 * Extracts script tags from HTML
 */
export function getScriptsFromHTML(
  html: string | null | undefined
): HTMLScriptElement[] {
  console.log("Extracting scripts from HTML");
  if (!html) return [];

  // Create a temporary DOM element to parse the sanitized HTML
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  // Find all script tags and return them as an array
  const scripts = tempDiv.querySelectorAll("script");
  return Array.from(scripts);
}

export function executeScripts(scripts: HTMLScriptElement[]) {
  console.log("Executing scripts:", scripts);
  scripts.forEach((script) => {
    console.log("Executing custom script:", script);
    const scriptToAppend = document.createElement("script");

    // Copy attributes
    Array.from(script.attributes).forEach((attr) => {
      scriptToAppend.setAttribute(attr.name, attr.value);
    });

    // Copy content if it's an inline script
    if (script.textContent) {
      scriptToAppend.textContent = script.textContent;
    }

    // Append to body to execute
    document.body.appendChild(scriptToAppend);
  });
}

export function removeScripts(scripts: HTMLScriptElement[]) {
  scripts.forEach((script) => {
    if (script.parentNode) {
      script.parentNode.removeChild(script);
    }
  });
}

export function removeScriptsFromHtml(
  html: string | null | undefined
): string | null {
  if (!html) return null;
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  // Remove all script tags from the HTML
  const scripts = tempDiv.querySelectorAll("script");
  scripts.forEach((script) => script.remove());

  return tempDiv.innerHTML || null;
}
