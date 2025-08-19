# AI Translator

**Translate any selected text on a webpage instantly with a tooltip or by pressing the Shift key!**

The AI Translator is a powerful Chrome extension that integrates directly into your Browse experience, providing quick and seamless translations powered by your choice of Google Gemini or OpenAI GPT models.

## Features

* **Effortless Translation:** Simply select text on any webpage.
* **Intuitive UI:** A small, non-intrusive translate icon appears next to your selection. Click it, or use the Shift key for quick translation.
* **Customizable AI Provider:** Choose between Google Gemini and OpenAI GPT.
* **Flexible Model Selection:** Select specific AI models available from your chosen provider.
* **Configurable API Endpoint:** Use default API endpoints or specify your own.
* **Personalized Prompt:** Define your own translation prompt to tailor the output (e.g., "Translate to French:", "Summarize and translate to Spanish:").
* **Real-time Feedback:** Visual loading animation and clear toast messages for success or error.

## Configuration Guide (Settings)

Before first use, or to customize its behavior, you'll need to configure your API settings.

1.  **Open Extension Popup:**
    * Click the "AI Translator" icon in your Chrome toolbar (the one you just pinned). This will open the extension's popup.

2.  **Navigate to Settings:**
    * On the main popup screen (Splash Screen), click the "Settings" button (gear icon).

3.  **Configure API Settings:**
    * **AI Provider:** Select your desired AI service (e.g., "Google Gemini" or "OpenAI GPT") from the dropdown.
    * **API Key:** Enter your valid API Key for the selected provider. This is crucial for the extension to work.
        * **For Google Gemini:** Obtain your API key from the [Google AI Studio](https://aistudio.google.com/app/apikey).
        * **For OpenAI GPT:** Obtain your API key from the [OpenAI API keys page](https://platform.openai.com/account/api-keys).
    * **API Endpoint:** The default endpoint for your chosen provider will be pre-filled. You generally don't need to change this unless you're using a custom proxy or specific regional endpoint.
    * **AI Model:** Choose a specific AI model from the dropdown. The available models will update based on your selected AI Provider. If your using Google Gemini, recommend `Gemini 2.0 Flash Lite` model.
    * **Custom Prompt:** (Optional) Customize the prompt sent to the AI model. Use `{text}` as a placeholder for the selected text that will be translated.
        * *Example:* `Translate this scientific text into simplified Japanese: '{text}'`
        * Click "Reset to Default" to revert to the standard translation prompt.

4.  **Save Settings:**
    * After making your desired changes, click the "Save Settings" button.
    * A "Settings saved successfully!" toast message will appear at the top if successful. If there are issues, an error toast will appear.

5.  **Go Back to Splash Screen:**
    * Click the "Back" button to return to the main splash screen.

## Usage Guide

Once configured, using the AI Translator is straightforward!

1.  **Select Text:**
    * On any webpage, use your mouse to highlight and select the text you wish to translate.

2.  **Translate Icon:**
    * After selecting text, a small translate icon (your extension's icon) will appear near your selection.
    * Click this icon to initiate the translation.

3.  **Translate with Shift Key (Quick Translate):**
    * Alternatively, after selecting text, you can immediately press the **Shift** key on your keyboard. This will instantly trigger the translation without needing to click the icon.

4.  **View Translation:**
    * Upon successful translation, a tooltip containing the translated text will appear near your selection.
    * A "loading" animation (three dancing dots) will temporarily appear while the translation is being fetched.

5.  **Dismiss Tooltip:**
    * The tooltip will automatically dismiss if you click anywhere outside of it.

## Troubleshooting

* **"API Key is not set..." error:** Go to the extension settings and ensure your API Key is correctly entered.
* **"An unknown error occurred during translation." or network errors:**
    * Check your internet connection.
    * Verify your API Key is correct and has the necessary permissions.
    * Ensure your selected API Endpoint is correct and accessible.
    * Check the developer console (`F12` -> `Console` tab) for more specific error messages from the extension.
* **Icon not appearing / extension breaking:** Reload the extension on `chrome://extensions/`. If the problem persists, try reinstalling it.
* **Translation is not what I expect:** Adjust your "Custom Prompt" in the settings to guide the AI model more effectively.

---

**Thank you for using AI Translator!**
