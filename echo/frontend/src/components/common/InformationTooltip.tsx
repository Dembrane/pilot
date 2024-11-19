import { Tooltip } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { ReactNode } from "react";

export const InformationTooltip = ({ label }: { label: ReactNode }) => {
  return (
    <Tooltip label={label}>
      <IconInfoCircle size={16} />
    </Tooltip>
  );
};
