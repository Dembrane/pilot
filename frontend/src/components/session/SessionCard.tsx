// import { Group, Paper, Stack, Text } from "@mantine/core";
// import { formatRelative } from "date-fns";
// import clsx from "clsx";
// import { Link } from "react-router-dom";

// export const SessionCard = ({
//   session,
// }: {
//   session: Session;
//   active?: boolean;
// }) => {
//   return (
//     <Link to={`/workspaces/${session.id}/projects`}>
//       <Paper
//         component="a"
//         bg="transparent"
//         className={clsx(
//           `text-left p-4 border-2 w-full hover:border-primary-400`,
//         )}
//       >
//         <Stack gap="xs" className="flex-1">
//           <Group justify="space-between">
//             <Text className="font-medium">
//               {session.uuid?.slice(0, 8) ?? session.id}
//             </Text>
//             <Text size="sm" c="gray.8">
//               {formatRelative(new Date(session.created_at), new Date())}
//             </Text>
//           </Group>
//           <Text size="sm" c="gray.8">
//             {session.projects_count} Projects
//           </Text>
//         </Stack>
//       </Paper>
//     </Link>
//   );
// };
