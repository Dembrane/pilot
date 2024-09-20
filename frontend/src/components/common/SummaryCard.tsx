import { Text, Paper, LoadingOverlay, Stack } from "@mantine/core";
import React from "react";

type SummaryCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string | React.ReactNode;
  loading?: boolean;
};

export const SummaryCard = (props: SummaryCardProps) => {
  return (
    <Paper p="md" shadow="0">
      <LoadingOverlay visible={props.loading} />
      <Stack align="start" justify="center" h="100%">
        <div>{props.icon}</div>
        <span>{props.label}</span>
        <Text size="xl">{props.value}</Text>
      </Stack>
    </Paper>
  );
};
