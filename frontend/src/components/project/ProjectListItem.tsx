import { Icons } from "@/icons";
import { ActionIcon, Button, Group, Paper, Stack, Text } from "@mantine/core";
import { IconExternalLink } from "@tabler/icons-react";
import { formatRelative } from "date-fns";
import { PropsWithChildren } from "react";
import { Link } from "react-router-dom";

export const ProjectListItem = ({
  project,
}: PropsWithChildren<{
  project: Project;
}>) => {
  return (
    <Link to={`/projects/${project.id}/overview`}>
      <Paper
        component="a"
        bg="transparent"
        p="sm"
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
          {/* <Group>
        <Link to={`/projects/${project.id}/overview`}>
          <Button
            rightSection={<IconExternalLink size={20} />}
            className="w-full"
            c="gray"
            bg="gray"
            variant="light"
            component="a"
          >
            Open
          </Button>
        </Link>
      </Group> */}
        </Group>
      </Paper>
    </Link>
  );
};
