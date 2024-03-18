import {
  Anchor,
  Box,
  Button,
  Container,
  Divider,
  Group,
  LoadingOverlay,
  Paper,
  Stack,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import {
  useAllSessions,
  useCurrentSession,
  useInitiateSessionById,
} from "../../lib/query";
import { format } from "date-fns";
import { IconPlus } from "@tabler/icons-react";
import { Trans, t } from "@lingui/macro";
import clsx from "clsx";
import { Link } from "react-router-dom";

const SessionCard = ({
  session,
  isCurrentSession,
}: {
  session: TSession;
  isCurrentSession: boolean;
}) => {
  const initiateSessionByIdMutation = useInitiateSessionById();

  const handleInitiateSession = () => {
    initiateSessionByIdMutation.mutate(session.id);
  };

  // Format the created_at date
  const formatDate = (date: Date) => {
    return format(date, "do MMMM, yyyy p");
  };

  return (
    <Paper
      component="button"
      onClick={handleInitiateSession}
      className={clsx(
        `text-left p-4 border-2 w-full`,
        isCurrentSession && "border-primary-500",
        "hover:border-primary-400",
      )}
    >
      <LoadingOverlay visible={initiateSessionByIdMutation.isPending} />
      <Stack gap="xs" className="flex-1">
        <Group>
          <div className="text-sm font-medium">ID: {session.id}</div>
        </Group>
        <div className="text-xs">{formatDate(session.created_at)}</div>
      </Stack>
    </Paper>
  );
};

export const SelectSession = () => {
  const allSessionsQuery = useAllSessions();
  const currentSessionQuery = useCurrentSession();
  const initiateSessionByIdMutation = useInitiateSessionById();

  if (allSessionsQuery.isLoading) {
    return (
      <div className="h-full">
        <LoadingOverlay visible />
      </div>
    );
  }

  const handleCreateNewSession = () => {
    initiateSessionByIdMutation.mutate("new");
  };

  return (
    <Container>
      <Stack className="h-full">
        <Group justify="space-between">
          <Title order={1}>
            <Trans>Login with Session</Trans>
          </Title>
          <Tooltip label={t`Create a new session`}>
            <Button
              loading={initiateSessionByIdMutation.isPending}
              onClick={handleCreateNewSession}
              variant="outline"
              rightSection={<IconPlus size="16" />}
            >
              Create
            </Button>
          </Tooltip>
        </Group>
        <Box>
          <LoadingOverlay visible={currentSessionQuery.isLoading} />
          {currentSessionQuery.data ? (
            <Text>
              Currently logged in as{" "}
              <strong className="pr-2">
                ID: {currentSessionQuery.data?.id}
              </strong>
              <Link to="/projects/home">
                <Anchor>Click here to continue</Anchor>
              </Link>
            </Text>
          ) : (
            <Text>Currently not logged in</Text>
          )}
        </Box>
        <Divider />
        <div className="grid grid-cols-12 gap-4">
          {allSessionsQuery.data &&
            allSessionsQuery.data.length > 0 &&
            allSessionsQuery.data.map((session) => (
              <div
                key={session.id}
                className="col-span-12 md:col-span-6 lg:col-span-4"
              >
                <SessionCard
                  session={session}
                  key={session.id}
                  isCurrentSession={
                    currentSessionQuery.data?.id === session.id || false
                  }
                />
              </div>
            ))}
        </div>
      </Stack>
    </Container>
  );
};
