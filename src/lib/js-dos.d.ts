export interface DosOptions {
  url: string;
  pathPrefix: string;
  kiosk: boolean;
  autoStart: boolean;
  mouseCapture: boolean;
  noCloud: boolean;
  volume: number;
}

export interface DosProps {
  setVolume(volume: number): void;
  setMouseCapture(isCapture: boolean): void;
  stop(): Promise<void>;
}

declare global {
  function Dos(element: HTMLElement, options: Partial<DosOptions>): DosProps;
}
