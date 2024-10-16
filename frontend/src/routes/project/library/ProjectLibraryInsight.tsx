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
import {
  IconArrowBack,
  IconChevronLeft,
  IconHome,
  IconStackBack,
} from "@tabler/icons-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Quote } from "../../../components/quote/Quote";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Icons } from "@/icons";
import { I18nLink } from "@/components/common/i18nLink";
import { usei18nNavigate } from "@/lib/usei18nNavigate";

export const ProjectLibraryInsight = () => {
  const { projectId, insightId } = useParams();

  const insightQuery = useInsight(insightId ?? "");
  const navigate = usei18nNavigate();

  if (!insightQuery.isLoading && !insightQuery.data) {
    return (
      <Stack className="px-2 py-6">
        <Group>
          <I18nLink to="..">
            <ActionIcon>
              <IconArrowBack />
            </ActionIcon>
          </I18nLink>
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
        {/* <Group align="baseline">
          <ActionIcon variant="light" onClick={() => navigate(-1)}>
            <IconChevronLeft />
          </ActionIcon>
          <Title order={1}>Insight Library</Title> */}

        {/* </Group> */}
        <Breadcrumbs
          items={[
            {
              label: <Title order={2}>Insights</Title>,
              link: `/projects/${projectId}/library#insights`,
            },
            {
              label: <Title order={2}>{insight.title}</Title>,
            },
          ]}
        />
        <Divider />

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
