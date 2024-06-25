import { Breadcrumbs } from "@/components/breadcrumbs/Breadcrumbs";
import { Insight } from "@/components/insight/Insight";
import { Task } from "@/components/task/Task";
import { ViewExpandedCard } from "@/components/view/View";
import { Icons } from "@/icons";
import {
  useConversationsByProjectId,
  useProjectInsights,
  useProjectViews,
  useGenerateProjectLibraryMutation,
} from "@/lib/query";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import {
  Alert,
  Divider,
  Group,
  Skeleton,
  Stack,
  Title,
  Text,
  Box,
  Button,
  LoadingOverlay,
  SimpleGrid,
  Paper,
  Pill,
} from "@mantine/core";
import {
  IconClock,
  IconInfoCircle,
  IconPlus,
  IconSortAscending,
} from "@tabler/icons-react";
import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";

type SortBy = "relevance" | "default";

const DummyViews = () => {
  return (
    <Stack>
      <Text c="gray">
        These are your default view templates. Once you create your library
        these will be your first two views.
      </Text>
      <Paper p="md">
        <SimpleGrid cols={3}>
          <Paper bg="white" p="md">
            <Text className="font-xl font-semibold pb-2">Topics</Text>
            <Group>
              <Pill>0 Aspects</Pill>
            </Group>
          </Paper>
          <Paper bg="white" p="md">
            <Text className="font-xl font-semibold pb-2">Sentiment</Text>
            <Group>
              <Pill>0 Aspects</Pill>
            </Group>
          </Paper>
        </SimpleGrid>
      </Paper>
    </Stack>
  );
};

export const ProjectLibrary = () => {
  const { projectId } = useParams();

  const viewsQuery = useProjectViews(projectId ?? "");
  const insightsQuery = useProjectInsights(projectId ?? "");
  const conversationsQuery = useConversationsByProjectId(
    projectId ?? "",
    false,
  );

  const requestProjectLibraryMutation = useGenerateProjectLibraryMutation();
  const [sortBy, setSortBy] = useState<SortBy>("relevance");
  const toggleSort = useCallback(() => {
    setSortBy(sortBy === "default" ? "relevance" : "default");
  }, [sortBy, setSortBy]);
  const [parent] = useAutoAnimate();

  if (conversationsQuery.isLoading) {
    return (
      <Stack className="relative py-6 px-2">
        <LoadingOverlay visible />
      </Stack>
    );
  }

  const sortInsights = (data: TInsight[], sortBy: SortBy) => {
    console.log("Sorting by", sortBy);
    try {
      if (sortBy === "default") {
        return data.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
      } else if (sortBy === "relevance") {
        // Ubiquity - Measured by the number of unique conversations in each insight.
        // Relevance - Measured by the number of quotes present in each insight.
        return data.sort((a, b) => {
          const uniqueConversationsA = new Set(
            a.quotes.map((quote) => quote.conversation_id),
          ).size;
          const uniqueConversationsB = new Set(
            b.quotes.map((quote) => quote.conversation_id),
          ).size;

          // primary sort on the number of unique conversations
          if (uniqueConversationsA !== uniqueConversationsB) {
            return uniqueConversationsB - uniqueConversationsA; // descending order
          }

          // secondary sort on the number of quotes
          return b.quotes.length - a.quotes.length; // descending order
        });
      } else {
        throw new Error("Invalid sortBy value");
      }
    } catch (err) {
      console.error("Invalid sort", err);
      return data;
    }
  };

  const insightsExist =
    insightsQuery && insightsQuery.data && insightsQuery.data.length > 0;

  const viewsExist =
    viewsQuery && viewsQuery.data && viewsQuery.data.length > 0;

  return (
    <Stack className="py-6 px-4">
      <Group justify="space-between">
        <Breadcrumbs
          items={[
            {
              label: <Icons.Sidebar />,
              link: `/projects/${projectId}/overview`,
            },
            {
              label: <Title order={1}>Library</Title>,
            },
          ]}
        />
      </Group>
      <Divider />

      {insightsQuery.isLoading && (
        <>
          <Skeleton height={100} />
          <Skeleton height={100} />
        </>
      )}

      {requestProjectLibraryMutation.isSuccess && (
        <Task task={requestProjectLibraryMutation.data} />
      )}

      {!insightsExist && (
        <>
          <Alert variant="light" icon={<IconInfoCircle />}>
            <Group justify="space-between">
              <Text>
                This is your project library. Currently,{" "}
                {conversationsQuery.data?.length ?? 0} conversations are waiting
                to be processed.
              </Text>
              <Box>
                <Button
                  onClick={() =>
                    requestProjectLibraryMutation.mutate({
                      projectId: projectId ?? "",
                    })
                  }
                  leftSection={<IconPlus />}
                  loading={requestProjectLibraryMutation.isPending}
                  disabled={requestProjectLibraryMutation.isPending}
                >
                  Create Library
                </Button>
              </Box>
            </Group>
          </Alert>
        </>
      )}

      <Group justify="space-between">
        <Title order={2}>Your Views</Title>
        <Button leftSection={<IconPlus />} disabled>
          Create View
        </Button>
      </Group>
      {!viewsExist && <DummyViews />}

      <Stack>
        {viewsQuery.data &&
          viewsQuery.data.map((v) => <ViewExpandedCard key={v.id} data={v} />)}
      </Stack>

      <Title order={2}>All Insights</Title>
      <Text>Create a library to see your first insights.</Text>

      {insightsQuery.data && insightsQuery.data.length > 0 && (
        <>
          <Title order={3}>All Insights</Title>
          <Group gap="md">
            <Button
              onClick={toggleSort}
              color={sortBy === "relevance" ? "blue" : "gray"}
              variant={sortBy === "relevance" ? "filled" : "subtle"}
              leftSection={<IconSortAscending />}
            >
              Relevance
            </Button>

            <Button
              onClick={toggleSort}
              color={sortBy === "default" ? "blue" : "gray"}
              variant={sortBy === "default" ? "filled" : "subtle"}
              leftSection={<IconClock />}
            >
              Time Created
            </Button>
          </Group>
          <div ref={parent} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {insightsQuery.data &&
              insightsQuery.data.length > 0 &&
              sortInsights(insightsQuery.data, sortBy).map((insight) => (
                <Insight key={insight.id} data={insight} />
              ))}
          </div>{" "}
        </>
      )}
    </Stack>
  );
};
