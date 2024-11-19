// import {
//   Alert,
//   Button,
//   Container,
//   Divider,
//   Group,
//   Skeleton,
//   Stack,
//   Text,
//   Title,
//   Tooltip,
// } from "@mantine/core";
// // import { useAllSessions, useCreateSessionMutation } from "../../lib/query";
// import { IconInfoCircle, IconPlus } from "@tabler/icons-react";
// import { Trans, t } from "@lingui/macro";
// import { SessionCard } from "./SessionCard";

// export const SessionSelection = () => {
//   // const allSessionsQuery = useAllSessions();
//   // const createSessionMutation = useCreateSessionMutation();

//   // const handleCreateNewSession = () => {
//   //   createSessionMutation.mutate({});
//   // };

//   return (
//     <Container>
//       <Stack className="h-full">
//         <Group justify="space-between">
//           <Title order={1}>
//             <Trans>Workspaces</Trans>
//           </Title>
//           <Tooltip label={t`Create a new workspace`}>
//             <Button
//               // loading={createSessionMutation.isPending}
//               // onClick={handleCreateNewSession}
//               variant="outline"
//               rightSection={<IconPlus size="16" />}
//             >
//               Create
//             </Button>
//           </Tooltip>
//         </Group>
//         <Divider />
//         {/* {!allSessionsQuery.data?.length && (
//           <Alert
//             title={"Welcome to Your Workspaces!"}
//             icon={<IconInfoCircle />}
//           >
//             <Trans>
//               Here you can create new workspaces to organize your projects.
//               Click "Create" to get started!
//             </Trans>
//           </Alert>
//         )}
//         <div className="grid grid-cols-12 gap-4">
//           {allSessionsQuery.data &&
//             allSessionsQuery.data.map((session) => (
//               <div
//                 key={session.id}
//                 className="col-span-12 md:col-span-6 lg:col-span-4"
//               >
//                 <SessionCard session={session} />
//               </div>
//             ))}
//           {allSessionsQuery.isLoading &&
//             [1, 2, 3, 4].map((i) => (
//               <Skeleton
//                 key={i}
//                 height={100}
//                 className="col-span-12 md:col-span-6 lg:col-span-4"
//               />
//             ))}
//         </div>
//         */}
//       </Stack>
//     </Container>
//   );
// };
