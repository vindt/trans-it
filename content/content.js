let currentTooltip = null;
let dismissListenerAdded = false;
let lastSelectedText = '';
let lastSelectionRect = null; // Stores the overall bounding rect of the selection
let isShiftPressed = false; // Flag to track Shift key state
let isTranslating = false; // Flag to prevent multiple rapid translation requests
let translationIcon = null; // Reference to the translation icon (created once)
let loadingAnimation = null; // Reference to the loading animation (created once)

// Function to remove the current tooltip
function removeTooltip() {
  if (currentTooltip) {
    currentTooltip.classList.remove(
      'show',
      'tooltip-below-selection',
      'tooltip-above-selection'
    ); // Remove all related classes
    // Give it a moment to fade out before removing from DOM
    setTimeout(() => {
      if (currentTooltip && currentTooltip.parentNode) {
        currentTooltip.parentNode.removeChild(currentTooltip);
      }
      currentTooltip = null;
    }, 200); // Should match CSS transition duration

    // Remove the document click listener if it was added
    if (dismissListenerAdded) {
      document.removeEventListener('click', handleDocumentClick);
      dismissListenerAdded = false;
    }
  }
}

// Global click handler to dismiss tooltip when clicking outside
function handleDocumentClick(event) {
  if (currentTooltip && !currentTooltip.contains(event.target)) {
    removeTooltip();
    removeTranslationIcon(); // Explicitly remove icon too when dismissing tooltip
    hideLoadingAnimation(); // Ensure loading is hidden too
  }
}

// Function to create and position the tooltip
async function showTranslationTooltip(translatedText, overallSelectionRect) {
  removeTooltip(); // Remove any existing tooltip first
  removeTranslationIcon(); // Ensure icon is hidden when tooltip shows
  hideLoadingAnimation(); // Ensure loading is hidden when tooltip shows

  currentTooltip = document.createElement('div');
  currentTooltip.id = 'translation-tooltip';
  currentTooltip.innerHTML = translatedText; // Use innerHTML to preserve formatting

  // Set max-width based on selection, ensuring a minimum for readability.
  currentTooltip.style.maxWidth = `${Math.max(
    overallSelectionRect.width,
    200
  )}px`;

  document.body.appendChild(currentTooltip);

  // Use requestAnimationFrame for tooltip as it's larger and might benefit from browser optimization
  requestAnimationFrame(() => {
    // IMPORTANT: Re-check if currentTooltip is null here.
    // In rare asynchronous scenarios, it might have been removed before this callback fires.
    if (!currentTooltip) {
      return;
    }
    const tooltipRect = currentTooltip.getBoundingClientRect(); // Get actual rendered dimensions
    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight;
    const viewportWidth =
      window.innerWidth || document.documentElement.clientWidth;
    const scrollY = window.scrollY || window.pageYOffset;
    const scrollX = window.scrollX || window.pageXOffset;

    const padding = 10; // Padding between selection and tooltip

    let finalLeft;
    // Calculate the horizontal center of the selected text range
    const selectionCenterX =
      overallSelectionRect.left + overallSelectionRect.width / 2;

    // Calculate the ideal left position to center the tooltip on the selection's center
    finalLeft = selectionCenterX - tooltipRect.width / 2;

    // Add scrollX to get document-relative position
    finalLeft += scrollX;

    // Horizontal boundary checks
    if (finalLeft < scrollX) {
      finalLeft = scrollX;
    } else if (finalLeft + tooltipRect.width > viewportWidth + scrollX) {
      finalLeft = viewportWidth + scrollX - tooltipRect.width;
      if (finalLeft < scrollX) {
        finalLeft = scrollX;
      }
    }

    let finalTop;
    const potentialTopBelow = overallSelectionRect.bottom + padding + scrollY;
    const potentialTopAbove =
      overallSelectionRect.top - tooltipRect.height - padding + scrollY;

    // Determine vertical position: below first, then above
    if (potentialTopBelow + tooltipRect.height <= viewportHeight + scrollY) {
      finalTop = potentialTopBelow;
      currentTooltip.classList.add('tooltip-below-selection'); // Add class for arrow pointing up
      currentTooltip.classList.remove('tooltip-above-selection'); // Ensure only one class is active
    } else if (potentialTopAbove >= scrollY) {
      finalTop = potentialTopAbove;
      currentTooltip.classList.add('tooltip-above-selection'); // Add class for arrow pointing down
      currentTooltip.classList.remove('tooltip-below-selection'); // Ensure only one class is active
    } else {
      // Fallback: If neither above nor below has full space, try to fit best
      if (potentialTopBelow >= scrollY) {
        finalTop = potentialTopBelow;
        currentTooltip.classList.add('tooltip-below-selection');
        currentTooltip.classList.remove('tooltip-above-selection');
      } else {
        finalTop = Math.max(
          scrollY,
          overallSelectionRect.top + scrollY - tooltipRect.height
        );
        currentTooltip.classList.add('tooltip-above-selection');
        currentTooltip.classList.remove('tooltip-below-selection');
      }
    }

    // Apply Math.floor to final positions for pixel-perfect rendering
    currentTooltip.style.left = `${Math.floor(finalLeft)}px`;
    currentTooltip.style.top = `${Math.floor(finalTop)}px`;

    currentTooltip.classList.add('show');

    if (!dismissListenerAdded) {
      setTimeout(() => {
        // Small delay to prevent immediate dismissal on same click that triggers it
        document.addEventListener('click', handleDocumentClick);
        dismissListenerAdded = true;
      }, 100);
    }
  });
}

