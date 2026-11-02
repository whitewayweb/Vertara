export function downloadFile(file: Blob, fileName: string): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  // Safari and batched downloads read the URL after click() returns.
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
