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
import { Trans, t } from "@lingui/macro";

interface ProjectQRCodeProps {
  project?: Project;
}

export const useProjectSharingLink = (project?: Project) => {
  if (!project) {
    return null;
  }

  const languageCode = {
    en: "en-US",
    nl: "nl-NL",
  }[project.language as "en" | "nl"];

  const link = `${PARTICIPANT_BASE_URL}/${languageCode}/${project.id}/start`;
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
                    title: t`Join ${project?.default_conversation_title} on Dembrane`,
                    url: link,
                  });
                }}
              >
                <Trans>Share</Trans>
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
                  {copied ? t`Copied` : t`Copy link`}
                </Button>
              )}
            </CopyButton>
          </Stack>
        </Group>
      ) : (
        <Text size="sm">
          <Trans>Please enable participation to enable sharing</Trans>
        </Text>
      )}
    </Paper>
  );
};
