import { EyeShape, PixelShape } from "@/types/qr";

export const EYE_SHAPES: { id: EyeShape; label: string }[] = [
  { id: "sharp", label: "Classic" },
  { id: "soft", label: "Soft" },
  { id: "round", label: "Round" },
  { id: "pill", label: "Pill" },
  { id: "leaf", label: "Leaf" },
  { id: "diamond", label: "Diamond" },
];

export const PIXEL_SHAPES: { id: PixelShape; label: string }[] = [
  { id: "sharp", label: "Square" },
  { id: "soft", label: "Soft" },
  { id: "round", label: "Round" },
  { id: "dots", label: "Dots" },
  { id: "liquid", label: "Liquid" },
  { id: "glued", label: "Glued" },
];
