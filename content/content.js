// content/content.js

let currentTooltip = null;
let dismissListenerAdded = false;
let lastSelectedText = '';
let lastSelectionRect = null;
let isShiftPressed = false;
let isTranslating = false;
let translationIcon = null;
let loadingAnimation = null;

function removeTooltip() {
  if (currentTooltip) {
    currentTooltip.classList.remove(
      'show',
      'tooltip-below-selection',
      'tooltip-above-selection'
    );
    setTimeout(() => {
      if (currentTooltip && currentTooltip.parentNode) {
        currentTooltip.parentNode.removeChild(currentTooltip);
      }
      currentTooltip = null;
    }, 200);
    if (dismissListenerAdded) {
      document.removeEventListener('click', handleDocumentClick);
      dismissListenerAdded = false;
    }
  }
}

function handleDocumentClick(event) {
  if (currentTooltip && !currentTooltip.contains(event.target)) {
    removeTooltip();
    removeTranslationIcon();
    hideLoadingAnimation();
  }
}

// MODIFIED: Added isError parameter to handle text/html safely
async function showTranslationTooltip(translatedText, overallSelectionRect, isError = false) {
  removeTooltip();
  removeTranslationIcon();
  hideLoadingAnimation();

  currentTooltip = document.createElement('div');
  currentTooltip.id = 'translation-tooltip';

  // --- FIX 1: SECURELY SET TOOLTIP CONTENT ---
  if (isError) {
    // For internally generated error messages, textContent is safest.
    currentTooltip.textContent = translatedText;
  } else {
    // For API responses, sanitize the HTML with DOMPurify before using innerHTML.
    // This allows safe tags (like <b>, <i>, <br>) but removes dangerous ones (<script>).
    currentTooltip.innerHTML = DOMPurify.sanitize(translatedText);
  }
  // --- END FIX 1 ---

  currentTooltip.style.maxWidth = `${Math.max(
    overallSelectionRect.width,
    200
  )}px`;
  document.body.appendChild(currentTooltip);

  requestAnimationFrame(() => {
    if (!currentTooltip) return;

    const tooltipRect = currentTooltip.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const scrollY = window.scrollY || window.pageYOffset;
    const scrollX = window.scrollX || window.pageXOffset;
    const padding = 10;
    let finalLeft;
    const selectionCenterX = overallSelectionRect.left + overallSelectionRect.width / 2;
    finalLeft = selectionCenterX - tooltipRect.width / 2;
    finalLeft += scrollX;

    if (finalLeft < scrollX) {
      finalLeft = scrollX;
    } else if (finalLeft + tooltipRect.width > viewportWidth + scrollX) {
      finalLeft = viewportWidth + scrollX - tooltipRect.width;
      if (finalLeft < scrollX) finalLeft = scrollX;
    }

    let finalTop;
    const potentialTopBelow = overallSelectionRect.bottom + padding + scrollY;
    const potentialTopAbove = overallSelectionRect.top - tooltipRect.height - padding + scrollY;

    if (potentialTopBelow + tooltipRect.height <= viewportHeight + scrollY) {
      finalTop = potentialTopBelow;
      currentTooltip.classList.add('tooltip-below-selection');
    } else if (potentialTopAbove >= scrollY) {
      finalTop = potentialTopAbove;
      currentTooltip.classList.add('tooltip-above-selection');
    } else {
      finalTop = potentialTopBelow;
      currentTooltip.classList.add('tooltip-below-selection');
    }
    currentTooltip.style.left = `${Math.floor(finalLeft)}px`;
    currentTooltip.style.top = `${Math.floor(finalTop)}px`;
    currentTooltip.classList.add('show');

    if (!dismissListenerAdded) {
      setTimeout(() => {
        document.addEventListener('click', handleDocumentClick);
        dismissListenerAdded = true;
      }, 100);
    }
  });
}


