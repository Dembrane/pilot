import { Markdown } from "@/components/common/Markdown";
import { AspectCard } from "@/components/aspect/AspectCard";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Icons } from "@/icons";
import { useViewById } from "@/lib/query";
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

  const view = useViewById(projectId ?? "", viewId ?? "");

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
      <Markdown content={view.data?.summary ?? ""} />
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
              xl: 5,
            }}
            spacing="md"
          >
            {view.data?.aspects?.map((aspect: Aspect) => (
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
