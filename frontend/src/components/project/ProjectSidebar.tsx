import { Icons } from "@/icons";
import { useProjectById } from "@/lib/query";
import { t } from "@lingui/macro";
import {
  ActionIcon,
  Group,
  LoadingOverlay,
  Stack,
  Title,
  Tooltip,
} from "@mantine/core";
import { Link, useParams } from "react-router-dom";
import { ProjectAccordion } from "./ProjectAccordion";
import { SidebarButton } from "../common/SidebarButton";
import { Breadcrumbs } from "../common/Breadcrumbs";

export const ProjectSidebar = () => {
  const { projectId, sessionId } = useParams();

  const projectQuery = useProjectById({ projectId: projectId ?? "" });

  if (!projectId) {
    return null;
  }

  return (
    <Stack className="h-full py-6 px-2">
      <LoadingOverlay visible={projectQuery.isLoading} />
      <Group justify="space-between">
        <Breadcrumbs
          items={[
            {
              label: <Icons.Home />,
              // link: `/workspaces`,
              link: `/workspaces/${sessionId}/projects`,
            },
            // {
            //   label: (
            //     <Title order={2} size="sm">
            //       Projects
            //     </Title>
            //   ),
            //   link: `/workspaces/${sessionId}/projects`,
            // },
            {
              label: (
                <Title order={2} size="sm">
                  {projectQuery.data?.name}
                </Title>
              ),
              // link: `/workspaces/${sessionId}/projects/${projectId}/overview`,
            },
          ]}
        />

        <Tooltip label={t`Project Overview`}>
          <Link to={`/workspaces/${sessionId}/projects/${projectId}/overview`}>
            <ActionIcon
              component="a"
              variant="transparent"
              aria-label="Project Oveview and Edit"
            >
              <Icons.Gear />
            </ActionIcon>
          </Link>
        </Tooltip>
      </Group>

      <Link to={`/workspaces/${sessionId}/projects/${projectId}/library`}>
        <SidebarButton
          component="a"
          icon={<Icons.Stars className="fill-black" />}
        >
          Analysis
        </SidebarButton>
      </Link>

      <Link to={`/workspaces/${sessionId}/projects/${projectId}/library`}>
        <SidebarButton component="a" icon={<Icons.LightBulb />}>
          Library
        </SidebarButton>
      </Link>

      <ProjectAccordion projectId={projectId} />
    </Stack>
  );
};
