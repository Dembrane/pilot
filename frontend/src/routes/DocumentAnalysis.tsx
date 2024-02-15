import { Anchor, Group, Skeleton, Stack, Title } from "@mantine/core";
import { useDocumentById } from "../lib/query";
import { DocumentChatInput, DocumentChatMessages } from "../components/Message";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Link, useLoaderData } from "react-router-dom";
import { IconChevronRight } from "@tabler/icons-react";

const AnalysisSkeleton = () =>
  [1, 2].map((i) => <Skeleton key={i} height={120} radius="md" />);

export const DocumentAnalysisRoute = () => {
  const initialData: TDocument = useLoaderData() as TDocument;
  const documentQuery = useDocumentById(initialData.id, initialData);

  const [parent] = useAutoAnimate();

  return (
    <Stack p="sm">
      <Group justify="space-between">
        <Group align="center" gap="xs" wrap="nowrap">
          <Link to="/">
            <Title component={Anchor} order={2}>
              Analysis
            </Title>
          </Link>
          <IconChevronRight />
          <Title order={2}>{initialData.title}</Title>
        </Group>
      </Group>

      {documentQuery.isLoading && (
        <Stack>
          <AnalysisSkeleton />
        </Stack>
      )}

      <Stack ref={parent}>
        {documentQuery.data && (
          <>
            <DocumentChatMessages document={documentQuery.data} />
            <DocumentChatInput document={documentQuery.data} />
          </>
        )}
      </Stack>
    </Stack>
  );
};
