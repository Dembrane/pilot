import { Logo } from "@/components/common/Logo";
import { Markdown } from "@/components/common/Markdown";
import { PARTICIPANT_BASE_URL } from "@/config";
import { getParticipantProjectById } from "@/lib/api";
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
  const project = useQuery({
    queryKey: ["participant", "project", projectId],
    queryFn: () => getParticipantProjectById(projectId as string),
    enabled: !!projectId,
  });

  const { language } = useLanguage();

  const initiateLink =
    PARTICIPANT_BASE_URL +
    `/${language}/${projectId}/login?pin=${project?.data?.pin}`;

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
    <div className="container max-w-2xl mx-auto">
      <header className="fixed left-0 w-full top-0 h-[64px] border-b border-slate-300 py-4 bg-white z-10">
        <Group justify="center" align="center" className="px-4 relative">
          <Logo hideTitle className="left-0 pl-4 absolute sm:relative" />
          <h1 className="text-xl">Dembrane</h1>
        </Group>
      </header>
      <Stack className="mt-[64px] py-8 px-4">
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
          <Link to={initiateLink}>
            <Button component="a" size="md" variant="outline">
              <Trans>Record another conversation</Trans>
            </Button>
          </Link>
        </Box>
      </Stack>
    </div>
  );
};
