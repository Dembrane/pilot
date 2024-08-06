import WelcomeImage from "@/assets/participant-welcome-pattern.png";
import { Logo } from "@/components/common/Logo";
import { Markdown } from "@/components/common/Markdown";
import {
  useUploadConversationChunk,
  useUploadConversationTextChunk,
} from "@/lib/query";
import {
  ActionIcon,
  Box,
  Button,
  Container,
  Divider,
  Group,
  LoadingOverlay,
  Menu,
  Modal,
  Notification,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconCheck,
  IconDotsVertical,
  IconMicrophone,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlayerStop,
  IconQuestionMark,
  IconReload,
  IconTextCaption,
  IconTrash,
  IconUpload,
} from "@tabler/icons-react";
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useLanguage } from "@/lib/useLanguage";
import { useWakeLock } from "@/lib/useWakeLock";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Trans, t } from "@lingui/macro";
import clsx from "clsx";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteParticipantConversationChunk,
  getParticipantConversation,
  getParticipantConversationChunks,
} from "@/lib/api";

const preferredMimeTypes = ["audio/webm", "audio/wav", "video/mp4"];

const getSupportedMimeType = () => {
  for (const mimeType of preferredMimeTypes) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }
  return "audio/webm";
};

const defaultMimeType = getSupportedMimeType();

const checkPermissionError = async () => {
  try {
    // @ts-ignore
    const result = await navigator.permissions.query({ name: "microphone" });
    if (result.state === "denied") {
      return "denied" as const;
    } else if (result.state === "prompt") {
      return "prompt" as const;
    } else if (result.state === "granted") {
      return "granted" as const;
    } else {
    }
  } catch (error) {
    console.error("Error checking microphone permissions", error);
    return "error" as const;
  }
};

interface UseAudioRecorderOptions {
  onChunk: (chunk: Blob) => void;
  mimeType?: string;
  timeslice?: number;
  debug?: boolean;
}

interface UseAudioRecorderResult {
  startRecording: () => void;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  errored:
    | boolean
    | {
        message: string;
      };
  loading: boolean;
  permissionError: string | null;
}

