import { directus } from "@/lib/directus";
import { readItem } from "@directus/sdk";
import useCopyToRichText from "@/hooks/useCopyToRichText";
import { useParams } from "react-router-dom";

interface Quote {
  text: string;
  conversation_id: {
    id: string;
    participant_name: string;
  };
}

export const useCopyInsight = () => {
  const { language, projectId } = useParams();
  const { copied, copy } = useCopyToRichText();

  const copyInsight = async (insightId: string) => {
    const stringBuilder: string[] = [];
    const insight = await directus.request(
      readItem("insight", insightId, {
        fields: [
          "id",
          "title",
          "summary",
          {
            quotes: [
              "text",
              {
                conversation_id: ["id", "participant_name"],
              },
            ],
          },
        ],
      }),
    );

    // Add insight title with link
    stringBuilder.push(
      `# Insight: [${insight.title || "Untitled"}](${window.location.origin}/${language}/projects/${projectId}/insights/${insightId})`,
    );

    // Add summary
    if (insight.summary) {
      stringBuilder.push(insight.summary);
    } else {
      stringBuilder.push(
        "The summary for this insight is not available. Please try again later.",
      );
    }

    // Add quotes
    const quotes = Array.isArray(insight.quotes)
      ? (insight.quotes as Quote[])
      : [];
    if (quotes.length > 0) {
      stringBuilder.push(`## Supporting Quotes`);

      for (const quote of quotes) {
        const conversationUrl =
          window.location.origin +
          `/${language}/projects/${projectId}/conversation/${quote.conversation_id.id}/transcript`;

        stringBuilder.push(`"${quote.text}"\n`);
        stringBuilder.push(
          `from [${quote.conversation_id.participant_name}](${conversationUrl})\n\n`,
        );
      }
    }

    copy(stringBuilder.join("\n"));
  };

  return {
    copyInsight,
    copied,
  };
};
