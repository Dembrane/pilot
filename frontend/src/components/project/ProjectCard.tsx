import { Icons } from "@/icons";
import { ActionIcon, Button, Group, Paper, Stack, Text } from "@mantine/core";
import { IconExternalLink } from "@tabler/icons-react";
import { formatRelative } from "date-fns";
import { PropsWithChildren } from "react";
import { Link, useParams } from "react-router-dom";

export const ProjectCard = ({
  project,
}: PropsWithChildren<{
  project: Project;
}>) => {
  const link = `/projects/${project.id}/overview`;

  return (
    <Paper p="md" className="h-full" withBorder>
      <Stack className="h-full" justify="space-between">
        <Stack gap="xs">
          <Group justify="space-between" wrap="nowrap">
            <Group align="center">
              <Icons.Calendar />
              <Text className="font-semibold" size="lg">
                {project.name}
              </Text>
            </Group>
            <Link to={link}>
              <ActionIcon component="a" variant="subtle">
                <Icons.Dots />
              </ActionIcon>
            </Link>
          </Group>
          <Text size="sm" c="dimmed">
            {project.conversations_count ?? 0} Conversation
            {project.conversations_count === 1 ? "" : "s"} &middot; Edited{" "}
            {formatRelative(new Date(project.updated_at), new Date())}
          </Text>
        </Stack>
        <Link to={link} style={{ width: "100%" }}>
          <Button
            rightSection={<IconExternalLink size={20} />}
            fullWidth
            variant="light"
          >
            Open
          </Button>
        </Link>
      </Stack>
    </Paper>
  );
};
