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
import { Link, useLocation, useParams } from "react-router-dom";
import { ProjectAccordion } from "./ProjectAccordion";
import { NavigationButton } from "../common/NavigationButton";
import { Breadcrumbs } from "../common/Breadcrumbs";

export const ProjectSidebar = () => {
  const { projectId } = useParams();
  const location = useLocation();

  const projectQuery = useProjectById({ projectId: projectId ?? "" });

  if (!projectId) {
    return null;
  }

  return (
    <Stack className="border-r-none lg:border-b-none h-full border-b px-4 py-6 lg:border-r">
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
        <NavigationButton
          component="a"
          rightSection={<Icons.Stars className="fill-black" />}
          active={location.pathname.includes("chat")}
        >
          Ask
        </NavigationButton>
      </Link>

      <Link to={`/projects/${projectId}/library`}>
        <NavigationButton component="a" rightSection={<Icons.LightBulb />}>
          Library
        </NavigationButton>
      </Link>

      <ProjectAccordion projectId={projectId} />
    </Stack>
  );
};
