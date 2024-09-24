import { DIRECTUS_PUBLIC_URL } from "@/config";
import { createDirectus, rest, realtime, authentication } from "@directus/sdk";

export const directus = createDirectus<CustomDirectusTypes>(DIRECTUS_PUBLIC_URL)
  .with(
    authentication("session", { credentials: "include", autoRefresh: true }),
  )
  .with(
    rest({
      credentials: "include",
    }),
  );

// remove any http or https from the url
const directusBaseUrl = ((DIRECTUS_PUBLIC_URL as string) ?? "").replace(
  /^(https?:\/\/)/,
  "",
);

const useSecureWebsocket = location.protocol === "https:";

export const wsDirectus = createDirectus<CustomDirectusTypes>(
  (useSecureWebsocket ? "wss://" : "ws://") + directusBaseUrl + "/websocket",
)
  .with(
    authentication("session", { credentials: "include", autoRefresh: true }),
  )
  .with(realtime());

wsDirectus.connect().then(() => {
  console.log("Connected to realtime");
});

// TODO: localization
export const getDirectusErrorString = (error: any) => {
  if (error.errors && error.errors.length > 0) {
    return error.errors[0].message;
  }

  if (error.response?.status === 401) {
    return "You are not authenticated";
  }

  if (error.response?.status === 403) {
    return "You don't have permission to access this.";
  }

  if (error.response?.status === 404) {
    return "Resource not found";
  }

  if (error.response?.status === 500) {
    return "Server error";
  }

  return "Something went wrong";
};
