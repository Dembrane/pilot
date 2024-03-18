import { ProjectCard } from "@/components/project/ProjectCard";
import { Icons } from "@/icons";
import { useProjects } from "@/lib/query";
import {
  Text,
  Box,
  Button,
  Container,
  Group,
  LoadingOverlay,
  Stack,
  Title,
} from "@mantine/core";
import { Link } from "react-router-dom";

export const ProjectsHomeRoute = () => {
  const projectsQuery = useProjects();

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
        <Box className="grid grid-cols-12 gap-4">
          {projectsQuery.isLoading && <LoadingOverlay visible />}
          {projectsQuery.data && projectsQuery.data.length === 0 && (
            <Box className="col-span-full">
              <Text>
                You have no projects yet. Click the button above to create a new
                project.
              </Text>
            </Box>
          )}
          {projectsQuery.data &&
            projectsQuery.data.length > 0 &&
            projectsQuery.data.map((project) => (
              <Box key={project.id} className="col-span-full md:col-span-4">
                <ProjectCard project={project} />
              </Box>
            ))}
        </Box>
      </Stack>
    </Container>
  );
};