function showTranslationIcon(selectionRect) {
  removeTooltip();
  hideLoadingAnimation();
  if (!translationIcon) {
    translationIcon = document.createElement('div');
    translationIcon.id = 'translation-icon';
    document.body.appendChild(translationIcon);

    // --- FIX 2: USE DOM MANIPULATION INSTEAD OF innerHTML ---
    translationIcon.textContent = ''; // Clear previous content
    const img = document.createElement('img');
    img.src = browser.runtime.getURL('images/icon48.png');
    img.alt = 'Translate';
    img.title = 'Click to Translate';
    translationIcon.appendChild(img);
    // --- END FIX 2 ---

    translationIcon.style.opacity = '0';
    translationIcon.style.visibility = 'hidden';
    translationIcon.style.pointerEvents = 'none';
    translationIcon.addEventListener('click', handleIconClick);
  }

  const iconRect = translationIcon.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  const scrollY = window.scrollY || window.pageYOffset;
  const scrollX = window.scrollX || window.pageXOffset;
  const padding = 10;
  let finalLeft, finalTop;
  const belowLeft = selectionRect.left + selectionRect.width / 2 - iconRect.width / 2;
  const belowTop = selectionRect.bottom + padding;
  const rightLeft = selectionRect.right + padding;
  const rightTop = selectionRect.top + selectionRect.height / 2 - iconRect.height / 2;
  const aboveLeft = selectionRect.left + selectionRect.width / 2 - iconRect.width / 2;
  const aboveTop = selectionRect.top - iconRect.height - padding;

  if (belowTop + iconRect.height <= viewportHeight && belowLeft >= 0 && belowLeft + iconRect.width <= viewportWidth) {
    finalLeft = belowLeft + scrollX;
    finalTop = belowTop + scrollY;
  } else if (rightLeft + iconRect.width <= viewportWidth && rightTop >= 0 && rightTop + iconRect.height <= viewportHeight) {
    finalLeft = rightLeft + scrollX;
    finalTop = rightTop + scrollY;
  } else if (aboveTop >= 0 && aboveLeft >= 0 && aboveLeft + iconRect.width <= viewportWidth) {
    finalLeft = aboveLeft + scrollX;
    finalTop = aboveTop + scrollY;
  } else {
    finalLeft = selectionRect.right + scrollX - iconRect.width;
    finalTop = selectionRect.bottom + scrollY + padding;
    if (finalLeft < scrollX) finalLeft = scrollX;
    if (finalLeft + iconRect.width > viewportWidth + scrollX) finalLeft = viewportWidth + scrollX - iconRect.width;
    if (finalTop < scrollY) finalTop = scrollY;
    if (finalTop + iconRect.height > viewportHeight + scrollY) finalTop = viewportHeight + scrollY - iconRect.height;
  }
  translationIcon.style.left = `${Math.floor(finalLeft)}px`;
  translationIcon.style.top = `${Math.floor(finalTop)}px`;
  translationIcon.style.opacity = '1';
  translationIcon.style.visibility = 'visible';
  translationIcon.style.pointerEvents = 'auto';
  translationIcon.classList.add('show');
}

function removeTranslationIcon() {
  if (translationIcon && translationIcon.parentNode) {
    translationIcon.classList.remove('show');
    translationIcon.style.opacity = '0';
    translationIcon.style.pointerEvents = 'none';
    setTimeout(() => {
      if (translationIcon) {
        translationIcon.style.visibility = 'hidden';
      }
    }, 200);
  }
}

function showLoadingAnimation(selectionRect) {
  removeTooltip();
  removeTranslationIcon();
  if (!loadingAnimation) {
    loadingAnimation = document.createElement('div');
    loadingAnimation.id = 'translation-loading';
    loadingAnimation.innerHTML = `<span></span><span></span><span></span>`;
    document.body.appendChild(loadingAnimation);
    loadingAnimation.style.opacity = '0';
    loadingAnimation.style.visibility = 'hidden';
    loadingAnimation.style.pointerEvents = 'none';
  }
  const loadingRect = loadingAnimation.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  const scrollY = window.scrollY || window.pageYOffset;
  const scrollX = window.scrollX || window.pageXOffset;
  const padding = 10;
  let finalLeft, finalTop;
  const selectionCenterX = selectionRect.left + selectionRect.width / 2;
  finalLeft = selectionCenterX - loadingRect.width / 2;
  finalLeft += scrollX;
  if (finalLeft < scrollX) {
    finalLeft = scrollX;
  } else if (finalLeft + loadingRect.width > viewportWidth + scrollX) {
    finalLeft = viewportWidth + scrollX - loadingRect.width;
    if (finalLeft < scrollX) {
      finalLeft = scrollX;
    }
  }
  const potentialTopBelow = selectionRect.bottom + padding + scrollY;
  const potentialTopAbove =
    selectionRect.top - loadingRect.height - padding + scrollY;
  if (potentialTopBelow + loadingRect.height <= viewportHeight + scrollY) {
    finalTop = potentialTopBelow;
  } else if (potentialTopAbove >= scrollY) {
    finalTop = potentialTopAbove;
  } else {
    finalTop = Math.max(scrollY, selectionRect.bottom + scrollY + padding);
    if (finalTop + loadingRect.height > viewportHeight + scrollY) {
      finalTop = viewportHeight + scrollY - loadingRect.height;
    }
  }
  loadingAnimation.style.left = `${Math.floor(finalLeft)}px`;
  loadingAnimation.style.top = `${Math.floor(finalTop)}px`;
  loadingAnimation.style.opacity = '1';
  loadingAnimation.style.visibility = 'visible';
  loadingAnimation.style.pointerEvents = 'auto';
  loadingAnimation.classList.add('show');
}

function hideLoadingAnimation() {
  if (loadingAnimation && loadingAnimation.parentNode) {
    loadingAnimation.classList.remove('show');
    loadingAnimation.style.opacity = '0';
    loadingAnimation.style.pointerEvents = 'none';
    setTimeout(() => {
      if (loadingAnimation) {
        loadingAnimation.style.visibility = 'hidden';
      }
    }, 200);
  }
}

