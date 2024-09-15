import { cn } from "@/lib/utils";
import { useEffect } from "react";
import showdown from "showdown";

export const Markdown = ({
  content,
  className,
}: {
  content: string;
  className?: string;
}) => {
  const generatedHTML = new showdown.Converter().makeHtml(content);

  useEffect(() => {
    try {
      if ((window as any).Tally) {
        setTimeout(() => {
          (window as any).Tally.loadEmbeds();
        }, 500);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <div
      className={cn("prose", className)}
      dangerouslySetInnerHTML={{ __html: generatedHTML }}
    />
  );
};
