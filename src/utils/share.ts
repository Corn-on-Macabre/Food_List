// Native share sheet on mobile, clipboard copy elsewhere.
// Returns true when the share/copy completed (callers show a toast),
// false when the user cancelled the sheet or clipboard access failed.
export async function shareUrl(title: string, url: string): Promise<boolean> {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  try {
    if (isMobile && navigator.share) {
      await navigator.share({ title, url });
    } else {
      await navigator.clipboard.writeText(url);
    }
    return true;
  } catch {
    return false;
  }
}
