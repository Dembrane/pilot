import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { CloseableAlert } from "@/components/common/ClosableAlert";
import { Insight } from "@/components/insight/Insight";
import { ProjectAnalysisRunStatus } from "@/components/project/ProjectAnalysisRunStatus";
import { ViewExpandedCard } from "@/components/view/View";
import { Icons } from "@/icons";
import {
  useConversationsByProjectId,
  useProjectInsights,
  useProjectViews,
  useGenerateProjectLibraryMutation,
  useLatestProjectAnalysisRunByProjectId,
  useGenerateProjectViewMutation,
} from "@/lib/query";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { t, Trans } from "@lingui/macro";
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
  ActionIcon,
  CloseButton,
  Input,
  Textarea,
  Collapse,
  Container,
  TextInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconClock,
  IconInfoCircle,
  IconPlus,
  IconRefresh,
  IconSortAscending,
} from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import { StringValidation } from "zod";

type SortBy = "relevance" | "default";

const DummyViews = () => {
  return (
    <Stack>
      <Text c="gray">
        <Trans>
          These are your default view templates. Once you create your library
          these will be your first two views.
        </Trans>
      </Text>
      <Paper p="md">
        <SimpleGrid cols={3}>
          <Paper bg="white" p="md">
            <Text className="font-xl pb-2 font-semibold">
              <Trans>Topics</Trans>
            </Text>
            <Group>
              <Pill>
                <Trans>0 Aspects</Trans>
              </Pill>
            </Group>
          </Paper>
          <Paper bg="white" p="md">
            <Text className="font-xl pb-2 font-semibold">
              <Trans>Sentiment</Trans>
            </Text>
            <Group>
              <Pill>
                <Trans>0 Aspects</Trans>
              </Pill>
            </Group>
          </Paper>
        </SimpleGrid>
      </Paper>
    </Stack>
  );
};

type CreateViewForm = {
  query: string;
  additionalContext: string;
};

const CreateView = ({
  projectId,
  onClose,
}: {
  projectId: string;
  onClose: () => void;
}) => {
  const createViewMutation = useGenerateProjectViewMutation();

  const { register, handleSubmit, reset } = useForm<CreateViewForm>();

  const onSubmit = (data: CreateViewForm) => {
    createViewMutation.mutate({
      projectId,
      query: data.query,
      additionalContext: data.additionalContext,
    });
  };

  useEffect(() => {
    if (createViewMutation.isSuccess) {
      reset();
    }
  }, [createViewMutation.isSuccess, reset]);

  return (
    <Paper className="max-w-[800px]" p="md">
      <Stack>
        <Group gap="md">
          <ActionIcon variant="transparent" onClick={onClose}>
            <CloseButton />
          </ActionIcon>
          <Icons.View />
          <Text>
            <Trans>Create new view</Trans>
          </Text>
        </Group>

        <form>
          <Stack gap="sm">
            {createViewMutation.isError && (
              <Alert variant="filled" color="red">
                {createViewMutation.error?.message}
              </Alert>
            )}
            {createViewMutation.isSuccess && (
              <Alert variant="light" icon={<IconInfoCircle />}>
                <Text>
                  <Trans>
                    Your view has been created. Please wait as we process and
                    analyse the data.
                  </Trans>
                </Text>
              </Alert>
            )}
            <TextInput
              {...register("query")}
              label={t`Enter your query`}
              required
              placeholder={t`Topics`}
            />
            <Textarea
              rows={5}
              {...register("additionalContext")}
              label={t`Add additional context (Optional)`}
              placeholder={t`Give me a list of 5-10 topics that are being discussed.`}
            />
            <Group className="w-full" justify="flex-end">
              <Button
                onClick={handleSubmit(onSubmit)}
                loading={createViewMutation.isPending}
                disabled={createViewMutation.isPending}
              >
                <Trans>Create View</Trans>
              </Button>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Paper>
  );
};

