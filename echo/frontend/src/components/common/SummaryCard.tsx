import { Group, LoadingOverlay, Paper, Stack, Text } from "@mantine/core";
import React from "react";

type SummaryCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string | React.ReactNode;
  loading?: boolean;
};

export const SummaryCard = (props: SummaryCardProps) => {
  return (
    <Paper p="md" shadow="0" className="h-full">
      <LoadingOverlay visible={props.loading} />
      <Stack align="start" justify="center" h="100%">
        <Group gap="xs">
          <div>{props.icon}</div>
          <span>{props.label}</span>
        </Group>
        {props.value}
      </Stack>
    </Paper>
  );
};
