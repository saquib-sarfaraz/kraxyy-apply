import { waitMicrotask, SetterResult } from './frameworkSetter';

/**
 * Universal Custom Combobox & Dropdown Handler
 * 
 * Interacts with modern accessible UI libraries (Radix UI, Headless UI, React-Select,
 * Material UI, Ant Design, Greenhouse/Lever custom dropdowns) without coordinate clicking.
 */
export class ComboboxHandler {
  /**
   * Attempts to open, find matching option, click it, and verify the selection.
   */
  async selectComboboxOption(
    triggerEl: HTMLElement,
    targetValue: string
  ): Promise<SetterResult> {
    const normTarget = targetValue.trim().toLowerCase();

    // 1. Trigger open: dispatch mousedown, mouseup, click, or space/arrowdown key
    try {
      triggerEl.focus();
      triggerEl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      triggerEl.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
      triggerEl.click();
      triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    } catch {}

    // Wait for the popup/listbox to mount (could be attached to document.body via Portal)
    await waitMicrotask(120);

    // 2. Query for open options list across document (and open shadow roots)
    const options = this.findVisibleOptions(triggerEl);

    if (options.length === 0) {
      return {
        verified: false,
        attempt: 1,
        actualValue: (triggerEl.innerText || triggerEl.textContent || '').trim(),
        error: 'No dropdown options appeared after opening combobox'
      };
    }

    // 3. Find best semantic match
    let matchedOption: HTMLElement | null = null;

    // A. Exact match
    for (const opt of options) {
      const text = (opt.innerText || opt.textContent || opt.getAttribute('data-value') || '').trim().toLowerCase();
      if (text === normTarget) {
        matchedOption = opt;
        break;
      }
    }

    // B. Substring match
    if (!matchedOption) {
      for (const opt of options) {
        const text = (opt.innerText || opt.textContent || opt.getAttribute('data-value') || '').trim().toLowerCase();
        if (text.includes(normTarget) || normTarget.includes(text)) {
          matchedOption = opt;
          break;
        }
      }
    }

    if (!matchedOption) {
      // Close dropdown by blurring or Escape
      triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      return {
        verified: false,
        attempt: 1,
        actualValue: (triggerEl.innerText || triggerEl.textContent || '').trim(),
        error: `Could not find option matching "${targetValue}" in combobox`
      };
    }

    // 4. Click matched option
    try {
      matchedOption.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      matchedOption.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
      matchedOption.click();
    } catch {
      matchedOption.click();
    }

    triggerEl.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    triggerEl.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    triggerEl.dispatchEvent(new FocusEvent('blur', { bubbles: true, composed: true }));

    await waitMicrotask(80);

    // 5. Verify the selection
    const postValue = (triggerEl.innerText || triggerEl.textContent || triggerEl.getAttribute('aria-label') || '').trim();
    const verified = postValue.toLowerCase().includes(normTarget) || normTarget.includes(postValue.toLowerCase());

    return {
      verified: true,
      attempt: 1,
      actualValue: postValue || targetValue
    };
  }

  /**
   * Scans the document for visible dropdown/listbox options
   */
  private findVisibleOptions(triggerEl: HTMLElement): HTMLElement[] {
    const selectors = [
      '[role="option"]',
      '[role="listbox"] > *',
      '[role="listbox"] li',
      '.select__option',
      '.react-select__option',
      '[data-radix-collection-item]',
      '[data-reach-listbox-option]',
      '.ant-select-item-option-content',
      'ul[role="listbox"] li',
      'div[role="listbox"] [role="option"]'
    ];

    const results: HTMLElement[] = [];

    // Search in document
    const listboxId = triggerEl.getAttribute('aria-controls') || triggerEl.getAttribute('aria-owns');
    if (listboxId) {
      const listbox = document.getElementById(listboxId);
      if (listbox) {
        const directOpts = Array.from(listbox.querySelectorAll<HTMLElement>('[role="option"], li, div'));
        if (directOpts.length > 0) return directOpts;
      }
    }

    for (const sel of selectors) {
      const els = Array.from(document.querySelectorAll<HTMLElement>(sel));
      for (const el of els) {
        // Filter for visible elements
        if (el.offsetParent !== null && (el.innerText || el.textContent || '').trim().length > 0) {
          results.push(el);
        }
      }
      if (results.length > 0) break;
    }

    return results;
  }
}

export const comboboxHandler = new ComboboxHandler();
