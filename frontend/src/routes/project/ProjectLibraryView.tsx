import { AspectCard } from "@/components/aspect/Aspect";
import { Breadcrumbs } from "@/components/breadcrumbs/Breadcrumbs";
import { Icons } from "@/icons";
import { useProjectViewById } from "@/lib/query";
import {
  Anchor,
  Box,
  Divider,
  Group,
  LoadingOverlay,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { Link, useParams } from "react-router-dom";

export const ProjectLibraryView = () => {
  const { projectId, viewId } = useParams();

  const view = useProjectViewById(projectId ?? "", viewId ?? "");

  return (
    <Stack className="py-6 px-4 min-h-dvh">
      <Breadcrumbs
        items={[
          {
            label: <Icons.Sidebar />,
            link: `/projects/${projectId}/overview`,
          },
          {
            label: "Library",
            link: `/projects/${projectId}/library`,
          },
          {
            label: "View",
          },
        ]}
      />
      <Divider />
      <LoadingOverlay visible={view.isLoading} />
      <Title order={1}>{view.data?.name}</Title>
      <Text>{view.data?.summary}</Text>
      <Paper p="md">
        <Stack>
          <Group c="gray">
            <Icons.Aspect />
            <Text className="font-semibold">Aspects</Text>
          </Group>

          <SimpleGrid
            cols={{
              sm: 2,
              md: 3,
              lg: 4,
            }}
            spacing="md"
          >
            {view.data?.aspects?.map((aspect) => (
              <AspectCard
                key={aspect.id}
                data={aspect}
                className="w-full h-full"
              />
            ))}
          </SimpleGrid>
        </Stack>
      </Paper>
    </Stack>
  );
};
