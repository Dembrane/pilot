import { useEffect } from "react";
import showdown from "showdown";

export const Markdown = ({ content }: { content: string }) => {
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
      className="prose"
      dangerouslySetInnerHTML={{ __html: generatedHTML }}
    />
  );
};
