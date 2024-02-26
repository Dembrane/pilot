import {
  Button,
  Group,
  LoadingOverlay,
  Stack,
  Title,
  Tooltip,
} from "@mantine/core";
import {
  useAllSessions,
  useCurrentSession,
  useInitiateSessionById,
} from "../lib/query";
import { format } from "date-fns";
import { IconPlus } from "@tabler/icons-react";

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

  // Helper function to truncate context string
  const truncateString = (str?: string, num: number = 100) => {
    if (!str) {
      return "";
    }
    if (str.length <= num) {
      return str;
    }
    return str.slice(0, num) + "...";
  };

  // Format the created_at date
  const formatDate = (date: Date) => {
    return format(date, "do MMMM, yyyy p");
  };

  return (
    <button
      className={`h-full w-full shadow-lg flex flex-col justify-between text-center p-4 rounded-lg transition duration-150 ease-in-out transform hover:-translate-y-1 hover:shadow-xl ${
        isCurrentSession ? "bg-blue-50 border-blue-500" : "bg-white"
      } border-2 cursor-pointer`}
      onClick={handleInitiateSession}
    >
      <LoadingOverlay visible={initiateSessionByIdMutation.isPending} />
      <Stack className="text-left" align="start" gap="xs">
        <div className="text-xs text-gray-500 font-medium">
          ID: {session.id} | Docs: {session.documents_count}
        </div>
        <div className="text-xs text-gray-500">
          {formatDate(session.created_at)}
        </div>

        <div className="text-gray-600 text-xs whitespace-pre-line text-left">
          <span>{truncateString(session.context, 100)}</span>
        </div>
      </Stack>
    </button>
  );
};

export const SelectSessionRoute = () => {
  const allSessionsQuery = useAllSessions();
  const currentSessionQuery = useCurrentSession();
  const initiateSessionByIdMutation = useInitiateSessionById();

  if (allSessionsQuery.isLoading || currentSessionQuery.isLoading) {
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
    <Stack className="h-full p-2">
      <Group justify="space-between">
        <Title order={1}>Select Session</Title>
        <Tooltip label="Create a new session">
          {/* <ActionIcon onClick={handleCreateNewSession}>
            <IconPlus color="black" />
          </ActionIcon> */}
          <Button
            loading={initiateSessionByIdMutation.isPending}
            onClick={handleCreateNewSession}
            c="white"
            bg="blue"
            variant="filled"
            rightSection={<IconPlus size="16" />}
          >
            Create
          </Button>
        </Tooltip>
      </Group>
      <div className="container p-2">
        <div className="grid grid-cols-12 gap-4">
          {allSessionsQuery.data &&
            allSessionsQuery.data.length > 0 &&
            allSessionsQuery.data.map((session) => (
              <div key={session.id} className="col-span-6 lg:col-span-4">
                <SessionCard
                  session={session}
                  key={session.id}
                  isCurrentSession={currentSessionQuery.data?.id === session.id}
                />
              </div>
            ))}
        </div>
      </div>
    </Stack>
  );
};
