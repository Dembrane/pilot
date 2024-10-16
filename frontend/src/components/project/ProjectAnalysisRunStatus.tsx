import { useLatestProjectAnalysisRunByProjectId } from "@/lib/query";

export const ProjectAnalysisRunStatus = ({
  projectId,
}: {
  projectId: string;
}) => {
  // const [data, setData] = useState<ProjectAnalysisRun | null>(null);

  const latestRunQuery = useLatestProjectAnalysisRunByProjectId(
    projectId ?? "",
  );

  const data = latestRunQuery.data ?? null;

  // useEffect(() => {
  //   if (latestRunQuery.data && latestRunQuery.data.length > 0) {
  //     setData(latestRunQuery.data[0]);
  //   }
  // }, [latestRunQuery.data]);

  // useEffect(() => {
  //   const fn = async () => {
  //     console.log("Subscribing to project_analysis_run");
  //     const { subscription } = await wsDirectus.subscribe(
  //       "project_analysis_run",
  //       {
  //         event: "update",
  //         query: {
  //           filter: {
  //             project_id: { _eq: projectId },
  //           },
  //           limit: 1,
  //         },
  //       },
  //     );

  //     for await (const event of subscription) {
  //       console.log("Received event", event);
  //       if (event.event === "update" && event.data && event.data.length > 0) {
  //         setData(event.data[0] as ProjectAnalysisRun);
  //       }
  //     }

  //     return () => {
  //       latestRunQuery.refetch();
  //     };
  //   };

  //   fn();
  // }, [setData]);

  if (data == null) {
    return null;
  }

  if (data.processing_status === "DONE") {
    return (
      <div className="italic text-gray-700">
        This project library was generated on{" "}
        {new Date(data.created_at).toLocaleString()}.
      </div>
    );
  }

  return (
    <div className="italic text-gray-700">
      {data.processing_status}: {data.processing_message}{" "}
    </div>
  );
};
