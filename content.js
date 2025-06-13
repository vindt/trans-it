let currentTooltip = null;
let dismissListenerAdded = false;
let lastSelectedText = '';
let lastSelectionRect = null; // Stores the overall bounding rect of the selection
let isShiftPressed = false; // Flag to track Shift key state
let isTranslating = false; // Flag to prevent multiple rapid translation requests

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
  }
}

// Function to create and position the tooltip
async function showTranslationTooltip(translatedText, overallSelectionRect) {
  removeTooltip(); // Remove any existing tooltip first

  currentTooltip = document.createElement('div');
  currentTooltip.id = 'translation-tooltip';
  currentTooltip.innerHTML = translatedText; // Use innerHTML to preserve formatting

  // Set max-width based on selection, ensuring a minimum for readability.
  // This allows the tooltip to shrink if content is shorter than original selection,
  // but expands up to the selection's width.
  currentTooltip.style.maxWidth = `${Math.max(
    overallSelectionRect.width,
    200
  )}px`;

  document.body.appendChild(currentTooltip);

  // Use requestAnimationFrame to ensure the browser has rendered the element
  // before calculating its dimensions for accurate positioning.
  requestAnimationFrame(() => {
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
        document.addEventListener('click', handleDocumentClick);
        dismissListenerAdded = true;
      }, 100);
    }
  });
}

// Event listener for text selection on the page
document.addEventListener('mouseup', function (event) {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  if (selectedText.length > 0) {
    const range = selection.getRangeAt(0);
    const selectionRect = range.getBoundingClientRect(); // Overall bounding rect

    lastSelectedText = selectedText;
    // Convert DOMRect to a plain object for sending via message
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
  } else {
    lastSelectedText = '';
    lastSelectionRect = null;
    removeTooltip();
  }
});

// Event listener for Shift key press
document.addEventListener('keydown', async function (event) {
  if (event.key === 'Shift') {
    if (
      lastSelectedText &&
      lastSelectionRect &&
      !isShiftPressed &&
      !isTranslating
    ) {
      isShiftPressed = true; // Mark Shift as pressed
      isTranslating = true; // Set translating flag

      removeTooltip(); // Remove any existing tooltip before translating

      console.log(
        `Content Script: Shift pressed. Translating "${lastSelectedText}"...`
      );
      try {
        const response = await chrome.runtime.sendMessage({
          action: 'translateText',
          text: lastSelectedText,
          rect: lastSelectionRect, // Pass the overall rect for reference
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
      }
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
    if (message.translatedText && message.selectionRect) {
      console.log('Content Script: Received translation to display.');
      showTranslationTooltip(message.translatedText, message.selectionRect);
      sendResponse({ success: true });
    } else {
      console.error(
        'Content Script: Missing translation data or selection rect.'
      );
      sendResponse({ success: false, error: 'Missing data.' });
    }
  } else if (message.action === 'displayTranslationError') {
    // Handle translation errors
    console.error(
      'Content Script: Received translation error:',
      message.errorMessage
    );
    // Display the error message in the tooltip
    // You might want to style this error differently, e.g., red text
    if (message.errorMessage && message.selectionRect) {
      showTranslationTooltip(
        `Error: ${message.errorMessage}`,
        message.selectionRect,
        true
      ); // Pass a flag for error styling
      sendResponse({ success: true });
    } else {
      console.error(
        'Content Script: Missing error message or selection rect for error display.'
      );
      sendResponse({ success: false, error: 'Missing error data.' });
    }
  }
});
