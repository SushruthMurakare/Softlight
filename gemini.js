const { cleanHTMLForPlaywright } = require("./minimizePageContent");

const API_KEY = "AIzaSyAbNTANkYy7Jf7ebx0nhJsx8Mcjwf9gdbc";
const MODEL_NAME = "gemini-2.5-flash-preview-09-2025";
//const MODEL_NAME = "gemini-1.5-pro";

const API_URL_BASE = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

const callGeminiApi = async (url, payload) => {
  let response;
  const retries = 3;
  let delay = 1000;

  for (let i = 0; i < retries; i++) {
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.status === 429) {
        // Too many requests, retry with delay
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
        continue;
      }

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${err}`);
      }

      return await response.json();
    } catch (error) {
      if (i === retries - 1) {
        throw error; // Throw on final attempt
      }
    }
  }
};

const getWebsiteURL = async (prompt) => {
  const url = API_URL_BASE;
  //This is the actual prompt from the user that needs to be analyzed
  const systemPrompt =
    "Analyze the user's prompt to identify a single, specific website URL. Your response MUST contain ONLY the fully qualified URL (e.g., 'https://www.google.com') and nothing else. If no URL can be identified, return an empty string.";
  const userQuery = `Identify the website based on this prompt and return only the URL, check if URL is already present in the text and verify if its right and return only the URL: ${prompt}`;
  // This is the prompt that tells the model how to behave and its role
  

  const payload = {
    contents: [{ parts: [{ text: userQuery }] }],
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
  };

  try {
    const result = await callGeminiApi(url, payload);
    return result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
  } catch (e) {
    console.error("Error in getWebsiteURL:", e);
    return "";
  }
};

const askGemini = async (
  screenshot,
  content,
  prompt,
  error = null,
  prevAction = null
) => {
  const base64 = screenshot.toString("base64");
  const url = API_URL_BASE;

  const errorContext = error
    ? `

PREVIOUS ATTEMPT FAILED:
- Failed Action: ${JSON.stringify(prevAction)}
- Error: ${error}

Please analyze why this failed and provide a DIFFERENT, more specific selector or approach, try something that is unique and use that as selector .
`
    : "";

  const systemPrompt = `You are an AI web automation expert. Your task is to analyze the provided screenshot and HTML content against the user's main task.

CRITICAL SELECTOR RULES:
0. If there are multiple elements that match the selector like a list of produts, use the id of the button 
Example : #a-autoid-1-announce - this is the button id for the first product
1. ALWAYS use SPECIFIC, UNIQUE selectors that target exactly ONE element
2. NEVER use broad selectors like "a[href*='login'], button[role='link'], a[role='button']"
3. Prefer in order of specificity:
   - Exact attribute match: a[href='/login']
   - ID selectors: #login-button
   - Specific class + attribute: a.login-link[href='/login']
   - Text content via attribute: button[aria-label='Log in']
4. If multiple elements match, add MORE specificity (combine classes, attributes, or parent context)
5. Test your selector mentally - does it match exactly ONE element?

RESPONSE FORMAT:
You MUST return valid JSON with this exact structure:

{
  "taskComplete": boolean,
  "actions": [array of action objects],
  "reasoning": "string explanation",
  "guidance": "step-by-step instruction for the user explaining exactly WHERE and HOW to perform the action on the screen, written in second person ('you' or imperative)"
}

TASK COMPLETION:
- Set "taskComplete": true ONLY when the main task is fully satisfied
- Set "taskComplete": false if any steps remain

EXAMPLE ACTIONS:
Each action object must follow these patterns:

1. Click action:
{
  "action": "click",
  "selector": "specific-css-selector"
}

2. Type action:
{
  "action": "type",
  "selector": "input-css-selector",
  "value": "text to type"
}

3. Select dropdown:
{
  "action": "select",
  "selector": "select-element-selector",
  "value": "option-value"
}

5. Press key:
{
  "action": "press",
  "selector": "element-selector",
  "value": "Enter"
}
(valid keys: Enter, Escape, Tab, ArrowDown, ArrowUp, etc.)

6. Scroll to element:
{
  "action": "scroll",
  "selector": "element-selector"
}

7. Scroll page:
{
  "action": "scrollPage",
  "direction": "down",
  "amount": 500
}
(direction: "up" or "down", amount is optional, default 500)

8. Wait for element:
{
  "action": "wait",
  "selector": "element-selector"
}

SELECTOR REQUIREMENTS:
- DO NOT use jQuery syntax like :contains()
- DO NOT use XPath
- USE standard CSS selectors only
- Examples of GOOD selectors:
  ✓ "#a-autoid-2-announce"
  ✓ "#submit-button"
  ✓ "button[type='submit'][class*='primary']"
  ✓ "input[name='email']"
✓"div.modal button.close"
  ✓"a:contains('Login')"

WORKFLOW LOGIC:
1. Analyze the screenshot and HTML to understand current page state
2. Identify what step of the task we're on
3. Determine the MOST SPECIFIC selector for the next action
4. If element is not visible, add a scroll action first
5. Return sequential actions in logical order
6. Provide clear reasoning for your decisions
7. Provide clear guidance for the user on what to do next

EXAMPLE RESPONSES:

Example 1 - Login flow:
{
  "taskComplete": false,
  "actions": [
    {
      "action": "click",
      "selector": "a[href='/login']"
    }
  ],
  "reasoning": "User needs to log in. Clicking the specific login link in the header.",
 "guidance": "Look at the top right corner of the page. Click on the 'Login' link to proceed to the login page."
}

Example 2 - Form submission:
{
  "taskComplete": false,
  "actions": [
    {
      "action": "type",
      "selector": "input[name='email']",
      "value": "user@example.com"
    },
    {
      "action": "type",
      "selector": "input[name='password']",
      "value": "password123"
    },
    {
      "action": "click",
      "selector": "button[type='submit']"
    }
  ],
  "reasoning": "Filling login form with credentials and submitting.",
  "guidance": "In the email field at the top of the form, type 'user@example.com'. Then in the password field below it, type your password. Finally, click the blue 'Submit' button at the bottom of the form."
}

Example 3 - Task complete:
{
  "taskComplete": true,
  "actions": [],
  "reasoning": "Successfully logged in and dashboard is visible. Task completed.",
  "guidance": "You are now logged in and can proceed to the next task."
}

Example 4 - Scroll before action:
{
  "taskComplete": false,
  "actions": [
    {
      "action": "scrollPage",
      "direction": "down",
      "amount": 300
    },
    {
      "action": "click",
      "selector": "#footer-link"
    }
  ],
  "reasoning": "Target element is below fold, scrolling down first then clicking.",
  "guidance": "Scroll down and click the footer link."
}`;

  const userQuery = `
Main task: ${prompt}
 ${errorContext}
Current Page Content (HTML/Text). Only the first 5000 characters are shown:
---
${content.substring(0, 15000)}

---

INSTRUCTIONS:
1. Examine the screenshot carefully, and most importantly before generating actions use scroll functionality to get the element that needs to be interacted with to the very top
2. Look at the HTML content to find SPECIFIC, UNIQUE selectors
3. Determine if the task is complete or what the next action should be
4. Return a valid JSON response with taskComplete, actions array, reasoning and guidance
5. Ensure each selector is SPECIFIC enough to match exactly ONE element
6. If you see multiple similar elements (like multiple buttons or links), use additional attributes or context to make the selector unique

Analyze and provide the next action(s).`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          { text: userQuery },
            {
              inlineData: {
                mimeType: "image/png",
                data: base64,
              },
            },
        ],
      },
    ],
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        description: "Response containing task status, actions, reasoning and guidance",
        properties: {
          taskComplete: {
            type: "BOOLEAN",
            description: "Whether the task is fully completed (true/false)",
          },
          actions: {
            type: "ARRAY",
            description: "List of actions to perform on the page",
            items: {
              type: "OBJECT",
              properties: {
                action: {
                  type: "STRING",
                  description:
                    "The action to perform: 'click', 'type', 'select', 'hover', 'press', 'scroll', 'scrollPage', 'wait'",
                },
                selector: {
                  type: "STRING",
                  description:
                    "SPECIFIC CSS selector targeting exactly ONE element. Must use exact matches like a[href='/login'], #id, or button[type='submit']. NEVER use broad selectors with multiple comma-separated options.",
                },
                value: {
                  type: "STRING",
                  description:
                    "Value to input (for 'type'), option to select (for 'select'), key to press (for 'press'). Optional.",
                },
                direction: {
                  type: "STRING",
                  description:
                    "Scroll direction: 'up' or 'down'. Only for 'scrollPage' action.",
                },
                amount: {
                  type: "NUMBER",
                  description:
                    "Scroll distance in pixels. Only for 'scrollPage' action. Default: 500",
                },
              },
              required: ["action"],
            },
          },
          reasoning: {
            type: "STRING",
            description:
              "Brief explanation of why these actions are being taken and how selectors were chosen to be specific",
          },
           guidance: {
            type: "STRING",
            description:
              "Clear, specific instructions for the user explaining WHERE on the screen to look and WHAT to do, written as direct instructions (e.g., 'In the search bar at the top, type wireless mouse'). Be specific about location and action.",
          },
        },
        required: ["taskComplete", "actions", "reasoning", "guidance"],
      },
    },
  };

  try {
    const result = await callGeminiApi(url, payload);
    const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!jsonText) {
      console.error("Gemini returned no JSON text.");
      return {
        taskComplete: false,
        actions: [],
        reasoning: "No response from AI",
        guidance: "No response from AI",
      };
    }

    const parsedJson = JSON.parse(jsonText);

    // Validate the response structure
    if (!parsedJson.hasOwnProperty("taskComplete")) {
      console.error("Invalid response: missing taskComplete field");
      return {
        taskComplete: false,
        actions: [],
        reasoning: "Invalid AI response",
        guidance: "Invalid AI response",
      };
    }

    // Legacy check for "Done" status
    if (
      Array.isArray(parsedJson) &&
      parsedJson.length === 1 &&
      parsedJson[0].status === "Done"
    ) {
      return { taskComplete: true, actions: [], reasoning: "Task completed", "guidance": "Task completed" };
    }

    return parsedJson;
  } catch (e) {
    console.error("Error in askGemini or JSON parsing:", e);
    return {
      taskComplete: false,
      actions: [],
      reasoning: "Error processing AI response",
      guidance: "Error processing AI response",
    };
  }
};

module.exports = { getWebsiteURL, askGemini };
