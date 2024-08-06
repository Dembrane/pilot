import { Icons } from "@/icons";
import {
  Divider,
  LoadingOverlay,
  Stack,
  Title,
  Text,
  Box,
  Container,
  Skeleton,
} from "@mantine/core";
import { useParams } from "react-router-dom";
import { Quote } from "../../components/quote/Quote";
import { Markdown } from "@/components/common/Markdown";
import { useAspectById } from "@/lib/query";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";

const dedupeQuotes = (quotes: QuoteAspect[]): QuoteAspect[] => {
  const seen = new Set();
  return quotes.filter((quote) => {
    if (seen.has((quote.quote_id as Quote).id)) {
      return false;
    }
    seen.add((quote.quote_id as Quote).id);
    return true;
  });
};

export const ProjectLibraryAspect = () => {
  const { projectId, viewId, aspectId } = useParams();

  const { data: aspect, isLoading } = useAspectById(
    projectId ?? "",
    aspectId ?? "",
  );

  return (
    <Stack className="py-6 px-4 relative">
      <Breadcrumbs
        items={[
          {
            label: <Icons.Sidebar />,
            link: `/projects/${projectId}/overview`,
          },
          {
            label: "Library",
            link: `/projects/${projectId}/library`,
          },
          {
            label: "View",
            link: `/projects/${projectId}/library/views/${viewId}`,
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
        <Title order={2}>Quotes</Title>
        {!isLoading ? (
          <>
            {" "}
            {dedupeQuotes([
              ...(aspect?.representative_quotes ?? []),
              ...(aspect?.quotes ?? []),
            ]).map((quote: QuoteAspect) => (
              <Quote key={quote.id} data={quote.quote_id as Quote} />
            ))}{" "}
          </>
        ) : (
          <Skeleton height={100} />
        )}
      </Stack>
    </Stack>
  );
};
