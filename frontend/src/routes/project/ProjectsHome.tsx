import { ProjectCard } from "@/components/project/ProjectCard";
import { ProjectListItem } from "@/components/project/ProjectListItem";
import { Icons } from "@/icons";
import { getDirectusErrorString } from "@/lib/directus";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useCreateProjectMutation, useProjects } from "@/lib/query";
import {
  Text,
  Box,
  Button,
  Container,
  Group,
  Stack,
  Title,
  Alert,
  Divider,
  ActionIcon,
  Skeleton,
  TextInput,
} from "@mantine/core";
import {
  useDebouncedValue,
  useDocumentTitle,
  useSessionStorage,
} from "@mantine/hooks";
import {
  IconInfoCircle,
  IconLayoutGrid,
  IconLayoutList,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";

export const ProjectsHomeRoute = () => {
  useDocumentTitle("Projects | Dembrane");

  const [gridParent] = useAutoAnimate();
  const [listParent] = useAutoAnimate();

  const [search, setSearch] = useState("");

  const [debouncedSearchValue] = useDebouncedValue(search, 200);

  const projectsQuery = useProjects({
    query: {
      fields: ["count(conversations)", "*"],
      sort: "-updated_at",
      search: debouncedSearchValue,
    },
  });

  const [view, setView] = useSessionStorage<"grid" | "list">({
    key: "projects-home-view",
    defaultValue: "list",
  });

  const navigate = useNavigate();
  const createProjectMutation = useCreateProjectMutation();

  const handleCreateProject = async () => {
    const project = await createProjectMutation.mutateAsync({
      name: "New Project",
    });
    navigate(`/projects/${project.id}/overview`);
  };

  return (
    <Container>
      <Stack>
        <Group justify="space-between">
          <Group align="center">
            <Breadcrumbs
              items={[
                {
                  label: (
                    <Group>
                      <Icons.Home />
                      <Title order={1}>Home</Title>
                    </Group>
                  ),
                },
              ]}
            />
          </Group>
          <Button
            size="md"
            rightSection={<Icons.Plus stroke="white" fill="white" />}
            loading={createProjectMutation.isPending}
            onClick={handleCreateProject}
          >
            Create
          </Button>
        </Group>
        <Divider />
        <Group justify="space-between" className="relative">
          <Title order={2}>Projects</Title>

          <Group gap="xs">
            <ActionIcon
              disabled={
                projectsQuery.data &&
                projectsQuery.data.length === 0 &&
                debouncedSearchValue === ""
              }
              variant="transparent"
              onClick={() => setView("list")}
              title="List view"
              color={view === "list" ? "blue" : "gray"}
            >
              <IconLayoutList />
            </ActionIcon>

            <Divider orientation="vertical" />
            <ActionIcon
              disabled={
                projectsQuery.data &&
                projectsQuery.data.length === 0 &&
                debouncedSearchValue === ""
              }
              variant="transparent"
              onClick={() => setView("grid")}
              title="Grid view"
              color={view === "grid" ? "blue" : "gray"}
            >
              <IconLayoutGrid />
            </ActionIcon>
          </Group>
        </Group>

        {projectsQuery.data &&
          projectsQuery.data.length === 0 &&
          debouncedSearchValue === "" && (
            <Alert icon={<IconInfoCircle />}>
              Welcome to Your Home! Here you can see all your projects and get
              access to tutorial resources. Currently, you have no projects.
              Click "Create" to configure to get started!
            </Alert>
          )}

        {!(
          projectsQuery.data &&
          projectsQuery.data.length === 0 &&
          debouncedSearchValue === ""
        ) && (
          <TextInput
            leftSection={<IconSearch />}
            rightSection={
              !!search && (
                <ActionIcon
                  disabled={projectsQuery.isLoading}
                  variant="transparent"
                  onClick={() => {
                    setSearch("");
                  }}
                >
                  <IconX />
                </ActionIcon>
              )
            }
            placeholder="Search projects"
            value={search}
            size="md"
            onChange={(e) => setSearch(e.currentTarget.value)}
            className="w-full"
          />
        )}

        {projectsQuery.data &&
          projectsQuery.data.length === 0 &&
          debouncedSearchValue !== "" && (
            <Text>
              No projects found for search term <i>{debouncedSearchValue}</i>
            </Text>
          )}

        {projectsQuery.isError && (
          <Alert color="red" title="Error">
            {getDirectusErrorString(projectsQuery.error)}
          </Alert>
        )}

        <Box className="relative">
          {view === "grid" && (
            <Box
              ref={gridParent}
              className="grid grid-cols-12 place-content-stretch gap-4"
            >
              {projectsQuery.isLoading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <Box key={i} className="col-span-full h-full md:col-span-4">
                    <Skeleton height={80} radius="md" />
                  </Box>
                ))}
              {projectsQuery.data &&
                projectsQuery.data.length > 0 &&
                projectsQuery.data.map((project) => (
                  <Box
                    key={project.id}
                    className="col-span-full h-full md:col-span-4"
                  >
                    <ProjectCard project={project as Project} />
                  </Box>
                ))}
            </Box>
          )}

          {view === "list" && (
            <Stack ref={listParent} gap="sm">
              {projectsQuery.isLoading && (
                <>
                  <Skeleton height={60} radius="md" />
                  <Skeleton height={60} radius="md" />
                  <Skeleton height={60} radius="md" />
                </>
              )}
              {projectsQuery.data &&
                projectsQuery.data.length > 0 &&
                projectsQuery.data.map((project) => (
                  <Box key={project.id}>
                    <ProjectListItem project={project as Project} />
                  </Box>
                ))}
            </Stack>
          )}
        </Box>
      </Stack>
    </Container>
  );
};
