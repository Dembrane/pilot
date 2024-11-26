import { Trans } from "@lingui/macro";
import { Group, Text, Tooltip } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";

export const UnsavedChanges = ({ isDirty }: { isDirty: boolean }) => {
  if (!isDirty) {
    return (
      <Text size="xs" c="gray">
        <Trans>Changes will be saved automatically</Trans>
      </Text>
    );
  }

  return (
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
  );
};
