import ProjectBasicEdit from "@/components/project/ProjectBasicEdit";
import { ProjectDangerZone } from "@/components/project/ProjectDangerZone";
import { ProjectPortalEditor } from "@/components/project/ProjectPortalEditor";
import { ProjectTranscriptSettings } from "@/components/project/ProjectTranscriptSettings";
import { getProjectTranscriptsLink } from "@/lib/api";
import { useProjectById } from "@/lib/query";
import { Trans } from "@lingui/macro";
import {
  Alert,
  Box,
  Button,
  Divider,
  LoadingOverlay,
  Stack,
  Title,
} from "@mantine/core";
import { IconDownload } from "@tabler/icons-react";
import { useParams } from "react-router-dom";

export const ProjectSettingsRoute = () => {
  const { projectId } = useParams();
  const projectQuery = useProjectById({ projectId: projectId ?? "" });

  return (
    <Stack className="relative px-2 py-2">
      {projectQuery.isLoading && <LoadingOverlay visible />}
      {projectQuery.isError && (
        <Alert variant="outline" color="red">
          <Trans>Error loading project</Trans>
        </Alert>
      )}
      {projectQuery.data && <ProjectBasicEdit project={projectQuery.data} />}

      {projectQuery.data && (
        <>
          <Divider />
          <Title order={2}>
            <Trans>Export</Trans>
          </Title>
          <Box>
            <Button
              component="a"
              href={getProjectTranscriptsLink(projectId ?? "")}
              download={`${projectQuery.data.name ?? "Project"}-Transcripts.zip`}
              rightSection={<IconDownload />}
              variant="outline"
            >
              <Trans>Download All Transcripts</Trans>
            </Button>
          </Box>
        </>
      )}

      {projectQuery.data && (
        <>
          <Divider />
          <ProjectDangerZone project={projectQuery.data} />
        </>
      )}
    </Stack>
  );
};

export const ProjectPortalSettingsRoute = () => {
  const { projectId } = useParams();
  const projectQuery = useProjectById({ projectId: projectId ?? "" });

  return (
    <Stack className="relative px-2 py-2">
      {projectQuery.isLoading && <LoadingOverlay visible />}
      {projectQuery.isError && (
        <Alert variant="outline" color="red">
          <Trans>Error loading project</Trans>
        </Alert>
      )}
      {projectQuery.data && <ProjectPortalEditor project={projectQuery.data} />}
      <Divider />
      {projectQuery.data && (
        <ProjectTranscriptSettings project={projectQuery.data} />
      )}
    </Stack>
  );
};