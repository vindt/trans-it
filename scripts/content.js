const ICON_CLASS_NAME = 'transIt-icon';
const POPUP_CLASS_NAME = 'transIt-popup';
const ICON_PATH = 'images/icon-16.png';

let importedInitCredentials;
let importedTranslateTextStreaming;

import('../common/utils.js').then(({ initCredentials, translateTextStreaming }) => {
  importedInitCredentials = initCredentials;
  importedTranslateTextStreaming = translateTextStreaming;
}).catch(error => {
  console.error('Failed to import functions from utils:', error);
});

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

      importedInitCredentials(({ apiKey, aiModel }) => {
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
    importedInitCredentials(async ({ apiKey, aiModel }) => {
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

  importedTranslateTextStreaming(orgMsg, apiKey, aiModel).then(res => {
    if (document.body.contains(loadingPopup)) {
      document.body.removeChild(loadingPopup);
    }
    createPopup(res, rec);
  });
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

