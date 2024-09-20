import { Icons } from "@/icons";
import { useCreateChatMutation, useProjectById } from "@/lib/query";
import { Group, LoadingOverlay, Stack, Title } from "@mantine/core";
import { Link, useParams } from "react-router-dom";
import { ProjectAccordion } from "./ProjectAccordion";
import { NavigationButton } from "../common/NavigationButton";
import { Breadcrumbs } from "../common/Breadcrumbs";

export const ProjectSidebar = () => {
  const { projectId, conversationId } = useParams();

  const projectQuery = useProjectById({ projectId: projectId ?? "" });

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
              label: <Icons.Home color="black" />,
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

        {/* <Tooltip label={t`Project Overview`}>
          <Link to={`/projects/${projectId}/overview`}>
            <ActionIcon
              component="a"
              variant="transparent"
              aria-label="Project Oveview and Edit"
            >
              <Icons.Gear color="black" />
            </ActionIcon>
          </Link>
        </Tooltip> */}
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

      <ProjectAccordion projectId={projectId} />
    </Stack>
  );
};
