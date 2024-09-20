import ProjectBasicEdit from "@/components/project/ProjectBasicEdit";
import { ProjectEdit } from "@/components/project/ProjectEdit";
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

export const ProjectSettings = () => {
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
    </Stack>
  );
};

export const ProjectPortalEditor = () => {
  return <Stack className="relative px-2 py-2">Project Portal Editor</Stack>;
};

export const ProjectTranscriptSettings = () => {
  return (
    <Stack className="relative px-2 py-2">Project Transcript Settings</Stack>
  );
};
