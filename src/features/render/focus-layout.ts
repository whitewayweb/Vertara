export interface FocusLayout {
  panX: number;
  zoom: number;
}

export const defaultFocusLayout: FocusLayout = {
  panX: 50,
  zoom: 1,
};

export function createFocusLayout(panX: number, zoom: number): FocusLayout {
  return {
    panX: Math.min(Math.max(panX, 0), 100),
    zoom: Math.min(Math.max(zoom, 1), 2),
  };
}

export function getFocusObjectPosition({ panX }: FocusLayout): string {
  return `${panX}% center`;
}
