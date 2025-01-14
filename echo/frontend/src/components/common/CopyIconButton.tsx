import { IconCheck, IconCopy } from "@tabler/icons-react";
import { ActionIcon, Tooltip } from "@mantine/core";
import useCopyToRichText from "@/hooks/useCopyToRichText";

export const CopyIconButton = ({
  onCopy,
  copied,
  size = 16,
}: {
  onCopy: () => void;
  copied: boolean;
  size?: number;
}) => {
  return (
    <Tooltip label={copied ? "Copied" : "Copy"} position="bottom">
      <ActionIcon
        p="xs"
        color={copied ? "teal" : "gray"}
        variant="subtle"
        onClick={onCopy}
      >
        {copied ? <IconCheck size={size} /> : <IconCopy size={size} />}
      </ActionIcon>
    </Tooltip>
  );
};
