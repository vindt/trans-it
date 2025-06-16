# Advanced Translator Tooltip

**Translate any selected text on a webpage instantly with a tooltip or by pressing the Shift key!**

The Advanced Translator Tooltip is a powerful Chrome extension that integrates directly into your Browse experience, providing quick and seamless translations powered by your choice of Google Gemini or OpenAI GPT models.

## Features

* **Effortless Translation:** Simply select text on any webpage.
* **Intuitive UI:** A small, non-intrusive translate icon appears next to your selection. Click it, or use the Shift key for quick translation.
* **Customizable AI Provider:** Choose between Google Gemini and OpenAI GPT.
* **Flexible Model Selection:** Select specific AI models available from your chosen provider.
* **Configurable API Endpoint:** Use default API endpoints or specify your own.
* **Personalized Prompt:** Define your own translation prompt to tailor the output (e.g., "Translate to French:", "Summarize and translate to Spanish:").
* **Real-time Feedback:** Visual loading animation and clear toast messages for success or error.

## Installation Guide (Load Unpacked Extension)

Since your extension is currently in development, you'll install it as an "unpacked" extension in Chrome.

1.  **Download/Clone the Extension:**
    * If you received a `.zip` file of the extension, extract its contents to a folder on your computer (e.g., `C:\MyTranslatorExtension` or `~/MyTranslatorExtension`).
    * If you cloned from a repository, navigate to the directory where you cloned the project.

2.  **Open Chrome Extensions Page:**
    * Open your Google Chrome browser.
    * Type `chrome://extensions` into the address bar and press Enter.

    ![Screenshot of Chrome extensions page address bar](<INSERT_CHROME_EXTENSIONS_PAGE_ADDRESS_BAR_SCREENSHOT_HERE>)
    *(You will need to take a screenshot of your Chrome browser with `chrome://extensions` in the address bar.)*

3.  **Enable Developer Mode:**
    * On the Extensions page, locate the "Developer mode" toggle switch in the top right corner.
    * Click the toggle to turn it **ON**.

    ![Screenshot of Developer Mode toggle in Chrome Extensions](<INSERT_DEVELOPER_MODE_TOGGLE_SCREENSHOT_HERE>)
    *(You will need to take a screenshot of the "Developer mode" toggle switch.)*

4.  **Load Unpacked Extension:**
    * Once Developer mode is enabled, three new buttons will appear at the top. Click the "Load unpacked" button.

    ![Screenshot of Load Unpacked button](<INSERT_LOAD_UNPACKED_BUTTON_SCREENSHOT_HERE>)
    *(You will need to take a screenshot of the "Load unpacked" button.)*

