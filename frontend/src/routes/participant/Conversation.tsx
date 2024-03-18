import { Logo } from "@/components/Logo";
import { useConversationById, useUploadConversationChunk } from "@/lib/query";
import {
  Group,
  Stack,
  Button,
  Text,
  Box,
  Title,
  LoadingOverlay,
} from "@mantine/core";
import {
  IconMicrophone,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlayerStop,
} from "@tabler/icons-react";
import { useParams } from "react-router-dom";
import WelcomeImage from "@/assets/participant-welcome-pattern.png";
import { Markdown } from "@/components/Markdown";
import { useState, useRef, useEffect, useCallback } from "react";

const preferredMimeTypes = ["audio/webm", "audio/wav"];

const getSupportedMimeType = () => {
  for (let mimeType of preferredMimeTypes) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }
  return "audio/webm";
};

const defaultMimeType = getSupportedMimeType();

// interface UseAudioRecorderOptions {
//   onChunk: (chunk: Blob) => void;
//   mimeType?: string;
//   timeslice?: number;
// }

// interface UseAudioRecorderResult {
//   startRecording: () => void;
//   stopRecording: () => void;
//   pauseRecording: () => void;
//   resumeRecording: () => void;
//   isRecording: boolean;
//   isPaused: boolean;
//   recordingTime: number;
// }

// const useAudioRecorder = ({
//   onChunk,
//   mimeType = defaultMimeType,
//   timeslice = 30000,
// }: UseAudioRecorderOptions): UseAudioRecorderResult => {
//   const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
//     null,
//   );
//   const [isRecording, setIsRecording] = useState(false);
//   const [isPaused, setIsPaused] = useState(false);
//   const audioContextRef = useRef<AudioContext | null>(null);
//   const workletNodeRef = useRef<AudioWorkletNode | null>(null);
//   const [recordingTime, setRecordingTime] = useState(0); // Track recording time in seconds
//   const intervalRef = useRef<NodeJS.Timeout | null>(null);
//   const startTimeRef = useRef<Date | null>(null);

//   const updateRecordingTime = () => {
//     if (startTimeRef.current) {
//       const elapsedTime = (Date.now() - startTimeRef.current.getTime()) / 1000;
//       setRecordingTime(Math.floor(elapsedTime));
//     }
//   };

//   const startRecording = async () => {
//     try {
//       console.log("Requesting access to the microphone...");
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       console.log("Access to microphone granted.");

//       const audioContext = new AudioContext();
//       audioContextRef.current = audioContext;

//       console.log("Loading audio worklet module...");
//       await audioContext.audioWorklet.addModule("/processor.js");

//       const workletNode = new AudioWorkletNode(
//         audioContext,
//         "silence-detector",
//       );
//       workletNodeRef.current = workletNode;

//       const source = audioContext.createMediaStreamSource(stream);
//       source.connect(workletNode);
//       workletNode.connect(audioContext.destination);

//       workletNode.port.onmessage = (event) => {
//         const { action } = event.data;
//         if (action === "pause" && mediaRecorder?.state === "recording") {
//           mediaRecorder.pause();
//           setIsPaused(true);
//         } else if (action === "resume" && mediaRecorder?.state === "paused") {
//           mediaRecorder.resume();
//           setIsPaused(false);
//         }
//       };

//       const recorder = new MediaRecorder(stream, {
//         mimeType: MediaRecorder.isTypeSupported(mimeType)
//           ? mimeType
//           : "audio/webm",
//       });

//       recorder.ondataavailable = async (event) => {
//         if (event.data.size > 0) {
//           // const arrayBuffer = await event.data.arrayBuffer();

//           // const muxer = new Muxer({
//           //   target: new ArrayBufferTarget(),
//           //   audio: {
//           //     codec: "A_OPUS",
//           //     sampleRate: 48000,
//           //     numberOfChannels: 2,
//           //   },
//           //   firstTimestampBehavior: "permissive",
//           // });

//           // const raw = new Uint8Array(arrayBuffer);
//           // console.log("Adding audio chunk to muxer", raw.byteLength, "bytes");
//           // muxer.addAudioChunkRaw(raw, "key", recordingTime * 1000);
//           // muxer.finalize();

//           // const { buffer } = muxer.target;

//           // const blob = new Blob([buffer], { type: "audio/webm" });
//           // console.log("Muxed blob of data", blob.size, "bytes");

//           // onChunk(blob);
//           onChunk(event.data);
//         }
//       };

//       setMediaRecorder(recorder);
//       recorder.start(timeslice);
//       setIsRecording(true);
//       setIsPaused(false);

//       startTimeRef.current = new Date();
//       intervalRef.current = setInterval(updateRecordingTime, 1000);
//     } catch (error) {
//       console.error("Error accessing audio stream", error);
//     }
//   };

//   const stopRecording = () => {
//     mediaRecorder?.stop();
//     setIsRecording(false);
//     setIsPaused(false);
//     audioContextRef.current?.close();
//     workletNodeRef.current?.disconnect();

//     if (intervalRef.current) {
//       clearInterval(intervalRef.current);
//     }
//     intervalRef.current = null;
//     startTimeRef.current = null;
//   };

//   const pauseRecording = () => {
//     if (mediaRecorder?.state === "recording") {
//       mediaRecorder.pause();
//       setIsPaused(true);
//     }

//     if (intervalRef.current) {
//       clearInterval(intervalRef.current);
//     }
//     intervalRef.current = null;
//   };

//   const resumeRecording = () => {
//     if (mediaRecorder?.state === "paused") {
//       mediaRecorder.resume();
//       setIsPaused(false);
//     }

