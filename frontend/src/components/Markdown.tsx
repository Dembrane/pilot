import showdown from "showdown";

export const Markdown = ({ content }: { content: string }) => {
  const generatedHTML = new showdown.Converter().makeHtml(content);

  return (
    <div
      className="prose"
      dangerouslySetInnerHTML={{ __html: generatedHTML }}
    />
  );
};
