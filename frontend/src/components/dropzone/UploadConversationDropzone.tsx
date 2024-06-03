import { useProjectById, useUploadConversation } from "@/lib/query";
import { Group, LoadingOverlay, rem } from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import { IconUpload, IconX } from "@tabler/icons-react";
import { PropsWithChildren } from "react";

export const UploadConversationDropzone = (
  props: PropsWithChildren<{
    projectId: string;
    idle?: React.ReactNode;
    reject?: React.ReactNode;
    accept?: React.ReactNode;
  }>,
) => {
  const uploadConversationMutation = useUploadConversation();
  const projectQuery = useProjectById(props.projectId);

  if (projectQuery.isLoading) {
    return <LoadingOverlay visible />;
  }

  return (
    <Dropzone
      onDrop={(files) => {
        uploadConversationMutation.mutate({
          projectId: props.projectId,
          namePrefix: "uploaded-",
          chunks: files,
          pin: projectQuery.data?.pin || "",
          tagIdList: [],
          timestamps: files.map(() => new Date()),
        });
      }}
      maxFiles={5}
      maxSize={24 * 1024 * 1024}
      onReject={(files) => {
        console.log("rejected files", files);
      }}
      loading={uploadConversationMutation.isPending}
      accept={[
        "audio/m4a",
        "audio/x-m4a",
        "audio/mp3",
        "audio/wav",
        "audio/mpeg",
      ]}
    >
      <Group justify="center" gap="xl" style={{ pointerEvents: "none" }}>
        <Dropzone.Accept>
          {props.accept ? (
            props.accept
          ) : (
            <IconUpload
              style={{
                width: rem(52),
                height: rem(52),
                color: "var(--mantine-color-blue-6)",
              }}
              stroke={1.5}
            />
          )}
        </Dropzone.Accept>
        <Dropzone.Reject>
          {props.reject ? (
            props.reject
          ) : (
            <IconX
              style={{
                width: rem(52),
                height: rem(52),
                color: "var(--mantine-color-red-6)",
              }}
              stroke={1.5}
            />
          )}
        </Dropzone.Reject>
        <Dropzone.Idle>{props.children}</Dropzone.Idle>
      </Group>
    </Dropzone>
  );
};
