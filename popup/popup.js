document.addEventListener('DOMContentLoaded', initPopup);

const SPLASH_SCREEN_ID = 'splashScreen';
const SETTINGS_SCREEN_ID = 'settingsScreen';
const API_PROVIDER_ID = 'apiProvider';
const AI_MODEL_ID = 'aiModel';
const API_ENDPOINT_ID = 'apiEndpoint';
const CUSTOM_PROMPT_ID = 'customPrompt';
const API_KEY_ID = 'apiKey';
const SAVE_SETTINGS_BTN_ID = 'saveSettings';
const GO_TO_SETTINGS_BTN_ID = 'goToSettingsBtn';
const BACK_TO_SPLASH_BTN_ID = 'backToSplashBtn';
const CANCEL_SETTINGS_BTN_ID = 'cancelSettings';
const RESET_PROMPT_BTN_ID = 'resetPromptBtn';
const TOAST_CONTAINER_ID = 'toastContainer';

const AI_MODELS = {
  gemini: [
    { value: 'gemini-pro', text: 'Gemini Pro' },
    { value: 'gemini-2.5-flash-preview-05-20', text: 'Gemini 2.5 Flash (Preview)' },
    { value: 'gemini-2.5-flash-preview-tts', text: 'Gemini 2.5 Flash (Preview TTS)' },
    { value: 'gemini-2.5-pro-preview-06-05', text: 'Gemini 2.5 Pro (Preview)' },
    { value: 'gemini-2.5-pro-preview-tts', text: 'Gemini 2.5 Pro (Preview TTS)' },
    { value: 'gemini-2.0-flash', text: 'Gemini 2.0 Flash (Latest)' },
    { value: 'gemini-2.0-flash-lite', text: 'Gemini 2.0 Flash Lite (Latest)' },
    { value: 'gemini-1.5-flash', text: 'Gemini 1.5 Flash (Latest)' },
    { value: 'gemini-1.5-pro', text: 'Gemini 1.5 Pro (Latest)' },
  ],
  openai: [
    { value: 'gpt-3.5-turbo', text: 'GPT-3.5 Turbo' },
    { value: 'gpt-4', text: 'GPT-4' },
    { value: 'gpt-4o', text: 'GPT-4o' },
    { value: 'gpt-4-turbo', text: 'GPT-4 Turbo' },
  ],
};

const DEFAULT_ENDPOINTS = {
  gemini: 'https://generativelanguage.googleapis.com/v1beta/models/',
  openai: 'https://api.openai.com/v1/chat/completions',
};

const DEFAULT_TRANSLATION_PROMPT = `### ROLE AND GOAL
You are an expert technical translator specializing in Information Technology (IT) and software development localization. Your sole task is to translate the provided text into Vietnamese with the highest degree of technical and contextual accuracy.

### CORE DIRECTIVES

1.  **IT Contextual Accuracy:** Prioritize IT industry-standard terminology.
    *   **Example 1:** Translate "framework" as "framework" or "nền tảng" not the literal "khung làm việc"
    *   **Example 2:** "clean code" must be "clean code" not the literal "mã sạch"
    *   **Example 3:** A Git "commit" must be translated as "commit," not "cam kết"
    *   **Example 4:** "Deployment" must be "deployment" or "triển khai"
    *   For ambiguous terms, choose the meaning most relevant to software, networking, or data science.

2.  **Format Preservation:** Strictly maintain the original formatting of the source text. This includes all line breaks, paragraph spacing, markdown (\`**bold**\`, \`*italics*\`), lists, and \`code blocks\`.

3.  **Output Purity:** Your response must contain **only** the translated Vietnamese text. Do not include any headers, explanations, greetings, or any text other than the direct translation itself.

### TASK

Translate the following text:`;

function initPopup() {
  document
    .getElementById(GO_TO_SETTINGS_BTN_ID)
    .addEventListener('click', () => switchView(SETTINGS_SCREEN_ID));
  document
    .getElementById(BACK_TO_SPLASH_BTN_ID)
    .addEventListener('click', () => switchView(SPLASH_SCREEN_ID));
  document
    .getElementById(SAVE_SETTINGS_BTN_ID)
    .addEventListener('click', saveSettings);
  document
    .getElementById(CANCEL_SETTINGS_BTN_ID)
    .addEventListener('click', cancelSettings);
  document
    .getElementById(RESET_PROMPT_BTN_ID)
    .addEventListener('click', resetPromptToDefault);
  document
    .getElementById(API_PROVIDER_ID)
    .addEventListener('change', updateModelAndEndpointDefaults);

  loadSettings();

  const splashScreen = document.getElementById(SPLASH_SCREEN_ID);
  const container = document.querySelector('.container');

  splashScreen.style.position = 'relative';
  splashScreen.style.visibility = 'hidden';
  splashScreen.classList.remove('hidden');

  setTimeout(() => {
    const initialHeight = splashScreen.scrollHeight;
    container.style.height = `${initialHeight}px`;

    splashScreen.style.position = 'absolute';
    splashScreen.style.visibility = 'visible';
    splashScreen.classList.add('hidden');
    switchView(SPLASH_SCREEN_ID);
  }, 50);
}

