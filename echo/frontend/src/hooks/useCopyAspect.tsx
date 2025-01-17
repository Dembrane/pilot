import { directus } from "@/lib/directus";
import { readItem } from "@directus/sdk";
import useCopyToRichText from "@/hooks/useCopyToRichText";
import { useParams } from "react-router-dom";

interface Quote {
  quote_id: {
    text: string;
    conversation_id: {
      id: string;
      participant_name: string;
    };
  };
}

export const useCopyAspect = () => {
  const { language, projectId } = useParams();
  const { copied, copy } = useCopyToRichText();

  const copyAspect = async (aspectId: string) => {
    const stringBuilder: string[] = [];
    const aspect = await directus.request(
      readItem("aspect", aspectId, {
        fields: [
          "id",
          "name",
          "short_summary",
          "long_summary",
          "image_url",
          "view_id",
          {
            representative_quotes: [
              {
                quote_id: [
                  {
                    conversation_id: ["id", "participant_name"],
                  },
                  "text",
                ],
              },
            ],
          },
        ],
      }),
    );

    stringBuilder.push(
      `# Aspect: [${aspect.name}](${window.location.origin}/${language}/projects/${projectId}/library/views/${aspect.view_id}/aspects/${aspectId})`,
    );

    if (aspect.image_url) {
      stringBuilder.push(`![${aspect.name}](${aspect.image_url})`);
    }

    if (aspect.long_summary) {
      stringBuilder.push(aspect.long_summary);
    } else if (aspect.short_summary) {
      stringBuilder.push(aspect.short_summary);
    } else {
      stringBuilder.push(
        "The summary for this aspect is not available. Please try again later.",
      );
    }

    const quotes = Array.isArray(aspect.representative_quotes)
      ? (aspect.representative_quotes as Quote[])
      : [];
    if (quotes.length > 0) {
      stringBuilder.push(`## Top Quotes`);

      for (const quote of quotes) {
        if (!quote.quote_id) continue;

        const conversationUrl =
          window.location.origin +
          `/${language}/projects/${projectId}/conversation/${quote.quote_id.conversation_id.id}/transcript`;

        stringBuilder.push(`"${quote.quote_id.text}"\n`);
        stringBuilder.push(
          `from [${quote.quote_id.conversation_id.participant_name}](${conversationUrl})\n\n`,
        );
      }
    }

    copy(stringBuilder.join("\n"));
  };

  return {
    copyAspect,
    copied,
  };
};
