const OpenAI = require("openai");

const client = new OpenAI({
  apiKey:
    "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",
});

const getWebsiteURL = async (prompt) => {
  const response = await client.responses.create({
    model: "gpt-5",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Identify the website based on this prompt and return only the URL, check if URL is already present in the text and verify if its right and return only the URL: ${prompt}`,
          },
        ],
      },
    ],
  });
  return response.output_text;
};

const askGPT = async (screenshot, content, prompt) => {
  const screenshotBase64 = screenshot.toString("base64");
  const response = await client.responses.create({
    model: "gpt-5",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Main prompt: ${prompt}`,
          },
          {
            type: "input_text",
            text: `I am providing you with screenshot and the page content, based on those analyze what page/step we are currently in based on the main task/prompt and give me the selector and action to be performed, include inputs if required which you might have found in the main prompt.Give me the response in an aray such that I can iterate over it and perform all tasks that can be done in this screen. If the page seems to be satisfied with the main prompt, return "Done"`,
          },
          {
            type: "input_text",
            text: `Page content: ${content}`,
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_image",
            image_url: `data:image/png;base64,${screenshotBase64}`,
          },
        ],
      },
    ],
  });

  return response.output_text;
};

module.exports = { getWebsiteURL, askGPT };
