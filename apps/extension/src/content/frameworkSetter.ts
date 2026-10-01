/**
 * Universal Framework-Aware Value Setter
 * 
 * Sets values on HTML inputs, textareas, selects, and contenteditable elements
 * across React, Vue, Angular, Svelte, and vanilla HTML forms.
 * 
 * Follows a strict 3-tier bounded retry & verification lifecycle:
 * Tier 1: Standard native prototype setter + composed bubbling events
 * Tier 2: Focus + native setter + explicit input/change/blur
 * Tier 3: Framework-compatible fallback (value tracker / beforeinput)
 * Terminal: Returns verified status or reports failure
 */

export interface SetterResult {
  verified: boolean;
  attempt: number;
  actualValue: string;
  error?: string;
}

/**
 * Microtask/timer wait to give framework state (React, Vue, etc.) time to process events and re-render
 */
export function waitMicrotask(ms: number = 30): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 3-Tier Bounded Universal Setter for Inputs and Textareas
 */
export async function setNativeInputValue(
  el: HTMLInputElement | HTMLTextAreaElement,
  value: string
): Promise<SetterResult> {
  const isTextArea = el instanceof HTMLTextAreaElement;
  const prototype = isTextArea ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');

  // Helper to read current normalized value
  const readCurrent = () => (el.value !== undefined ? el.value : '');

  // Helper to check match
  const isMatch = (target: string) => {
    const current = readCurrent();
    return current === target || current.trim().toLowerCase() === target.trim().toLowerCase();
  };

  // ==========================================================
  // ATTEMPT 1: Standard Universal Native Setter + Composed Events
  // ==========================================================
  try {
    if (descriptor?.set) {
      descriptor.set.call(el, value);
    } else {
      el.value = value;
    }

    el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    el.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    el.dispatchEvent(new FocusEvent('blur', { bubbles: true, composed: true }));

    await waitMicrotask(25);

    if (isMatch(value)) {
      return { verified: true, attempt: 1, actualValue: readCurrent() };
    }
  } catch {
    // Proceed to Attempt 2
  }

  // ==========================================================
  // ATTEMPT 2: Focus Element + Native Setter + Dispatched Events
  // ==========================================================
  try {
    el.focus();

    if (descriptor?.set) {
      descriptor.set.call(el, value);
    } else {
      el.value = value;
    }

    el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    el.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    el.dispatchEvent(new FocusEvent('blur', { bubbles: true, composed: true }));

    await waitMicrotask(35);

    if (isMatch(value)) {
      return { verified: true, attempt: 2, actualValue: readCurrent() };
    }
  } catch {
    // Proceed to Attempt 3
  }

  // ==========================================================
  // ATTEMPT 3: Framework-Compatible Fallback (Tracker / BeforeInput)
  // ==========================================================
  try {
    el.focus();

    // 1. If React internal _valueTracker exists, inform it of prior value
    const tracker = (el as any)._valueTracker;
    if (tracker && typeof tracker.setValue === 'function') {
      try {
        tracker.setValue('');
      } catch {}
    }

    // 2. Dispatch beforeinput event if supported
    try {
      el.dispatchEvent(
        new InputEvent('beforeinput', {
          bubbles: true,
          composed: true,
          inputType: 'insertText',
          data: value
        })
      );
    } catch {}

    // 3. Set value via prototype setter again
    if (descriptor?.set) {
      descriptor.set.call(el, value);
    } else {
      el.value = value;
    }

    // 4. Optional fallback for stubborn editable nodes
    try {
      if (!isMatch(value) && typeof document.execCommand === 'function') {
        el.select();
        document.execCommand('insertText', false, value);
      }
    } catch {}

    el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    el.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    el.dispatchEvent(new FocusEvent('blur', { bubbles: true, composed: true }));

    await waitMicrotask(50);

    if (isMatch(value)) {
      return { verified: true, attempt: 3, actualValue: readCurrent() };
    }
  } catch {}

  // Terminal state: Verification Failed
  return {
    verified: false,
    attempt: 3,
    actualValue: readCurrent(),
    error: 'Page rejected external value'
  };
}

/**
 * Universal Native Select Dropdown Setter
 */
export async function setNativeSelectValue(
  el: HTMLSelectElement,
  targetValue: string
): Promise<SetterResult> {
  const normTarget = targetValue.trim().toLowerCase();
  let matchedIndex = -1;

  for (let i = 0; i < el.options.length; i++) {
    const opt = el.options[i];
    const optVal = opt.value.trim().toLowerCase();
    const optText = opt.text.trim().toLowerCase();

    if (optVal === normTarget || optText === normTarget) {
      matchedIndex = i;
      break;
    }
    if (optVal.includes(normTarget) || normTarget.includes(optVal) || optText.includes(normTarget) || normTarget.includes(optText)) {
      if (matchedIndex === -1) matchedIndex = i;
    }
  }

  if (matchedIndex !== -1) {
    el.selectedIndex = matchedIndex;
    el.value = el.options[matchedIndex].value;
  } else if (el.options.length > 0) {
    el.value = targetValue;
  }

  el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  el.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  el.dispatchEvent(new FocusEvent('blur', { bubbles: true, composed: true }));

  await waitMicrotask(25);

  const selectedOpt = el.options[el.selectedIndex];
  const actual = selectedOpt ? selectedOpt.text || selectedOpt.value : el.value;

  const verified = matchedIndex !== -1 || actual.toLowerCase().includes(normTarget);

  return {
    verified,
    attempt: 1,
    actualValue: actual,
    error: verified ? undefined : `Option matching "${targetValue}" not found in dropdown`
  };
}

/**
 * Universal Contenteditable Setter
 */
export async function setContentEditableValue(
  el: HTMLElement,
  value: string
): Promise<SetterResult> {
  el.focus();
  el.textContent = value;

  try {
    el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    el.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    el.dispatchEvent(new FocusEvent('blur', { bubbles: true, composed: true }));
  } catch {}

  await waitMicrotask(30);

  const actual = (el.textContent || el.innerText || '').trim();
  const verified = actual === value.trim() || actual.includes(value.trim());

  return {
    verified,
    attempt: 1,
    actualValue: actual,
    error: verified ? undefined : 'Failed to update contenteditable element'
  };
}
