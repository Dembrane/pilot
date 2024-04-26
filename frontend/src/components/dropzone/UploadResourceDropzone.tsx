import { useUploadResourceByProjectIdMutation } from "@/lib/query";
import { Group, rem } from "@mantine/core";
import { Dropzone, PDF_MIME_TYPE } from "@mantine/dropzone";
import { IconUpload, IconX } from "@tabler/icons-react";
import { PropsWithChildren } from "react";

export const UploadResourceDropzone = (
  props: PropsWithChildren<{
    projectId: string;
    idle?: React.ReactNode;
    reject?: React.ReactNode;
    accept?: React.ReactNode;
  }>,
) => {
  const uploadDocumentsMutation = useUploadResourceByProjectIdMutation();

  return (
    <Dropzone
      onDrop={(files) => {
        uploadDocumentsMutation.mutate({
          projectId: props.projectId,
          files,
        });
      }}
      onReject={(files) => {
        console.log("rejected files", files);
      }}
      loading={uploadDocumentsMutation.isPending}
      accept={PDF_MIME_TYPE}
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
