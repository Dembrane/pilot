import { Navigate, Outlet, createBrowserRouter } from "react-router-dom";
import { BaseLayout } from "./components/layout/BaseLayout";
import { ProjectsHomeRoute } from "./routes/project/ProjectsHome";
import { ProjectsCreateRoute } from "./routes/project/ProjectCreate";
import { ProjectOverviewRoute } from "./routes/project/ProjectOverview";
import { ProjectLayout } from "./components/layout/ProjectLayout";
import { ProjectResourceLayout } from "./components/layout/ProjectResourceLayout";
import { ProjectResourceOverviewRoute } from "./routes/project/ProjectResourceOverview";
import { ProjectResourceAnalysisRoute } from "./routes/project/ProjectResourceAnalysis";
import { ParticipantLayout } from "./components/layout/ParticipantLayout";
import { ParticipantLoginRoute } from "./routes/participant/ParticipantLogin";
import {
  ParticipantConversationAudioRoute,
  ParticipantConversationTextRoute,
} from "./routes/participant/Conversation";
import { ProjectConversationLayout } from "./components/layout/ProjectConversationLayout";
import { ProjectConversationOverviewRoute } from "./routes/project/ProjectConversationOverview";
import { ProjectConversationTranscript } from "./routes/project/ProjectConversationTranscript";
import { ProjectConversationAnalysis } from "./routes/project/ProjectConversationAnalysis";
import { NotFoundRoute } from "./routes/404";
import { ProjectLibrary } from "./routes/project/ProjectLibrary";
import { ProjectLibraryInsight } from "./routes/project/ProjectLibraryInsight";
import { ParticipantPostConversation } from "./routes/participant/PostConversation";
import { ProjectLibraryLayout } from "./components/layout/ProjectLibraryLayout";
import { ProjectLibraryView } from "./routes/project/ProjectLibraryView";
import { ProjectLibraryAspect } from "./routes/project/ProjectLibraryAspect";
import { LoginRoute } from "./routes/auth/Login";
import { RegisterRoute } from "./routes/auth/Register";
import { Protected } from "./components/common/Protected";
import { WorkspacesHomeRoute } from "./routes/workspaces/WorkspacesHome";
import { AuthLayout } from "./components/layout/AuthLayout";

export const mainRouter = createBrowserRouter([
  {
    path: "/:language?",
    element: <Outlet />,
    children: [
      {
        path: "",
        element: <Navigate to="/login" />,
      },
      {
        path: "login",
        element: (
          <AuthLayout>
            <LoginRoute />
          </AuthLayout>
        ),
      },
      {
        path: "register",
        element: (
          <AuthLayout>
            <RegisterRoute />
          </AuthLayout>
        ),
      },
      // {
      //   path: "welcome",
      //   element: <CheckYourEmailRoute />,
      // },
      // {
      //   path: "check-your-email",
      //   element: <CheckYourEmailRoute />,
      // },
      {
        path: "workspaces",
        element: (
          <Protected>
            <BaseLayout>
              <WorkspacesHomeRoute />
            </BaseLayout>
          </Protected>
        ),
      },
      {
        path: "workspaces/:sessionId/projects",
        element: (
          <Protected>
            {" "}
            <BaseLayout />
          </Protected>
        ),
        children: [
          {
            index: true,
            element: <ProjectsHomeRoute />,
          },
          {
            path: "create",
            element: <ProjectsCreateRoute />,
          },
          {
            path: ":projectId",
            children: [
              {
                path: "library",
                element: <ProjectLibraryLayout />,
                children: [
                  {
                    path: "views/:viewId/aspects/:aspectId",
                    element: <ProjectLibraryAspect />,
                  },
                  {
                    path: "views/:viewId",
                    element: <ProjectLibraryView />,
                  },
                  {
                    path: "insights/:insightId",
                    element: <ProjectLibraryInsight />,
                  },
                  {
                    index: true,
                    element: <ProjectLibrary />,
                  },
                ],
              },
              {
                element: <ProjectLayout />,
                children: [
                  {
                    index: true,
                    path: "overview",
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
                        index: true,
                        path: "overview",
                        element: <ProjectResourceOverviewRoute />,
                      },
                      {
                        path: "chat",
                        element: <ProjectResourceAnalysisRoute />,
                      },
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
                      {
                        path: "analysis",
                        element: <ProjectConversationAnalysis />,
                      },
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
        ],
      },
    ],
  },
]);

export const participantRouter = createBrowserRouter([
  {
    path: "/:language?/:projectId",
    element: <ParticipantLayout />,
    errorElement: <NotFoundRoute />,
    children: [
      {
        path: "login",
        element: <ParticipantLoginRoute />,
      },
      {
        path: "conversation/:conversationId",
        element: <ParticipantConversationAudioRoute isTranscriptionLive />,
        // element: <ParticipantConversationChunkedAudioRoute />,
      },
      {
        path: "conversation/:conversationId/async",
        element: (
          <ParticipantConversationAudioRoute isTranscriptionLive={false} />
        ),
        // element: <ParticipantConversationChunkedAudioRoute />,
      },
      {
        path: "conversation/:conversationId/text",
        element: <ParticipantConversationTextRoute />,
      },
      {
        path: "conversation/:conversationId/finish",
        element: <ParticipantPostConversation />,
      },
    ],
  },
]);
