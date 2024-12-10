import { Group, Text, LoadingOverlay, Paper, Stack } from "@mantine/core";
import React from "react";

type SummaryCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string | React.ReactNode;
  loading?: boolean;
};

export const SummaryCard = (props: SummaryCardProps) => {
  return (
    <Paper px="md" py="sm" shadow="0" className="basis-1/4">
      <LoadingOverlay visible={props.loading} />
      <Stack align="start" justify="center" h="100%">
        <Group gap="md">
          <div>{props.icon}</div>
          <Text size="lg">{props.label}</Text>
        </Group>
        {props.value}
      </Stack>
    </Paper>
  );
};
