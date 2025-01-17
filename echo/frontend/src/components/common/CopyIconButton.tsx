import { t } from "@lingui/core/macro";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import { ActionIcon, ActionIconProps, Tooltip } from "@mantine/core";

export const CopyIconButton = ({
  onCopy,
  copied,
  copyTooltip = t`Copy`,
  size = 16,
  ...props
}: {
  copyTooltip?: string;
  onCopy: () => void;
  copied: boolean;
} & ActionIconProps) => {
  return (
    <Tooltip label={copied ? t`Copied` : copyTooltip} position="bottom">
      <ActionIcon
        p="xs"
        color={copied ? "teal" : "gray"}
        variant="subtle"
        onClick={onCopy}
        {...props}
      >
        {copied ? <IconCheck size={size} /> : <IconCopy size={size} />}
      </ActionIcon>
    </Tooltip>
  );
};
