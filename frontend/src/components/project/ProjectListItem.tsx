import { Icons } from "@/icons";
import { ActionIcon, Button, Group, Paper, Stack, Text } from "@mantine/core";
import { IconExternalLink } from "@tabler/icons-react";
import { formatRelative } from "date-fns";
import { PropsWithChildren } from "react";
import { Link, useParams } from "react-router-dom";

export const ProjectListItem = ({
  project,
}: PropsWithChildren<{
  project: Project;
}>) => {
  const { sessionId } = useParams();
  const link = `/workspaces/${sessionId}/projects/${project.id}/overview`;

  return (
    <Link to={link}>
      <Paper
        component="a"
        p="sm"
        bg="transparent"
        className="relative hover:!border-primary-400"
      >
        <Group justify="space-between">
          <Stack gap="0">
            <Group align="center">
              <Icons.Calendar />
              <Text className="font-semibold" size="lg">
                {project.name}
              </Text>
            </Group>
            <Text size="sm" c="gray.8">
              {project.conversations_count} Conversation
              {project.conversations_count === 1 ? "" : "s"} &middot; Edited{" "}
              {formatRelative(new Date(project.updated_at), new Date())}
            </Text>
          </Stack>
        </Group>
      </Paper>
    </Link>
  );
};
