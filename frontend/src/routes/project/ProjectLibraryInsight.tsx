import { useConversationById, useProjectInsights } from "@/lib/query";
import {
  Divider,
  Text,
  LoadingOverlay,
  Stack,
  Title,
  Paper,
  Group,
  Pill,
  Breadcrumbs,
  ActionIcon,
} from "@mantine/core";
import { IconArrowBack, IconChevronLeft } from "@tabler/icons-react";
import { Link, useParams } from "react-router-dom";

export const Quote = ({ data }: { data: Quote | TQuote }) => {
  const { projectId } = useParams();

  return (
    <Paper p="sm">
      <Text size="sm" pb="xs">
        "{data.text}"
      </Text>
      {data.conversation_id && (
        <Link
          to={`/projects/${projectId}/conversation/${data.conversation_id}/transcript`}
        >
          <Pill>
            {((data as any).conversation_id as Conversation).participant_name ??
              ""}
          </Pill>
        </Link>
      )}
    </Paper>
  );
};

export const ProjectLibraryInsight = () => {
  const { projectId, insightId } = useParams();
  const insightsQuery = useProjectInsights(projectId ?? "");

  if (insightsQuery.isLoading) {
    return (
      <Stack className="relative py-6 px-2">
        <LoadingOverlay visible />
      </Stack>
    );
  }

  const insight =
    insightsQuery.data?.find((insight) => insight.id === insightId) ?? null;

  if (!insight) {
    return (
      <Stack className="py-6 px-2">
        <Group>
          <Link to="..">
            <ActionIcon>
              <IconArrowBack />
            </ActionIcon>
          </Link>
          <Title order={1}>Insight Library</Title>
        </Group>
        <Divider />
        <p>Insight not found</p>
      </Stack>
    );
  }

  const quotes = insight.quotes;

  return (
    <Stack className="py-6 px-2">
      <Group align="baseline">
        <Link to={`/projects/${projectId}/library`}>
          <ActionIcon variant="light">
            <IconChevronLeft />
          </ActionIcon>
        </Link>
        <Title order={1}>Insight Library</Title>
      </Group>
      <Divider />
      <Title order={2}>{insight.title}</Title>
      <Text>{insight.summary}</Text>

      <Divider />
      <Title order={2}>Quotes</Title>
      <Stack>
        {quotes.map((quote) => (
          <Quote key={quote.id} data={quote} />
        ))}
      </Stack>
    </Stack>
  );
};
