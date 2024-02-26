import { Anchor, Group, Skeleton, Stack, Title } from "@mantine/core";
import { useDocumentById } from "../lib/query";
import { DocumentChat } from "../components/Message";
import { Link, useLoaderData } from "react-router-dom";
import { IconChevronRight } from "@tabler/icons-react";

const AnalysisSkeleton = () =>
  [1, 2].map((i) => <Skeleton key={i} height={120} radius="md" />);

export const DocumentAnalysisRoute = () => {
  const initialData: TDocument = useLoaderData() as TDocument;
  const documentQuery = useDocumentById(initialData.id, initialData);

  return (
    <Stack p="sm" h="100%">
      <Group justify="space-between">
        <Group align="center" gap="xs" wrap="nowrap">
          <Link to="/">
            <Title component={Anchor} order={1}>
              Analysis
            </Title>
          </Link>
          <IconChevronRight />
          <Title order={1}>{initialData.title}</Title>
        </Group>
      </Group>

      {documentQuery.isLoading && (
        <Stack>
          <AnalysisSkeleton />
        </Stack>
      )}

      {documentQuery.data && <DocumentChat document={documentQuery.data} />}
    </Stack>
  );
};