export const ProjectLibraryRoute = () => {
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

  const latestRunQuery = useLatestProjectAnalysisRunByProjectId(
    projectId ?? "",
  );

  const latestRun = latestRunQuery.data ?? null;

  const [opened, { toggle, close }] = useDisclosure(false);

  if (conversationsQuery.isLoading) {
    return (
      <Container>
        <Stack className="relative h-[400px] px-2 py-6">
          <LoadingOverlay visible />
        </Stack>
      </Container>
    );
  }

  const sortInsights = (data: Insight[], sortBy: SortBy) => {
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
            a.quotes.map((quote) => (quote as Quote).conversation_id),
          ).size;
          const uniqueConversationsB = new Set(
            b.quotes.map((quote) => (quote as Quote).conversation_id),
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

  const handleCreateLibrary = async () => {
    if (
      window.confirm(
        t`Are you sure you want to generate the library? This will take a while and overwrite your current views and insights.`,
      )
    ) {
      requestProjectLibraryMutation.mutate({
        projectId: projectId ?? "",
      });
    }
  };

  return (
    <Stack className="relative px-4 py-6">
      <Group justify="space-between">
        <Breadcrumbs
          items={[
            {
              label: (
                <Title order={1}>
                  <Trans>Library</Trans>
                </Title>
              ),
            },
          ]}
        />

        {latestRun && latestRun.processing_completed_at ? (
          <Button
            variant="outline"
            leftSection={<IconRefresh />}
            onClick={handleCreateLibrary}
          >
            <Trans>Regenerate Library</Trans>
          </Button>
        ) : (
          <Button
            leftSection={<IconPlus />}
            onClick={handleCreateLibrary}
            loading={requestProjectLibraryMutation.isPending}
            disabled={
              requestProjectLibraryMutation.isPending ||
              latestRun?.processing_status === "PROCESSING"
            }
          >
            <Trans>Create Library</Trans>
          </Button>
        )}
      </Group>

      <Divider />

      <ProjectAnalysisRunStatus projectId={projectId ?? ""} />

      {!latestRun && (
        <>
          <Alert>
            <Text>
              <Trans>
                This is your project library. Currently,{" "}
                {conversationsQuery.data?.length ?? 0} conversations are waiting
                to be processed.
              </Trans>
            </Text>
          </Alert>
        </>
      )}

      <Group justify="space-between">
        <Title order={2}>
          <Trans>Your Views</Trans>
        </Title>
        <Button
          leftSection={<IconPlus />}
          onClick={toggle}
          disabled={!(latestRun && latestRun.processing_status === "DONE")}
        >
          <Trans>Create View</Trans>
        </Button>
      </Group>

      <Collapse in={opened}>
        <CreateView projectId={projectId ?? ""} onClose={close} />
      </Collapse>

      {!opened && latestRun && latestRun.processing_status === "DONE" && (
        <CloseableAlert variant="light" icon={<Icons.View />}>
          <Text>
            <Trans>
              In order to better navigate through the quotes, create additional
              views. The quotes will then be clustered based on your view.
            </Trans>
          </Text>
        </CloseableAlert>
      )}

      <Stack>
        {!viewsExist && <DummyViews />}
        {viewsQuery.data &&
          viewsQuery.data.map((v) => <ViewExpandedCard key={v.id} data={v} />)}
      </Stack>

      <Title order={2} id="insights">
        <Trans>All Insights</Trans>
      </Title>

      {!insightsExist && (
        <Alert variant="light" icon={<IconInfoCircle />}>
          <Text>
            <Trans>
              Your library is empty. Create a library to see your first
              insights.
            </Trans>
          </Text>
        </Alert>
      )}

      {insightsQuery.data && insightsQuery.data.length > 0 && (
        <>
          <Group gap="md">
            <Button
              onClick={toggleSort}
              color={sortBy === "relevance" ? "blue" : "gray"}
              variant={sortBy === "relevance" ? "filled" : "subtle"}
              leftSection={<IconSortAscending />}
            >
              <Trans>Relevance</Trans>
            </Button>

            <Button
              onClick={toggleSort}
              color={sortBy === "default" ? "blue" : "gray"}
              variant={sortBy === "default" ? "filled" : "subtle"}
              leftSection={<IconClock />}
            >
              <Trans>Time Created</Trans>
            </Button>
          </Group>

          <div ref={parent} className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {insightsQuery.isLoading && (
              <>
                <Skeleton height={100} />
                <Skeleton height={100} />
              </>
            )}
            {insightsQuery.data &&
              insightsQuery.data.length > 0 &&
              sortInsights(insightsQuery.data, sortBy).map((insight) => (
                <Insight key={insight.id} data={insight as Insight} />
              ))}
          </div>
        </>
      )}
    </Stack>
  );
};
