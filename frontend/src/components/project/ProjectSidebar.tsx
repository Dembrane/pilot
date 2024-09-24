import { Icons } from "@/icons";
import { useCreateChatMutation, useProjectById } from "@/lib/query";
import {
  ActionIcon,
  Box,
  Group,
  LoadingOverlay,
  Stack,
  Title,
  Tooltip,
} from "@mantine/core";
import { Link, useParams } from "react-router-dom";
import { ProjectAccordion } from "./ProjectAccordion";
import { NavigationButton } from "../common/NavigationButton";
import { Breadcrumbs } from "../common/Breadcrumbs";
import { ProjectQRCode } from "./ProjectQRCode";
import { useSidebarCollapsed } from "@/lib/useSidebarCollapsed";
import { IconChevronLeft } from "@tabler/icons-react";

export const ProjectSidebar = () => {
  const { projectId, conversationId } = useParams();

  const projectQuery = useProjectById({ projectId: projectId ?? "" });

  const { isCollapsed, toggleSidebar } = useSidebarCollapsed();

  const createChatMutation = useCreateChatMutation();

  const handleAsk = () => {
    createChatMutation.mutate({
      project_id: { id: projectId ?? "" },
      conversationId: conversationId ?? "",
      navigateToNewChat: true,
    });
  };

  if (!projectId) {
    return null;
  }

  return (
    <Stack className="h-full px-4 py-6">
      <LoadingOverlay visible={projectQuery.isLoading} />
      <Group justify="space-between">
        <Breadcrumbs
          items={[
            {
              label: (
                <Tooltip label="Projects Home">
                  <ActionIcon variant="transparent">
                    <Icons.Home color="black" />
                  </ActionIcon>
                </Tooltip>
              ),
              link: `/projects`,
            },
            {
              label: (
                <Link to={`/projects/${projectId}/overview`}>
                  <Title
                    order={2}
                    size="sm"
                    className="whitespace-break-spaces"
                  >
                    {projectQuery.data?.name}
                  </Title>
                </Link>
              ),
            },
          ]}
        />

        <Tooltip label={`Project Overview`}>
          <Link to={`/projects/${projectId}/overview`}>
            <ActionIcon
              component="a"
              variant="transparent"
              aria-label="Project Oveview and Edit"
            >
              <Icons.Gear color="black" />
            </ActionIcon>
          </Link>
        </Tooltip>

        {!isCollapsed && (
          <ActionIcon variant="transparent" onClick={toggleSidebar}>
            <Icons.Sidebar />
          </ActionIcon>
        )}
      </Group>

      <NavigationButton
        onClick={handleAsk}
        component="button"
        rightIcon={<Icons.Stars />}
      >
        Ask
      </NavigationButton>

      <NavigationButton
        to={`/projects/${projectId}/library`}
        component="a"
        rightIcon={<Icons.LightBulb />}
      >
        Library
      </NavigationButton>

      <Box hiddenFrom="lg">
        <ProjectQRCode project={projectQuery.data} />
      </Box>

      <ProjectAccordion projectId={projectId} />
    </Stack>
  );
};
