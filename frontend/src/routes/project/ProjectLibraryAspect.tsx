import { Breadcrumbs } from "@/components/breadcrumbs/Breadcrumbs";
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
import { Quote } from "./ProjectLibraryInsight";
import { Markdown } from "@/components/Markdown";
import { useAspectById } from "@/lib/query";

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
          src={
            aspect?.image_url ??
            "https://loremflickr.com/320/240/" +
              "nature" +
              "?random=" +
              aspect?.id // data.image_url
          }
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
        {aspect?.quotes.map((quote: QuoteAspect) => (
          <Quote key={quote.id} data={quote.quote_id as Quote} />
        ))}
      </Stack>
    </Stack>
  );
};
