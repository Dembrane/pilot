import { I18nLink } from "@/components/common/i18nLink";
import { Logo } from "@/components/common/Logo";
import { Markdown } from "@/components/common/Markdown";
import { PARTICIPANT_BASE_URL } from "@/config";
import { getParticipantProjectById } from "@/lib/api";
import { useParticipantProjectById } from "@/lib/participantQuery";
import { useProjectById } from "@/lib/query";
import { useLanguage } from "@/lib/useLanguage";
import { Trans } from "@lingui/macro";
import {
  Box,
  Button,
  Divider,
  Group,
  LoadingOverlay,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";

export const ParticipantPostConversation = () => {
  const { projectId, conversationId } = useParams();
  const project = useParticipantProjectById(projectId ?? "");

  const initiateLink = `/${projectId}/start`;

  const variables = {
    "{{CONVERSATION_ID}}": conversationId ?? "null",
    "{{PROJECT_ID}}": projectId ?? "null",
  };

  const text =
    project.data?.default_conversation_finish_text?.replace(
      /{{CONVERSATION_ID}}|{{PROJECT_ID}}/g,
      // @ts-ignore
      (match) => variables[match],
    ) ?? null;

  return (
    <div className="container mx-auto h-full max-w-2xl">
      <Stack className="mt-[64px] px-4 py-8">
        {!!text && text != "" ? (
          <>
            <Markdown content={text} />
            <Divider />
          </>
        ) : (
          <Title order={2}>
            <Trans>Thank you for participating!</Trans>
          </Title>
        )}
        <Text size="lg">
          <Trans>
            Your response has been recorded. You may now close this tab.
          </Trans>{" "}
          <Trans>You may also choose to record another conversation.</Trans>
        </Text>
        <Box className="relative">
          <LoadingOverlay visible={project.isLoading} />
          <I18nLink to={initiateLink}>
            <Button component="a" size="md" variant="outline">
              <Trans>Record another conversation</Trans>
            </Button>
          </I18nLink>
        </Box>
      </Stack>
    </div>
  );
};