// Function to create and position the translation icon
function showTranslationIcon(selectionRect) {
  // Ensure any existing tooltip or loading animation is removed
  removeTooltip();
  hideLoadingAnimation();

  // Create the icon element only once
  if (!translationIcon) {
    translationIcon = document.createElement('div');
    translationIcon.id = 'translation-icon';
    translationIcon.innerHTML = `<img src="${chrome.runtime.getURL(
      'images/icon48.png'
    )}" alt="Translate" title="Click to Translate">`;
    document.body.appendChild(translationIcon); // Append to DOM only once

    // Set initial hidden state for the first time
    translationIcon.style.opacity = '0';
    translationIcon.style.visibility = 'hidden';
    translationIcon.style.pointerEvents = 'none'; // Prevent interaction when hidden

    // Add click listener only once when the element is created
    translationIcon.addEventListener('click', handleIconClick);
  }

  // Get dimensions *after* it's in the DOM for stable calculations
  const iconRect = translationIcon.getBoundingClientRect();
  const viewportHeight =
    window.innerHeight || document.documentElement.clientHeight;
  const viewportWidth =
    window.innerWidth || document.documentElement.clientWidth;
  const scrollY = window.scrollY || window.pageYOffset;
  const scrollX = window.scrollX || window.pageXOffset;

  const padding = 10;

  let finalLeft;
  let finalTop;

  // Calculate potential positions (all are viewport-relative initially)
  // Horizontal centering logic remains the same, relying on selectionRect.
  const belowLeft =
    selectionRect.left + selectionRect.width / 2 - iconRect.width / 2;
  const belowTop = selectionRect.bottom + padding;

  const rightLeft = selectionRect.right + padding;
  const rightTop =
    selectionRect.top + selectionRect.height / 2 - iconRect.height / 2;

  const aboveLeft =
    selectionRect.left + selectionRect.width / 2 - iconRect.width / 2;
  const aboveTop = selectionRect.top - iconRect.height - padding;

  // Prioritize below, then right, then above for placement
  if (
    belowTop + iconRect.height <= viewportHeight &&
    belowLeft >= 0 &&
    belowLeft + iconRect.width <= viewportWidth
  ) {
    finalLeft = belowLeft + scrollX;
    finalTop = belowTop + scrollY;
  } else if (
    rightLeft + iconRect.width <= viewportWidth &&
    rightTop >= 0 &&
    rightTop + iconRect.height <= viewportHeight
  ) {
    finalLeft = rightLeft + scrollX;
    finalTop = rightTop + scrollY;
  } else if (
    aboveTop >= 0 &&
    aboveLeft >= 0 &&
    aboveLeft + iconRect.width <= viewportWidth
  ) {
    finalLeft = aboveLeft + scrollX;
    finalTop = aboveTop + scrollY;
  } else {
    // Fallback: place it below the selection, clamped to viewport and near selection's right edge
    finalLeft = selectionRect.right + scrollX - iconRect.width;
    finalTop = selectionRect.bottom + scrollY + padding;

    // Ensure fallback position is always within viewport bounds
    if (finalLeft < scrollX) finalLeft = scrollX;
    if (finalLeft + iconRect.width > viewportWidth + scrollX)
      finalLeft = viewportWidth + scrollX - iconRect.width;
    if (finalTop < scrollY) finalTop = scrollY;
    if (finalTop + iconRect.height > viewportHeight + scrollY)
      finalTop = viewportHeight + scrollY - iconRect.height;
  }

  // Apply Math.floor to final positions for pixel-perfect rendering
  translationIcon.style.left = `${Math.floor(finalLeft)}px`;
  translationIcon.style.top = `${Math.floor(finalTop)}px`;

  // Make it visible immediately after positioning for speed and add 'show' class for CSS transitions
  translationIcon.style.opacity = '1';
  translationIcon.style.visibility = 'visible';
  translationIcon.style.pointerEvents = 'auto'; // Re-enable interaction
  translationIcon.classList.add('show');
}

