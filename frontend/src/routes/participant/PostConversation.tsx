import { Logo } from "@/components/Logo";
import { PARTICIPANT_BASE_URL } from "@/config";
import { useProjectById } from "@/lib/query";
import { useLanguage } from "@/lib/useLanguage";
import { Trans } from "@lingui/macro";
import {
  Anchor,
  Group,
  LoadingOverlay,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { Link, useParams } from "react-router-dom";

export const ParticipantPostConversation = () => {
  const { projectId } = useParams();
  const project = useProjectById(projectId ?? "");

  const { language } = useLanguage();

  const initiateLink =
    PARTICIPANT_BASE_URL +
    `/${language}/${projectId}/login?pin=${project?.data?.pin}`;

  return (
    <div className="h-dvh min-h-[100vh] container max-w-2xl">
      <header className="fixed left-0 w-full top-0 h-[64px] border-b border-slate-300 py-4 bg-white z-10">
        <Group justify="center" align="center" className="px-4 relative">
          <Logo hideTitle className="left-0 pl-4 absolute sm:relative" />
          <h1 className="text-xl">Dembrane</h1>
        </Group>
      </header>
      <Stack className="mt-[64px] py-8 px-4 relative">
        <LoadingOverlay visible={project.isLoading} />
        <Title order={2}>
          <Trans>Thank you for participating!</Trans>
        </Title>
        <Text size="lg">
          <Trans>
            Your response has been recorded. You may now close this tab.
          </Trans>{" "}
          <Link to={initiateLink}>
            <Anchor>
              <Trans>You may also choose to record another conversation.</Trans>
            </Anchor>
          </Link>
        </Text>
      </Stack>
    </div>
  );
};
