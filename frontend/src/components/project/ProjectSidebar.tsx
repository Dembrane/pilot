import { Icons } from "@/icons";
import { useProjectById, useUpdateProjectByIdMutation } from "@/lib/query";
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
  const { projectId } = useParams();

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
              link: `/projects`,
            },
            {
              label: (
                <Title order={2} size="sm">
                  {projectQuery.data?.name}
                </Title>
              ),
            },
          ]}
        />

        <Tooltip label={t`Project Overview`}>
          <Link to={`/projects/${projectId}/overview`}>
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

      <Link to={`/projects/${projectId}/chat`}>
        <SidebarButton
          component="a"
          icon={<Icons.Stars className="fill-black" />}
        >
          Ask
        </SidebarButton>
      </Link>

      <Link to={`/projects/${projectId}/library`}>
        <SidebarButton component="a" icon={<Icons.LightBulb />}>
          Library
        </SidebarButton>
      </Link>

      <ProjectAccordion projectId={projectId} />
    </Stack>
  );
};
