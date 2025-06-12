const DEFAULT_MODEL = 'gemini-2.0-flash';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/';

const ICON_CLASS_NAME = 'transIt-icon';
const POPUP_CLASS_NAME = 'transIt-popup';
const ICON_PATH = 'images/icon-16.png';

document.addEventListener(
  'selectionchange',
  debounce(async function () {
    removeOldIconsAndPopup();

    const currentSelection = getCurrentSelection();
    if (
      currentSelection.anchorNode?.parentElement?.type === 'password' ||
      !currentSelection.toString().trim()
    ) {
      return;
    }

    let orgText = currentSelection.toString().trim();
    if (!orgText || orgText.length === 0) {
      return;
    }

    const rect = currentSelection.getRangeAt(0).getBoundingClientRect();
    let icon = appendTranslateIcon(rect);

    icon.addEventListener('click', async function () {
      removeOldIconsAndPopup();

      initCredentials(({ apiKey, aiModel }) => {
        handleTranslation(rect, currentSelection.toString().trim(), apiKey, aiModel);
      });
    });
  }, 150)
);

document.addEventListener('keydown', async function (event) {
  removeOldIconsAndPopup();

  if (event.key === 'Shift') {
    const currentSelection = getCurrentSelection();
    if (
      currentSelection.anchorNode?.parentElement?.type === 'password' ||
      !currentSelection.toString().trim()
    ) {
      return;
    }

    let orgText = currentSelection.toString().trim();
    if (!orgText || orgText.length === 0) {
      return;
    }
    const rect = currentSelection.getRangeAt(0).getBoundingClientRect();
    initCredentials(async ({ apiKey, aiModel }) => {
      handleTranslation(rect, orgText, apiKey, aiModel);
    });
  }
});

async function handleTranslation(rec, orgMsg, apiKey, aiModel) {
  const loadingPopup = createPopup('', rec);
  const loadingSvg = `<svg style="width:40px;height:30px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><circle fill="#7E7274" stroke="#7E7274" stroke-width="15" r="15" cx="40" cy="100"><animate attributeName="opacity" calcMode="spline" dur="2" values="1;0;1;" keySplines=".5 0 .5 1;.5 0 .5 1" repeatCount="indefinite" begin="-.4"></animate></circle><circle fill="#7E7274" stroke="#7E7274" stroke-width="15" r="15" cx="100" cy="100"><animate attributeName="opacity" calcMode="spline" dur="2" values="1;0;1;" keySplines=".5 0 .5 1;.5 0 .5 1" repeatCount="indefinite" begin="-.2"></animate></circle><circle fill="#7E7274" stroke="#7E7274" stroke-width="15" r="15" cx="160" cy="100"><animate attributeName="opacity" calcMode="spline" dur="2" values="1;0;1;" keySplines=".5 0 .5 1;.5 0 .5 1" repeatCount="indefinite" begin="0"></animate></circle></svg>`;
  loadingPopup.innerHTML = loadingSvg;
  loadingPopup.style.transform = `translate(${rec.width / 2 + rec.x - 15}px, ${rec.bottom + window.scrollY + 10}px) scale(0.9375)`;
  loadingPopup.style.padding = '0';
  document.body.appendChild(loadingPopup); 

  translateTextStreaming(orgMsg, apiKey, aiModel).then(res => {
    if (document.body.contains(loadingPopup)) {
      document.body.removeChild(loadingPopup);
    }
    createPopup(res, rec);
  });
}

async function translateTextStreaming(text, apiKey, aiModel) {
  const fullUrl = `${API_URL}${aiModel}:streamGenerateContent?alt=json&key=${apiKey}`;
  const prompt = `Translate the following text to Vietnamese. Pay close attention to accuracy, technical terminology within the field of Information Technology, and maintain the original formatting as precisely as possible. Do not add any introductory or concluding phrases. Only output the translated Vietnamese text. The text to translate is: "${text}"`;
  const response = await fetch(fullUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });

  if (response.status !== 200) {
    return `Something went wrong. Please try again later.<br/>Error: ${response.status}`;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let result = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }

  return JSON.parse(result)
    .map((item) => item.candidates[0].content.parts[0].text)
    .join('');
}

function appendTranslateIcon(rect) {
  const icon = document.createElement('img');
  icon.className = ICON_CLASS_NAME;
  icon.src = chrome.runtime.getURL(ICON_PATH);

  icon.style.left = '0px';
  icon.style.top = '0px';
  icon.style.position = 'absolute';
  icon.style.transform = `translate(${rect.width / 2 + rect.x - 7.5}px, ${
    rect.bottom + window.scrollY + 10
  }px) scale(0.9375)`;
  icon.style.zIndex = '9999';
  icon.style.cursor = 'pointer';
  icon.style.opacity = '1';
  icon.style.transition = 'opacity 0.2s';
  icon.title = 'Click to translate';

  document.body.appendChild(icon);
  return icon;
}

function createPopup(content, rect) {
  const popup = document.createElement('div');
  popup.className = POPUP_CLASS_NAME;
  popup.innerHTML = `<span style="font-size: medium; white-space: pre-wrap;">${content}</span>`;
  
  popup.style.left = '0px';
  popup.style.top = '0px';
  popup.style.maxWidth = `${rect.width}px`;
  popup.style.height = 'auto';
  popup.style.position = 'absolute';
  document.body.appendChild(popup);

  const middle = rect.x + rect.width / 2;
  const translateX = middle - popup.offsetWidth / 2;
  const maxWidth = rect.width < 200 ? 200 : rect.width;
  popup.style.cssText = `
    left: 0px;
    top: 0px;
    max-width: ${maxWidth}px;
    height: auto;
    position: absolute;
    z-index: 9999;
    opacity: 1;
    transition: opacity 0.2s;
    background-color: white;
    border: 1px solid #ccc;
    border-radius: 5px;
    padding: 10px;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
    font-size: 14px;
    line-height: 1.5;
    color: #333;
  `;
  popup.style.transform = `translate(${translateX - 5}px, ${
    rect.bottom + 10 + window.scrollY
  }px) scale(0.9375)`;

  return popup;
}

function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function removeOldIconsAndPopup() {
  [...document.getElementsByClassName(ICON_CLASS_NAME), ...document.getElementsByClassName(POPUP_CLASS_NAME)]
    .forEach((elm) => document.body.removeChild(elm));
}

function getCurrentSelection() {
  return document.getSelection ? document.getSelection() : document.selection.createRange();
}

function initCredentials(callback) {
  chrome.storage.sync.get(['apiKey', 'aiModel'], (result) => {
    if (!result.apiKey) {
      alert('Please provide an API key in the extension options.');
      return;
    }
    const aiModel = result.aiModel || DEFAULT_MODEL;
    if (!result.aiModel) {
      chrome.storage.sync.set({ aiModel }, () => {
        callback({ apiKey: result.apiKey, aiModel });
      });
    } else {
      // console.log(`Using AI Model: ${aiModel}`);
      callback({ apiKey: result.apiKey, aiModel });
    }
  });
}
