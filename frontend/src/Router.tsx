import { Navigate, createBrowserRouter } from "react-router-dom";
import { BaseLayout } from "./components/layout/BaseLayout";
import { ProjectsHomeRoute } from "./routes/project/ProjectsHome";
import { ProjectsCreateRoute } from "./routes/project/ProjectCreate";
import { ProjectOverviewRoute } from "./routes/project/ProjectOverview";
import { ProjectLayout } from "./components/layout/ProjectLayout";
import { ProjectResourceLayout } from "./components/layout/ProjectResourceLayout";
import { ProjectResourceOverviewRoute } from "./routes/project/resource/ProjectResourceOverview";
import { ProjectResourceAnalysisRoute } from "./routes/project/resource/ProjectResourceAnalysis";
import { LanguageLayout } from "./components/layout/LanguageLayout";
import { ParticipantLoginRoute } from "./routes/participant/ParticipantLogin";
import {
  ParticipantConversationAudioRoute,
  ParticipantConversationTextRoute,
} from "./routes/participant/Conversation";
import { ProjectConversationLayout } from "./components/layout/ProjectConversationLayout";
import { ProjectConversationOverviewRoute } from "./routes/project/conversation/ProjectConversationOverview";
import { ProjectConversationTranscript } from "./routes/project/conversation/ProjectConversationTranscript";
import { ProjectConversationAnalysis } from "./routes/project/conversation/ProjectConversationAnalysis";
import { NotFoundRoute } from "./routes/404";
import { ProjectLibraryRoute } from "./routes/project/library/ProjectLibrary";
import { ProjectLibraryInsight } from "./routes/project/library/ProjectLibraryInsight";
import { ParticipantPostConversation } from "./routes/participant/PostConversation";
import { ProjectLibraryLayout } from "./components/layout/ProjectLibraryLayout";
import { ProjectLibraryView } from "./routes/project/library/ProjectLibraryView";
import { ProjectLibraryAspect } from "./routes/project/library/ProjectLibraryAspect";
import { LoginRoute } from "./routes/auth/Login";
import { RegisterRoute } from "./routes/auth/Register";
import { Protected } from "./components/common/Protected";
// import { WorkspacesHomeRoute } from "./routes/workspaces/WorkspacesHome";
import { AuthLayout } from "./components/layout/AuthLayout";
import { CheckYourEmailRoute } from "./routes/auth/CheckYourEmail";
import { VerifyEmailRoute } from "./routes/auth/VerifyEmail";
import { PasswordResetRoute } from "./routes/auth/PasswordReset";
import { RequestPasswordResetRoute } from "./routes/auth/RequestPasswordReset";
import { Text } from "@mantine/core";
import { ProjectChatRoute } from "./routes/project/chat/ProjectChat";

export const mainRouter = createBrowserRouter([
  {
    path: "/:language?",
    element: <LanguageLayout />,
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
      {
        path: "check-your-email",
        element: (
          <AuthLayout>
            <CheckYourEmailRoute />
          </AuthLayout>
        ),
      },
      {
        path: "password-reset",
        element: (
          <AuthLayout>
            <PasswordResetRoute />
          </AuthLayout>
        ),
      },
      {
        path: "request-password-reset",
        element: (
          <AuthLayout>
            <RequestPasswordResetRoute />
          </AuthLayout>
        ),
      },
      {
        path: "verify-email",
        element: (
          <AuthLayout>
            <VerifyEmailRoute />
          </AuthLayout>
        ),
      },

      // {
      //   path: "workspaces",
      //   element: (
      //     <Protected>
      //       <BaseLayout>
      //         <WorkspacesHomeRoute />
      //       </BaseLayout>
      //     </Protected>
      //   ),
      // },

      {
        // path: "workspaces/:sessionId/projects",
        path: "projects",

        // path: "projects",
        element: (
          <Protected>
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
                    element: <ProjectLibraryRoute />,
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
                    element: <ProjectChatRoute />,
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
    element: <LanguageLayout />,
    errorElement: <NotFoundRoute />,
    children: [
      {
        path: "login",
        element: <ParticipantLoginRoute />,
      },
      {
        path: "conversation/:conversationId",
        element: <ParticipantConversationAudioRoute isTranscriptionLive />,
      },
      {
        path: "conversation/:conversationId/async",
        element: (
          <ParticipantConversationAudioRoute isTranscriptionLive={false} />
        ),
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
