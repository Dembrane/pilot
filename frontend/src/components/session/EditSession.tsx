// import { useParams } from "react-router-dom";
// import { useSessionById, useUpdateSessionById } from "../../lib/query";
// import { Container, LoadingOverlay, Stack, Title } from "@mantine/core";
// import { NotFoundRoute } from "../../routes/404";

// export const EditSession = () => {
//   const sessionId = useParams<{ sessionId: string }>().sessionId;
//   const sessionQuery = useSessionById(sessionId ?? "");
//   const updateSessionMutation = useUpdateSessionById();

//   if (sessionQuery.isLoading) {
//     return <LoadingOverlay visible />;
//   }

//   if (sessionQuery.isError) {
//     return <NotFoundRoute />;
//   }

//   return (
//     <Container>
//       <Stack>
//         <Title order={1}>Edit session</Title>
//         <Stack></Stack>
//       </Stack>
//     </Container>
//   );
// };
