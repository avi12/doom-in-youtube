const TILE_RENDERER_SELECTOR = [
  "ytd-rich-item-renderer",
  "ytd-grid-video-renderer",
  "ytd-video-renderer",
  "ytd-compact-video-renderer",
  "ytd-playlist-video-renderer",
  "ytd-playlist-renderer",
  "ytd-radio-renderer",
  "ytd-reel-item-renderer",
  "ytd-grid-movie-renderer",
  "ytd-movie-renderer",
  "yt-lockup-view-model",
  "yt-collection-thumbnail-view-model",
  "ytm-shorts-lockup-view-model",
  "ytm-shorts-lockup-view-model-v2"
].join(", ");

const THUMBNAIL_SELECTOR = [
  "ytd-thumbnail a#thumbnail",
  "a.reel-item-endpoint",
  "a.shortsLockupViewModelHostEndpoint",
  ".shortsLockupViewModelHostThumbnailContainer",
  ".ytThumbnailViewModelHost",
  "yt-thumbnail-view-model",
  "yt-image img",
  "img.yt-core-image"
].join(", ");

const MIN_TILE_SIZE = 48;

export function collectVisibleTileRects() {
  const elRenderers = document.querySelectorAll<HTMLElement>(TILE_RENDERER_SELECTOR);
  const elThumbnails = new Set<HTMLElement>();

  for (const elRenderer of elRenderers) {
    elThumbnails.add(elRenderer.querySelector<HTMLElement>(THUMBNAIL_SELECTOR) ?? elRenderer);
  }

  const rects: DOMRect[] = [];

  for (const elThumbnail of elThumbnails) {
    const rect = elThumbnail.getBoundingClientRect();
    if (isRenderableTile(rect)) {
      rects.push(rect);
    }
  }

  return rects;
}

function isRenderableTile(rect: DOMRect) {
  const isBigEnough = rect.width >= MIN_TILE_SIZE && rect.height >= MIN_TILE_SIZE;
  const isOnScreen = rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth;
  return isBigEnough && isOnScreen;
}
