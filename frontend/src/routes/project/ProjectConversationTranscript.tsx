import { BaseMessage } from "@/components/BaseMessage";
import { apiCommonConfig, getConversationChunkContentLink } from "@/lib/api";
import { useConversationById, useConversationChunks } from "@/lib/query";
import {
  ActionIcon,
  Box,
  Group,
  LoadingOverlay,
  Paper,
  Text,
  Stack,
  Tooltip,
  Skeleton,
  Title,
  Divider,
  Modal,
  Button,
  Checkbox,
  TextInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconDownload } from "@tabler/icons-react";
import { useState } from "react";
import { useParams } from "react-router-dom";

const Chunk = ({ chunk }: { chunk: TConversationChunk }) => {
  const src = getConversationChunkContentLink(chunk.conversation_id, chunk.id);
  return (
    <BaseMessage
      title={"Speaker"}
      rightSection={
        <span className="text-sm">
          {new Date(chunk.timestamp).toLocaleTimeString()}
        </span>
      }
      bottomSection={
        <>
          <Divider />
          <audio
            src={src}
            className="w-full h-6 p-0"
            crossOrigin="anonymous"
            preload="metadata"
            controls
          />
        </>
      }
    >
      {chunk.processing_error ? (
        <p className="text-red-500">Transcription error</p>
      ) : chunk.processing_status === "PROCESSING" ? (
        <LoadingOverlay visible />
      ) : (
        <Text>{chunk.transcript}</Text>
      )}
    </BaseMessage>
  );
};

export const ProjectConversationTranscript = () => {
  const { conversationId } = useParams();
  const conversationQuery = useConversationById(conversationId ?? "");
  const conversationChunksQuery = useConversationChunks(conversationId ?? "");

  const [opened, { open, close }] = useDisclosure(false);
  const [downloadWithTimestamps, setDownloadWithTimestamps] = useState(false);
  const [filename, setFilename] = useState("");

  if (conversationChunksQuery.isLoading) {
    return (
      <Stack>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={200} />
        ))}
      </Stack>
    );
  }

  const sorted = conversationChunksQuery.data?.sort((a, b) => {
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });

  const handleDownloadTranscript = (
    includeTimestamps: boolean,
    filename: string,
  ) => {
    let text: string[];

    if (includeTimestamps) {
      text = sorted?.map((v) => `${v.timestamp}: ${v.transcript}\n`) ?? [""];
    } else {
      text = sorted?.map((v) => `${v.transcript}\n`) ?? [""];
    }

    const blob = new Blob(text, { type: "text/markdown" });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    if (conversationQuery.data) {
      if (filename != "") {
        a.download = filename;
      } else {
        a.download =
          conversationQuery.data.title ??
          "Conversation" +
            "-" +
            conversationQuery.data.participant_email +
            ".md";
      }
    }

    a.click();

    window.URL.revokeObjectURL(url);
  };

  return (
    <Stack>
      <Stack>
        <Group>
          <Title order={2}>Transcript</Title>
          <Tooltip label="Download transcript">
            <ActionIcon onClick={open} size="md" variant="subtle" color="gray">
              <IconDownload size={48} />
            </ActionIcon>
          </Tooltip>
          <Modal
            opened={opened}
            onClose={close}
            title="Download Transcript Options"
          >
            <Stack>
              <TextInput
                label="Custom Filename"
                placeholder="ConversationTitle-Email.md"
                value={filename}
                onChange={(event) => setFilename(event.currentTarget.value)}
              />
              <Checkbox
                label="Include timestamps"
                checked={downloadWithTimestamps}
                onChange={(event) =>
                  setDownloadWithTimestamps(event.currentTarget.checked)
                }
              />
              <Button
                onClick={() => {
                  handleDownloadTranscript(downloadWithTimestamps, filename);
                  close();
                }}
                rightSection={<IconDownload />}
              >
                Download
              </Button>
            </Stack>
          </Modal>
        </Group>
        <Stack>
          {sorted?.map((chunk) => {
            return <Chunk key={chunk.id} chunk={chunk} />;
          })}
        </Stack>
      </Stack>
    </Stack>
  );
};
