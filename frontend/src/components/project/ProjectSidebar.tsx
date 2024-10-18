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
import { useParams } from "react-router-dom";
import { ProjectAccordion } from "./ProjectAccordion";
import { NavigationButton } from "../common/NavigationButton";
import { Breadcrumbs } from "../common/Breadcrumbs";
import { ProjectQRCode } from "./ProjectQRCode";
import { I18nLink } from "../common/i18nLink";
import { Trans, t } from "@lingui/macro";

export const ProjectSidebar = () => {
  const { projectId, conversationId } = useParams();

  const projectQuery = useProjectById({ projectId: projectId ?? "" });

  // const { isCollapsed, toggleSidebar } = useSidebarCollapsed();

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
                <Tooltip label={t`Projects Home`}>
                  <ActionIcon variant="transparent">
                    <Icons.Home color="black" />
                  </ActionIcon>
                </Tooltip>
              ),
              link: `/projects`,
            },
            {
              label: (
                <I18nLink to={`/projects/${projectId}/overview`}>
                  <Title
                    order={2}
                    size="lg"
                    className="whitespace-break-spaces hover:underline"
                  >
                    {projectQuery.data?.name}
                  </Title>
                </I18nLink>
              ),
            },
          ]}
        />
        {/* 
        <Tooltip label={t`Project Overview`}>
          <I18nLink to={`/projects/${projectId}/overview`}>
            <ActionIcon
              component="a"
              variant="transparent"
              aria-label={t`Project Overview and Edit`}
            >
              <Icons.Gear color="black" />
            </ActionIcon>
          </I18nLink>
        </Tooltip> */}
        {/* 
        {!isCollapsed && (
          <ActionIcon variant="transparent" onClick={toggleSidebar}>
            <Icons.Sidebar />
          </ActionIcon>
        )} */}
      </Group>

      <NavigationButton
        onClick={handleAsk}
        component="button"
        rightIcon={<Icons.Stars />}
      >
        <Trans>Ask</Trans>
      </NavigationButton>

      <NavigationButton
        to={`/projects/${projectId}/library`}
        component="a"
        rightIcon={<Icons.LightBulb />}
      >
        <Trans>Library</Trans>
      </NavigationButton>

      <Box hiddenFrom="lg">
        <ProjectQRCode project={projectQuery.data} />
      </Box>

      <ProjectAccordion projectId={projectId} />
    </Stack>
  );
};