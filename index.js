const { chromium } = require("playwright");
const { getWebsiteURL, askGemini } = require("./gemini.js");
const { generateHTMLGuide } = require("./genHTML.js");

//const task = `Go to linkedin and click on sign in option and sign in with username - sushruthmurakare@gmail.com & password-Fulltimejob@2025 and open messaging option and start a chat with Sushma K`;
//const url = "https://www.google.com";
//const task = `"How do I search about best programming lauguage from duck duck go ?"`;

const runAutomation = async (task) => {
  const guideSteps = [];
  const url = await getWebsiteURL(task);
  //const url = "https://www.amazon.com";

  try{
  const browser = await chromium.launch({
    headless: true,
     args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage"
  ],
  });

  const context = await browser.newContext({
    viewport: null,
  });
  const page = await context.newPage();
  await page.goto(url);

  let taskCompleted = false;
  let step = 0;
  let lastError = null;
  let failedAction = null;
  const MAX_RETRIES = 3;
  let retryCount = 0;

  while (!taskCompleted && retryCount < MAX_RETRIES) {
    console.log("Started while loop:");

    let screenshot = await page.screenshot();
    let pageContent = await page.content();

    const gptResponse = await askGemini(
      screenshot,
      pageContent,
      task,
      lastError,
      failedAction
    );
    console.log("Fetched gpt reponse based on image and content:", gptResponse);

    if (gptResponse.taskComplete === true) {
      taskCompleted = true;
      const finalScreenshot = await page.screenshot();
      guideSteps.push({
        stepNumber: step + 1,
        screenshot: finalScreenshot.toString("base64"),
        guidance: gptResponse?.guidance || "Task completed successfully",
      });

      break;
    }

    const actions = gptResponse?.actions || [];

    try {
      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        try {
          if (action.action === "click") {
            await page.click(action.selector);
            await page.waitForTimeout(1000);
          } else if (action.action === "press") {
            await page.locator(action.selector).press(action.value);
            await page.waitForTimeout(1000);
          } else if (action.action === "type") {
            await page.fill(action.selector, action.value);
            await page.waitForTimeout(1000);
          } else if (action.action === "scroll") {
            await page.locator(action.selector).scrollIntoViewIfNeeded();
          } else if (action.action === "scrollPage") {
            const distance = action.amount || 500;
            const dir = action.direction === "up" ? -distance : distance;
            await page.evaluate((d) => window.scrollBy(0, d), dir);
          } else if (action.action === "select") {
            await page.selectOption(action.selector, action.value);
            await page.waitForTimeout(2000);
          } else if (action.action === "wait") {
            await page.waitForSelector(action.selector, { state: "visible" });
          } else {
            console.log(`Unknown action: ${action.action}`);
          }
          // screenshot = await page.screenshot({
          //   path: `screenshots/inner-${i + 1}.png`,
          // });
          console.log("Step:", i + 1, "Action:", action);
          step += 1;
          guideSteps.push({
            stepNumber: step,
            screenshot: screenshot.toString("base64"),
            guidance: gptResponse?.guidance || "No guidance provided",
          });
          await page.waitForTimeout(1000);
          lastError = null;
          failedAction = null;
          retryCount = 0;
        } catch (actionError) {
          console.log("Action error:", actionError);
          lastError = actionError;
          failedAction = action;
          retryCount++;

          // await page.screenshot({
          //   path: `screenshots/error-step-${step}-action-${i + 1}.png`,
          // });

          throw actionError;
        }
      }
    } catch (err) {
      console.error(
        `Retry ${retryCount}/${MAX_RETRIES} - Error: ${err.message}`
      );

      if (retryCount >= MAX_RETRIES) {
        console.error(" Max retries reached. Stopping automation.");
        taskCompleted = true;
      }
    }
  }
  if (taskCompleted || retryCount >= MAX_RETRIES) {
    await browser.close();
  }

  const finalHTML = await generateHTMLGuide(guideSteps, task);
  if (finalHTML) {
    return finalHTML;
  }
}
finally{
   if (browser) {
      await browser.close().catch(console.error);
    }
}
};

module.exports = { runAutomation };
