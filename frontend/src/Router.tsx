import { Navigate, createBrowserRouter } from "react-router-dom";
import { LoginRoute } from "./routes/Login";
import { BaseLayout } from "./components/layout/BaseLayout";
import { ProjectsHomeRoute } from "./routes/project/ProjectsHome";
import { ProjectsCreateRoute } from "./routes/project/ProjectCreate";
import { ProjectOverviewRoute } from "./routes/project/ProjectOverview";
import { ProjectLayout } from "./components/layout/ProjectLayout";
import { ProjectResourceLayout } from "./components/layout/ProjectResourceLayout";
import { ProjectResourceOverviewRoute } from "./routes/project/ProjectResourceOverview";
import { ProjectResourceAnalysisRoute } from "./routes/project/ProjectResourceAnalysis";
import { ParticipantLayout } from "./components/layout/ParticipantLayout";
import { ParticipantLoginRoute } from "./routes/participant/Login";
import { ParticipantConversationRoute } from "./routes/participant/Conversation";
import { ProjectConversationLayout } from "./components/layout/ProjectConversationLayout";
import { ProjectConversationOverviewRoute } from "./routes/project/ProjectConversationOverview";
import { ProjectConversationTranscript } from "./routes/project/ProjectConversationTranscript";
import { ProjectConversationAnalysis } from "./routes/project/ProjectConversationAnalysis";
import { NotFoundRoute } from "./routes/404";

// export const _router = createBrowserRouter([
//   {
//     path: "/",
//     element: <Layout />,
//     errorElement: <NotFoundRoute />,
//     children: [
//       {
//         path: "document/:documentId",
//         element: <DocumentAnalysisRoute />,
//         errorElement: <NotFoundRoute />,
//         // loader: async ({ params }) => {
//         //   const document = await getDocumentById(params.documentId as string);
//         //   return document;
//         // },
//       },
//       {
//         element: <GlobalAnalysisRoute />,
//         index: true,
//       },
//     ],
//   },
//   {
//     path: "/session",
//     element: <BaseLayout />,
//     children: [
//       {
//         element: <SelectSession />,
//         index: true,
//       },
//       {
//         path: ":sessionId/edit",
//         element: <EditSession />,
//       },
//     ],
//   },
// ]);

/**
 *
 * /login
 * /projects
 * /projects/new
 * /projects/:projectId/overview
 * /projects/:projectId/chat
 * /projects/:projectId/resources/:resourceId/overview
 * /projects/:projectId/resources/:resourceId/chat/:chatId
 * /projects/:projectId/conversation/:conversationId/overview
 * /projects/:projectId/conversation/:conversationId/transcript
 * /projects/:projectId/conversation/:conversationId/chat/:chatId
 * /projects/:projectId/chat/:chatId
 * Use <></> for boilerplate
 */

export const mainRouter = createBrowserRouter([
  {
    index: true,
    path: "/",
    element: <Navigate to="/projects/home" />,
    errorElement: <Navigate to="/projects/home" />,
  },

  {
    path: "/login",
    element: (
      <BaseLayout>
        <LoginRoute />
      </BaseLayout>
    ),
  },
  {
    path: "/projects",
    element: <BaseLayout />,
    children: [
      {
        index: true,
        path: "home",
        element: <ProjectsHomeRoute />,
      },
      {
        path: "create",
        element: <ProjectsCreateRoute />,
      },
      {
        path: ":projectId",
        element: <ProjectLayout />,
        children: [
          {
            path: "overview",
            index: true,
            element: <ProjectOverviewRoute />,
          },
          {
            path: "chat",
            element: <></>,
          },
          {
            path: "resources/:resourceId",
            element: <ProjectResourceLayout />,

            children: [
              {
                path: "overview",
                index: true,
                element: <ProjectResourceOverviewRoute />,
              },
              {
                path: "chat",
                element: <ProjectResourceAnalysisRoute />,
              },
              // {
              //   path: "chat/:chatId",
              //   element: <>Not Implemented</>,
              // },
            ],
          },
          {
            path: "conversation/:conversationId",
            element: <ProjectConversationLayout />,
            children: [
              {
                path: "overview",
                element: <ProjectConversationOverviewRoute />,
              },
              {
                path: "transcript",
                element: <ProjectConversationTranscript />,
              },
              // {
              //   path: "chat",
              //   element: <ProjectConversationAnalysis />,
              // },
            ],
          },
          {
            path: "chat/:chatId",
            element: <></>,
          },
        ],
      },
    ],
  },
]);

export const participantRouter = createBrowserRouter([
  {
    path: "/:projectId",
    element: <ParticipantLayout />,
    errorElement: <NotFoundRoute />,
    children: [
      {
        path: "login",
        element: <ParticipantLoginRoute />,
      },
      {
        path: "conversation/:conversationId",
        element: <ParticipantConversationRoute />,
      },
      {
        path: "conversation/:conversationId/fallback",
        element: <ParticipantConversationRoute fallback />,
      },
    ],
  },
]);
