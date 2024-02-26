import { Layout } from "../components/Layout";
import { createBrowserRouter } from "react-router-dom";
import { GlobalAnalysisRoute } from "./GlobalAnalysis";
import { DocumentAnalysisRoute } from "./DocumentAnalysis";
import { NotFoundRoute } from "./404";
import { getDocumentById } from "../lib/query";
import { SelectSessionRoute } from "./SelectSession";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <NotFoundRoute />,
    children: [
      {
        path: "session",
        element: <SelectSessionRoute />,
      },
      {
        path: "document/:documentId",
        element: <DocumentAnalysisRoute />,
        errorElement: <NotFoundRoute />,
        loader: async ({ params }) => {
          const document = await getDocumentById(params.documentId as string);
          return document;
        },
      },
      {
        element: <GlobalAnalysisRoute />,
        index: true,
      },
    ],
  },
]);
