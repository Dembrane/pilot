import { BaseMessage } from "@/components/BaseMessage";
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
  const [downloadWithTimestamps, setDownloadWithTimestamps] = useState(false);
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
        <Group justify="space-between">
          <Group>
            {" "}
            <Title order={2}>
              <Trans>Transcript</Trans>
            </Title>
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

          <Switch
            checked={showAudioPlayer}
            onChange={(event) =>
              setShowAudioPlayer(event.currentTarget.checked)
            }
            label={t`Show audio player`}
          />
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
            <Checkbox
              label={t`Include timestamps`}
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
              <Trans>Download</Trans>
            </Button>
          </Stack>
        </Modal>
        <Stack>
          {sorted?.length === 0 && (
            <Text size="md">
              <Trans>No transcript available for this conversation.</Trans>
            </Text>
          )}
          {sorted
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
