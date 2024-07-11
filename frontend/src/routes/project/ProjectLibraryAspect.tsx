import { Icons } from "@/icons";
import {
  Divider,
  LoadingOverlay,
  Stack,
  Title,
  Text,
  Box,
  Container,
} from "@mantine/core";
import { useParams } from "react-router-dom";
import { Quote } from "../../components/quote/Quote";
import { Markdown } from "@/components/Markdown";
import { useAspectById } from "@/lib/query";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";

export const ProjectLibraryAspect = () => {
  const { projectId, viewId, aspectId, sessionId } = useParams();

  const { data: aspect, isLoading } = useAspectById(
    projectId ?? "",
    aspectId ?? "",
  );

  // in quotes not in representative quotes
  console.log("quotes", aspect?.quotes);
  console.log("representative_quotes", aspect?.representative_quotes);
  const deltaQuotes =
    aspect?.quotes?.filter(
      (quote: QuoteAspect) =>
        // Check if the current quote is not in representative_quotes
        !aspect?.representative_quotes?.some(
          (repQuote: QuoteAspect) =>
            (repQuote.quote_id as Quote).id === (quote.quote_id as Quote).id,
        ),
    ) ?? []; // If quotes is undefined or null, use an empty array

  console.log("deltaQuotes", deltaQuotes);

  return (
    <Stack className="py-6 px-4 relative">
      <Breadcrumbs
        items={[
          {
            label: <Icons.Sidebar />,
            link: `/workspaces/${sessionId}/projects/${projectId}/overview`,
          },
          {
            label: "Library",
            link: `/workspaces/${sessionId}/projects/${projectId}/library`,
          },
          {
            label: "View",
            link: `/workspaces/${sessionId}/projects/${projectId}/library/views/${viewId}`,
          },
          {
            label: "Aspect",
          },
        ]}
      />
      <Divider />

      <Stack gap="md" className="relative">
        <LoadingOverlay visible={isLoading} />
        <img
          src={aspect?.image_url ?? "/placeholder.png"}
          alt={aspect?.name}
          className="w-full h-[400px] object-cover"
        />
        <Container>
          <Stack>
            <Title order={1}>{aspect?.name}</Title>
            <Markdown content={aspect?.long_summary ?? ""} />
          </Stack>
        </Container>
      </Stack>

      <Stack>
        {aspect?.representative_quotes?.length != 0 && (
          <Title order={2}>Representative Quotes</Title>
        )}
        {aspect?.representative_quotes?.map((quote: QuoteAspect) => (
          <Quote key={quote.id} data={quote.quote_id as Quote} />
        ))}

        {deltaQuotes.length != 0 && (
          <Title order={2}>Other Relevant Quotes</Title>
        )}
        {deltaQuotes.map((quote: QuoteAspect) => (
          <Quote key={quote.id} data={quote.quote_id as Quote} />
        ))}
      </Stack>
    </Stack>
  );
};
