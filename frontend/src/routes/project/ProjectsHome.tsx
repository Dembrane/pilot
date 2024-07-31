import { ProjectCard } from "@/components/project/ProjectCard";
import { ProjectListItem } from "@/components/project/ProjectListItem";
import { Icons } from "@/icons";
import { directus } from "@/lib/directus";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import {
  useCurrentUser,
  useProjects,
  useUploadConversationChunk,
} from "@/lib/query";
import { readItems, readUser } from "@directus/sdk";
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
  Skeleton,
  TextInput,
} from "@mantine/core";
import {
  useDebouncedState,
  useDebouncedValue,
  useDocumentTitle,
  useSessionStorage,
} from "@mantine/hooks";
import {
  IconCross,
  IconGrid3x3,
  IconInfoCircle,
  IconLayoutGrid,
  IconLayoutList,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";

export const ProjectsHomeRoute = () => {
  useDocumentTitle("Projects | Dembrane");
  const { sessionId } = useParams();

  const [gridParent] = useAutoAnimate();
  const [listParent] = useAutoAnimate();

  const [search, setSearch] = useState("");

  const [debouncedSearchValue] = useDebouncedValue(search, 200);

  const projectsQuery = useProjects({
    query: {
      fields: ["count(conversations)", "*"],
      sort: "-updated_at",
      filter: {
        session_id: {
          _eq: Number(sessionId ?? -1),
        },
      },
      search: debouncedSearchValue,
    },
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
            <Breadcrumbs
              items={[
                { label: <Icons.Home />, link: "/workspaces" },
                {
                  label: <Title order={1}>Workspace Home</Title>,
                },
              ]}
            />
          </Group>
          <Link to={`/workspaces/${sessionId}/projects/create`}>
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

        <Box className="relative">
          {view === "grid" && (
            <Box
              ref={gridParent}
              className="grid grid-cols-12 gap-4 place-content-stretch"
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
