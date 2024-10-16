import ProjectBasicEdit from "@/components/project/ProjectBasicEdit";
import { ProjectDangerZone } from "@/components/project/ProjectDangerZone";
import { ProjectEdit } from "@/components/project/ProjectEdit";
import { ProjectPortalEditor } from "@/components/project/ProjectPortalEditor";
import { ProjectTranscriptSettings } from "@/components/project/ProjectTranscriptSettings";
import { getProjectTranscriptsLink } from "@/lib/api";
import { useProjectById } from "@/lib/query";
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
          Error loading project
        </Alert>
      )}
      {projectQuery.data && <ProjectBasicEdit project={projectQuery.data} />}

      {projectQuery.data && (
        <>
          <Divider />
          <Title order={2}>Export</Title>
          <Box>
            <Button
              component="a"
              href={getProjectTranscriptsLink(projectId ?? "")}
              download={`${projectQuery.data.name ?? "Project"}-Transcripts.zip`}
              rightSection={<IconDownload />}
              variant="outline"
            >
              Download All Transcripts
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
          Error loading project
        </Alert>
      )}
      {projectQuery.data && <ProjectPortalEditor project={projectQuery.data} />}
    </Stack>
  );
};

export const ProjectTranscriptSettingsRoute = () => {
  const { projectId } = useParams();
  const projectQuery = useProjectById({ projectId: projectId ?? "" });

  return (
    <Stack className="relative px-2 py-2">
      {projectQuery.isLoading && <LoadingOverlay visible />}
      {projectQuery.isError && (
        <Alert variant="outline" color="red">
          Error loading project
        </Alert>
      )}
      {projectQuery.data && (
        <ProjectTranscriptSettings project={projectQuery.data} />
      )}
    </Stack>
  );
};
