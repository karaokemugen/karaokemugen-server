export interface CustomElement extends HTMLElement {
  webkitRequestFullscreen(): void;
  webkitEnterFullscreen(): void;
}

export interface CustomDocument extends Document {
  webkitCancelFullScreen(): void;
}