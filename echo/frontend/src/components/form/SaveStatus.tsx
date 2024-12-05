import { Trans } from "@lingui/macro";
import { Group, Text } from "@mantine/core";
import { IconCheck, IconExclamationCircle, IconX } from "@tabler/icons-react";
import { formatDistance } from "date-fns";

type SaveStatusProps = {
  savedAt: string | null;
  isPendingSave: boolean;
  isSaving: boolean;
  isError: boolean;
};

export const SaveStatus = ({
  savedAt,
  isPendingSave,
  isSaving,
  isError,
}: SaveStatusProps) => {
  if (isError) {
    return (
      <StatusIcon icon={IconX}>
        <Trans>Save Error!</Trans>
      </StatusIcon>
    );
  }

  if (isSaving) {
    return (
      <StatusIcon icon={IconExclamationCircle}>
        <Trans>Saving...</Trans>
      </StatusIcon>
    );
  }

  if (!savedAt || isPendingSave) {
    return (
      <StatusIcon icon={IconExclamationCircle}>
        <Trans>Not saved yet.</Trans>
      </StatusIcon>
    );
  }

  return (
    <StatusIcon icon={IconCheck}>
      <Trans>
        Last saved{" "}
        {formatDistance(new Date(savedAt), new Date(), { addSuffix: true })}
      </Trans>
    </StatusIcon>
  );
};

const StatusIcon = ({
  icon: Icon,
  children,
}: {
  icon: any;
  children: React.ReactNode;
}) => {
  return (
    <Group gap="xs" align="center">
      <Icon size={16} />
      <Text size="sm">{children}</Text>
    </Group>
  );
};
