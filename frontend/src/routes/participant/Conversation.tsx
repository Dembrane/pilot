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
import { Navigate, useParams } from "react-router-dom";
import WelcomeImage from "@/assets/participant-welcome-pattern.png";
import { Markdown } from "@/components/Markdown";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  ReactRealTimeVADOptions,
  useMicVAD,
  utils,
} from "@ricky0123/vad-react";
import * as ort from "onnxruntime-web";

ort.env.wasm.wasmPaths = {
  "ort-wasm-simd-threaded.wasm": "/ort-wasm-simd-threaded.wasm",
  "ort-wasm-simd.wasm": "/ort-wasm-simd.wasm",
  "ort-wasm.wasm": "/ort-wasm.wasm",
  "ort-wasm-threaded.wasm": "/ort-wasm-threaded.wasm",
};

const preferredMimeTypes = ["audio/webm", "audio/wav", "video/mp4"];

const getSupportedMimeType = () => {
  for (let mimeType of preferredMimeTypes) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }
  return "audio/webm";
};

const defaultMimeType = getSupportedMimeType();

// const useSelectAudioDevice = () => {
//   const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
//   const [selectedAudioDevice, setSelectedAudioDevice] =
//     useState<MediaDeviceInfo | null>(null);

//   useEffect(() => {
//     navigator.mediaDevices.enumerateDevices().then((devices) => {
//       setAudioDevices(devices.filter((device) => device.kind === "audioinput"));
//     });
//   }, []);

//   return {
//     audioDevices,
//     selectedAudioDevice,
//     setSelectedAudioDevice,
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
  errored:
    | boolean
    | {
        message: string;
      };
  loading: boolean;
}

