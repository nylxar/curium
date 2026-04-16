import { EyeShape, PixelShape } from "@/types/qr";

export const EYE_SHAPES: { id: EyeShape; label: string; desc: string }[] = [
  { id: "square", label: "Classic", desc: "Sharp corners" },
  { id: "circle", label: "Circle", desc: "Fully round" },
  { id: "rounded", label: "Rounded", desc: "Soft corners" },
  { id: "extra-rounded", label: "Pill", desc: "Extra soft" },
  { id: "leaf", label: "Leaf", desc: "Organic" },
  { id: "diamond", label: "Diamond", desc: "Angular" },
];

export const PIXEL_SHAPES: { id: PixelShape; label: string; desc: string }[] = [
  { id: "square", label: "Square", desc: "Classic pixels" },
  { id: "circle", label: "Dots", desc: "Polka dot style" },
  { id: "rounded", label: "Rounded", desc: "Soft squares" },
  { id: "dots", label: "Micro", desc: "Small dots" },
  { id: "classy", label: "Classy", desc: "Corner accents" },
  { id: "classy-rounded", label: "Elegant", desc: "Classy + rounded" },
];
