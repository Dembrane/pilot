import { ProjectCard } from "@/components/project/ProjectCard";
import { ProjectListItem } from "@/components/project/ProjectListItem";
import { Icons } from "@/icons";
import { directus } from "@/lib/directus";
import { useCurrentSession, useProjects } from "@/lib/query";
import { readItem, readItems } from "@directus/sdk";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import {
  Text,
  Box,
  Button,
  Container,
  Group,
  LoadingOverlay,
  Stack,
  Title,
  Alert,
  Divider,
  ActionIcon,
} from "@mantine/core";
import { useSessionStorage } from "@mantine/hooks";
import {
  IconGrid3x3,
  IconInfoCircle,
  IconLayoutGrid,
  IconLayoutList,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

export const ProjectsHomeRoute = () => {
  const sessionQuery = useCurrentSession();
  const projectsQuery = useQuery({
    enabled: !!sessionQuery.data,
    queryKey: ["projects", sessionQuery.data?.id],
    queryFn: () =>
      directus.request(
        readItems("project", {
          fields: ["count(conversations)", "*"],
          sort: "-updated_at",
          filter: {
            session_id: {
              _eq: sessionQuery.data?.id,
            },
          },
        }),
      ),
  });

  const [view, setView] = useSessionStorage<"grid" | "list">({
    key: "projects-home-view",
    defaultValue: "list",
  });

  return (
    <Container>
      <Stack>
        <Group justify="space-between">
          <Group align="center">
            <Icons.Home />
            <Title order={1}>Home</Title>
          </Group>
          <Link to="/projects/create">
            <Button
              component="a"
              size="md"
              rightSection={<Icons.Plus stroke="white" fill="white" />}
            >
              Create
            </Button>
          </Link>
        </Group>
        <Divider />
        <Group justify="space-between" className="relative">
          <Title order={2}>Projects</Title>

          <LoadingOverlay visible={projectsQuery.isLoading} />

          {projectsQuery.data && projectsQuery.data.length > 0 && (
            <Group gap="xs">
              <ActionIcon
                variant="transparent"
                onClick={() => setView("list")}
                title="List view"
                color={view === "list" ? "blue" : "gray"}
              >
                <IconLayoutList />
              </ActionIcon>

              <Divider orientation="vertical" />
              <ActionIcon
                variant="transparent"
                onClick={() => setView("grid")}
                title="Grid view"
                color={view === "grid" ? "blue" : "gray"}
              >
                <IconLayoutGrid />
              </ActionIcon>
            </Group>
          )}
        </Group>

        {projectsQuery.data && projectsQuery.data.length === 0 && (
          <Alert icon={<IconInfoCircle />}>
            Welcome to Your Home! Here you can see all your projects and get
            access to tutorial resources. Currently, you have no projects. Click
            "Create" to configure to get started!
          </Alert>
        )}

        <Box className="relative">
          {(sessionQuery.isLoading || projectsQuery.isLoading) && (
            <LoadingOverlay visible />
          )}
          {view === "grid" && (
            <Box className="grid grid-cols-12 gap-4 place-content-stretch">
              {projectsQuery.data &&
                projectsQuery.data.length > 0 &&
                projectsQuery.data.map((project) => (
                  <Box
                    key={project.id}
                    className="col-span-full h-full md:col-span-4"
                  >
                    <ProjectCard project={project} />
                  </Box>
                ))}
            </Box>
          )}

          {view === "list" && (
            <Stack gap="sm">
              {projectsQuery.data &&
                projectsQuery.data.length > 0 &&
                projectsQuery.data.map((project) => (
                  <Box key={project.id}>
                    <ProjectListItem project={project} />
                  </Box>
                ))}
            </Stack>
          )}
        </Box>
      </Stack>
    </Container>
  );
};
