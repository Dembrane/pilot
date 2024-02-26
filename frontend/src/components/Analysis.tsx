import { ActionIcon, Group, Skeleton, Stack, Title } from "@mantine/core";
import { Icons } from "../icons";
import { useCurrentSession, useDocuments } from "../lib/query";
import {
  AIMessage,
  AllDocumentsReadyMessages,
  DropzoneUploadDocumentsMessage,
  GlobalContextAIMessage,
  InputGlobalContextHumanMessage,
} from "./Message";
import { useAutoAnimate } from "@formkit/auto-animate/react";

const AnalysisSkeleton = () =>
  [1, 2].map((i) => <Skeleton key={i} height={120} radius="md" />);

export const GlobalAnalysisPanel = () => {
  const session = useCurrentSession();
  const documentsQuery = useDocuments();
  const [parent] = useAutoAnimate();

  return (
    <Stack p="sm">
      <Group justify="space-between">
        <Title order={2}>Analysis</Title>
        <ActionIcon disabled opacity={"25%"}>
          <Icons.Refresh />
        </ActionIcon>
      </Group>

      {documentsQuery.isLoading && (
        <Stack>
          <AnalysisSkeleton />
        </Stack>
      )}

      <Stack ref={parent}>
        <AIMessage text="Hallo, ik ben vandaag je onderzoeksassistent. Om te beginnen upload je de documenten die je wilt analyseren." />
        <DropzoneUploadDocumentsMessage />
        {documentsQuery.data && documentsQuery.data.length > 0 && (
          <>
            <AIMessage text="Geweldig! Uw documenten worden nu geüpload. Terwijl de documenten worden verwerkt, kun je me vertellen waar deze analyse over gaat?" />
            <InputGlobalContextHumanMessage session={session.data} />
            <GlobalContextAIMessage />
            <AllDocumentsReadyMessages />
          </>
        )}
      </Stack>
    </Stack>
  );
};
