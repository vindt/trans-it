const AI_MODEL = 'gemini-2.0-pro-exp-02-05';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/';

const API_KEY = 'YOUR-API-KEY-HERE'; // Replace 'your-api-key-here' with your actual API key

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

    let icon = appendTranslateIcon(currentSelection);

    icon.addEventListener('click', async function () {
      await handleTranslation(currentSelection, orgText);
    });

    document.addEventListener('keydown', async function (event) {
      if (event.key === 'Shift') {
      await handleTranslation(currentSelection, orgText);
      }
    });

    async function handleTranslation(currentSelection, orgText) {
      let loadingPopup = document.createElement('div');
      loadingPopup.className = POPUP_CLASS_NAME;
      loadingPopup.innerHTML = `<span style="font-size: small">Translating...</span>`;
      let range = currentSelection.getRangeAt(0);
      let rect = range.getBoundingClientRect();

      loadingPopup.style.left = '0px';
      loadingPopup.style.top = '0px';
      loadingPopup.style.maxWidth = `${rect.width}px`;
      loadingPopup.style.height = 'auto';
      loadingPopup.style.position = 'absolute';
      document.body.appendChild(loadingPopup);

      let middle = rect.x + rect.width / 2;
      let translateX = middle - loadingPopup.offsetWidth / 2;

      loadingPopup.style.transform = `translate(${translateX}px, ${
        rect.bottom + 10 + window.scrollY
      }px) scale(0.9375)`;
      loadingPopup.style.zIndex = '9999';
      loadingPopup.style.opacity = '1';
      loadingPopup.style.transition = 'opacity 0.2s';
      loadingPopup.style.backgroundColor = 'white';
      loadingPopup.style.border = '1px solid #ccc';
      loadingPopup.style.borderRadius = '5px';
      loadingPopup.style.padding = '10px';
      loadingPopup.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';
      loadingPopup.style.fontSize = '14px';
      loadingPopup.style.lineHeight = '1.5';
      loadingPopup.style.color = '#333';

      let translatedText = await translateTextStreaming(orgText);

      // Remove loading animation
      document.body.removeChild(loadingPopup);

      let popup = document.createElement('div');
      popup.className = POPUP_CLASS_NAME;
      popup.innerHTML = `<span style="font-size: medium; white-space: pre-wrap;">${translatedText}</span>`;
      popup.style.left = '0px';
      popup.style.top = '0px';
      popup.style.maxWidth = `${rect.width}px`;
      popup.style.height = 'auto';
      popup.style.position = 'absolute';
      document.body.appendChild(popup);

      middle = rect.x + rect.width / 2;
      translateX = middle - popup.offsetWidth / 2;

      popup.style.transform = `translate(${translateX}px, ${
        rect.bottom + 10 + window.scrollY
      }px) scale(0.9375)`;
      popup.style.zIndex = '9999';
      popup.style.opacity = '1';
      popup.style.transition = 'opacity 0.2s';
      popup.style.backgroundColor = 'white';
      popup.style.border = '1px solid #ccc';
      popup.style.borderRadius = '5px';
      popup.style.padding = '10px';
      popup.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';
      popup.style.fontSize = '14px';
      popup.style.lineHeight = '1.5';
      popup.style.color = '#333';
    }
    document.body.appendChild(icon);
  }, 250)
);

async function translateTextStreaming(text) {
  const fullUrl = `${API_URL}${AI_MODEL}:streamGenerateContent?alt=json&key=${API_KEY}`;
  const prompt = `Translate this text into Vietnamese, maintaining its original format and within the context of Information Technology. Only return the translated text: ${text}`;
  const response = await fetch(fullUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });

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

function appendTranslateIcon(currentSelection) {
  const icon = document.createElement('img');
  icon.className = ICON_CLASS_NAME;
  icon.src = chrome.runtime.getURL(ICON_PATH);

  let range = currentSelection.getRangeAt(0);
  let rect = range.getBoundingClientRect();

  icon.style.left = '0px';
  icon.style.top = '0px';
  icon.style.position = 'absolute';
  icon.style.transform = `translate(${rect.width / 2 + rect.x}px, ${
    rect.bottom + window.scrollY + 10
  }px) scale(0.9375)`;
  icon.style.zIndex = '9999';
  icon.style.cursor = 'pointer';
  icon.style.opacity = '1';
  icon.style.transition = 'opacity 0.2s';
  icon.title = 'Click to translate';

  return icon;
}
// TODO: Fix the popup position
// function createPopup(content, currentSelection) {
//   const popup = document.createElement('div');
//   popup.className = POPUP_CLASS_NAME;
//   popup.innerHTML = `<span style="font-size: medium">${content}</span>`;
  
//   const rect = currentSelection.getRangeAt(0).getBoundingClientRect();
//   const middle = rect.x + rect.width / 2;
//   const translateX = middle - popup.offsetWidth / 2;

//   popup.style.cssText = `
//     left: 0px;
//     top: 0px;
//     max-width: ${rect.width}px;
//     height: auto;
//     position: absolute;
//     z-index: 9999;
//     opacity: 1;
//     transition: opacity 0.2s;
//     background-color: white;
//     border: 1px solid #ccc;
//     border-radius: 5px;
//     padding: 10px;
//     box-shadow: 0 0 10px rgba(0,0,0,0.1);
//     font-size: 14px;
//     line-height: 1.5;
//     color: #333;
//   `;
//   popup.style.transform = `translate(${translateX}px, ${
//     rect.bottom + 10 + window.scrollY
//   }px) scale(0.9375)`;

//   return popup;
// }

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
