// background.js

// Import the polyfill for the service worker context
if (typeof self.browser === "undefined") {
  try {
    importScripts('browser-polyfill.js');
  } catch (e) {
    console.error(e);
  }
}

function setupRules() {
  const viewerUrl = chrome.runtime.getURL('web/viewer.html');
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [1],
    addRules: [{
      id: 1, priority: 1,
      action: { type: 'redirect', redirect: { regexSubstitution: `${viewerUrl}?file=\\1` } },
      condition: { regexFilter: '^(https?://.*\\.pdf(\\?.*)?|file://.*\\.pdf)$', resourceTypes: ['main_frame'] }
    }]
  });
}

browser.runtime.onInstalled.addListener(() => {
  setupRules();
});

// Function to get settings from storage
async function getExtensionSettings() {
  return browser.storage.sync.get([
    'apiProvider',
    'apiKey',
    'apiEndpoint',
    'aiModel',
    'customPrompt',
  ]);
}

// Function to make API call for translation
async function getTranslatedText(textToTranslate) {
  const settings = await getExtensionSettings();
  const { apiProvider, apiKey, apiEndpoint, aiModel, customPrompt } = settings;

  // --- Input Validation (unchanged) ---
  if (!apiKey) throw new Error('API Key is not set in extension settings.');
  if (!aiModel) throw new Error('AI Model is not selected in extension settings.');
  if (!apiEndpoint) throw new Error('API Endpoint is not set in extension settings.');

  // OPTIMIZATION: The `customPrompt` is now treated as system-level instructions.
  // The `textToTranslate` is the user data. We will send them separately.

  let requestUrl = apiEndpoint;
  let headers = {
    'Content-Type': 'application/json',
  };
  let body = {};

  if (apiProvider === 'gemini') {
    // Construct request URL for Gemini (unchanged)
    if (!apiEndpoint.includes(`models/${aiModel}`)) {
      if (apiEndpoint.endsWith('/')) {
        requestUrl = `${apiEndpoint}${aiModel}:generateContent`;
      } else {
        requestUrl = `${apiEndpoint}${aiModel}:generateContent`;
      }
    } else if (!apiEndpoint.endsWith(':generateContent')) {
      requestUrl = `${apiEndpoint}:generateContent`;
    }
    headers['x-goog-api-key'] = apiKey;

    // OPTIMIZATION for Gemini API: Send instructions and user text as separate parts.
    // This is more structured and efficient than a single large string.
    body = {
      contents: [
        {
          parts: [
            { text: customPrompt }, // Part 1: System instructions
            { text: textToTranslate } // Part 2: User text to translate
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
      },
    };

  } else if (apiProvider === 'openai') {
    headers['Authorization'] = `Bearer ${apiKey}`;

    // OPTIMIZATION for OpenAI API: Use the 'system' role for instructions.
    // This is the standard and most token-efficient method.
    body = {
      model: aiModel,
      messages: [
        {
          role: 'system',
          content: customPrompt, // Instructions for the model's behavior
        },
        {
          role: 'user',
          content: textToTranslate, // The actual text to translate
        },
      ],
      temperature: 0.7,
    };
  } else {
    throw new Error('Unsupported AI provider selected.');
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
      } catch (jsonError) { /* Ignore if body is not JSON */ }
      throw new Error(`API Request failed: ${errorDetail}.`);
    }

    const data = await response.json();
    let translatedText = '';

    // Data extraction logic remains the same
    if (apiProvider === 'gemini') {
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        translatedText = data.candidates[0].content.parts[0].text;
      } else {
        throw new Error('Gemini API: No translation found in response.');
      }
    } else if (apiProvider === 'openai') {
      if (data.choices?.[0]?.message?.content) {
        translatedText = data.choices[0].message.content;
      } else {
        throw new Error('OpenAI API: No translation found in response.');
      }
    }

    return translatedText;
  } catch (error) {
    throw new Error(`Failed to get translation: ${error.message}`);
  }
}

// Listener for messages from content scripts (unchanged)
browser.runtime.onMessage.addListener(async (message, sender) => {
  if (message.action === 'translateText') {
    if (!message.text || !message.rect) {
      return {
        success: false,
        error: 'No text or selection area provided for translation.',
      };
    }

    try {
      const translated = await getTranslatedText(message.text);
      await browser.tabs.sendMessage(sender.tab.id, {
        action: 'displayTranslation',
        translatedText: translated,
        selectionRect: message.rect,
      });
      return { success: true };
    } catch (error) {
      try {
        await browser.tabs.sendMessage(sender.tab.id, {
          action: 'displayTranslationError',
          errorMessage: error.message || 'An unknown error occurred.',
          selectionRect: message.rect,
        });
      } catch (sendError) {
        console.error("Failed to send error message to content script:", sendError);
      }
      return { success: false, error: error.message };
    }
  }

  if (message.action === 'translatePDFText') {
    if (!message.text) {
      return {
        success: false,
        error: 'No text provided for translation.',
      };
    }

    try {
      const translated = await getTranslatedText(message.text);
      await browser.tabs.sendMessage(sender.tab.id, {
        action: 'displayPDFTranslation',
        translatedText: translated,
      });
      return { success: true };
    } catch (error) {
     try {
        await browser.tabs.sendMessage(sender.tab.id, {
          action: 'displayPDFTranslationError',
          errorMessage: error.message || 'An unknown error occurred.',
        });
      } catch (sendError) {
        console.error("Failed to send error message to content script:", sendError);
      }
      return { success: false, error: error.message };
    }
  }
});
