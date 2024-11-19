import { Markdown } from "@/components/common/Markdown";
import { AspectCard } from "@/components/aspect/AspectCard";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Icons } from "@/icons";
import { useViewById } from "@/lib/query";
import {
  Divider,
  Group,
  LoadingOverlay,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useParams } from "react-router-dom";
import { Trans } from "@lingui/macro";

export const ProjectLibraryView = () => {
  const { projectId, viewId } = useParams();

  const view = useViewById(projectId ?? "", viewId ?? "");

  return (
    <Stack className="min-h-dvh px-4 py-6">
      <Breadcrumbs
        items={[
          {
            label: <Trans>Library</Trans>,
            link: `/projects/${projectId}/library`,
          },
          {
            label: <Trans>View</Trans>,
          },
        ]}
      />
      <Divider />
      <LoadingOverlay visible={view.isLoading} />
      <Title order={1}>{view.data?.name}</Title>
      <Markdown content={view.data?.summary ?? ""} />
      <Paper p="md">
        <Stack>
          <Group c="gray">
            <Icons.Aspect />
            <Text className="font-semibold">
              <Trans>Aspects</Trans>
            </Text>
          </Group>

          <SimpleGrid
            cols={{
              sm: 2,
              md: 3,
              xl: 4,
            }}
            spacing="md"
          >
            {view.data?.aspects?.map((aspect: Aspect) => (
              <AspectCard
                key={aspect.id}
                data={aspect}
                className="h-full w-full"
              />
            ))}
          </SimpleGrid>
        </Stack>
      </Paper>
    </Stack>
  );
};
