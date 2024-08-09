import { ChatContextProgress } from "@/components/chat/ChatContextProgress";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { useProjectById } from "@/lib/query";
import {
  Box,
  Stack,
  Title,
  Text,
  Divider,
  Textarea,
  Group,
  Button,
} from "@mantine/core";
import { useDocumentTitle } from "@mantine/hooks";
import { IconSend } from "@tabler/icons-react";
import { useState } from "react";
import { useParams } from "react-router-dom";

export const ProjectChatRoute = () => {
  useDocumentTitle("Chat | Dembrane");

  const { projectId } = useParams();

  const projectQuery = useProjectById({
    projectId: projectId ?? "",
    query: {
      fields: ["id", "name"],
    },
  });

  const [value, setValue] = useState("");

  const sendMessage = () => {
    if (value.trim() === "") {
      return;
    }

    alert("Send message");
  };

  if (projectQuery.isLoading) {
    return <div>Loading...</div>;
  }

  if (projectQuery.isError || !projectQuery.data) {
    return <div>Project not found</div>;
  }

  return (
    <Stack className="relative flex min-h-full flex-col px-2 pr-4">
      {/* Header */}
      <Stack className="top-0 w-full bg-white pt-6 lg:sticky">
        <Title order={1}>Chat</Title>
        <Divider />
      </Stack>
      {/* Body */}
      <Box className="flex-grow">
        <Stack py="sm" className="h-full w-full">
          <ChatMessage>
            Welcome to Dembrane Chat! Please use the sidebar to select resources
            and coversations that you want to analyse
          </ChatMessage>
          <ChatMessage fromUser>Hi there!</ChatMessage>
        </Stack>
      </Box>
      {/* Footer */}
      <Box className="bottom-0 w-full border-t bg-white py-4 lg:sticky">
        <Stack>
          <Box className="flex-grow">
            <ChatContextProgress />
          </Box>
          <Group>
            <Textarea
              placeholder="Type a message..."
              minRows={3}
              autosize
              value={value}
              onChange={(e) => {
                setValue(e.currentTarget.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }

                if (e.key === "Enter" && e.shiftKey) {
                  setValue((prev) => prev + "\n");
                  e.preventDefault();
                  return false;
                }

                return true;
              }}
              className="grow"
            />
            {value.trim() !== "" && (
              <Button
                variant="primary"
                rightSection={<IconSend size={14} />}
                onClick={sendMessage}
              >
                Send
              </Button>
            )}
          </Group>

          <Group align="center" className="w-full" justify="center">
            <Button variant="outline" className="flex-grow">
              Templates
            </Button>
            <Button variant="outline" className="flex-grow">
              Context
            </Button>
          </Group>
        </Stack>
      </Box>
    </Stack>
  );
};
