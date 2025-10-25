export function useScripts() {
  const runningScripts: HTMLScriptElement[] = [];

  function getFromHtml(html: string): HTMLScriptElement[] {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    const scriptNodeList = tempDiv.querySelectorAll("script");
    return Array.from(scriptNodeList);
  }

  function cleanup() {
    runningScripts.forEach((script) => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    });
    runningScripts.splice(0, runningScripts.length);
  }

  function run(html: string) {
    const scripts = getFromHtml(html);
    scripts.forEach(async (originalScript) => {
      const script = document.createElement("script");

      // Copy attributes
      Array.from(originalScript.attributes).forEach((attr) => {
        script.setAttribute(attr.name, attr.value);
      });

      // Copy content if it's an inline script
      if (originalScript.textContent) {
        script.textContent = originalScript.textContent;
      }

      // Append to body to execute
      document.body.appendChild(script);
      runningScripts.push(script);
    });
  }

  function stripScriptsFromHtml(html: string): string {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    const scriptNodeList = tempDiv.querySelectorAll("script");
    scriptNodeList.forEach((script) => script.remove());

    return tempDiv.innerHTML;
  }

  return {
    run,
    cleanup,
    stripScriptsFromHtml,
  };
}
