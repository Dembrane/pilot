import { Group, rem } from "@mantine/core";
import { FileRejection, Dropzone as MantineDropzone } from "@mantine/dropzone";
import { IconUpload, IconX } from "@tabler/icons-react";
import { PropsWithChildren, ReactNode } from "react";

interface CommonDropzoneProps {
  idle?: ReactNode;
  reject?: ReactNode;
  accept?: ReactNode;
  maxFiles?: number;
  maxSize?: number;
  loading?: boolean;
  onDrop: (files: File[]) => void;
  onReject: (fileRejections: FileRejection[]) => void;
}

export const CommonDropzone = ({
  idle,
  reject,
  accept,
  children,
  ...props
}: PropsWithChildren<CommonDropzoneProps>) => {
  return (
    <MantineDropzone p="sm" {...props}>
      <Group justify="center" gap="xl" style={{ pointerEvents: "none" }}>
        <MantineDropzone.Accept>
          {accept || (
            <IconUpload
              style={{
                width: rem(52),
                height: rem(52),
                color: "var(--mantine-color-blue-6)",
              }}
              stroke={1.5}
            />
          )}
        </MantineDropzone.Accept>
        <MantineDropzone.Reject>
          {reject || (
            <IconX
              style={{
                width: rem(52),
                height: rem(52),
                color: "var(--mantine-color-red-6)",
              }}
              stroke={1.5}
            />
          )}
        </MantineDropzone.Reject>
        <MantineDropzone.Idle>{idle || children}</MantineDropzone.Idle>
      </Group>
    </MantineDropzone>
  );
};