5.  **Select Extension Folder:**
    * A file dialog will open. Navigate to the folder where you extracted or cloned your extension (the folder containing `manifest.json`, `background.js`, `popup.html`, etc.).
    * Select this entire folder and click "Select Folder" (or "Open" depending on your OS).

    ![Screenshot of Folder Selection Dialog](<INSERT_FOLDER_SELECTION_DIALOG_SCREENSHOT_HERE>)
    *(You will need to take a screenshot of the folder selection dialog, pointing to your extension's root directory.)*

6.  **Extension Installed:**
    * Your "Advanced Translator Tooltip" extension should now appear on the Extensions page.
    * You might want to "pin" the extension to your Chrome toolbar for easy access. Click the puzzle piece icon in your Chrome toolbar, find your extension, and click the pin icon next to it.

    ![Screenshot of Installed Extension on Extensions Page with Pin option](<INSERT_INSTALLED_EXTENSION_WITH_PIN_SCREENSHOT_HERE>)
    *(You will need to take a screenshot of your extension listed on `chrome://extensions`, highlighting the pin icon.)*

## Configuration Guide (Settings)

Before first use, or to customize its behavior, you'll need to configure your API settings.

1.  **Open Extension Popup:**
    * Click the "Advanced Translator Tooltip" icon in your Chrome toolbar (the one you just pinned). This will open the extension's popup.

    ![Screenshot of Extension Icon in Toolbar](<INSERT_EXTENSION_ICON_TOOLBAR_SCREENSHOT_HERE>)
    *(You will need to take a screenshot of your extension's icon in the Chrome toolbar.)*

2.  **Navigate to Settings:**
    * On the main popup screen (Splash Screen), click the "Settings" button (gear icon).

    ![Screenshot of Splash Screen with Settings button highlighted](<INSERT_SPLASH_SCREEN_SETTINGS_BUTTON_SCREENSHOT_HERE>)
    *(You will need to take a screenshot of the splash screen with the "Settings" button clearly visible and highlighted.)*

3.  **Configure API Settings:**
    * **AI Provider:** Select your desired AI service (e.g., "Google Gemini" or "OpenAI GPT") from the dropdown.
    * **API Key:** Enter your valid API Key for the selected provider. This is crucial for the extension to work.
        * **For Google Gemini:** Obtain your API key from the [Google AI Studio](https://aistudio.google.com/app/apikey).
        * **For OpenAI GPT:** Obtain your API key from the [OpenAI API keys page](https://platform.openai.com/account/api-keys).
    * **API Endpoint:** The default endpoint for your chosen provider will be pre-filled. You generally don't need to change this unless you're using a custom proxy or specific regional endpoint.
    * **AI Model:** Choose a specific AI model from the dropdown. The available models will update based on your selected AI Provider.
    * **Custom Prompt:** (Optional) Customize the prompt sent to the AI model. Use `{text}` as a placeholder for the selected text that will be translated.
        * *Example:* `Translate this scientific text into simplified Chinese: '{text}'`
        * Click "Reset to Default" to revert to the standard translation prompt.

    ![Screenshot of Settings Screen with fields filled](<INSERT_SETTINGS_SCREEN_FILLED_SCREENSHOT_HERE>)
    *(You will need to take a comprehensive screenshot of the settings screen with example values filled in for API Provider, API Key, AI Model, and Custom Prompt.)*

4.  **Save Settings:**
    * After making your desired changes, click the "Save Settings" button.
    * A "Settings saved successfully!" toast message will appear at the top if successful. If there are issues, an error toast will appear.

    ![Screenshot of Saved Settings Toast Message](<INSERT_SAVE_SETTINGS_TOAST_SCREENSHOT_HERE>)
    *(You will need a screenshot showing the "Settings saved successfully!" toast message at the top.)*

5.  **Go Back to Splash Screen:**
    * Click the "Back" button to return to the main splash screen.

## Usage Guide

Once configured, using the Advanced Translator Tooltip is straightforward!

1.  **Select Text:**
    * On any webpage, use your mouse to highlight and select the text you wish to translate.

    ![Screenshot of Text Selection on a Webpage](<INSERT_TEXT_SELECTION_SCREENSHOT_HERE>)
    *(You will need a screenshot of text being selected on a sample webpage.)*

2.  **Translate Icon:**
    * After selecting text, a small translate icon (your extension's icon) will appear near your selection.
    * Click this icon to initiate the translation.

    ![Screenshot of Translate Icon appearing next to selected text](<INSERT_TRANSLATE_ICON_APPEARING_SCREENSHOT_HERE>)
    *(You will need a screenshot showing the translate icon appearing next to the selected text.)*

3.  **Translate with Shift Key (Quick Translate):**
    * Alternatively, after selecting text, you can immediately press the **Shift** key on your keyboard. This will instantly trigger the translation without needing to click the icon.

    ![Screenshot showing Shift key usage for quick translate](<INSERT_SHIFT_KEY_USAGE_SCREENSHOT_HERE>)
    *(You will need a screenshot that visually implies the Shift key being pressed after text selection, perhaps with a subtle animation or text overlay.)*

4.  **View Translation:**
    * Upon successful translation, a tooltip containing the translated text will appear near your selection.
    * A "loading" animation (three dancing dots) will temporarily appear while the translation is being fetched.

    ![Screenshot of Translation Tooltip with Translated Text](<INSERT_TRANSLATION_TOOLTIP_SCREENSHOT_HERE>)
    *(You will need a screenshot showing the translation tooltip displaying the translated text.)*

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

**Thank you for using Advanced Translator Tooltip!**
