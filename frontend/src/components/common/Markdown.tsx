import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from "@/lib/utils";
import { useEffect } from 'react';

export const Markdown = ({
  content,
  className,
}: {
  content: string;
  className?: string;
}) => {
  // FIXME: workaround to load Tally embeds
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
    <ReactMarkdown
      className={cn("prose", className)}
      remarkPlugins={[remarkGfm]}
    >
      {content}
    </ReactMarkdown>
  );
};
