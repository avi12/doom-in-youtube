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
const CHANNEL_ITEM_SELECTOR = "ytd-grid-channel-renderer";
const CHANNEL_AVATAR_SELECTOR = "yt-img-shadow";
const TOP_CHROME_SELECTOR = "#masthead-container, #chips-wrapper";
const SHORTS_ITEM_SELECTOR = "ytm-shorts-lockup-view-model, ytm-shorts-lockup-view-model-v2, ytd-reel-item-renderer";
const SHORTS_SHELF_SELECTOR = "ytd-rich-shelf-renderer[is-shorts], ytd-reel-shelf-renderer, grid-shelf-view-model";
const MIN_TILE_SIZE = 48;
const FRAME_ASPECT_WIDTH = 4;
const FRAME_ASPECT_HEIGHT = 3;
const FRAME_ASPECT = FRAME_ASPECT_WIDTH / FRAME_ASPECT_HEIGHT;
const PERCENT = 100;

export interface TilePeephole {
  rect: DOMRect;
  radius: number;
}

interface CandidateTile extends TilePeephole {
  framesWidth: boolean;
}

export interface FrameRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface DoomProjection {
  frame: FrameRect;
  peepholes: TilePeephole[];
}

// Work out where the single 4:3 DOOM frame lives and which thumbnails reveal it.
//
// The frame is the largest 4:3 rect that fits (contain) inside the bounding box of the visible
// thumbnails, so it is never distorted or cropped. A wide grid keeps the whole frame across its
// centre columns; a tall single column (search, channel) lands the frame in its middle thumbnail -
// the only place a 4:3 picture reads correctly. Every visible thumbnail is a peephole: the parts
// over the frame show the game, the rest reveal the iframe's black backdrop (so non-game thumbnails
// read as black and a thumbnail straddling the frame edge is game on one side, black on the other).
//
// The box's WIDTH comes from the regular thumbnails only - a wide Shorts shelf must not stretch the
// frame across a narrow result/channel column - while its HEIGHT spans every thumbnail, so Shorts
// rows above and below a video row still enlarge the frame on the home grid.
export function collectDoomProjection() {
  const seenContainers = new Set<HTMLElement>();
  const topInset = readTopChromeInset();
  const tiles: CandidateTile[] = [];
  // Regular grid thumbnails frame the width unless they are Shorts; channel avatars (a channel
  // page's "Featured Channels" row) are round peepholes that never frame the width.
  collectTiles({
    selector: GRID_ITEM_SELECTOR,
    resolveContainer: thumbnailContainerInItem,
    framesWidth: elItem => !isShortsItem(elItem),
    tiles,
    seenContainers,
    topInset
  });
  collectTiles({
    selector: CHANNEL_ITEM_SELECTOR,
    resolveContainer: channelAvatarInItem,
    framesWidth: () => false,
    tiles,
    seenContainers,
    topInset
  });

  const frame = computeFrame({
    tiles,
    topInset
  });
  if (!frame) {
    return null;
  }

  return {
    frame,
    peepholes: tiles
  };
}

// Turn each item under `selector` into a viewport-clipped peephole tile, deduping by container
// so an item and its inner lockup never yield the same thumbnail twice.
function collectTiles({ selector, resolveContainer, framesWidth, tiles, seenContainers, topInset }: {
  selector: string;
  resolveContainer: (elItem: HTMLElement) => HTMLElement;
  framesWidth: (elItem: HTMLElement) => boolean;
  tiles: CandidateTile[];
  seenContainers: Set<HTMLElement>;
  topInset: number;
}) {
  for (const elItem of document.querySelectorAll<HTMLElement>(selector)) {
    const elContainer = resolveContainer(elItem);
    if (seenContainers.has(elContainer)) {
      continue;
    }

    seenContainers.add(elContainer);

    const rect = elContainer.getBoundingClientRect();
    if (!isRealThumbnail(rect)) {
      continue;
    }

    const visibleRect = clipToViewport({
      rect,
      topInset
    });
    if (!visibleRect) {
      continue;
    }

    tiles.push({
      rect: visibleRect,
      radius: readCornerRadius(elContainer),
      framesWidth: framesWidth(elItem)
    });
  }
}

function channelAvatarInItem(elItem: HTMLElement) {
  return elItem.querySelector<HTMLElement>(CHANNEL_AVATAR_SELECTOR) ?? elItem;
}

function isShortsItem(elItem: HTMLElement) {
  return elItem.matches(SHORTS_ITEM_SELECTOR) || elItem.closest(SHORTS_SHELF_SELECTOR) !== null;
}

