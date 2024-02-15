import { TypographyStylesProvider } from "@mantine/core";
import showdown from "showdown";

export const Markdown = ({ content }: { content: string }) => {
  const generatedHTML = new showdown.Converter().makeHtml(content);

  return (
    <TypographyStylesProvider className="text-sm">
      <div dangerouslySetInnerHTML={{ __html: generatedHTML }} />
    </TypographyStylesProvider>
  );
};
