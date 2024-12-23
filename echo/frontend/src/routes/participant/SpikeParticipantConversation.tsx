import WelcomeImage from "@/assets/participant-welcome-pattern.png";
import { Logo } from "@/components/common/Logo";
import { Markdown } from "@/components/common/Markdown";
import { useI18nNavigate } from "@/lib/useI18nNavigate";
import { I18nLink } from "@/components/common/i18nLink";
import {
  useGetConversationReplyMutation,
  useSpikeMessages,
  useUploadConversationChunk,
  useGetRelatedObjectsMutation,
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
  Slider,
  Skeleton,
  Badge,
  Pill,
  Tooltip,
} from "@mantine/core";
import {
  IconCheck,
  IconDotsVertical,
  IconLink,
  IconMicrophone,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlayerStop,
  IconQuestionMark,
  IconReload,
  IconTextCaption,
  IconTrash,
  IconTrendingUp,
  IconUpload,
} from "@tabler/icons-react";
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useLanguage } from "@/lib/useLanguage";
import { useWakeLock } from "@/lib/useWakeLock";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import clsx from "clsx";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteParticipantConversationChunk,
  getParticipantConversation,
  getParticipantConversationChunks,
} from "@/lib/api";
import { useParticipantProjectById } from "@/lib/participantQuery";
import { useDisclosure } from "@mantine/hooks";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { directus } from "@/lib/directus";
import { createItem, readItem, readItems, updateItem } from "@directus/sdk";
import { InformationTooltip } from "@/components/common/InformationTooltip";

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
    // @ts-expect-error microphone is not strictly typed
    const result = await navigator.permissions.query({ name: "microphone" });
    if (result.state === "denied") {
      return "denied" as const;
    } else if (result.state === "prompt") {
      return "prompt" as const;
    } else if (result.state === "granted") {
      return "granted" as const;
    } else {
      return "error" as const;
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

    // Stop any previous MediaRecorder instance
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

    recorder.start(timeslice * 2);
  }, [isRecording, mimeType, onChunk, timeslice, log]);

  const startRecording = async () => {
    try {
      log("Requesting access to the microphone...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      log("Access to microphone granted.", { stream });

      setIsRecording(true);
      setIsPaused(false);
      setUserPaused(false);
      startRecordingChunk();

      startRecordingIntervalRef.current = setInterval(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
          if (isRecording) {
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

    audioProcessorRef.current?.disconnect();
    audioProcessorRef.current = null;
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
    <header className="sticky top-0 z-10 h-[64px] w-full border-b border-slate-300 bg-white py-4 shadow-sm">
      <Group justify="center" align="center" className="relative px-4">
        <Logo hideTitle className="absolute left-0 pl-4 sm:relative" />
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

  return (
    <div className="align-center flex justify-end">
      <Paper className="rounded-t-xl rounded-bl-xl border border-blue-300 bg-blue-100/50 p-4 shadow-sm">
        <Text className="prose text-sm">
          {chunk.transcript == null && (
            <Markdown content={t`*Transcription in progress.*`} />
          )}
          <Markdown content={chunk.transcript ?? ""} />

          <Text className="text-xs italic text-gray-800">
            This transcript may be displayed incorrectly at times.
          </Text>
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
        className="rounded-t-xl rounded-br-xl border border-slate-200 p-4 shadow-sm"
      >
        <Text className="prose text-sm">
          <Markdown content={markdown ?? ""} />
        </Text>
      </Paper>
    </div>
  );
};

/**
 * A subcomponent to let user rate related objects in a simple manner.
 * Focused on a streamlined, accessible UX.
 */
function RelatedObjectItem({
  objectData,
  chatId,
}: {
  objectData: any;
  chatId: number;
}) {
  const [value, setValue] = useState<number | null>(4);
  const [previousVote, setPreviousVote] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [userHasRated, setUserHasRated] = useState(false);

  const queryClient = useQueryClient();

  const objectVoteMutation = useMutation({
    mutationFn: async (val: number) => {
      // Check if there's an existing rating for the given object in this chat
      const existingRating = await directus.request(
        readItems("spike_object_rating", {
          filter: {
            spike_chat_id: chatId,
            spike_object_id: objectData.id,
          },
        }),
      );

      if (existingRating.length > 0) {
        return directus.request(
          updateItem("spike_object_rating", existingRating[0].id, {
            value: val,
          }),
        );
      }

      return directus.request(
        createItem("spike_object_rating", {
          value: val,
          spike_chat_id: chatId,
          spike_object_id: objectData.id,
        }),
      );
    },
    onSuccess: () => {
      setUserHasRated(true);
      // relevant invalidations if needed
      queryClient.invalidateQueries({
        queryKey: ["spike_object", objectData.id],
      });
    },
  });

  // Check if the user previously rated this in the chat
  useEffect(() => {
    const fetchRating = async () => {
      try {
        const data = await directus.request(
          readItems("spike_object_rating", {
            filter: {
              spike_chat_id: chatId,
              spike_object_id: objectData.id,
            },
          }),
        );
        if (data.length > 0 && data[0].value != null) {
          setValue(data[0].value);
          setPreviousVote(data[0].value);
          setUserHasRated(true);
        }
      } catch (error) {
        console.error(
          "Error fetching rating for related object",
          objectData.id,
          error,
        );
      }
    };
    fetchRating();
  }, [objectData.id, chatId]);

  const marks = [
    { value: 0, label: t`Not at all` },
    { value: 2, label: t`Slightly` },
    { value: 4, label: t`Moderately` },
    { value: 6, label: t`Very` },
    { value: 8, label: t`Extremely` },
  ];

  const handleSliderChange = (newValue: number) => {
    setValue(newValue);
    setShowConfirm(true);
  };

  const handleConfirmVote = async () => {
    if (value == null) return;
    try {
      await objectVoteMutation.mutateAsync(value);
      setPreviousVote(value);
      setShowConfirm(false);
    } catch (error) {
      console.error("Error rating related object:", error);
    }
  };

  const handleCancelVote = () => {
    setValue(previousVote);
    setShowConfirm(false);
  };

  return (
    <Paper shadow="xs" p="md" radius="md" withBorder>
      <Title order={5} c="blue.9" my="md">
        {objectData.title}
      </Title>
      {objectData.description && (
        <Text c="gray.8" mb="md">
          <Markdown content={objectData.description} />
        </Text>
      )}
      <Text
        fw={500}
        size="sm"
        c={objectVoteMutation.isPending ? "gray.6" : undefined}
      >
        <Trans>How relevant is this to you?</Trans>
      </Text>
      <Slider
        value={value ?? 0}
        onChange={handleSliderChange}
        min={0}
        max={8}
        step={2}
        marks={marks}
        size="lg"
        color={objectVoteMutation.isPending ? "gray" : "blue"}
        className="px-2"
        disabled={objectVoteMutation.isPending}
        styles={{
          markLabel: {
            fontSize: "10px",
            paddingTop: "10px",
            color: objectVoteMutation.isPending
              ? "var(--mantine-color-gray-6)"
              : undefined,
          },
          mark: {
            width: "4px",
            height: "4px",
          },
          thumb: {
            borderColor: objectVoteMutation.isPending
              ? "var(--mantine-color-gray-4)"
              : undefined,
          },
          track: {
            backgroundColor: objectVoteMutation.isPending
              ? "var(--mantine-color-gray-3)"
              : undefined,
          },
        }}
      />

      {showConfirm && value !== previousVote && (
        <Group mt="md">
          <Button
            onClick={handleConfirmVote}
            loading={objectVoteMutation.isPending}
            disabled={objectVoteMutation.isPending}
          >
            {userHasRated ? (
              <Trans>Update Rating</Trans>
            ) : (
              <Trans>Confirm Rating</Trans>
            )}
          </Button>
          <Button variant="light" onClick={handleCancelVote}>
            <Trans>Cancel</Trans>
          </Button>
        </Group>
      )}
    </Paper>
  );
}

/**
 * The main component that displays a single "object" message (type="object").
 * Incorporates logic for rating, optionally sharing, plus now showing "related objects."
 */
function SpikeObjectMessage({ message }: { message: SpikeChatMessage }) {
  // Basic rating states
  const [value, setValue] = useState<number | null>(4);
  const [showConfirm, setShowConfirm] = useState(false);
  const [previousVote, setPreviousVote] = useState<number | null>(null);
  const [userHasRated, setUserHasRated] = useState<boolean>(false);
  const [showSharePrompt, setShowSharePrompt] = useState(false);

  // Related objects states
  const [openedRelatedObjects, setOpenedRelatedObjects] = useState(false);
  const [relatedObjects, setRelatedObjects] = useState<any[]>([]);

  const { conversationId } = useParams();
  const getConversationReplyMutation = useGetConversationReplyMutation();
  const getRelatedObjectsMutation = useGetRelatedObjectsMutation();

  // Query for object details
  const objectQuery = useQuery({
    queryKey: ["spike_object", message.content_object_id],
    queryFn: async () => {
      if (!message.content_object_id) return null;
      const data = await directus.request(
        readItems("spike_object", {
          filter: {
            id: {
              _eq: message.content_object_id as number,
            },
          },
          fields: ["*", { ratings: ["*"] }],
          deep: {
            // @ts-expect-error ratings might not be typed
            ratings: {
              _filter: {
                spike_chat_id: {
                  _eq: message.spike_chat_id as number,
                },
              },
            },
          },
        }),
      );

      if (data.length === 0) throw new Error("No spike object found");

      return data[0];
    },
    // @ts-expect-error ratings might not be typed
    onSuccess: (data: any) => {
      if (data?.ratings?.[0]?.value != null) {
        setValue(data.ratings[0].value);
        setPreviousVote(data.ratings[0].value);
        setUserHasRated(true);
      }
    },
  });

  // Voting mutation for this primary object
  const objectVoteMutation = useMutation({
    mutationFn: async (val: number) => {
      // see if there's an existing rating for the object in this chat
      const existingRating = await directus.request(
        readItems("spike_object_rating", {
          filter: {
            spike_chat_id: message.spike_chat_id as number,
            spike_object_id: message.content_object_id as number,
          },
        }),
      );

      if (existingRating.length > 0) {
        return directus.request(
          updateItem("spike_object_rating", existingRating[0].id, {
            value: val,
          }),
        );
      }

      return directus.request(
        createItem("spike_object_rating", {
          value: val,
          spike_chat_id: message.spike_chat_id,
          spike_object_id: message.content_object_id,
        }),
      );
    },
    onSuccess: () => {
      setUserHasRated(true);
    },
  });

  const addUserVoteMessageMutation = useMutation({
    mutationFn: async ({
      ratingId,
      ratingValue,
    }: {
      ratingId: string;
      ratingValue: number;
    }) => {
      const voteMeanings: Record<number, string> = {
        0: "not at all",
        2: "slightly",
        4: "moderately",
        6: "very",
        8: "extremely",
      };
      const contentText = `I rate this a ${ratingValue} out of 8, and I feel that it is ${voteMeanings[ratingValue]} relevant to me.`;

      await directus.request(
        createItem("spike_chat_message", {
          spike_chat_id: message.spike_chat_id,
          type: "user_rating",
          content_text: contentText,
          content_rating_value: ratingValue,
          content_rating_id: ratingId,
        }),
      );
    },
  });

  // Handlers for the main object rating
  const handleSliderChange = useCallback((newValue: number) => {
    setValue(newValue);
    setShowConfirm(true);
  }, []);

  const handleConfirmVote = useCallback(async () => {
    if (value == null) return;
    const rating = (await objectVoteMutation.mutateAsync(value)) as {
      id?: string;
    };
    setPreviousVote(value);
    setShowConfirm(false);

    // If relatively low rating, just send user rating and get a reply
    if (value <= 4 && rating?.id) {
      await addUserVoteMessageMutation.mutateAsync({
        ratingId: rating.id,
        ratingValue: value,
      });

      await getConversationReplyMutation.mutateAsync(conversationId ?? "");
    } else {
      // If user gave a higher rating, prompt to share
      setShowSharePrompt(true);
    }
  }, [
    value,
    objectVoteMutation,
    addUserVoteMessageMutation,
    getConversationReplyMutation,
    conversationId,
  ]);

  const handleCancelVote = useCallback(() => {
    setValue(previousVote);
    setShowConfirm(false);
  }, [previousVote]);

  // Share-action confirms the user wants to publish this object to "public"
  const handleShareYes = async () => {
    try {
      // Mark the object as public
      await directus.request(
        updateItem("spike_object", message.content_object_id as number, {
          is_public: true,
        }),
      );
      alert(t`Thank you for sharing your object!`);

      // After sharing, optionally fetch any "related" objects
      const objs = await getRelatedObjectsMutation.mutateAsync(
        String(message.content_object_id),
      );
      if (objs && objs.length > 0) {
        setRelatedObjects(objs);
        setOpenedRelatedObjects(true);
      }

      // Optionally, get a reply after sharing
      await getConversationReplyMutation.mutateAsync(conversationId ?? "");
    } catch (error) {
      console.error("Error sharing object or fetching related objects:", error);
      alert(
        t`Something went wrong while sharing the object or fetching related objects.`,
      );
    }
  };

  const handleShareNo = () => {
    alert(t`Thank you for your inputs!`);
  };

  // UI concerns
  const marks = [
    { value: 0, label: t`Not at all` },
    { value: 2, label: t`Slightly` },
    { value: 4, label: t`Moderately` },
    { value: 6, label: t`Very` },
    { value: 8, label: t`Extremely` },
  ];

  // If the object is loading or empty, skip rendering
  if (objectQuery.isLoading) return <Skeleton height={200} />;
  if (!objectQuery.data) return <></>;

  const disableSlider = objectVoteMutation.isPending;

  return (
    <>
      <Paper className="rounded-t-xl rounded-br-xl border border-slate-200 p-6 shadow-sm">
        <Stack gap="md">
          {/* Title and possible public indicator */}
          <Group justify="space-between" align="center">
            <Title
              order={3}
              c="blue.9"
              onClick={() => alert(objectQuery.data?.context ?? "")}
            >
              {objectQuery.data?.title ?? ""}
            </Title>

            {objectQuery.data?.is_public && (
              <Group>
                {objectQuery.data?.origin_spike_chat_id != null && (
                  <Tooltip label="Shared in the public Dembrane by other participants">
                    <Logo hideTitle className="h-4 w-4" />
                  </Tooltip>
                )}
                {objectQuery.data?.exa_query_origin_object_id != null && (
                  <Tooltip label="Other participants found this highly relevant">
                    <IconTrendingUp className="h-4 w-4" />
                  </Tooltip>
                )}
              </Group>
            )}

            {objectQuery.data?.exa_query_origin_object_id != null && (
              <Tooltip label="We found this object on the internet and thought it might be relevant to you">
                <IconLink className="h-4 w-4" />
              </Tooltip>
            )}
          </Group>

          {/* Description for the object */}
          <Text className="prose text-sm" c="gray.8">
            <Markdown content={objectQuery.data?.description ?? ""} />
          </Text>

          {/* Voting control */}
          <Stack gap="xs" mt="md">
            <Text fw={500} size="sm" c={disableSlider ? "gray.6" : undefined}>
              <Trans>How relevant is this to you?</Trans>
            </Text>
            <Slider
              value={value ?? 0}
              onChange={handleSliderChange}
              min={0}
              max={8}
              step={2}
              marks={marks}
              size="lg"
              color={disableSlider ? "gray" : "blue"}
              className="px-2"
              disabled={disableSlider}
              styles={{
                markLabel: {
                  fontSize: "10px",
                  paddingTop: "10px",
                  color: disableSlider
                    ? "var(--mantine-color-gray-6)"
                    : undefined,
                },
                mark: {
                  width: "4px",
                  height: "4px",
                },
                thumb: {
                  borderColor: disableSlider
                    ? "var(--mantine-color-gray-4)"
                    : undefined,
                },
                track: {
                  backgroundColor: disableSlider
                    ? "var(--mantine-color-gray-3)"
                    : undefined,
                },
              }}
            />

            {showConfirm && value !== previousVote && (
              <Group mt="xl">
                <Button
                  onClick={handleConfirmVote}
                  loading={objectVoteMutation.isPending}
                  disabled={disableSlider}
                >
                  {userHasRated ? (
                    <Trans>Update Rating</Trans>
                  ) : (
                    <Trans>Confirm Rating</Trans>
                  )}
                </Button>
                <Button
                  variant="light"
                  onClick={handleCancelVote}
                  disabled={disableSlider}
                >
                  <Trans>Cancel</Trans>
                </Button>
              </Group>
            )}

            {/* Share prompt for votes higher than 4 */}
            {showSharePrompt && (
              <div className="mt-8">
                <Text mt="xl">
                  <Trans>
                    <Text className="font-bold">
                      Share this to the Dembrane?
                    </Text>
                    <Text className="italic">
                      Doing this will allow other people to discover and rate
                      your object. You will also receive updates about their
                      activities.
                    </Text>
                  </Trans>
                </Text>
                <Group mt="md">
                  <Button onClick={handleShareYes}>
                    <Trans>Yes</Trans>
                  </Button>
                  <Button variant="light" onClick={handleShareNo}>
                    <Trans>No</Trans>
                  </Button>
                </Group>
              </div>
            )}
          </Stack>
        </Stack>
      </Paper>

      {/* Show a modal with related objects if any are found after sharing */}
      <Modal
        opened={openedRelatedObjects}
        onClose={() => setOpenedRelatedObjects(false)}
        size="lg"
        title={t`We found some related items you might be interested in!`}
      >
        <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
          {relatedObjects.length === 0 && (
            <Text>
              <Trans>No related objects found.</Trans>
            </Text>
          )}
          <Stack gap="md">
            {relatedObjects.map((obj) => (
              <RelatedObjectItem
                key={obj.id}
                objectData={obj}
                chatId={message.spike_chat_id as number}
              />
            ))}
          </Stack>
        </div>
      </Modal>
    </>
  );
}

const SpikeMessage = ({ message }: { message: SpikeChatMessage }) => {
  if (message.type === "text") {
    return <SystemMessage markdown={message.content_text ?? ""} />;
  }
  if (message.type === "object") {
    return <SpikeObjectMessage message={message} />;
  }
  if (message.type === "user_audio") {
    return null;
  }
  return <></>;
};

const combineUserChunks = (
  chunks: { type: "user_chunk"; timestamp: Date; data: TConversationChunk }[],
) => {
  return {
    type: "user_chunk" as const,
    timestamp: chunks[0].timestamp,
    data: {
      ...chunks[0].data,
      transcript: chunks.map((c) => c.data.transcript).join("..."),
    },
  };
};

const ParticipantBody = ({
  project,
  conversation,
  viewResponses = false,
  interleaveMessages = true,
  lastMessageIsUntouchedObject,
  children,
}: PropsWithChildren<{
  project: Project;
  conversation?: TConversation;
  viewResponses?: boolean;
  interleaveMessages?: boolean;
  lastMessageIsUntouchedObject?: boolean;
}>) => {
  const [ref] = useAutoAnimate();
  const [chatRef] = useAutoAnimate();
  const bottomRef = useRef<HTMLDivElement>(null);

  const chunksQuery = useConversationChunksQuery(project.id, conversation?.id);
  const spikeMessagesQuery = useSpikeMessages(conversation?.id ?? "");
  const [opened, { open, close }] = useDisclosure(false);

  const combinedMessages = useMemo(() => {
    if (!interleaveMessages) return [];
    const userChunks = (chunksQuery.data ?? []).map((chunk) => ({
      type: "user_chunk" as const,
      timestamp: new Date(chunk.timestamp),
      data: chunk,
    }));
    const spikeMsgs = (spikeMessagesQuery.data ?? [])
      .filter((m) => ["object", "text"].includes(m.type ?? ""))
      .map((m) => ({
        type: "spike_message" as const,
        timestamp: new Date(m.date_created ?? ""),
        data: m,
      }));

    const allMessages = [...userChunks, ...spikeMsgs].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );

    const combinedResult = [];
    let currentUserChunks = [];

    for (let i = 0; i < allMessages.length; i++) {
      const message = allMessages[i];
      if (message.type === "user_chunk") {
        currentUserChunks.push(message);
      } else {
        if (currentUserChunks.length > 0) {
          if (currentUserChunks.length > 1) {
            combinedResult.push(combineUserChunks(currentUserChunks));
          } else {
            combinedResult.push(currentUserChunks[0]);
          }
          currentUserChunks = [];
        }
        combinedResult.push(message);
      }
    }
    if (currentUserChunks.length > 0) {
      if (currentUserChunks.length > 1) {
        combinedResult.push(combineUserChunks(currentUserChunks));
      } else {
        combinedResult.push(currentUserChunks[0]);
      }
    }

    return combinedResult;
  }, [chunksQuery.data, spikeMessagesQuery.data, interleaveMessages]);

  return (
    <Stack ref={ref} className="max-h-full">
      <h2 className="text-center text-3xl">
        <Trans>Welcome</Trans>
      </h2>
      <img
        className="w-full animate-pulse object-contain duration-1000"
        src={WelcomeImage}
      />
      {conversation && (
        <Stack ref={chatRef} py="md">
          <Title order={3}>{project.default_conversation_title}</Title>
          {project.default_conversation_description && (
            <SystemMessage
              markdown={project.default_conversation_description ?? ""}
            />
          )}
          <SystemMessage
            markdown={t`Please record your response by clicking the "Start Recording" button below.`}
          />

          {/* If there's a fresh object awaiting a "touch," nudge the user */}
          {lastMessageIsUntouchedObject && (
            <SystemMessage
              markdown={t`Please provide a rating for the content above before proceeding.`}
            />
          )}

          {children}

          {interleaveMessages ? (
            <Stack gap="sm">
              {combinedMessages.map((message, index) => (
                <div key={index}>
                  {message.type === "user_chunk" ? (
                    <UserChunkMessage chunk={message.data} />
                  ) : (
                    <SpikeMessage message={message.data} />
                  )}
                </div>
              ))}
            </Stack>
          ) : (
            <>
              {viewResponses ? (
                <div className="flex justify-end">
                  <Stack gap="sm">
                    {chunksQuery.data
                      ?.sort(
                        (a, b) =>
                          new Date(a.timestamp).getTime() -
                          new Date(b.timestamp).getTime(),
                      )
                      .map((chunk) => (
                        <UserChunkMessage key={chunk.id} chunk={chunk} />
                      ))}
                  </Stack>
                </div>
              ) : (
                <>
                  {chunksQuery.data && chunksQuery.data.length > 0 && (
                    <div className="flex justify-end">
                      <Button variant="transparent" onClick={open}>
                        <Trans>View your responses</Trans>
                      </Button>
                    </div>
                  )}
                  <Modal
                    opened={opened}
                    onClose={close}
                    size="lg"
                    title={t`Your responses`}
                  >
                    <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
                      <Stack gap="sm">
                        {chunksQuery.data
                          ?.sort(
                            (a, b) =>
                              new Date(a.timestamp).getTime() -
                              new Date(b.timestamp).getTime(),
                          )
                          .map((chunk) => (
                            <UserChunkMessage key={chunk.id} chunk={chunk} />
                          ))}
                      </Stack>
                    </div>
                  </Modal>
                </>
              )}
              <Stack gap="sm">
                {spikeMessagesQuery.data?.map((msg) => (
                  <SpikeMessage key={msg.id} message={msg} />
                ))}
              </Stack>
            </>
          )}

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

export const SpikeParticipantConversationAudioRoute = () => {
  const { projectId, conversationId } = useParams();
  const projectQuery = useParticipantProjectById(projectId ?? "");
  const conversationQuery = useConversationQuery(projectId, conversationId);
  const chunks = useConversationChunksQuery(projectId, conversationId);
  const uploadChunkMutation = useUploadConversationChunk();
  const getConversationReplyMutation = useGetConversationReplyMutation();
  const spikeMessagesQuery = useSpikeMessages(conversationId ?? "");

  const onChunk = (chunk: Blob) => {
    uploadChunkMutation.mutate({
      conversationId: conversationId ?? "",
      chunk,
      timestamp: new Date(),
    });
  };

  const fallbackAudioRecorder = useChunkedAudioRecorder({ onChunk });

  const [once, setOnce] = useState(false);
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
  } = fallbackAudioRecorder;

  const [troubleShootingGuideOpened, setTroubleShootingGuideOpened] =
    useState(false);

  const navigate = useI18nNavigate();
  const { language } = useLanguage();

  const handleCheckMicrophoneAccess = async () => {
    const perm = await checkPermissionError();
    if (["granted", "prompt"].includes(perm)) {
      window.location.reload();
    } else {
      alert(
        t`Microphone access is still denied. Please check your settings and try again.`,
      );
    }
  };

  // Check if last message is an "untouched" object
  const combinedMessages = useMemo(() => {
    const userChunks = (chunks.data ?? []).map((chunk) => ({
      type: "user_chunk" as const,
      timestamp: new Date(chunk.timestamp),
      data: chunk,
    }));
    const spikeMsgs = (spikeMessagesQuery.data ?? [])
      .filter((m) => ["object", "text"].includes(m.type ?? ""))
      .map((m) => ({
        type: "spike_message" as const,
        timestamp: new Date(m.date_created ?? ""),
        data: m,
      }));

    return [...userChunks, ...spikeMsgs].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );
  }, [chunks.data, spikeMessagesQuery.data]);

  const [lastMessageIsUntouchedObject, setLastMessageIsUntouchedObject] =
    useState(false);
  const [lastMessageIsObject, setLastMessageIsObject] = useState(false);

  useEffect(() => {
    if (combinedMessages.length === 0) {
      setLastMessageIsUntouchedObject(false);
      return;
    }

    const lastMessage = combinedMessages[combinedMessages.length - 1];
    if (
      lastMessage.type === "spike_message" &&
      lastMessage.data.type === "object"
    ) {
      setLastMessageIsObject(true);
      const objectId = lastMessage.data.content_object_id;
      if (!objectId) {
        setLastMessageIsUntouchedObject(false);
        return;
      }
      const fetchUserHasRated = async () => {
        try {
          const data = await directus.request(
            readItems("spike_object_rating", {
              filter: {
                spike_chat_id: lastMessage.data.spike_chat_id as number,
                spike_object_id: objectId,
              },
              limit: 1,
            }),
          );
          if (data.length > 0) {
            setLastMessageIsUntouchedObject(false);
          } else {
            setLastMessageIsUntouchedObject(true);
          }
        } catch (error) {
          console.error("Error fetching user rating status", error);
          setLastMessageIsUntouchedObject(false);
        }
      };
      fetchUserHasRated();
    } else {
      setLastMessageIsUntouchedObject(false);
      setLastMessageIsObject(false);
    }
  }, [combinedMessages]);

  // Early loads
  if (conversationQuery.isLoading || loading || projectQuery.isLoading) {
    return <LoadingOverlay visible />;
  }

  const textModeUrl = `/${language}/${projectId}/conversation/${conversationId}/text`;
  const finishUrl = `/${language}/${projectId}/conversation/${conversationId}/finish`;

  const handleStartRecording = () => {
    setOnce(true);
    startRecording();
  };

  const handleFinish = () => {
    if (window.confirm(t`Are you sure you want to finish?`)) {
      navigate(finishUrl);
    }
  };

  const handleReply = async () => {
    try {
      stopRecording();
      // Wait for pending uploads to complete
      while (uploadChunkMutation.isPending) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      await getConversationReplyMutation.mutateAsync(conversationId ?? "");
    } catch (error) {
      console.error("Error during reply:", error);
    }
  };

  return (
    <div className="container mx-auto flex min-h-dvh max-w-2xl flex-col">
      {/* Modal for microphone permissions */}
      <Modal
        opened={!!permissionError}
        onClose={() => true}
        centered
        fullScreen
        radius={0}
        transitionProps={{ transition: "fade", duration: 200 }}
        withCloseButton={false}
      >
        <div className="h-full rounded-md bg-white py-4">
          <Stack className="container mx-auto mt-4 max-w-2xl px-2" gap="lg">
            <div className="max-w-prose text-lg">
              <Trans>
                Oops! It looks like microphone access was denied. No worries,
                though! We've got a handy troubleshooting guide for you. Once
                you've resolved the issue, come back to check if your microphone
                is ready.
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

      <Box className={clsx("relative flex-grow px-4 py-4 transition-all")}>
        {projectQuery.data && conversationQuery.data && (
          <ParticipantBody
            conversation={conversationQuery.data}
            project={projectQuery.data}
            lastMessageIsUntouchedObject={lastMessageIsUntouchedObject}
          />
        )}

        {(!!once || (chunks.data && chunks.data.length > 0)) &&
          !lastMessageIsObject &&
          !isRecording && (
            <Button
              size="xl"
              variant="outline"
              onClick={handleReply}
              disabled={
                uploadChunkMutation.isPending ||
                getConversationReplyMutation.isPending
              }
            >
              <Trans>Get Reply!</Trans>
            </Button>
          )}
      </Box>

      {/* Nudge message for user to rate the last object, if needed */}
      {lastMessageIsUntouchedObject && (
        <Box className="px-4 pb-8">
          <SystemMessage
            markdown={t`Please provide a rating for the content above before proceeding.`}
          />
        </Box>
      )}

      {!errored && !lastMessageIsUntouchedObject && (
        <Stack className="sticky bottom-0 z-10 w-full border-t border-slate-300 bg-white p-4 shadow-sm">
          {isRecording && (
            <div className="w-full border-slate-300 bg-white pb-4 pt-2">
              <Group justify="center" align="center">
                {isPaused ? (
                  <IconPlayerPause />
                ) : (
                  <div className="h-4 w-4 animate-pulse rounded-full bg-red-500"></div>
                )}
                <Text className="text-4xl">
                  {Math.floor(recordingTime / 3600) > 0 && (
                    <>
                      {Math.floor(recordingTime / 3600)
                        .toString()
                        .padStart(2, "0")}
                      :
                    </>
                  )}
                  {Math.floor((recordingTime % 3600) / 60)
                    .toString()
                    .padStart(2, "0")}
                  :{(recordingTime % 60).toString().padStart(2, "0")}
                </Text>
              </Group>
            </div>
          )}

          <Group justify="center">
            {!isRecording && (
              <Group className="w-full">
                <Button
                  size="xl"
                  rightSection={<IconMicrophone />}
                  onClick={handleStartRecording}
                  className="flex-grow"
                >
                  <Trans>Start Recording</Trans>
                </Button>

                {!isRecording && chunks?.data && chunks.data.length > 0 && (
                  <Button
                    size="xl"
                    onClick={handleFinish}
                    component="a"
                    variant="light"
                    rightSection={<IconCheck />}
                  >
                    <Trans>Finish</Trans>
                  </Button>
                )}
              </Group>
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
