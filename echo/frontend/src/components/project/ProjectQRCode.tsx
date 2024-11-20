import {
  Box,
  Button,
  CopyButton,
  Group,
  Paper,
  Skeleton,
  Stack,
  Text,
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

  // map the project.language to the language code
  const languageCode = {
    en: "en-US",
    nl: "nl-NL",
    de: "de-DE",
    fr: "fr-FR",
    es: "es-ES",
    "en-US": "en-US",
    "nl-NL": "nl-NL",
    "de-DE": "de-DE",
    "fr-FR": "fr-FR",
    "es-ES": "es-ES",
  }[
    project.language as
      | "en"
      | "nl"
      | "de"
      | "fr"
      | "es"
      | "en-US"
      | "nl-NL"
      | "de-DE"
      | "fr-FR"
      | "es-ES"
  ];

  const link = `${PARTICIPANT_BASE_URL}/${languageCode}/${project.id}/start`;
  return link;
};

export const ProjectQRCode = ({ project }: ProjectQRCodeProps) => {
  const link = useProjectSharingLink(project);

  if (!link) {
    return <Skeleton height={200} />;
  }

  let canShare = false;
  try {
    if (navigator.canShare) {
      canShare = navigator.canShare({
        title: `Join the conversation on Dembrane`,
        url: link,
      });
    }
  } catch (e) {
    console.error(e);
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
            {canShare && (
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