// Function to remove/hide the translation icon (does not remove from DOM)
function removeTranslationIcon() {
  if (translationIcon && translationIcon.parentNode) {
    // Check if it exists and is in DOM
    translationIcon.classList.remove('show');
    translationIcon.style.opacity = '0'; // Fade out
    translationIcon.style.pointerEvents = 'none'; // Disable clicks
    // Use a timeout to ensure fade-out completes before setting visibility to 'hidden'
    setTimeout(() => {
      if (translationIcon) {
        // Check if it still exists before manipulating
        translationIcon.style.visibility = 'hidden';
      }
    }, 200); // Matches CSS transition duration
  }
}

// --- NEW: Function to show the loading animation ---
function showLoadingAnimation(selectionRect) {
  // Ensure any existing tooltip or icon is removed first
  removeTooltip();
  removeTranslationIcon();

  if (!loadingAnimation) {
    loadingAnimation = document.createElement('div');
    loadingAnimation.id = 'translation-loading';
    loadingAnimation.innerHTML = `<span></span><span></span><span></span>`; // Three dancing dots
    document.body.appendChild(loadingAnimation);

    // Initial hidden state
    loadingAnimation.style.opacity = '0';
    loadingAnimation.style.visibility = 'hidden';
    loadingAnimation.style.pointerEvents = 'none'; // Not interactive
  }

  // Get dimensions for accurate positioning
  const loadingRect = loadingAnimation.getBoundingClientRect();
  const viewportHeight =
    window.innerHeight || document.documentElement.clientHeight;
  const viewportWidth =
    window.innerWidth || document.documentElement.clientWidth;
  const scrollY = window.scrollY || window.pageYOffset;
  const scrollX = window.scrollX || window.pageXOffset;

  const padding = 10; // Padding from selection, similar to tooltip

  let finalLeft;
  let finalTop;

  // Horizontal centering on the selection
  const selectionCenterX = selectionRect.left + selectionRect.width / 2;
  finalLeft = selectionCenterX - loadingRect.width / 2;
  finalLeft += scrollX; // Convert to document coordinates

  // Horizontal boundary checks
  if (finalLeft < scrollX) {
    finalLeft = scrollX;
  } else if (finalLeft + loadingRect.width > viewportWidth + scrollX) {
    finalLeft = viewportWidth + scrollX - loadingRect.width;
    if (finalLeft < scrollX) {
      finalLeft = scrollX;
    }
  }

  // Vertical positioning: try below, then above
  const potentialTopBelow = selectionRect.bottom + padding + scrollY;
  const potentialTopAbove =
    selectionRect.top - loadingRect.height - padding + scrollY;

  if (potentialTopBelow + loadingRect.height <= viewportHeight + scrollY) {
    finalTop = potentialTopBelow;
  } else if (potentialTopAbove >= scrollY) {
    finalTop = potentialTopAbove;
  } else {
    // Fallback: place it below, clamped to viewport
    finalTop = Math.max(scrollY, selectionRect.bottom + scrollY + padding);
    if (finalTop + loadingRect.height > viewportHeight + scrollY) {
      finalTop = viewportHeight + scrollY - loadingRect.height;
    }
  }

  // Apply positions
  loadingAnimation.style.left = `${Math.floor(finalLeft)}px`;
  loadingAnimation.style.top = `${Math.floor(finalTop)}px`;

  // Make it visible
  loadingAnimation.style.opacity = '1';
  loadingAnimation.style.visibility = 'visible';
  loadingAnimation.style.pointerEvents = 'auto'; // Make it interactive (if desired, though usually not for loaders)
  loadingAnimation.classList.add('show'); // Trigger CSS animations/transitions
}

