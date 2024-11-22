const { createDirectus, rest, readItems } = require("@directus/sdk");

// for echo content
const contentClient = createDirectus(
  "https://admin-dembrane.azurewebsites.net/"
).with(rest());

const openai = 

const main = async () => {
  const echo = await contentClient.request(
    readItems("echo__portal_tutorial_card", {
      fields: ["*", "translations.*"],
    })
  );

  console.log(echo.length);
  console.log(echo[0]);
};

main().catch(console.error);
