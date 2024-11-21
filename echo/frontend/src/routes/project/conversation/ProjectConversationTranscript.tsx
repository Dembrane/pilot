import { BaseMessage } from "@/components/BaseMessage";
import { InformationTooltip } from "@/components/common/InformationTooltip";
import { getConversationChunkContentLink } from "@/lib/api";
import {
  useConversationById,
  useConversationChunks,
  useConversationTranscriptString,
} from "@/lib/query";
import { Trans, t } from "@lingui/macro";
import {
  ActionIcon,
  Group,
  // LoadingOverlay,
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
  CopyButton,
  Switch,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconCheck, IconCopy, IconDownload } from "@tabler/icons-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import useSessionStorageState from "use-session-storage-state";

const Chunk = ({
  chunk,
  showAudioPlayer = true,
}: {
  chunk: ConversationChunk;
  showAudioPlayer?: boolean;
}) => {
  const src = getConversationChunkContentLink(
    chunk.conversation_id as string,
    chunk.id,
  );
  return (
    <BaseMessage
      title={t`Speaker`}
      rightSection={
        <span className="text-sm">
          {new Date(chunk.timestamp).toLocaleTimeString()}
        </span>
      }
      bottomSection={
        showAudioPlayer ? (
          <>
            <Divider />
            <audio
              src={src}
              className="h-6 w-full p-0"
              crossOrigin="anonymous"
              preload="metadata"
              controls
            />
          </>
        ) : (
          <> </>
        )
      }
    >
      {/* {chunk.processing_error ? (
        <p className="text-red-500">Transcription error</p>
      ) : chunk.processing_status === "PROCESSING" ? (
        <LoadingOverlay visible />
      ) : ( */}
      <Text>{chunk.transcript ?? ""}</Text>
      {/* )} */}
    </BaseMessage>
  );
};

export const ProjectConversationTranscript = () => {
  const { conversationId } = useParams();
  const conversationQuery = useConversationById({
    conversationId: conversationId ?? "",
    loadConversationChunks: true,
  });
  const conversationChunksQuery = useConversationChunks(conversationId ?? "");
  const transcriptQuery = useConversationTranscriptString(conversationId ?? "");

  const [opened, { open, close }] = useDisclosure(false);
  const [filename, setFilename] = useState("");

  const [showAudioPlayer, setShowAudioPlayer] = useSessionStorageState<boolean>(
    "conversation-transcript-show-audio-player",
    {
      defaultValue: false,
    },
  );

  if (conversationChunksQuery.isLoading) {
    return (
      <Stack>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={200} />
        ))}
      </Stack>
    );
  }

  const handleDownloadTranscript = (filename: string) => {
    const text = transcriptQuery.data ?? "";
    const blob = new Blob([text], { type: "text/markdown" });

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

  // Add function to check if conversation is older than 30 days
  const isAudioExpired = () => {
    if (!conversationQuery.data?.created_at) return false;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(conversationQuery.data.created_at) < thirtyDaysAgo;
  };

  return (
    <Stack>
      <Stack>
        <Group justify="space-between">
          <Group>
            {" "}
            <Title order={2}>
              <Trans>Transcript</Trans>
            </Title>
            {/* open the download modal */}
            <Tooltip label={t`Download transcript`}>
              <ActionIcon
                onClick={open}
                size="md"
                variant="subtle"
                color="gray"
              >
                <IconDownload size={48} />
              </ActionIcon>
            </Tooltip>
            <CopyButton value={transcriptQuery.data ?? ""}>
              {({ copied, copy }) => (
                <Tooltip label={t`Copy transcript`}>
                  <ActionIcon
                    size="md"
                    variant="subtle"
                    color="gray"
                    loading={transcriptQuery.isLoading}
                    onClick={copy}
                  >
                    {!copied ? <IconCopy size={48} /> : <IconCheck size={48} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Group>

          <Group>
            <Switch
              checked={showAudioPlayer}
              onChange={(event) =>
                setShowAudioPlayer(event.currentTarget.checked)
              }
              label={t`Show audio player`}
              disabled={isAudioExpired()}
            />
            <InformationTooltip
              label={t`Audio recordings are scheduled to be deleted after 30 days from the recording date`}
            />
          </Group>
        </Group>

        <Modal
          opened={opened}
          onClose={close}
          title={t`Download Transcript Options`}
        >
          <Stack>
            <TextInput
              label={t`Custom Filename`}
              placeholder="ConversationTitle-Email.md"
              value={filename}
              onChange={(event) => setFilename(event.currentTarget.value)}
            />
            <Button
              onClick={() => {
                handleDownloadTranscript(filename);
                close();
              }}
              rightSection={<IconDownload />}
            >
              <Trans>Download</Trans>
            </Button>
          </Stack>
        </Modal>

        <Stack>
          {conversationChunksQuery.data?.length === 0 && (
            <Text size="md">
              <Trans>No transcript available for this conversation.</Trans>
            </Text>
          )}
          {conversationChunksQuery.data
            ?.filter(
              (chunk) =>
                !!chunk.transcript && chunk.transcript.trim().length > 0,
            )
            .map((chunk) => {
              return (
                <Chunk
                  key={chunk.id}
                  chunk={chunk}
                  showAudioPlayer={showAudioPlayer}
                />
              );
            })}
        </Stack>
      </Stack>
    </Stack>
  );
};