const useChunkedAudioRecorder = ({
  onChunk,
  mimeType = defaultMimeType,
  timeslice = 30000, // 30 sec
  // timeslice = 300000, // 5 min
  debug = false,
}: UseAudioRecorderOptions): UseAudioRecorderResult => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);

  const isRecordingRef = useRef(isRecording);
  const isPausedRef = useRef(isPaused);
  const userPausedRef = useRef(userPaused);

  const [recordingTime, setRecordingTime] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startRecordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioProcessorRef = useRef<AudioWorkletNode | null>(null);

  const [permissionError, setPermissionError] = useState<string | null>(null);

  const log = (...args: any[]) => {
    if (debug) {
      console.log(...args);
    }
  };

  useEffect(() => {
    // for syncing
    isRecordingRef.current = isRecording;
    isPausedRef.current = isPaused;
    userPausedRef.current = userPaused;
  }, [isRecording, isPaused, userPaused]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const updateRecordingTime = useCallback(() => {
    setRecordingTime((prev) => prev + 1);
  }, []);

  const chunkBufferRef = useRef<Blob[]>([]);

  const startRecordingChunk = useCallback(() => {
    log("startRecordingChunk", {
      isRecording,
      mediaRecorderRefState: mediaRecorderRef.current?.state,
    });
    if (!streamRef.current) {
      log("startRecordingChunk: no stream found");
      return;
    }

    // Ensure that any previous MediaRecorder instance is stopped before creating a new one
    if (mediaRecorderRef.current) {
      log("startRecordingChunk: stopping previous MediaRecorder instance");
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    log("startRecordingChunk: creating new MediaRecorder instance");
    const recorder = new MediaRecorder(streamRef.current, {
      mimeType: MediaRecorder.isTypeSupported(mimeType)
        ? mimeType
        : "audio/webm",
    });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      log("ondataavailable", event.data.size, "bytes");
      if (event.data.size > 0) {
        chunkBufferRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      log("MediaRecorder stopped");
      onChunk(new Blob(chunkBufferRef.current, { type: mimeType }));

      startRecordingChunk();

      // flush the buffer
      chunkBufferRef.current = [];
    };

    // allow for some room to restart so all is just one chunk as per mediarec
    recorder.start(timeslice * 2);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      log("Requesting access to the microphone...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      log("Access to microphone granted.", { stream });

      log("Creating MediaRecorder instance");

      setIsRecording(true);
      setIsPaused(false);
      setUserPaused(false);
      startRecordingChunk();

      // allow to restart recording chunk
      startRecordingIntervalRef.current = setInterval(() => {
        log("Checking if MediaRecorder should be stopped");
        if (mediaRecorderRef.current?.state === "recording") {
          log("attempting to Stop recording chunk");
          mediaRecorderRef.current.stop();

          log("attempt to Restart recording chunk", {
            isRecording,
            mediaRecorderRefState: mediaRecorderRef.current?.state,
          });

          if (isRecording) {
            log("Restarting recording chunk");
            startRecordingChunk();
          }
        }
      }, timeslice);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(updateRecordingTime, 1000);
    } catch (error) {
      console.error("Error accessing audio stream", error);
      setPermissionError("Error accessing audio stream");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsPaused(false);
    setUserPaused(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setRecordingTime(0);
    if (startRecordingIntervalRef.current)
      clearInterval(startRecordingIntervalRef.current);
    // remove the worker
    audioProcessorRef.current?.disconnect();
    audioProcessorRef.current = null;
    // close the audio context
    audioContextRef.current?.close();
    audioContextRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const pauseRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  const userPauseRecording = () => {
    pauseRecording();
    setUserPaused(true);
  };

  const resumeRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "paused"
    ) {
      mediaRecorderRef.current.resume();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(updateRecordingTime, 1000);
      setIsPaused(false);
      setUserPaused(false);
    }
  };

  const userResumeRecording = () => {
    resumeRecording();
    setUserPaused(false);
  };

  return {
    startRecording,
    stopRecording,
    pauseRecording: userPauseRecording,
    resumeRecording: userResumeRecording,
    isRecording,
    isPaused,
    recordingTime,
    loading: false,
    errored: false,
    permissionError,
  };
};

const useAudioRecorder = ({
  onChunk,
  mimeType = defaultMimeType,
  // 30 sec
  // timeslice = 300000, // 5 min
  debug = false,
}: UseAudioRecorderOptions): UseAudioRecorderResult => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);

  const isRecordingRef = useRef(isRecording);
  const isPausedRef = useRef(isPaused);
  const userPausedRef = useRef(userPaused);

  const [recordingTime, setRecordingTime] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);

  const [permissionError, setPermissionError] = useState<string | null>(null);

  const log = (...args: any[]) => {
    if (debug) {
      console.log(...args);
    }
  };

  useEffect(() => {
    // for syncing
    isRecordingRef.current = isRecording;
    isPausedRef.current = isPaused;
    userPausedRef.current = userPaused;
  }, [isRecording, isPaused, userPaused]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const updateRecordingTime = useCallback(() => {
    setRecordingTime((prev) => prev + 1);
  }, []);

  const chunkBufferRef = useRef<Blob[]>([]);

  const startRecordingChunk = useCallback(() => {
    log("startRecordingChunk", {
      isRecording,
      mediaRecorderRefState: mediaRecorderRef.current?.state,
    });
    if (!streamRef.current) {
      log("startRecordingChunk: no stream found");
      return;
    }

    // Ensure that any previous MediaRecorder instance is stopped before creating a new one
    if (mediaRecorderRef.current) {
      log("startRecordingChunk: stopping previous MediaRecorder instance");
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    log("startRecordingChunk: creating new MediaRecorder instance");
    const recorder = new MediaRecorder(streamRef.current, {
      mimeType: MediaRecorder.isTypeSupported(mimeType)
        ? mimeType
        : "audio/webm",
    });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      log("ondataavailable", event.data.size, "bytes");
      if (event.data.size > 0) {
        chunkBufferRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      log("MediaRecorder stopped");
      onChunk(new Blob(chunkBufferRef.current, { type: mimeType }));
      // flush the buffer
      chunkBufferRef.current = [];
    };

    recorder.start();
  }, [isRecording]);

  const startRecording = async () => {
    try {
      log("Requesting access to the microphone...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      log("Access to microphone granted.", { stream });

      log("Creating MediaRecorder instance");
      setIsRecording(true);
      setIsPaused(false);
      setUserPaused(false);
      startRecordingChunk();

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(updateRecordingTime, 1000);
    } catch (error) {
      console.error("Error accessing audio stream", error);
      setPermissionError("Error accessing audio stream");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsPaused(false);
    setUserPaused(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setRecordingTime(0);
    // close the audio context
    audioContextRef.current?.close();
    audioContextRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const pauseRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  const userPauseRecording = () => {
    pauseRecording();
    setUserPaused(true);
  };

  const resumeRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "paused"
    ) {
      mediaRecorderRef.current.resume();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(updateRecordingTime, 1000);
      setIsPaused(false);
      setUserPaused(false);
    }
  };

  const userResumeRecording = () => {
    resumeRecording();
    setUserPaused(false);
  };

  return {
    startRecording,
    stopRecording,
    pauseRecording: userPauseRecording,
    resumeRecording: userResumeRecording,
    isRecording,
    isPaused,
    recordingTime,
    loading: false,
    errored: false,
    permissionError,
  };
};

// Common hooks
const useConversationQuery = (
  projectId: string | undefined,
  conversationId: string | undefined,
) => {
  return useQuery({
    queryKey: ["participant", "conversation", projectId, conversationId],
    queryFn: () =>
      getParticipantConversation(projectId ?? "", conversationId ?? ""),
    enabled: !!conversationId,
    refetchInterval: 30000,
  });
};

const useConversationChunksQuery = (
  projectId: string | undefined,
  conversationId: string | undefined,
) => {
  return useQuery({
    queryKey: ["participant", "conversation_chunks", conversationId],
    queryFn: () =>
      getParticipantConversationChunks(projectId ?? "", conversationId ?? ""),
    enabled: !!conversationId,
    refetchInterval: 15000,
  });
};

const ParticipantHeader = () => {
  return (
    <header className="w-full h-[64px] sticky top-0 border-b border-slate-300 py-4 bg-white z-10 shadow-sm">
      <Group justify="center" align="center" className="px-4 relative">
        <Logo hideTitle className="left-0 pl-4 absolute sm:relative" />
        <h1 className="text-xl">Dembrane</h1>
      </Group>
    </header>
  );
};

const UserChunkMessage = ({ chunk }: { chunk?: TConversationChunk }) => {
  const { projectId, conversationId } = useParams();
  const queryClient = useQueryClient();

  const deleteChunkMutation = useMutation({
    mutationFn: ({
      projectId,
      conversationId,
      chunkId,
    }: {
      projectId: string;
      conversationId: string;
      chunkId: string;
    }) =>
      deleteParticipantConversationChunk(
        projectId ?? "",
        conversationId ?? "",
        chunkId ?? "",
      ),
    onMutate: (vars) => {
      queryClient.cancelQueries({
        queryKey: ["participant", "conversation_chunks", conversationId ?? ""],
      });
      const previousValue = queryClient.getQueryData([
        "participant",
        "conversation_chunks",
        conversationId ?? "",
      ]);
      queryClient.setQueryData(
        ["participant", "conversation_chunks", conversationId ?? ""],

        (old: TConversationChunk[] | undefined) =>
          old?.filter((c) => c.id !== vars.chunkId),
      );
      return previousValue;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["participant", "conversation_chunks", conversationId ?? ""],
      });
    },
  });

  if (!chunk) return <></>;

  const handleDelete = () => {
    deleteChunkMutation.mutate({
      projectId: projectId ?? "",
      conversationId: conversationId ?? "",
      chunkId: chunk.id,
    });
  };

  return (
    <div className="flex justify-end align-center">
      <div>
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <ActionIcon variant="transparent" c="gray" className="h-full">
              <IconDotsVertical />
            </ActionIcon>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Item
              onClick={handleDelete}
              disabled={deleteChunkMutation.isPending}
              leftSection={<IconTrash />}
            >
              Delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </div>
      <Paper className="rounded-t-xl rounded-bl-xl shadow-sm p-4">
        <Text className="text-sm prose">
          {chunk.transcript == null && (
            <Markdown content={t`*Transcription in progress.*`} />
          )}
          <Markdown content={chunk.transcript ?? ""} />
        </Text>
      </Paper>
    </div>
  );
};

const UserMessage = ({ markdown }: { markdown?: string }) => {
  return (
    <div className="flex justify-end">
      <Paper className="rounded-t-xl rounded-bl-xl shadow-sm p-4">
        <Text className="text-sm prose">
          <Markdown content={markdown ?? ""} />
        </Text>
      </Paper>
    </div>
  );
};

const SystemMessage = ({ markdown }: { markdown?: string }) => {
  return (
    <div className="flex justify-start">
      <Paper
        bg="transparent"
        className="rounded-t-xl rounded-br-xl shadow-sm p-4 border border-slate-200"
      >
        <Text className="text-sm prose">
          <Markdown content={markdown ?? ""} />
        </Text>
      </Paper>
    </div>
  );
};

const ParticipantBody = ({
  conversation,
  children,
}: PropsWithChildren<{
  conversation?: TConversation;
}>) => {
  const { projectId } = useParams();
  const [ref] = useAutoAnimate();
  const [chatRef] = useAutoAnimate();
  const bottomRef = useRef<HTMLDivElement>(null);

  const chunksQuery = useConversationChunksQuery(projectId, conversation?.id);

  useEffect(() => {
    if (bottomRef.current) {
      // disable autoscroll for now
      // bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chunksQuery.data]);

  return (
    <Stack ref={ref} className="max-h-full">
      {conversation && conversation.participant_name != "" ? (
        <h2 className="text-3xl text-center">
          <Trans>Welcome</Trans>, {conversation.participant_name}
        </h2>
      ) : (
        <h2 className="text-3xl text-center">
          <Trans>Welcome</Trans>
        </h2>
      )}
      <img
        className="w-full object-contain animate-pulse duration-1000"
        src={WelcomeImage}
      />
      {conversation && (
        <Stack ref={chatRef} py="md">
          <Title order={3}>{conversation.title}</Title>

          {conversation.description && (
            <SystemMessage markdown={conversation.description} />
          )}

          <SystemMessage
            markdown={t`Please record your response by clicking the "Start Recording" button below. You may also choose to respond in text by clicking the text icon.`}
          />

          {children}

          {chunksQuery.data
            ?.sort(
              (a, b) =>
                new Date(a.timestamp).getTime() -
                new Date(b.timestamp).getTime(),
            )
            .map((chunk) => {
              return <UserChunkMessage key={chunk.id} chunk={chunk} />;
            })}

          <div
            role="presentation"
            ref={bottomRef}
            style={{ float: "left", clear: "both" }}
          ></div>
        </Stack>
      )}
    </Stack>
  );
};

export const ParticipantConversationChunkedAudioRoute = () =>
  //   {
  //   fallback = false,
  // }: {
  //   fallback?: boolean;
  // }
  {
    const { projectId, conversationId } = useParams();
    const conversationQuery = useConversationQuery(projectId, conversationId);
    const chunks = useConversationChunksQuery(projectId, conversationId);
    const uploadChunkMutation = useUploadConversationChunk();

    const onChunk = (chunk: Blob) => {
      uploadChunkMutation.mutate({
        conversationId: conversationId ?? "",
        chunk,
        timestamp: new Date(),
      });
    };

    // const audioRecorder = useVADAudioRecorder({ onChunk });
    const fallbackAudioRecorder = useChunkedAudioRecorder({ onChunk });

    useWakeLock({ obtainWakeLockOnMount: true });

    const {
      startRecording,
      stopRecording,
      isRecording,
      isPaused,
      pauseRecording,
      resumeRecording,
      recordingTime,
      errored,
      loading,
      permissionError,
    } =
      // fallback ?
      fallbackAudioRecorder;
    // : audioRecorder;

    const [troubleShootingGuideOpened, setTroubleShootingGuideOpened] =
      useState(false);

    const navigate = useNavigate();
    const { language } = useLanguage();

    const handleCheckMicrophoneAccess = async () => {
      const permissionError = await checkPermissionError();
      if (["granted", "prompt"].includes(permissionError ?? "")) {
        window.location.reload();
      } else {
        alert(
          t`Microphone access is still denied. Please check your settings and try again.`,
        );
      }
    };

    if (conversationQuery.isLoading || loading) {
      return <LoadingOverlay visible />;
    }

    const textModeUrl = `/${language}/${projectId}/conversation/${conversationId}/text`;
    const finishUrl = `/${language}/${projectId}/conversation/${conversationId}/finish`;

    const handleFinish = () => {
      if (window.confirm(t`Are you sure you want to finish?`)) {
        navigate(finishUrl);
      }
    };

    return (
      <div className="min-h-dvh flex flex-col container max-w-2xl mx-auto">
        {/* modal for permissions error */}
        <Modal
          opened={!!permissionError}
          onClose={() => true}
          centered
          fullScreen
          radius={0}
          transitionProps={{ transition: "fade", duration: 200 }}
          withCloseButton={false}
        >
          <div className="bg-white py-4 h-full rounded-md">
            <ParticipantHeader />
            <Stack className="mt-4 px-2 mx-auto container max-w-2xl" gap="lg">
              <div className="text-lg max-w-prose">
                <Trans>
                  Oops! It looks like microphone access was denied. No worries,
                  though! We've got a handy troubleshooting guide for you. Feel
                  free to check it out. Once you've resolved the issue, come
                  back and visit this page again to check if your microphone is
                  ready.
                </Trans>
              </div>

              <Button
                component="a"
                href="https://dembrane.notion.site/Troubleshooting-Microphone-Permissions-All-Languages-bd340257647742cd9cd960f94c4223bb?pvs=74"
                target="_blank"
                size={troubleShootingGuideOpened ? "lg" : "xl"}
                leftSection={<IconQuestionMark />}
                variant={!troubleShootingGuideOpened ? "filled" : "light"}
                onClick={() => setTroubleShootingGuideOpened(true)}
              >
                <Trans>Open troubleshooting guide</Trans>
              </Button>
              <Divider />
              <Button
                size={!troubleShootingGuideOpened ? "lg" : "xl"}
                leftSection={<IconReload />}
                variant={troubleShootingGuideOpened ? "filled" : "light"}
                onClick={handleCheckMicrophoneAccess}
              >
                <Trans>Check microphone access</Trans>
              </Button>
            </Stack>
          </div>
        </Modal>

        <ParticipantHeader />

        <Box className={clsx("flex-grow px-4 py-4 relative transition-all")}>
          <ParticipantBody conversation={conversationQuery.data} />
        </Box>

        {!errored && (
          <Stack className="sticky bottom-0 z-10 p-4 w-full border-t border-slate-300 bg-white shadow-sm">
            {/* Recording time indicator */}
            {isRecording && (
              <div className="w-full bg-white border-slate-300 pt-2 pb-4">
                <Group justify="center" align="center">
                  {isPaused ? (
                    <IconPlayerPause />
                  ) : (
                    <div className="animate-pulse bg-red-500 h-4 w-4 rounded-full"></div>
                  )}
                  <Text className="text-4xl">
                    {Math.floor(recordingTime / 60)
                      .toString()
                      .padStart(2, "0")}
                    :{(recordingTime % 60).toString().padStart(2, "0")}
                  </Text>
                </Group>
              </div>
            )}

            <Group justify="center">
              {!isRecording && (
                <>
                  <Group className="w-full">
                    <Button
                      size="xl"
                      rightSection={<IconMicrophone />}
                      onClick={startRecording}
                      className="flex-grow"
                    >
                      <Trans>Start Recording</Trans>
                    </Button>

                    <Link to={textModeUrl}>
                      <ActionIcon component="a" size="60" variant="outline">
                        <IconTextCaption />
                      </ActionIcon>
                    </Link>

                    {!isRecording && chunks?.data && chunks.data.length > 0 && (
                      <Button
                        size="xl"
                        onClick={handleFinish}
                        component="a"
                        variant="light"
                        rightSection={<IconCheck />}
                      >
                        Finish
                      </Button>
                    )}
                  </Group>
                </>
              )}

              {isRecording && (
                <>
                  {isPaused ? (
                    <Button
                      className="flex-1"
                      size="xl"
                      rightSection={<IconPlayerPlay size={16} />}
                      onClick={resumeRecording}
                    >
                      <Trans>Resume</Trans>
                    </Button>
                  ) : (
                    <Button
                      className="flex-1"
                      size="xl"
                      rightSection={<IconPlayerPause size={16} />}
                      onClick={pauseRecording}
                    >
                      <Trans>Pause</Trans>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="xl"
                    rightSection={<IconPlayerStop size={16} />}
                    onClick={() => {
                      stopRecording();
                    }}
                  >
                    <Trans>Stop</Trans>
                  </Button>
                </>
              )}
            </Group>
          </Stack>
        )}
      </div>
    );
  };

export const ParticipantConversationAudioRoute = ({
  isTranscriptionLive,
}: {
  isTranscriptionLive: boolean;
}) =>
  //   {
  //   fallback = false,
  // }: {
  //   fallback?: boolean;
  // }
  {
    const { projectId, conversationId } = useParams();
    const conversationQuery = useConversationQuery(projectId, conversationId);
    const chunks = useConversationChunksQuery(projectId, conversationId);
    const uploadChunkMutation = useUploadConversationChunk();

    const [uploadInProgress, updatedUploadInProgress] = useState(false);
    // Add a delay when setting back "uploadInProgress" to false
    // to avoid "flashing" effect
    useEffect(() => {
      if (uploadChunkMutation.isPending === true) {
        updatedUploadInProgress(true);
      }
      if (uploadChunkMutation.isPending === false) {
        const timer = setTimeout(() => {
          console.log("here!");
          updatedUploadInProgress(false);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }, [uploadChunkMutation.isPending]);

    const [preview, setPreview] = useState<string | null>(null);
    const blob = useRef<Blob | null>(null);

    const showPreview = false;

    const onChunk = (chunk: Blob) => {
      if (showPreview) {
        blob.current = chunk;
        const url = URL.createObjectURL(chunk);
        setPreview(url);
      } else {
        uploadChunkMutation.mutate({
          conversationId: conversationId ?? "",
          chunk,
          timestamp: new Date(),
        });
      }
    };

    // const audioRecorder = useVADAudioRecorder({ onChunk });
    const liveAudioRecorder = useChunkedAudioRecorder({ onChunk });
    const asyncAudioRecorder = useAudioRecorder({ onChunk });

    useWakeLock({ obtainWakeLockOnMount: true });

    const {
      startRecording,
      stopRecording,
      isRecording,
      isPaused,
      pauseRecording,
      resumeRecording,
      recordingTime,
      errored,
      loading,
      permissionError,
    } = isTranscriptionLive === false ? asyncAudioRecorder : liveAudioRecorder;

    const [troubleShootingGuideOpened, setTroubleShootingGuideOpened] =
      useState(false);

    const navigate = useNavigate();
    const { language } = useLanguage();

    const handleCheckMicrophoneAccess = async () => {
      const permissionError = await checkPermissionError();
      if (["granted", "prompt"].includes(permissionError ?? "")) {
        window.location.reload();
      } else {
        alert(
          t`Microphone access is still denied. Please check your settings and try again.`,
        );
      }
    };

    if (conversationQuery.isLoading || loading) {
      return <LoadingOverlay visible />;
    }

    const textModeUrl = `/${language}/${projectId}/conversation/${conversationId}/text`;
    const finishUrl = `/${language}/${projectId}/conversation/${conversationId}/finish`;

    const handleFinish = () => {
      if (window.confirm(t`Are you sure you want to finish?`)) {
        navigate(finishUrl);
      }
    };

    return (
      <div className="min-h-dvh flex flex-col container max-w-2xl mx-auto">
        {/* modal for permissions error */}
        <Modal
          opened={!!permissionError}
          onClose={() => true}
          centered
          fullScreen
          radius={0}
          transitionProps={{ transition: "fade", duration: 200 }}
          withCloseButton={false}
        >
          <div className="bg-white py-4 h-full rounded-md">
            <ParticipantHeader />
            <Stack className="mt-4 px-2 mx-auto container max-w-2xl" gap="lg">
              <div className="text-lg max-w-prose">
                <Trans>
                  Oops! It looks like microphone access was denied. No worries,
                  though! We've got a handy troubleshooting guide for you. Feel
                  free to check it out. Once you've resolved the issue, come
                  back and visit this page again to check if your microphone is
                  ready.
                </Trans>
              </div>

              <Button
                component="a"
                href="https://dembrane.notion.site/Troubleshooting-Microphone-Permissions-All-Languages-bd340257647742cd9cd960f94c4223bb?pvs=74"
                target="_blank"
                size={troubleShootingGuideOpened ? "lg" : "xl"}
                leftSection={<IconQuestionMark />}
                variant={!troubleShootingGuideOpened ? "filled" : "light"}
                onClick={() => setTroubleShootingGuideOpened(true)}
              >
                <Trans>Open troubleshooting guide</Trans>
              </Button>
              <Divider />
              <Button
                size={!troubleShootingGuideOpened ? "lg" : "xl"}
                leftSection={<IconReload />}
                variant={troubleShootingGuideOpened ? "filled" : "light"}
                onClick={handleCheckMicrophoneAccess}
              >
                <Trans>Check microphone access</Trans>
              </Button>
            </Stack>
          </div>
        </Modal>

        <ParticipantHeader />

        <Box className={clsx("flex-grow px-4 py-4 relative transition-all")}>
          <ParticipantBody conversation={conversationQuery.data} />
        </Box>

        {!errored && (
          <Stack className="sticky bottom-0 z-10 p-4 w-full border-t border-slate-300 bg-white shadow-sm">
            {/* Recording time indicator */}
            {isRecording && (
              <div className="w-full bg-white border-slate-300 pt-2 pb-4">
                <Group justify="center" align="center">
                  {isPaused ? (
                    <IconPlayerPause />
                  ) : (
                    <div className="animate-pulse bg-red-500 h-4 w-4 rounded-full"></div>
                  )}
                  <Text className="text-4xl">
                    {Math.floor(recordingTime / 60)
                      .toString()
                      .padStart(2, "0")}
                    :{(recordingTime % 60).toString().padStart(2, "0")}
                  </Text>
                </Group>
              </div>
            )}

            {uploadInProgress && (
              <Notification title={t`Upload in progress`}>
                <Trans>Please do not close your browser</Trans>
              </Notification>
            )}

            <Group justify="center">
              {!isRecording && (
                <>
                  {!preview || !blob ? (
                    <Group className="w-full">
                      <Button
                        size="xl"
                        rightSection={<IconMicrophone />}
                        onClick={startRecording}
                        className="flex-grow"
                      >
                        <Trans>Start Recording</Trans>
                      </Button>

                      <Link to={textModeUrl}>
                        <ActionIcon component="a" size="60" variant="outline">
                          <IconTextCaption />
                        </ActionIcon>
                      </Link>

                      {!isRecording &&
                        !preview &&
                        !blob.current &&
                        chunks?.data &&
                        chunks.data.length > 0 && (
                          <Button
                            size="xl"
                            onClick={handleFinish}
                            component="a"
                            variant="light"
                            rightSection={<IconCheck />}
                            disabled={uploadInProgress}
                          >
                            Finish
                          </Button>
                        )}
                    </Group>
                  ) : (
                    <Stack className="w-full">
                      <Group className="w-full">
                        <audio controls src={preview} className="flex-grow" />

                        <ActionIcon
                          variant="outline"
                          size="xl"
                          onClick={() => {
                            if (
                              window.confirm(
                                t`Are you sure you want to delete this recording?`,
                              )
                            ) {
                              setPreview(null);
                              blob.current = null;
                            }
                          }}
                        >
                          <IconTrash />
                        </ActionIcon>
                      </Group>
                      <Button
                        size="xl"
                        onClick={() => {
                          if (!blob.current) {
                            alert(t`Something went wrong. Please try again.`);
                            throw new Error("No blob found");
                          }

                          uploadChunkMutation.mutate({
                            conversationId: conversationId ?? "",
                            chunk: blob.current,
                            timestamp: new Date(),
                          });

                          setPreview(null);
                          blob.current = null;
                        }}
                        rightSection={<IconUpload />}
                      >
                        Submit
                      </Button>
                    </Stack>
                  )}
                </>
              )}

              {isRecording && (
                <>
                  {isPaused ? (
                    <Button
                      className="flex-1"
                      size="xl"
                      rightSection={<IconPlayerPlay size={16} />}
                      onClick={resumeRecording}
                    >
                      <Trans>Resume</Trans>
                    </Button>
                  ) : (
                    <Button
                      className="flex-1"
                      size="xl"
                      rightSection={<IconPlayerPause size={16} />}
                      onClick={pauseRecording}
                    >
                      <Trans>Pause</Trans>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="xl"
                    rightSection={<IconPlayerStop size={16} />}
                    onClick={() => {
                      stopRecording();
                    }}
                  >
                    <Trans>Stop</Trans>
                  </Button>
                </>
              )}
            </Group>
          </Stack>
        )}
      </div>
    );
  };

export const ParticipantConversationTextRoute = () => {
  const { projectId, conversationId } = useParams();
  const conversationQuery = useConversationQuery(projectId, conversationId);
  const chunks = useConversationChunksQuery(projectId, conversationId);
  const uploadChunkMutation = useUploadConversationTextChunk();

  const [text, setText] = useState("");

  const onChunk = () => {
    if (!text || text.trim() === "") {
      return;
    }

    uploadChunkMutation.mutate({
      conversationId: conversationId ?? "",
      timestamp: new Date(),
      content: text.trim(),
    });

    setText("");
  };

  const navigate = useNavigate();
  const { language } = useLanguage();

  const audioModeUrl = `/${language}/${projectId}/conversation/${conversationId}`;
  const finishUrl = `/${language}/${projectId}/conversation/${conversationId}/finish`;

  const handleFinish = () => {
    if (window.confirm(t`Are you sure you want to finish?`)) {
      navigate(finishUrl);
    }
  };

  if (conversationQuery.isLoading) {
    return <LoadingOverlay visible />;
  }

  return (
    <div className="min-h-dvh flex flex-col container max-w-2xl mx-auto">
      <ParticipantHeader />

      <Box className={clsx("flex-grow px-4 py-4 relative transition-all")}>
        <ParticipantBody
          conversation={conversationQuery.data}
        ></ParticipantBody>
      </Box>

      <Stack className="sticky bottom-0 z-10 p-4 w-full border-t border-slate-300 bg-white shadow-sm">
        <textarea
          className="w-full h-32 p-4 border border-slate-300 rounded-md"
          placeholder={t`Type your response here`}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Group className="w-full">
          <Button
            size="xl"
            rightSection={<IconUpload />}
            onClick={onChunk}
            loading={uploadChunkMutation.isPending}
            className="flex-grow"
          >
            <Trans>Submit</Trans>
          </Button>
          <Link to={audioModeUrl}>
            <ActionIcon component="a" variant="outline" size="60">
              <IconMicrophone />
            </ActionIcon>
          </Link>
          {text.trim() == "" && chunks.data && chunks.data.length > 0 && (
            <Button
              size="xl"
              onClick={handleFinish}
              component="a"
              variant="light"
              rightSection={<IconCheck />}
            >
              Finish
            </Button>
          )}
        </Group>
      </Stack>
    </div>
  );
};
