import { Trans } from "@lingui/macro";
import { Group, Text, Tooltip } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { formatRelative } from "date-fns";
import { LoadingSpinner } from "../common/LoadingSpinner";

export const UnsavedChanges = ({
  isDirty,
  isSaving,
  lastSavedAt,
}: {
  isDirty: boolean;
  isSaving?: boolean;
  lastSavedAt?: Date;
}) => {
  if (!isDirty) {
    return (
      <Group gap="md">
        <Text size="xs" c="gray">
          {lastSavedAt ? (
            <Trans>Last saved {formatRelative(lastSavedAt, new Date())}</Trans>
          ) : (
            <Trans>Changes will be saved automatically</Trans>
          )}
        </Text>
        {isSaving && <LoadingSpinner />}
      </Group>
    );
  }

  return (
    <Group gap="md">
      <Text size="xs" c="gray">
        <Tooltip
          label={
            <Trans>
              Changes are saved automatically as you continue to use the app.{" "}
              <br />
              Once you have some unsaved changes, you can click anywhere to save
              the changes. <br />
              You will also see a button to Cancel the changes.
            </Trans>
          }
        >
          <Group gap="xs">
            <Trans>Unsaved changes</Trans>
            <IconInfoCircle size="16px" />
          </Group>
        </Tooltip>
      </Text>
      {isSaving && <LoadingSpinner />}
    </Group>
  );
};
