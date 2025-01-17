import { IconCheck, IconCopy } from "@tabler/icons-react";
import { ActionIcon, Tooltip } from "@mantine/core";
import useCopyToRichText from "@/hooks/useCopyToRichText";

export const CopyRichTextIconButton = ({ markdown }: { markdown: string }) => {
  const { copy, copied } = useCopyToRichText();

  return (
    <Tooltip label={copied ? "Copied" : "Copy"} position="bottom">
      <ActionIcon
        size="xs"
        color={copied ? "teal" : "gray"}
        variant="subtle"
        onClick={() => copy(markdown)}
      >
        {copied ? <IconCheck /> : <IconCopy />}
      </ActionIcon>
    </Tooltip>
  );
};
