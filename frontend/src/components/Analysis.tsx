import { ActionIcon, Group, Skeleton, Stack, Title } from "@mantine/core";
import { Icons } from "../icons";
import { useDocuments } from "../lib/query";
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
        <AIMessage text="Hello, I will be your research assistant today. To get started please upload the documents you want to analyse." />
        <DropzoneUploadDocumentsMessage />
        {documentsQuery.data && documentsQuery.data.length > 0 && (
          <>
            <AIMessage text="Great! Your documents are now being uploaded. While the documents are being processed, can you tell me what this analysis is about?" />
            <InputGlobalContextHumanMessage />
            <GlobalContextAIMessage />
            <AllDocumentsReadyMessages />
          </>
        )}
      </Stack>
    </Stack>
  );
};
