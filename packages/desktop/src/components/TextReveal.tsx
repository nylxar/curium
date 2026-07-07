import type { ElementType } from "react";

type TextRevealProps = {
  text: string;
  per?: "word" | "char";
  as?: ElementType;
  className?: string;
  delay?: number;
};

export function TextReveal({
  text,
  per = "word",
  as: Tag = "span",
  className,
  delay = 0,
}: TextRevealProps) {
  const segments =
    per === "char" ? text.split("") : text.split(/(\s+)/).filter(Boolean);

  return (
    <Tag className={`text-reveal ${className ?? ""}`.trim()} aria-label={text}>
      {segments.map((segment, i) => (
        <span
          key={`${segment}-${i}`}
          className="text-reveal-segment"
          aria-hidden="true"
          style={{ animationDelay: `${delay + i * 0.03}s` }}
        >
          {segment === " " ? "\u00A0" : segment}
        </span>
      ))}
    </Tag>
  );
}
