import { Paper, LoadingOverlay, Stack } from "@mantine/core";

type SummaryCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  loading?: boolean;
};

export const SummaryCard = (props: SummaryCardProps) => {
  return (
    <Paper p="md" shadow="0">
      <LoadingOverlay visible={props.loading} />
      <Stack>
        {props.icon}
        <span>{props.label}</span>
        <span>{props.value}</span>
      </Stack>
    </Paper>
  );
};
