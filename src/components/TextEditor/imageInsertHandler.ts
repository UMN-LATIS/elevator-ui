import type Quill from "quill";

/**
 * Reads a File as a base64 data URI string.
 */
const readFileAsDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

/**
 * Inserts an image into the Quill editor at the current selection.
 */
function insertImage(quill: Quill, src: string): void {
  const range = quill.getSelection(true);
  quill.insertEmbed(range.index, "image", src, "user");
  quill.setSelection(range.index + 1, 0, "user");
}

/**
 * Creates the image insert dialog DOM structure.
 * Returns the overlay element and a cleanup function.
 */
function createDialog(
  quill: Quill,
): { overlay: HTMLElement; cleanup: () => void } {
  const overlay = document.createElement("div");
  overlay.className = "ql-image-overlay";

  const popup = document.createElement("div");
  popup.className = "ql-image-popup";

  // Title
  const title = document.createElement("h3");
  title.className = "ql-image-title";
  title.textContent = "Insert Image";
  popup.appendChild(title);

  // URL section
  const urlLabel = document.createElement("label");
  urlLabel.className = "ql-image-label";
  urlLabel.textContent = "Image URL";
  popup.appendChild(urlLabel);

  const urlInput = document.createElement("input");
  urlInput.type = "url";
  urlInput.className = "ql-image-input";
  urlInput.placeholder = "https://example.com/image.jpg";
  popup.appendChild(urlInput);

  // Divider
  const divider = document.createElement("div");
  divider.className = "ql-image-divider";
  divider.innerHTML = '<span class="ql-image-divider-text">or</span>';
  popup.appendChild(divider);

  // File upload section
  const fileLabel = document.createElement("label");
  fileLabel.className = "ql-image-label";
  fileLabel.textContent = "Embed from file";
  popup.appendChild(fileLabel);

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.className = "ql-image-file-input";
  popup.appendChild(fileInput);

  // Button row
  const buttonGroup = document.createElement("div");
  buttonGroup.className = "ql-image-button-group";

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "ql-image-btn-cancel";
  cancelBtn.textContent = "Cancel";

  const insertBtn = document.createElement("button");
  insertBtn.type = "button";
  insertBtn.className = "ql-image-btn-insert";
  insertBtn.textContent = "Insert";
  insertBtn.disabled = true;

  buttonGroup.appendChild(cancelBtn);
  buttonGroup.appendChild(insertBtn);
  popup.appendChild(buttonGroup);

  overlay.appendChild(popup);

  // State: track which source is active
  let pendingDataUrl: string | null = null;

  const updateInsertEnabled = () => {
    insertBtn.disabled = !urlInput.value.trim() && !pendingDataUrl;
  };

  urlInput.addEventListener("input", () => {
    // Clear file selection when typing a URL
    if (urlInput.value.trim()) {
      fileInput.value = "";
      pendingDataUrl = null;
    }
    updateInsertEnabled();
  });

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    pendingDataUrl = await readFileAsDataURL(file);
    // Clear URL when choosing a file
    urlInput.value = "";
    updateInsertEnabled();
  });

  const cleanup = () => overlay.remove();

  const handleInsert = () => {
    const src = urlInput.value.trim() || pendingDataUrl;
    if (src) {
      insertImage(quill, src);
    }
    cleanup();
  };

  insertBtn.addEventListener("click", handleInsert);
  cancelBtn.addEventListener("click", cleanup);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) cleanup();
  });

  // ESC to close
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      cleanup();
      document.removeEventListener("keydown", handleKeydown);
    }
    if (e.key === "Enter" && !insertBtn.disabled) {
      handleInsert();
      document.removeEventListener("keydown", handleKeydown);
    }
  };
  document.addEventListener("keydown", handleKeydown);

  return { overlay, cleanup };
}

/**
 * Custom toolbar handler for the image button.
 * Shows a dialog with URL input and file picker options.
 */
export function imageInsertHandler(quill: Quill): void {
  const { overlay } = createDialog(quill);
  document.body.appendChild(overlay);

  // Focus the URL input after render
  const input = overlay.querySelector<HTMLInputElement>(".ql-image-input");
  input?.focus();
}