async function handleIconClick() {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  if (selectedText.length > 0 && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const selectionRect = range.getBoundingClientRect();
    if (selectionRect.width > 0 || selectionRect.height > 0) {
      lastSelectedText = selectedText;
      lastSelectionRect = {
        x: selectionRect.x, y: selectionRect.y, width: selectionRect.width,
        height: selectionRect.height, top: selectionRect.top, right: selectionRect.right,
        bottom: selectionRect.bottom, left: selectionRect.left,
      };
      if (!isTranslating) {
        isTranslating = true;
        showLoadingAnimation(lastSelectionRect);
        try {
          const response = await browser.runtime.sendMessage({
            action: 'translateText', text: lastSelectedText, rect: lastSelectionRect,
          });
          if (response && !response.success) {
            console.error('Content Script: Translation request failed:', response.error);
          }
        } catch (error) {
          console.error('Content Script: Error sending translation message:', error.message);
        } finally {
          isTranslating = false;
        }
      }
      return;
    }
  }
  lastSelectedText = '';
  lastSelectionRect = null;
  removeTooltip();
  removeTranslationIcon();
  hideLoadingAnimation();
}

document.addEventListener('mouseup', function (event) {
  if (currentTooltip || (loadingAnimation && loadingAnimation.style.visibility === 'visible')) {
    removeTranslationIcon();
    return;
  }
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  if (selectedText.length > 0 && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const selectionRect = range.getBoundingClientRect();
    if (selectionRect.width > 0 || selectionRect.height > 0) {
      if (selectedText === lastSelectedText && translationIcon && translationIcon.style.visibility === 'visible') {
        return;
      }
      lastSelectedText = selectedText;
      lastSelectionRect = {
        x: selectionRect.x, y: selectionRect.y, width: selectionRect.width,
        height: selectionRect.height, top: selectionRect.top, right: selectionRect.right,
        bottom: selectionRect.bottom, left: selectionRect.left,
      };
      showTranslationIcon(lastSelectionRect);
    } else {
      lastSelectedText = '';
      lastSelectionRect = null;
      removeTooltip();
      removeTranslationIcon();
      hideLoadingAnimation();
    }
  } else {
    lastSelectedText = '';
    lastSelectionRect = null;
    removeTooltip();
    removeTranslationIcon();
    hideLoadingAnimation();
  }
});

document.addEventListener('selectionchange', function () {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed || selection.toString().trim().length === 0) {
    if (lastSelectedText !== '' || (translationIcon && translationIcon.style.visibility === 'visible') || (loadingAnimation && loadingAnimation.style.visibility === 'visible')) {
      lastSelectedText = '';
      lastSelectionRect = null;
      removeTooltip();
      removeTranslationIcon();
      hideLoadingAnimation();
    }
  }
});

document.addEventListener('keydown', async function (event) {
  if (event.key === 'Shift') {
    const selection = window.getSelection();
    const currentSelectedText = selection.toString().trim();
    if (currentSelectedText.length > 0 && selection.rangeCount > 0) {
      const currentRange = selection.getRangeAt(0);
      const currentSelectionRect = currentRange.getBoundingClientRect();
      if (currentSelectionRect.width > 0 || currentSelectionRect.height > 0) {
        if (!isShiftPressed && !isTranslating) {
          isShiftPressed = true;
          isTranslating = true;
          lastSelectedText = currentSelectedText;
          lastSelectionRect = {
            x: currentSelectionRect.x, y: currentSelectionRect.y, width: currentSelectionRect.width,
            height: currentSelectionRect.height, top: currentSelectionRect.top, right: currentSelectionRect.right,
            bottom: currentSelectionRect.bottom, left: currentSelectionRect.left,
          };
          showLoadingAnimation(lastSelectionRect);
          try {
            const response = await browser.runtime.sendMessage({
              action: 'translateText', text: lastSelectedText, rect: lastSelectionRect,
            });
            if (response && !response.success) {
              console.error('Content Script: Translation request failed:', response.error);
            }
          } catch (error) {
            console.error('Content Script: Error sending translation message:', error.message);
          } finally {
            isTranslating = false;
          }
        }
      } else {
        lastSelectedText = '';
        lastSelectionRect = null;
        removeTooltip();
        removeTranslationIcon();
        hideLoadingAnimation();
      }
    } else {
      lastSelectedText = '';
      lastSelectionRect = null;
      removeTooltip();
      removeTranslationIcon();
      hideLoadingAnimation();
    }
  }
});

document.addEventListener('keyup', function (event) {
  if (event.key === 'Shift') {
    isShiftPressed = false;
  }
});

browser.runtime.onMessage.addListener((message, sender) => {
  if (message.action === 'displayTranslation') {
    hideLoadingAnimation();
    if (message.translatedText && message.selectionRect) {
      showTranslationTooltip(message.translatedText, message.selectionRect, false);
      return Promise.resolve({ success: true });
    } else {
      return Promise.resolve({ success: false, error: 'Missing data.' });
    }
  } else if (message.action === 'displayTranslationError') {
    hideLoadingAnimation();
    if (message.errorMessage && message.selectionRect) {
      showTranslationTooltip(`Error: ${message.errorMessage}`, message.selectionRect, true);
      return Promise.resolve({ success: true });
    } else {
      return Promise.resolve({ success: false, error: 'Missing error data.' });
    }
  }
});