function switchView(viewId) {
  const splashScreen = document.getElementById(SPLASH_SCREEN_ID);
  const settingsScreen = document.getElementById(SETTINGS_SCREEN_ID);
  const container = document.querySelector('.container');

  let targetView;
  let currentView;

  if (viewId === SETTINGS_SCREEN_ID) {
    targetView = settingsScreen;
    currentView = splashScreen;
    loadSettings();
  } else {
    targetView = splashScreen;
    currentView = settingsScreen;
  }

  targetView.style.position = 'relative';
  targetView.style.visibility = 'hidden';
  targetView.style.opacity = '0';
  targetView.classList.remove('hidden');

  requestAnimationFrame(() => {
    const targetHeight = targetView.scrollHeight;
    container.style.height = `${targetHeight}px`;
    setTimeout(() => {
      currentView.classList.remove('active');
      currentView.classList.add('hidden');
      targetView.classList.remove('hidden');
      targetView.classList.add('active');
      targetView.style.position = 'absolute';
      targetView.style.visibility = 'visible';
      targetView.style.opacity = '1';
    }, 150);
  });
}

function removeToast(toastElement) {
  if (toastElement && toastElement.parentNode) {
    toastElement.classList.remove('show');
    toastElement.style.opacity = '0';
    toastElement.style.transform = 'translateY(-20px)';
    setTimeout(() => {
      if (toastElement && toastElement.parentNode) {
        toastElement.parentNode.removeChild(toastElement);
      }
    }, 300);
  }
}

function showStatus(message, isError = false) {
  let toastContainer = document.getElementById(TOAST_CONTAINER_ID);
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = TOAST_CONTAINER_ID;
    document.body.appendChild(toastContainer);
  }
  const toastMessage = document.createElement('div');
  toastMessage.classList.add('toast-message');
  toastMessage.classList.add(isError ? 'error' : 'success');
  const messageText = document.createElement('span');
  messageText.textContent = message;
  toastMessage.appendChild(messageText);
  const closeButton = document.createElement('button');
  closeButton.classList.add('toast-close-btn');
  closeButton.innerHTML = '&times;';
  closeButton.title = 'Dismiss message';
  closeButton.addEventListener('click', () => removeToast(toastMessage));
  toastMessage.appendChild(closeButton);
  toastContainer.appendChild(toastMessage);
  requestAnimationFrame(() => {
    toastMessage.classList.add('show');
  });
  if (!isError) {
    setTimeout(() => removeToast(toastMessage), 3000);
  }
}

async function loadSettings() {
  const items = await browser.storage.sync.get([
    'apiProvider',
    'apiKey',
    'apiEndpoint',
    'aiModel',
    'customPrompt',
  ]);
  document.getElementById(API_PROVIDER_ID).value = items.apiProvider || 'gemini';
  document.getElementById(API_KEY_ID).value = items.apiKey || '';
  document.getElementById(API_ENDPOINT_ID).value = items.apiEndpoint || DEFAULT_ENDPOINTS['gemini'];
  document.getElementById(CUSTOM_PROMPT_ID).value = items.customPrompt || DEFAULT_TRANSLATION_PROMPT;
  updateModelAndEndpointDefaults();
  if (items.aiModel) {
    document.getElementById(AI_MODEL_ID).value = items.aiModel;
  } else {
    document.getElementById(AI_MODEL_ID).value = document.getElementById(AI_MODEL_ID).options[0]?.value || '';
  }
}

async function saveSettings() {
  const apiProvider = document.getElementById(API_PROVIDER_ID).value;
  const apiKey = document.getElementById(API_KEY_ID).value;
  const apiEndpoint = document.getElementById(API_ENDPOINT_ID).value;
  const aiModel = document.getElementById(AI_MODEL_ID).value;
  const customPrompt = document.getElementById(CUSTOM_PROMPT_ID).value;
  try {
    await browser.storage.sync.set({
      apiProvider: apiProvider,
      apiKey: apiKey,
      apiEndpoint: apiEndpoint,
      aiModel: aiModel,
      customPrompt: customPrompt,
    });
    showStatus('Settings saved successfully!');
  } catch (error) {
    showStatus(`Error saving settings: ${error.message}`, true);
  }
}

function updateModelAndEndpointDefaults() {
  const provider = document.getElementById(API_PROVIDER_ID).value;
  const aiModelSelect = document.getElementById(AI_MODEL_ID);
  const apiEndpointInput = document.getElementById(API_ENDPOINT_ID);
  aiModelSelect.innerHTML = '';
  const models = AI_MODELS[provider] || [];
  models.forEach((model) => {
    const option = document.createElement('option');
    option.value = model.value;
    option.textContent = model.text;
    aiModelSelect.appendChild(option);
  });
  const currentEndpointValue = apiEndpointInput.value;
  const defaultEndpoint = DEFAULT_ENDPOINTS[provider];
  if (
    currentEndpointValue === '' ||
    (provider === 'gemini' && currentEndpointValue.includes('openai.com')) ||
    (provider === 'openai' && currentEndpointValue.includes('googleapis.com'))
  ) {
    apiEndpointInput.value = defaultEndpoint;
  }
  aiModelSelect.value = aiModelSelect.options[0]?.value || '';
}

function cancelSettings() {
  loadSettings();
  showStatus('Changes discarded.', false);
  switchView(SPLASH_SCREEN_ID);
}

function resetPromptToDefault() {
  document.getElementById(CUSTOM_PROMPT_ID).value = DEFAULT_TRANSLATION_PROMPT;
  showStatus('Prompt reset to default.', false);
}
