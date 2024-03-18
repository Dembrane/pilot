import { BaseMessage } from "@/components/BaseMessage";
import { useConversationChunks } from "@/lib/query";
import { LoadingOverlay, Paper, Stack } from "@mantine/core";
import { useParams } from "react-router-dom";

const Chunk = ({ chunk }: { chunk: TConversationChunk }) => {
  // if (chunk.processing_error) {
  //   return (
  //     <BaseMessage title="Speaker">
  //       <p className="text-red-500">Error</p>
  //     </BaseMessage>
  //   );
  // }

  // if (!chunk.is_processed) {
  //   return (
  //     <BaseMessage title="Speaker">
  //       <LoadingOverlay />
  //     </BaseMessage>
  //   );
  // }

  return (
    <BaseMessage
      title="Speaker"
      rightSection={
        <span className="text-sm">
          {new Date(chunk.timestamp).toLocaleTimeString()}
        </span>
      }
    >
      {chunk.processing_error ? (
        <p className="text-red-500">Transcription error</p>
      ) : chunk.is_processed ? (
        <>{chunk.transcript}</>
      ) : (
        <LoadingOverlay visible />
      )}
    </BaseMessage>
  );
};

export const ProjectConversationTranscript = () => {
  const { conversationId } = useParams();
  const chunksQuery = useConversationChunks(conversationId ?? "");

  if (chunksQuery.isLoading) {
    return <div>Loading...</div>;
  }

  const sorted = chunksQuery.data?.sort((a, b) => {
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });

  return (
    <Stack>
      {sorted?.map((chunk) => {
        return <Chunk key={chunk.id} chunk={chunk} />;
      })}
    </Stack>
  );
};
