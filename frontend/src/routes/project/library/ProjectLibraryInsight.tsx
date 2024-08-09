import { useInsight, useProjectInsights } from "@/lib/query";
import {
  Divider,
  Text,
  LoadingOverlay,
  Stack,
  Title,
  Group,
  ActionIcon,
  Container,
} from "@mantine/core";
import { IconArrowBack, IconChevronLeft } from "@tabler/icons-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Quote } from "../../../components/quote/Quote";

export const ProjectLibraryInsight = () => {
  const { projectId, insightId } = useParams();

  const insightQuery = useInsight(insightId ?? "");
  const navigate = useNavigate();

  if (!insightQuery.isLoading && !insightQuery.data) {
    return (
      <Stack className="px-2 py-6">
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

  const insight = insightQuery.data;
  const quotes = insight?.quotes;

  if (!insight || !quotes) {
    return <LoadingOverlay visible />;
  }

  return (
    <Container>
      <Stack className="px-2 py-6">
        <Group align="baseline">
          <ActionIcon variant="light" onClick={() => navigate(-1)}>
            <IconChevronLeft />
          </ActionIcon>
          <Title order={1}>Insight Library</Title>
        </Group>
        <Divider />
        <Title order={2}>{insight.title}</Title>
        <Text>{insight.summary}</Text>

        <Divider />
        <Title order={2}>Quotes</Title>
        <Stack>
          {quotes.map((quote) => (
            <Quote key={(quote as Quote).id} data={quote as Quote} />
          ))}
        </Stack>
      </Stack>
    </Container>
  );
};
