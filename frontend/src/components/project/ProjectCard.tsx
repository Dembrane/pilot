import { Icons } from "@/icons";
import { ActionIcon, Button, Group, Paper, Stack } from "@mantine/core";
import { IconExternalLink } from "@tabler/icons-react";
import { PropsWithChildren } from "react";
import { Link, useParams } from "react-router-dom";

export const ProjectCard = ({
  project,
}: PropsWithChildren<{
  project: Project;
}>) => {
  const { sessionId } = useParams();
  const link = `/workspaces/${sessionId}/projects/${project.id}/overview`;

  return (
    <Paper p="md" className="h-full">
      <Stack className="h-full">
        <Group justify="space-between" wrap="nowrap" className="grow">
          <Group align="center">
            <Icons.Calendar />
            {project.name}
          </Group>

          <Link to={link}>
            <ActionIcon component="a" variant="transparent">
              <Icons.Dots />
            </ActionIcon>
          </Link>
        </Group>

        <Link to={link}>
          <Button
            rightSection={<IconExternalLink size={20} />}
            className="w-full"
            component="a"
          >
            Open
          </Button>
        </Link>
      </Stack>
    </Paper>
  );
};
