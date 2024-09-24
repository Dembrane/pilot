import {
  Box,
  Button,
  CopyButton,
  Group,
  LoadingOverlay,
  Paper,
  Skeleton,
  Stack,
  Text,
  Tooltip,
  rem,
} from "@mantine/core";
import { IconCheck, IconCopy, IconShare } from "@tabler/icons-react";
import { QRCode } from "../common/QRCode";
import { PARTICIPANT_BASE_URL } from "@/config";

interface ProjectQRCodeProps {
  project?: Project;
}

export const useProjectSharingLink = (project?: Project) => {
  if (!project) {
    return null;
  }
  const link = `${PARTICIPANT_BASE_URL}/${project.language}/${project.id}/login?pin=${project.pin}&transcription=live`;
  return link;
};

export const ProjectQRCode = ({ project }: ProjectQRCodeProps) => {
  const link = useProjectSharingLink(project);

  if (!link) {
    return <Skeleton height={200} />;
  }

  return (
    <Paper
      p="md"
      className="relative flex h-full flex-col items-center justify-center"
    >
      {project?.is_conversation_allowed ? (
        <Group wrap="nowrap">
          <Box className="h-auto w-full max-w-[300px] rounded-lg bg-white md:max-w-[160px]">
            <QRCode value={link} />
          </Box>
          <Stack gap="sm">
            {navigator.canShare({
              title: `Join ${project.default_conversation_title} on Dembrane`,
              url: link,
            }) && (
              <Button
                rightSection={<IconShare style={{ width: rem(16) }} />}
                variant="outline"
                onClick={async () => {
                  await navigator.share({
                    title: `Join ${project?.default_conversation_title} on Dembrane`,
                    url: link,
                  });
                }}
              >
                Share
              </Button>
            )}{" "}
            <CopyButton value={link} timeout={2000}>
              {({ copied, copy }) => (
                <Button
                  variant="outline"
                  onClick={copy}
                  rightSection={
                    copied ? (
                      <IconCheck style={{ width: rem(16) }} />
                    ) : (
                      <IconCopy style={{ width: rem(16) }} />
                    )
                  }
                >
                  {copied ? "Copied" : "Copy link"}
                </Button>
              )}
            </CopyButton>
          </Stack>
        </Group>
      ) : (
        <Text size="sm">Please enable participation to enable sharing</Text>
      )}
    </Paper>
  );
};
