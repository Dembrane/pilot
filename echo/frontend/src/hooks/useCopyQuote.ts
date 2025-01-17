import { directus } from "@/lib/directus";
import { readItem } from "@directus/sdk";
import useCopyToRichText from "@/hooks/useCopyToRichText";
import { useParams } from "react-router-dom";
import { string } from "zod";

// Define types inline since the .d.ts file is not a module
type QuoteWithConversation = {
  id: string;
  text: string;
  timestamp: string | null;
  conversation_id: {
    id: string;
    title: string | null;
    participant_name: string | null;
    tags: Array<{
      project_tag_id: { text: string | null };
    }>;
  };
};

export const useCopyQuote = () => {
  const { language, projectId } = useParams();
  const { copied, copy } = useCopyToRichText();

  const copyQuote = async (quoteId: string) => {
    const stringBuilder: string[] = [];

    // @ts-expect-error - Directus SDK has incorrect types for nested fields
    const quote: QuoteWithConversation = await directus.request(
      readItem("quote", quoteId, {
        fields: [
          "id",
          "text",
          "timestamp",
          {
            conversation_id: [
              "id",
              "participant_name",
              {
                tags: [
                  {
                    project_tag_id: ["text"],
                  },
                ],
              },
            ],
          },
        ],
      }),
    );

    // Format timestamp if available
    const timestamp = quote.timestamp
      ? new Date(quote.timestamp).toLocaleString()
      : "";

    // Format tags if available
    const tags = quote.conversation_id.tags
      ?.map(
        (tag: { project_tag_id: { text: string | null } }) =>
          tag.project_tag_id?.text,
      )
      .join(", ");

    // Build the formatted quote with context
    stringBuilder.push(
      `# Quote from [${quote.conversation_id.participant_name}](${window.location.origin}/${language}/projects/${projectId}/conversation/${quote.conversation_id.id}/transcript)`,
    );
    stringBuilder.push(`"${quote.text}"`);
    stringBuilder.push(""); // Empty line for spacing

    // Add metadata
    if (quote.conversation_id.title) {
      stringBuilder.push(`**Conversation:** ${quote.conversation_id.title}`);
    }

    if (timestamp) {
      stringBuilder.push(`${timestamp}`);
      stringBuilder.push("");
    }

    if (tags) {
      stringBuilder.push(`**Tags:** ${tags}`);
      stringBuilder.push("");
    }

    // Add source link
    const sourceUrl = `${window.location.origin}/${language}/projects/${projectId}/conversation/${quote.conversation_id.id}/transcript`;
    stringBuilder.push(""); // Empty line before source
    stringBuilder.push(`[View in conversation](${sourceUrl})`);

    copy(stringBuilder.join("\n"));
  };

  return {
    copyQuote,
    copied,
  };
};