// --- NEW: Function to hide the loading animation ---
function hideLoadingAnimation() {
  if (loadingAnimation && loadingAnimation.parentNode) {
    loadingAnimation.classList.remove('show');
    loadingAnimation.style.opacity = '0';
    loadingAnimation.style.pointerEvents = 'none';
    setTimeout(() => {
      if (loadingAnimation) {
        // Check if it still exists before manipulating
        loadingAnimation.style.visibility = 'hidden';
      }
    }, 200); // Match CSS transition duration
  }
}

// Handler for icon click
async function handleIconClick() {
  // Re-validate selection before translating when icon is clicked
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  if (selectedText.length > 0 && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const selectionRect = range.getBoundingClientRect();

    if (selectionRect.width > 0 || selectionRect.height > 0) {
      lastSelectedText = selectedText; // Update with current selection
      lastSelectionRect = {
        // Update with current selection rect
        x: selectionRect.x,
        y: selectionRect.y,
        width: selectionRect.width,
        height: selectionRect.height,
        top: selectionRect.top,
        right: selectionRect.right,
        bottom: selectionRect.bottom,
        left: selectionRect.left,
      };

      if (!isTranslating) {
        isTranslating = true;
        // Show loading animation immediately, hiding icon/tooltip first
        showLoadingAnimation(lastSelectionRect);
        try {
          const response = await chrome.runtime.sendMessage({
            action: 'translateText',
            text: lastSelectedText,
            rect: lastSelectionRect,
          });

          if (!response.success) {
            console.error(
              'Content Script: Translation request failed:',
              response.error
            );
          }
        } catch (error) {
          console.error(
            'Content Script: Error sending translation message:',
            error
          );
        } finally {
          isTranslating = false;
          // The loading animation will be hidden by the message listener
          // when displayTranslation or displayTranslationError is received.
          // No need to hide here unless message listener might not fire.
        }
      }
      return; // Exit if a valid selection was handled
    }
  }
  // If no valid selection or current selection is invalid, clear previous states
  lastSelectedText = '';
  lastSelectionRect = null;
  removeTooltip();
  removeTranslationIcon();
  hideLoadingAnimation(); // Also hide loading if no valid selection after click
}

// Event listener for text selection on the page
document.addEventListener('mouseup', function (event) {
  // If a tooltip or loading animation is currently visible, do not show the icon again immediately.
  if (
    currentTooltip ||
    (loadingAnimation && loadingAnimation.style.visibility === 'visible')
  ) {
    removeTranslationIcon(); // Ensure icon is removed if tooltip or loader is up.
    return;
  }

  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  // If there's selected text and a valid range
  if (selectedText.length > 0 && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const selectionRect = range.getBoundingClientRect();

    // Only show icon if the selection has valid visual dimensions
    if (selectionRect.width > 0 || selectionRect.height > 0) {
      // If the selected text is the same as before AND the icon is already visible, do nothing.
      // This prevents unnecessary repositioning if the user just re-selects the same text.
      if (
        selectedText === lastSelectedText &&
        translationIcon &&
        translationIcon.style.visibility === 'visible'
      ) {
        return;
      }

      lastSelectedText = selectedText;
      lastSelectionRect = {
        x: selectionRect.x,
        y: selectionRect.y,
        width: selectionRect.width,
        height: selectionRect.height,
        top: selectionRect.top,
        right: selectionRect.right,
        bottom: selectionRect.bottom,
        left: selectionRect.left,
      };
      showTranslationIcon(lastSelectionRect); // Show the icon on selection
    } else {
      // Selection exists but has no visual dimension (e.g., just newlines or collapsed)
      lastSelectedText = '';
      lastSelectionRect = null;
      removeTooltip();
      removeTranslationIcon();
      hideLoadingAnimation(); // Also hide loading if no selection
    }
  } else {
    // No selected text or no valid range
    lastSelectedText = '';
    lastSelectionRect = null;
    removeTooltip();
    removeTranslationIcon(); // Remove icon when selection is empty
    hideLoadingAnimation(); // Also hide loading if no selection
  }
});

