import { Group, Text, Tooltip } from "@mantine/core";
import { Trans } from "@lingui/macro";

interface FormLabelProps {
  label: React.ReactNode;
  isDirty?: boolean;
}

export const FormLabel = ({ label, isDirty }: FormLabelProps) => {
  return (
    <Group gap="xs" align="center">
      <Text size="sm" fw={500}>
        {label}
      </Text>
      {isDirty && (
        <Tooltip label={<Trans>Unsaved changes</Trans>}>
          <div
            className="h-1.5 w-1.5 rounded-full bg-blue-500"
            role="presentation"
          />
        </Tooltip>
      )}
    </Group>
  );
};
