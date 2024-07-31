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
