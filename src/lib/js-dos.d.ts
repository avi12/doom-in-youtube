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
  const Dos: (element: HTMLElement, options: Partial<DosOptions>) => DosProps;
}
