// Storage public URLs accept ?download=<name>, which makes the server send it as an attachment.
export function mediaDownloadUrl(url: string, kind: 'image' | 'video') {
  const clean = url.split('?')[0];
  const ext = clean.split('.').pop()?.slice(0, 5) || (kind === 'video' ? 'mp4' : 'jpg');
  const name = `bezosmp-${kind}-${Date.now()}.${ext}`;
  if (clean.includes('/storage/v1/object/public/')) {
    return `${clean}?download=${encodeURIComponent(name)}`;
  }
  return url;
}

export function downloadMedia(url: string, kind: 'image' | 'video') {
  const a = document.createElement('a');
  a.href = mediaDownloadUrl(url, kind);
  a.download = '';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}
