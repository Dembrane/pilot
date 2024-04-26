import {
  useConversationsByProjectId,
  useProjectInsights,
  useRequestProjectAnalysisMutation,
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
  Paper,
} from "@mantine/core";
import {
  IconClock,
  IconInfoCircle,
  IconPlus,
  IconRefresh,
  IconSortAscending,
} from "@tabler/icons-react";
import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";

const Insight = ({ data }: { data: TInsight }) => {
  const { projectId } = useParams();
  return (
    <Link to={`/projects/${projectId}/library/insights/${data.id}`}>
      <Paper
        component="a"
        className="p-4 h-full place-content-start text-left hover:-translate-y-1 hover:border-opacity-70 border-2 border-opacity-0 border-primary-300 transition-all"
      >
        <Stack className="h-full">
          <Text size="md" className="font-semibold">
            {data.title}
          </Text>
          <Text size="sm">{data.summary}</Text>
        </Stack>
      </Paper>
    </Link>
  );
};

type SortBy = "relevance" | "default";

export const ProjectLibrary = () => {
  const { projectId } = useParams();

  const insightsQuery = useProjectInsights(projectId ?? "");
  const conversationsQuery = useConversationsByProjectId(projectId ?? "");
  const requestProjectAnalysisMutation = useRequestProjectAnalysisMutation();
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

  return (
    <Stack className="py-6 px-2">
      <Group justify="space-between">
        <Title order={1}>Insight Library</Title>
        {insightsQuery.data && (
          <Box>
            <Button
              onClick={() =>
                requestProjectAnalysisMutation.mutate({
                  projectId: projectId ?? "",
                })
              }
              variant="outline"
              leftSection={<IconRefresh />}
              loading={requestProjectAnalysisMutation.isPending}
              disabled={requestProjectAnalysisMutation.isPending}
            >
              Regenerate Library
            </Button>
          </Box>
        )}
      </Group>
      <Box>
        {requestProjectAnalysisMutation.isSuccess && (
          <Text>
            Please refresh this page after a bit <br /> DEBUG: <br />
            {JSON.stringify(requestProjectAnalysisMutation.data) ?? ""}
          </Text>
        )}
      </Box>
      <Divider />

      {insightsQuery.isLoading && (
        <>
          <Skeleton height={100} />
          <Skeleton height={100} />
        </>
      )}

      {insightsQuery &&
        insightsQuery.data &&
        insightsQuery.data.length === 0 && (
          // true && (
          <>
            <Alert variant="sublte" color="black" icon={<IconInfoCircle />}>
              <Group>
                <Text>
                  This is your insight library. It serves as a collection of
                  insights contained in a project. Currently,{" "}
                  {conversationsQuery.data?.length ?? 0} conversations are
                  waiting to be processed.
                </Text>
                <Box>
                  <Button
                    onClick={() =>
                      requestProjectAnalysisMutation.mutate({
                        projectId: projectId ?? "",
                      })
                    }
                    leftSection={<IconPlus />}
                    loading={requestProjectAnalysisMutation.isPending}
                    disabled={requestProjectAnalysisMutation.isPending}
                  >
                    Create Library
                  </Button>
                </Box>
              </Group>
            </Alert>

            <Title order={3}>Your Views</Title>
            <Text>Create a library to generate your first view.</Text>

            <Title order={3}>All Insights</Title>
            <Text>Create a library to see your first insights.</Text>
          </>
        )}
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
