document.addEventListener('DOMContentLoaded', initPopup);

const SPLASH_SCREEN_ID = 'splashScreen';
const SETTINGS_SCREEN_ID = 'settingsScreen';
const API_PROVIDER_ID = 'apiProvider';
const AI_MODEL_ID = 'aiModel';
const API_ENDPOINT_ID = 'apiEndpoint';
const CUSTOM_PROMPT_ID = 'customPrompt';
// Removed TARGET_LANGUAGE_ID constant
const API_KEY_ID = 'apiKey';
const STATUS_ELEMENT_ID = 'status';
const SAVE_SETTINGS_BTN_ID = 'saveSettings';
const GO_TO_SETTINGS_BTN_ID = 'goToSettingsBtn';
const BACK_TO_SPLASH_BTN_ID = 'backToSplashBtn';
const CANCEL_SETTINGS_BTN_ID = 'cancelSettings';
const RESET_PROMPT_BTN_ID = 'resetPromptBtn';

// Supported AI Models
const AI_MODELS = {
  gemini: [
    { value: 'gemini-pro', text: 'Gemini Pro' },
    { value: 'gemini-1.5-flash-latest', text: 'Gemini 1.5 Flash (Latest)' },
    { value: 'gemini-1.5-pro-latest', text: 'Gemini 1.5 Pro (Latest)' },
  ],
  openai: [
    { value: 'gpt-3.5-turbo', text: 'GPT-3.5 Turbo' },
    { value: 'gpt-4', text: 'GPT-4' },
    { value: 'gpt-4o', text: 'GPT-4o' },
    { value: 'gpt-4-turbo', text: 'GPT-4 Turbo' },
  ],
};

// Default API Endpoints
const DEFAULT_ENDPOINTS = {
  gemini: 'https://generativelanguage.googleapis.com/v1beta/models/',
  openai: 'https://api.openai.com/v1/chat/completions',
};

const DEFAULT_TRANSLATION_PROMPT =
  'Detect the language of the following text, then translate it into Vietnamese, focusing on accuracy, technical terminology (especially in Information Technology), and preserving original formatting. Do not include any introductory or concluding phrases, just the translated text: "{text}"';

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
  updateModelAndEndpointDefaults();

  const splashScreen = document.getElementById(SPLASH_SCREEN_ID);
  const container = document.querySelector('.container');

  splashScreen.style.position = 'relative';
  splashScreen.style.visibility = 'hidden';
  splashScreen.classList.remove('hidden');

  const initialHeight = splashScreen.scrollHeight + 100; // Increased buffer
  container.style.height = `${initialHeight}px`;

  splashScreen.style.position = 'absolute';
  splashScreen.style.visibility = 'visible';
  splashScreen.classList.add('hidden');

  switchView(SPLASH_SCREEN_ID);
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
  } else {
    targetView = splashScreen;
    currentView = settingsScreen;
  }

  targetView.style.position = 'relative';
  targetView.style.visibility = 'hidden';
  targetView.style.opacity = '0';
  targetView.classList.remove('hidden');

  const targetHeight = targetView.scrollHeight + 100; // Increased buffer

  container.style.height = `${targetHeight}px`;

  setTimeout(() => {
    currentView.classList.remove('active');
    currentView.classList.add('hidden');

    targetView.classList.remove('hidden');
    targetView.classList.add('active');

    targetView.style.position = 'absolute';
    targetView.style.visibility = 'visible';
    targetView.style.opacity = '1';
  }, 300);
}

function showStatus(message, isError = false) {
  const toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    console.error('Toast container not found!');
    return;
  }

  const toast = document.createElement('div');
  toast.textContent = message;
  toast.classList.add('toast-message');
  if (isError) {
    toast.classList.add('error');
  } else {
    toast.classList.add('success');
  }

  toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    toast.addEventListener(
      'transitionend',
      () => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      },
      { once: true }
    );
  }, 3000);
}

function loadSettings() {
  chrome.storage.sync.get(
    [
      'apiProvider',
      'apiKey',
      'apiEndpoint',
      'aiModel',
      'customPrompt', // Removed 'targetLanguage'
    ],
    function (items) {
      document.getElementById(API_PROVIDER_ID).value =
        items.apiProvider || 'gemini';
      document.getElementById(API_KEY_ID).value = items.apiKey || '';
      document.getElementById(API_ENDPOINT_ID).value = items.apiEndpoint || '';
      document.getElementById(CUSTOM_PROMPT_ID).value =
        items.customPrompt || DEFAULT_TRANSLATION_PROMPT;
      // Removed line for targetLanguage: document.getElementById(TARGET_LANGUAGE_ID).value = items.targetLanguage || 'vi';

      updateModelAndEndpointDefaults();
      if (items.aiModel) {
        document.getElementById(AI_MODEL_ID).value = items.aiModel;
      }
    }
  );
}

function saveSettings() {
  const apiProvider = document.getElementById(API_PROVIDER_ID).value;
  const apiKey = document.getElementById(API_KEY_ID).value;
  const apiEndpoint = document.getElementById(API_ENDPOINT_ID).value;
  const aiModel = document.getElementById(AI_MODEL_ID).value;
  const customPrompt = document.getElementById(CUSTOM_PROMPT_ID).value;
  // Removed targetLanguage variable: const targetLanguage = document.getElementById(TARGET_LANGUAGE_ID).value;

  chrome.storage.sync.set(
    {
      apiProvider,
      apiKey,
      apiEndpoint,
      aiModel,
      customPrompt, // Removed targetLanguage
    },
    function () {
      if (chrome.runtime.lastError) {
        showStatus(
          'Error saving settings: ' + chrome.runtime.lastError.message,
          true
        );
      } else {
        showStatus('Settings saved successfully!');
      }
    }
  );
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
