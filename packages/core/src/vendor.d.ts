declare module "apca-w3" {
  export function APCAcontrast(fgY: number, bgY: number): number | string;
  export function sRGBtoY(rgb: [number, number, number]): number;
}

declare module "culori" {
  interface OklchColor {
    mode: "oklch";
    l: number;
    c: number;
    h: number;
  }

  interface RgbColor {
    mode: "rgb";
    r: number;
    g: number;
    b: number;
  }

  export function converter(
    mode: string,
  ): (color: OklchColor | RgbColor | { mode: string }) => RgbColor;
  export function clampChroma(color: OklchColor, mode: string): OklchColor;
  export function parse(color: string): { mode: string } | undefined;
  export function formatHex(color: OklchColor | RgbColor | { mode: string }): string | undefined;
}