// New: Event listener for selection changes, more robust for clearing icon and state
document.addEventListener('selectionchange', function () {
  const selection = window.getSelection();
  // Check if the selection is truly empty (no ranges or collapsed)
  if (
    !selection ||
    selection.rangeCount === 0 ||
    selection.isCollapsed ||
    selection.toString().trim().length === 0
  ) {
    // Only clear if there was previously a selection or icon/loader was visible
    if (
      lastSelectedText !== '' ||
      (translationIcon && translationIcon.style.visibility === 'visible') ||
      (loadingAnimation && loadingAnimation.style.visibility === 'visible')
    ) {
      lastSelectedText = '';
      lastSelectionRect = null;
      removeTooltip(); // Ensures tooltip is also removed if open
      removeTranslationIcon(); // Ensures icon is removed
      hideLoadingAnimation(); // Ensures loading is removed
    }
  }
  // Note: 'mouseup' continues to handle setting lastSelectedText/Rect when a new selection is made.
  // This 'selectionchange' listener is primarily for *clearing* when selection is lost.
});

// Event listener for Shift key press
document.addEventListener('keydown', async function (event) {
  if (event.key === 'Shift') {
    // Re-validate selection directly here on Shift press
    const selection = window.getSelection();
    const currentSelectedText = selection.toString().trim();
    if (currentSelectedText.length > 0 && selection.rangeCount > 0) {
      const currentRange = selection.getRangeAt(0);
      const currentSelectionRect = currentRange.getBoundingClientRect();

      // Ensure the selection has actual dimensions
      if (currentSelectionRect.width > 0 || currentSelectionRect.height > 0) {
        if (!isShiftPressed && !isTranslating) {
          isShiftPressed = true;
          isTranslating = true;

          // Update lastSelectedText and lastSelectionRect with the *current* selection
          lastSelectedText = currentSelectedText;
          lastSelectionRect = {
            x: currentSelectionRect.x,
            y: currentSelectionRect.y,
            width: currentSelectionRect.width,
            height: currentSelectionRect.height,
            top: currentSelectionRect.top,
            right: currentSelectionRect.right,
            bottom: currentSelectionRect.bottom,
            left: currentSelectionRect.left,
          };

          // Show loading animation immediately
          showLoadingAnimation(lastSelectionRect);

          try {
            const response = await chrome.runtime.sendMessage({
              action: 'translateText',
              text: lastSelectedText,
              rect: lastSelectionRect,
            });

            if (!response.success) {
              console.error(
                'Content Script: Translation request failed:',
                response.error
              );
            }
          } catch (error) {
            console.error(
              'Content Script: Error sending translation message:',
              error
            );
          } finally {
            isTranslating = false;
            // The loading animation is hidden by the message listener
          }
        }
      } else {
        // Selection exists but has no visual dimension (e.g., just newlines or collapsed)
        lastSelectedText = '';
        lastSelectionRect = null;
        removeTooltip();
        removeTranslationIcon();
        hideLoadingAnimation(); // Hide if Shift pressed but no valid visual selection
      }
    } else {
      // No selected text or no valid range
      lastSelectedText = '';
      lastSelectionRect = null;
      removeTooltip();
      removeTranslationIcon();
      hideLoadingAnimation(); // Hide if Shift pressed but no selection at all
    }
  }
});

document.addEventListener('keyup', function (event) {
  if (event.key === 'Shift') {
    isShiftPressed = false; // Mark Shift as released
  }
});

// Listener for messages from the background script (to display translation or errors)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'displayTranslation') {
    hideLoadingAnimation(); // Hide loading animation on success
    if (message.translatedText && message.selectionRect) {
      showTranslationTooltip(message.translatedText, message.selectionRect);
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'Missing data.' });
    }
  } else if (message.action === 'displayTranslationError') {
    hideLoadingAnimation(); // Hide loading animation on error
    if (message.errorMessage && message.selectionRect) {
      showTranslationTooltip(
        `Error: ${message.errorMessage}`,
        message.selectionRect,
        true
      );
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'Missing error data.' });
    }
  }
});
