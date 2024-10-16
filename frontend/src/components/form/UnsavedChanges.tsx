import { Trans } from "@lingui/macro";
import { Text, Tooltip, Group } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";

export const UnsavedChanges = () => {
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