// Width comes from the framing thumbnails (regular videos, not Shorts or channel avatars) so a
// wide Shorts shelf can't stretch the frame across a narrow column; the height spans every tile so
// the frame on the home grid. The 4:3 frame is contained in that width x height, then anchored to
// the viewport centre (clamped on screen). Anchoring to the viewport - not to the thumbnails'
// centre - keeps the frame from snapping vertically as rows scroll into and out of view.
function computeFrame({ tiles, topInset }: {
  tiles: CandidateTile[];
  topInset: number;
}) {
  const hasNoTiles = tiles.length === 0;
  if (hasNoTiles) {
    return null;
  }

  const framing = tiles.filter(tile => tile.framesWidth);
  const widthTiles = framing.length > 0 ? framing : tiles;

  const { left, right } = horizontalBounds(widthTiles);
  const fullVertical = verticalBounds(tiles);

  let width = right - left;
  let height = width / FRAME_ASPECT;
  const isTooTall = height > fullVertical.bottom - fullVertical.top;
  if (isTooTall) {
    height = fullVertical.bottom - fullVertical.top;
    width = height * FRAME_ASPECT;
  }

  const viewportCenterY = (topInset + innerHeight) / 2;
  return {
    left: (left + right) / 2 - width / 2,
    top: clamp({
      value: viewportCenterY - height / 2,
      min: fullVertical.top,
      max: fullVertical.bottom - height
    }),
    width,
    height
  };
}

function horizontalBounds(tiles: CandidateTile[]) {
  let left = Infinity;
  let right = -Infinity;
  for (const { rect } of tiles) {
    left = Math.min(left, rect.left);
    right = Math.max(right, rect.right);
  }

  return {
    left,
    right
  };
}

function verticalBounds(tiles: CandidateTile[]) {
  let top = Infinity;
  let bottom = -Infinity;
  for (const { rect } of tiles) {
    top = Math.min(top, rect.top);
    bottom = Math.max(bottom, rect.bottom);
  }

  return {
    top,
    bottom
  };
}

function clamp({ value, min, max }: {
  value: number;
  min: number;
  max: number;
}) {
  return Math.min(Math.max(value, min), max);
}

// YouTube pins the masthead and filter-chip bar to the top; the DOOM iframe sits above
// them, so a thumbnail counts as visible only once it clears the bottom of that chrome
function readTopChromeInset() {
  let inset = 0;
  for (const elChrome of document.querySelectorAll<HTMLElement>(TOP_CHROME_SELECTOR)) {
    const isFixed = getComputedStyle(elChrome).position === "fixed";
    if (!isFixed) {
      continue;
    }

    inset = Math.max(inset, elChrome.getBoundingClientRect().bottom);
  }

  return inset;
}

function thumbnailContainerInItem(elItem: HTMLElement) {
  const elLockup = elItem.querySelector<HTMLElement>("yt-lockup-view-model");
  const root: HTMLElement | ShadowRoot = elLockup?.shadowRoot ?? elLockup ?? elItem;
  return root.querySelector<HTMLElement>(THUMBNAIL_CONTAINER_SELECTOR) ?? elItem;
}

function readCornerRadius(elContainer: HTMLElement) {
  const { borderTopLeftRadius } = getComputedStyle(elContainer);
  const radius = parseFloat(borderTopLeftRadius) || 0;
  const isPercentage = borderTopLeftRadius.endsWith("%");
  if (!isPercentage) {
    return radius;
  }

  // A percentage radius (channel avatars use 50%) resolves against the box, giving a true circle.
  const rect = elContainer.getBoundingClientRect();
  return radius / PERCENT * Math.min(rect.width, rect.height);
}

function isRealThumbnail(rect: DOMRect) {
  return rect.width >= MIN_TILE_SIZE && rect.height >= MIN_TILE_SIZE;
}

// intersect the thumbnail with the visible viewport (below the fixed top chrome); returns null
// when no part of it is on screen. As the user scrolls, each thumbnail's clipped slice changes,
// so the projected portions are re-picked every frame
function clipToViewport({ rect, topInset }: {
  rect: DOMRect;
  topInset: number;
}) {
  const left = Math.max(rect.left, 0);
  const top = Math.max(rect.top, topInset);
  const right = Math.min(rect.right, innerWidth);
  const bottom = Math.min(rect.bottom, innerHeight);
  const isEmpty = right <= left || bottom <= top;
  if (isEmpty) {
    return null;
  }

  return new DOMRect(left, top, right - left, bottom - top);
}
