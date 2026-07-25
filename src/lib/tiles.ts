const GRID_ITEM_SELECTOR = [
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

const THUMBNAIL_CONTAINER_SELECTOR = "yt-thumbnail-view-model, ytd-thumbnail, .ytThumbnailViewModelHost";
const MIN_TILE_SIZE = 48;

interface TilePeephole {
  rect: DOMRect;
  radius: number;
}

export function collectVisibleTilePeepholes() {
  const elContainers = new Set<HTMLElement>();
  for (const elItem of document.querySelectorAll<HTMLElement>(GRID_ITEM_SELECTOR)) {
    elContainers.add(thumbnailContainerInItem(elItem));
  }

  const peepholes: TilePeephole[] = [];
  for (const elContainer of elContainers) {
    const rect = elContainer.getBoundingClientRect();
    if (isRenderableTile(rect)) {
      peepholes.push({
        rect,
        radius: readCornerRadius(elContainer)
      });
    }
  }

  return peepholes;
}

function thumbnailContainerInItem(elItem: HTMLElement) {
  const elLockup = elItem.querySelector<HTMLElement>("yt-lockup-view-model");
  const root: HTMLElement | ShadowRoot = elLockup?.shadowRoot ?? elLockup ?? elItem;
  return root.querySelector<HTMLElement>(THUMBNAIL_CONTAINER_SELECTOR) ?? elItem;
}

function readCornerRadius(elContainer: HTMLElement) {
  return parseFloat(getComputedStyle(elContainer).borderTopLeftRadius) || 0;
}

function isRenderableTile(rect: DOMRect) {
  const isBigEnough = rect.width >= MIN_TILE_SIZE && rect.height >= MIN_TILE_SIZE;
  const isOnScreen = rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth;
  return isBigEnough && isOnScreen;
}
