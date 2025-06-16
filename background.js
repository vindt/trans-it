async function getExtensionSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      ['apiProvider', 'apiKey', 'apiEndpoint', 'aiModel', 'customPrompt'],
      function (items) {
        resolve(items);
      }
    );
  });
}

// Function to make API call for translation
async function getTranslatedText(textToTranslate) {
  const settings = await getExtensionSettings();

  const { apiProvider, apiKey, apiEndpoint, aiModel, customPrompt } = settings;

  // --- Input Validation ---
  if (!apiKey) {
    throw new Error(
      'API Key is not set in extension settings. Please go to the extension popup to set it.'
    );
  }
  if (!aiModel) {
    throw new Error(
      'AI Model is not selected in extension settings. Please select one.'
    );
  }
  if (!apiEndpoint) {
    throw new Error(
      'API Endpoint is not set in extension settings. Please set it.'
    );
  }

  const prompt = customPrompt.replace(/{text}/g, textToTranslate); // Replace {text} placeholder

  let requestUrl = apiEndpoint;
  let headers = {
    'Content-Type': 'application/json',
  };
  let body = {};

  if (apiProvider === 'gemini') {
    // Ensure the API endpoint correctly includes the model and method for Gemini
    // Example: https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
    // We handle cases where apiEndpoint might already have the model or just the base path.
    if (!apiEndpoint.includes(`models/${aiModel}`)) {
      // Append model and generateContent if not already part of the endpoint
      if (apiEndpoint.endsWith('/')) {
        // If endpoint ends with a slash (e.g., .../models/)
        requestUrl = `${apiEndpoint}${aiModel}:generateContent`;
      } else if (apiEndpoint.includes('models')) {
        // If endpoint has models but no trailing slash (e.g., .../models)
        requestUrl = `${apiEndpoint}/${aiModel}:generateContent`;
      } else {
        // Generic case, might be just the base URL
        requestUrl = `${apiEndpoint}models/${aiModel}:generateContent`;
      }
    } else if (!apiEndpoint.endsWith(':generateContent')) {
      // If model is already in path but :generateContent is missing
      requestUrl = `${apiEndpoint}:generateContent`;
    }

    headers['x-goog-api-key'] = apiKey;
    body = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
      },
    };
  } else if (apiProvider === 'openai') {
    // For OpenAI, model is in the body, endpoint is usually fixed
    headers['Authorization'] = `Bearer ${apiKey}`;
    body = {
      model: aiModel,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    };
  } else {
    throw new Error(
      'Unsupported AI provider selected. Please choose Gemini or OpenAI.'
    );
  }

  try {
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let errorDetail = `Status: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorDetail += ` - ${JSON.stringify(errorData)}`;
      } catch (jsonError) {
        // If response is not JSON, use status text
      }
      throw new Error(
        `API Request failed: ${errorDetail}. Please check your API key, model, or endpoint.`
      );
    }

    const data = await response.json();
    let translatedText = '';

    if (apiProvider === 'gemini') {
      if (
        data.candidates &&
        data.candidates.length > 0 &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts.length > 0
      ) {
        translatedText = data.candidates[0].content.parts[0].text;
      } else {
        throw new Error(
          'Gemini API: No translation found in response or unexpected format.'
        );
      }
    } else if (apiProvider === 'openai') {
      if (
        data.choices &&
        data.choices.length > 0 &&
        data.choices[0].message &&
        data.choices[0].message.content
      ) {
        translatedText = data.choices[0].message.content;
      } else {
        throw new Error(
          'OpenAI API: No translation found in response or unexpected format.'
        );
      }
    }

    return translatedText;
  } catch (error) {
    throw new Error(
      `Failed to get translation: ${
        error.message || 'Network or unexpected error occurred.'
      }`
    );
  }
}

// Listener for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'translateText') {
    if (message.text && message.rect) {
      getTranslatedText(message.text)
        .then((translated) => {
          // Send the translated text and the original rect back to the content script
          chrome.tabs
            .sendMessage(sender.tab.id, {
              action: 'displayTranslation',
              translatedText: translated,
              selectionRect: message.rect, // Pass the original rect back
            })
            .then(() => {
              sendResponse({ success: true }); // Acknowledge to content script
            })
            .catch((error) => {
              sendResponse({
                success: false,
                error:
                  'Failed to send translation to content script due to internal communication error.',
              });
            });
        })
        .catch((error) => {
          chrome.tabs
            .sendMessage(sender.tab.id, {
              action: 'displayTranslationError', // New action for errors
              errorMessage:
                error.message ||
                'An unknown error occurred during translation.',
            })
            .then(() => {
              sendResponse({ success: false, error: error.message });
            })
            .catch((sendError) => {
              sendResponse({
                success: false,
                error:
                  'Failed to send translation error to content script due to internal communication error.',
              });
            });
        });
    } else {
      sendResponse({
        success: false,
        error: 'No text or selection area provided for translation.',
      });
    }
    // Return true to indicate that sendResponse will be called asynchronously
    return true;
  }
});