//     if (!intervalRef.current) {
//       startTimeRef.current = new Date(Date.now() - recordingTime * 1000);
//       intervalRef.current = setInterval(updateRecordingTime, 1000);
//     }
//   };

//   return {
//     startRecording,
//     stopRecording,
//     pauseRecording,
//     resumeRecording,
//     isRecording,
//     isPaused,
//     recordingTime,
//   };
// };

interface UseAudioRecorderOptions {
  onChunk: (chunk: Blob) => void;
  mimeType?: string;
  timeslice?: number;
}

interface UseAudioRecorderResult {
  startRecording: () => void;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
}

const useAudioRecorder = ({
  onChunk,
  mimeType = defaultMimeType,
  timeslice = 30000,
}: UseAudioRecorderOptions): UseAudioRecorderResult => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const startRecordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const updateRecordingTime = () => {
    if (startTimeRef.current) {
      const elapsedTime = Date.now() - startTimeRef.current;
      setRecordingTime(Math.floor(elapsedTime / 1000));
    }
  };

  let chunkBufferRef = useRef<Blob[]>([]);

  const startRecordingChunk = useCallback(() => {
    console.log("startRecordingChunk", {
      isRecording,
      mediaRecorderRefState: mediaRecorderRef.current?.state,
    });
    if (!streamRef.current) {
      console.log("startRecordingChunk: no stream found");
      return;
    }

    // Ensure that any previous MediaRecorder instance is stopped before creating a new one
    if (mediaRecorderRef.current) {
      console.log(
        "startRecordingChunk: stopping previous MediaRecorder instance",
      );
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    console.log("startRecordingChunk: creating new MediaRecorder instance");
    const recorder = new MediaRecorder(streamRef.current, {
      mimeType: MediaRecorder.isTypeSupported(mimeType)
        ? mimeType
        : "audio/webm",
    });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      console.log("ondataavailable", event.data.size, "bytes");
      if (event.data.size > 0) {
        chunkBufferRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      console.log("MediaRecorder stopped");
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setIsRecording(true);
      setIsPaused(false);
      startRecordingChunk();

      // allow to restart recording chunk
      startRecordingIntervalRef.current = setInterval(() => {
        console.log("Checking if MediaRecorder should be stopped");
        if (mediaRecorderRef.current?.state === "recording") {
          console.log("attempting to Stop recording chunk");
          mediaRecorderRef.current.stop();

          console.log("attempt to Restart recording chunk", {
            isRecording,
            mediaRecorderRefState: mediaRecorderRef.current?.state,
          });

          if (isRecording) {
            console.log("Restarting recording chunk");
            startRecordingChunk();
          }
        }
      }, timeslice);

      startTimeRef.current = Date.now();
      intervalRef.current = setInterval(updateRecordingTime, 1000);
    } catch (error) {
      console.error("Error accessing audio stream", error);
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
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (startRecordingIntervalRef.current)
      clearInterval(startRecordingIntervalRef.current);
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
    }
  };

  const resumeRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "paused"
    ) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  };

  return {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    isRecording,
    isPaused,
    recordingTime,
  };
};

export const ParticipantConversationRoute = () => {
  const { conversationId } = useParams();
  const conversationQuery = useConversationById(conversationId as string);
  const uploadChunkMutation = useUploadConversationChunk();
  const {
    startRecording,
    stopRecording,
    isRecording,
    isPaused,
    pauseRecording,
    resumeRecording,
    recordingTime,
  } = useAudioRecorder({
    onChunk: (chunk) => {
      uploadChunkMutation.mutate({
        conversationId: conversationId ?? "",
        chunk,
        timestamp: new Date(),
      });
    },
  });

  if (conversationQuery.isLoading) {
    return <LoadingOverlay visible />;
  }

  return (
    <Stack className="h-full">
      <header className="sticky top-0 py-4 bg-white z-10">
        <Group justify="center" className="px-4 relative">
          <Logo hideTitle className="left-0 pl-4 absolute sm:relative" />
          <h1 className="text-xl">Dembrane</h1>
        </Group>
      </header>

      <Box className="flex-1 px-4 py-8">
        <Stack className="h-full overflow-y-auto">
          {!isRecording ? (
            <h2 className="text-3xl text-center">Welcome</h2>
          ) : (
            <Group justify="center">
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
          )}
          <img
            className="w-full object-contain animate-pulse duration-1000"
            src={WelcomeImage}
          />
          <Stack>
            <Title order={3}>{conversationQuery.data?.title}</Title>
            <Text className="text-sm prose">
              <Markdown content={conversationQuery.data?.description ?? ""} />
            </Text>
          </Stack>
        </Stack>
      </Box>
      <Box className="px-4 py-8 sticky bottom-0 bg-white">
        <Group justify="center w-full">
          {!isRecording && !isPaused && (
            <Button
              fullWidth
              size="xl"
              rightSection={<IconMicrophone size={16} />}
              onClick={startRecording}
            >
              Start Recording
            </Button>
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
                  Resume
                </Button>
              ) : (
                <Button
                  className="flex-1"
                  size="xl"
                  rightSection={<IconPlayerPause size={16} />}
                  onClick={pauseRecording}
                >
                  Pause
                </Button>
              )}
              <Button
                // className="flex-1"
                variant="outline"
                size="xl"
                rightSection={<IconPlayerStop size={16} />}
                onClick={() => {
                  if (
                    window.confirm("Are you sure you want to stop recording?")
                  ) {
                    stopRecording();
                  }
                }}
              >
                Stop
              </Button>
            </>
          )}
        </Group>
      </Box>
    </Stack>
  );
};
