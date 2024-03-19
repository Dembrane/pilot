import { Icons } from "@/icons";
import { ActionIcon, Button, Group, Paper, Stack } from "@mantine/core";
import { IconExternalLink } from "@tabler/icons-react";
import { PropsWithChildren } from "react";
import { Link } from "react-router-dom";

export const ProjectCard = ({
  project,
}: PropsWithChildren<{
  project: TProject;
}>) => {
  return (
    <Paper p="md">
      <Stack>
        <Group justify="space-between">
          <Group align="center">
            <Icons.Calendar />
            {project.name}
          </Group>
          <Link to={`/projects/${project.id}/overview`}>
            <ActionIcon component="a" variant="transparent">
              <Icons.Dots />
            </ActionIcon>
          </Link>
        </Group>
        <Link to={`/projects/${project.id}/overview`}>
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