const useAudioRecorder = ({
  onChunk,
  mimeType = defaultMimeType,
  // timeslice = 30000, // 30 sec
  timeslice = 300000, // 5 min
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
  const startTimeRef = useRef<number | null>(null);
  const startRecordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioProcessorRef = useRef<AudioWorkletNode | null>(null);

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

  const handleAudioProcessorMessages = (event: MessageEvent) => {
    console.log("Not Handled: Received audio processor message", event.data);
    return;

    console.log("Received audio processor message", event.data);
    const { action } = event.data;

    // Use the current state from refs
    const currentIsRecording = isRecordingRef.current;
    const currentIsPaused = isPausedRef.current;
    const currentUserPaused = userPausedRef.current;

    if (action === "pause" && isRecordingRef.current && !isPausedRef.current) {
      console.log("System-initiated pause");
      pauseRecording();
    } else if (
      action === "resume" &&
      isPausedRef.current &&
      !userPausedRef.current
    ) {
      console.log("System-initiated resume");
      resumeRecording();
    } else {
      console.log("Unhandled audio processor message", {
        action,
        currentIsRecording,
        currentIsPaused,
        currentUserPaused,
      });

      // Detailed logging for unhandled cases
      if (action === "pause") {
        console.log(
          "unhandled because action is pause, isRecording, isPaused, userPaused",
          currentIsRecording,
          currentIsPaused,
          currentUserPaused,
        );
      } else if (action === "resume") {
        console.log(
          "unhandled because action is resume, isRecording, isPaused, userPaused",
          currentIsRecording,
          currentIsPaused,
          currentUserPaused,
        );
      }
    }
  };

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
      console.log("Requesting access to the microphone...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      console.log("Access to microphone granted.", { stream });

      // Setup audio context and processor for silence detection
      audioContextRef.current = new AudioContext();
      console.log("Loading audio worklet module...");
      await audioContextRef.current.audioWorklet.addModule("/processor.js"); // Your worklet processor file
      audioProcessorRef.current = new AudioWorkletNode(
        audioContextRef.current,
        "silence-detector",
      );
      console.log("Audio worklet module loaded", audioProcessorRef.current);
      audioProcessorRef.current.port.onmessage = handleAudioProcessorMessages;

      // Connect the stream to the audio context
      console.log("Connecting audio stream to audio processor");
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(audioProcessorRef.current);
      audioProcessorRef.current.connect(audioContextRef.current.destination);

      console.log("Creating MediaRecorder instance");

      setIsRecording(true);
      setIsPaused(false);
      setUserPaused(false);
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
    setIsPaused(false);
    setUserPaused(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
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
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setIsPaused(true);
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
  };
};

const useVADAudioRecorder = (
  props: UseAudioRecorderOptions,
): UseAudioRecorderResult => {
  const vadOptions: Partial<ReactRealTimeVADOptions> = {
    redemptionFrames: 20,
    minSpeechFrames: 5,
    startOnLoad: false,
    submitUserSpeechOnPause: true,
    workletURL: "/vad.worklet.bundle.min.js",
    modelURL: "/silero_vad.onnx",
    // additionalAudioConstraints: {
    //   deviceId: ""
    // },
    onVADMisfire: () => {
      console.log("Vad misfire");
    },
    onSpeechStart: () => {
      console.log("Speech start");
    },
    onSpeechEnd: (audio) => {
      console.log("Speech ended");
      const buffer = utils.encodeWAV(audio);
      const blob = new Blob([buffer], { type: "audio/wav" });
      props.onChunk(blob);
    },
  };

  const vad = useMicVAD(vadOptions);

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const [recordingTime, setRecordingTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateRecordingTime = useCallback(() => {
    setRecordingTime((prev) => prev + 1);
  }, []);

  const startRecording = useCallback(() => {
    console.log("Starting recording");
    setIsRecording(true);
    setIsPaused(false);
    setRecordingTime(0);
    vad.start();
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(updateRecordingTime, 1000);
  }, [vad, setIsPaused]);

  const stopRecording = useCallback(() => {
    vad.pause();
    setIsRecording(false);
    setIsPaused(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setRecordingTime(0);
  }, [vad, setIsPaused]);

  const pauseRecording = useCallback(() => {
    vad.pause();
    setIsPaused(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [vad, setIsPaused]);

  const resumeRecording = useCallback(() => {
    vad.start();
    setIsPaused(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(updateRecordingTime, 1000);
  }, [vad, setIsPaused]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    isRecording,
    isPaused,
    recordingTime,
    errored: vad.errored,
    loading: vad.loading,
  };
};

export const ParticipantConversationRoute = ({
  fallback = false,
}: {
  fallback?: boolean;
}) => {
  const { conversationId } = useParams();
  const conversationQuery = useConversationById(conversationId as string);
  const uploadChunkMutation = useUploadConversationChunk();

  const onChunk = (chunk: Blob) => {
    uploadChunkMutation.mutate({
      conversationId: conversationId ?? "",
      chunk,
      timestamp: new Date(),
    });
  };

  const audioRecorder = useVADAudioRecorder({ onChunk });
  const fallbackAudioRecorder = useAudioRecorder({ onChunk });

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
  } = fallback ? fallbackAudioRecorder : audioRecorder;

  if (conversationQuery.isLoading || loading) {
    return <LoadingOverlay visible />;
  }

  return (
    <Stack className="h-dvh">
      <header className="sticky top-0 py-4 bg-white z-10">
        <Group justify="center" className="px-4 relative">
          <Logo hideTitle className="left-0 pl-4 absolute sm:relative" />
          <h1 className="text-xl">Dembrane</h1>
        </Group>
      </header>

      <Box className="flex-1 px-4 py-8">
        <Stack className="h-full overflow-y-auto">
          {!isRecording ? (
            <>
              {conversationQuery.data?.participant_name != "" ? (
                <h2 className="text-3xl text-center">
                  Welcome, {conversationQuery.data?.participant_name}
                </h2>
              ) : (
                <h2 className="text-3xl text-center">Welcome</h2>
              )}
            </>
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
          {!fallback && errored && <Navigate to="fallback" />}
          <Stack>
            <Title order={3}>{conversationQuery.data?.title}</Title>
            <Text className="text-sm prose">
              <Markdown content={conversationQuery.data?.description ?? ""} />
            </Text>
          </Stack>
        </Stack>
      </Box>
      {!errored && (
        <Box className="px-4 py-8 sticky bottom-0 bg-white">
          <Group justify="center w-full">
            {!isRecording && (
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
      )}
    </Stack>
  );
};
