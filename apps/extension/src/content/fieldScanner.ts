export interface ScannedElementMetadata {
  element: HTMLElement;
  tagName: string;
  type: string;
  name?: string;
  id?: string;
  placeholder?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  autocomplete?: string;
  title?: string;
  labelText?: string;
  subLabelText?: string;
  nearbyText?: string;
  parentLegendText?: string;
  isShadowDom: boolean;
  frameId?: number;
  selector: string;
  role?: string;
  isContentEditable: boolean;
}

export interface ScanMetrics {
  totalScanned: number;
  inputCount: number;
  textareaCount: number;
  selectCount: number;
  comboboxCount: number;
  contenteditableCount: number;
  shadowRootCount: number;
  frameCount: number;
  uninspectableFramesCount: number;
}

export interface ScanResult {
  elements: ScannedElementMetadata[];
  metrics: ScanMetrics;
}

export class FieldScanner {
  /**
   * Recursively scans a root document, open Shadow DOMs, and accessible same-origin iframes.
   */
  public scan(root: Document | ShadowRoot = document): ScanResult {
    const elements: ScannedElementMetadata[] = [];
    const metrics: ScanMetrics = {
      totalScanned: 0,
      inputCount: 0,
      textareaCount: 0,
      selectCount: 0,
      comboboxCount: 0,
      contenteditableCount: 0,
      shadowRootCount: 0,
      frameCount: 0,
      uninspectableFramesCount: 0
    };

    this.scanRecursive(root, false, undefined, elements, metrics);

    return { elements, metrics };
  }

  private scanRecursive(
    node: Document | ShadowRoot,
    isShadowDom: boolean,
    frameId: number | undefined,
    outElements: ScannedElementMetadata[],
    metrics: ScanMetrics
  ): void {
    // 1. Gather all candidates in this scope
    const candidates = this.queryCandidateElements(node);

    for (const el of candidates) {
      // Ignore hidden or explicitly zero-dimension script/style/hidden inputs
      if (this.isElementIgnored(el)) {
        continue;
      }

      const meta = this.extractElementMetadata(el, isShadowDom, frameId);
      outElements.push(meta);
      metrics.totalScanned++;

      // Update type metrics
      if (meta.tagName === 'input') metrics.inputCount++;
      else if (meta.tagName === 'textarea') metrics.textareaCount++;
      else if (meta.tagName === 'select') metrics.selectCount++;
      else if (meta.role === 'combobox' || el.getAttribute('aria-haspopup') === 'listbox') metrics.comboboxCount++;
      else if (meta.isContentEditable) metrics.contenteditableCount++;
    }

    // 2. Discover and traverse open Shadow Roots
    const allDescendants = Array.from(node.querySelectorAll<HTMLElement>('*'));
    for (const desc of allDescendants) {
      if (desc.shadowRoot) {
        metrics.shadowRootCount++;
        this.scanRecursive(desc.shadowRoot, true, frameId, outElements, metrics);
      }
    }

    // 3. Discover and inspect accessible iframes (if in main document)
    if (node instanceof Document) {
      const iframes = Array.from(node.querySelectorAll<HTMLIFrameElement>('iframe'));
      metrics.frameCount += iframes.length;

      for (let idx = 0; idx < iframes.length; idx++) {
        const iframe = iframes[idx];
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc && iframeDoc.body) {
            this.scanRecursive(iframeDoc, false, idx + 1, outElements, metrics);
          } else {
            // Inaccessible cross-origin iframe
            metrics.uninspectableFramesCount++;
          }
        } catch {
          // SecurityError on cross-origin iframe access
          metrics.uninspectableFramesCount++;
        }
      }
    }
  }

  private queryCandidateElements(root: Document | ShadowRoot): HTMLElement[] {
    const selector = [
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"])',
      'textarea',
      'select',
      '[role="textbox"]',
      '[role="combobox"]',
      '[role="radio"]',
      '[role="checkbox"]',
      '[aria-haspopup="listbox"]',
      '[contenteditable="true"]',
      '[contenteditable=""]',
      'div[class*="select__control"]',
      'div[class*="react-select"]',
      'div[class*="custom-select"]'
    ].join(', ');

    return Array.from(root.querySelectorAll<HTMLElement>(selector));
  }

  private isElementIgnored(el: HTMLElement): boolean {
    if (el instanceof HTMLInputElement && el.type === 'hidden') return true;

    try {
      const style = window.getComputedStyle ? window.getComputedStyle(el) : null;
      if (style) {
        if (style.display === 'none' || style.visibility === 'hidden') return true;
        if (parseFloat(style.opacity || '1') === 0 && !el.classList.contains('form-radio') && !el.classList.contains('form-checkbox')) {
          // Allow radio/checkbox that use custom styled wrappers
          if (!(el instanceof HTMLInputElement && (el.type === 'radio' || el.type === 'checkbox' || el.type === 'file'))) {
            return true;
          }
        }
      }
    } catch {}

    return false;
  }

  private extractElementMetadata(
    el: HTMLElement,
    isShadowDom: boolean,
    frameId: number | undefined
  ): ScannedElementMetadata {
    const tagName = el.tagName.toLowerCase();
    const type = el instanceof HTMLInputElement ? el.type.toLowerCase() : tagName;
    const name = el.getAttribute('name') || undefined;
    const id = el.id || undefined;
    const placeholder = el.getAttribute('placeholder') || undefined;
    const ariaLabel = el.getAttribute('aria-label') || undefined;
    const ariaLabelledBy = el.getAttribute('aria-labelledby') || undefined;
    const autocomplete = el.getAttribute('autocomplete') || undefined;
    const title = el.getAttribute('title') || undefined;
    const role = el.getAttribute('role') || undefined;
    const isContentEditable = el.isContentEditable || el.getAttribute('contenteditable') === 'true' || el.getAttribute('contenteditable') === '';

    const labelText = this.findAssociatedLabelText(el);
    const subLabelText = this.findSubLabelText(el);
    const nearbyText = this.findNearbyText(el);
    const parentLegendText = this.findParentLegendText(el);
    const selector = this.generateCssSelector(el);

    return {
      element: el,
      tagName,
      type,
      name,
      id,
      placeholder,
      ariaLabel,
      ariaLabelledBy,
      autocomplete,
      title,
      labelText,
      subLabelText,
      nearbyText,
      parentLegendText,
      isShadowDom,
      frameId,
      selector,
      role,
      isContentEditable
    };
  }

  private findAssociatedLabelText(el: HTMLElement): string | undefined {
    // 1. Explicit <label for="id">
    if (el.id) {
      const root = el.getRootNode() as Document | ShadowRoot;
      const label = root.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(el.id)}"]`);
      if (label?.textContent) return label.textContent.trim();
    }

    // 2. aria-labelledby
    const labelledBy = el.getAttribute('aria-labelledby');
    if (labelledBy) {
      const root = el.getRootNode() as Document | ShadowRoot;
      const ids = labelledBy.split(/\s+/);
      const textParts = ids
        .map((targetId) => root.querySelector(`#${CSS.escape(targetId)}`)?.textContent?.trim())
        .filter(Boolean);
      if (textParts.length > 0) return textParts.join(' ');
    }

    // 3. Parent / Ancestor <label>
    const parentLabel = el.closest('label');
    if (parentLabel?.textContent) {
      return parentLabel.textContent.trim();
    }

    // 4. Preceding sibling label or text
    let prev = el.previousElementSibling;
    while (prev) {
      if (prev.tagName.toLowerCase() === 'label' && prev.textContent) {
        return prev.textContent.trim();
      }
      prev = prev.previousElementSibling;
    }

    // 5. Label inside enclosing form line / group / field wrapper
    const group = el.closest('.form-line, [class*="form-group"], [class*="form-row"], [class*="field"], [class*="control"]');
    if (group) {
      const groupLabel = group.querySelector<HTMLLabelElement>('label:not(.form-sub-label):not([class*="sub-label"])');
      if (groupLabel?.textContent) {
        return groupLabel.textContent.trim();
      }
    }

    return undefined;
  }

  private findSubLabelText(el: HTMLElement): string | undefined {
    // Check Jotform / Wufoo style sub-labels
    const container = el.closest('.form-line, [class*="form-group"], [class*="field"], div');
    if (container) {
      const subLabel = container.querySelector('.form-sub-label, [class*="sub-label"], small, .description');
      if (subLabel?.textContent) {
        return subLabel.textContent.trim();
      }
    }
    return undefined;
  }

  private findNearbyText(el: HTMLElement): string | undefined {
    const parent = el.parentElement;
    if (!parent) return undefined;

    // Collect immediate text content from parent or sibling headings
    const headings = parent.querySelectorAll('h1, h2, h3, h4, h5, h6, strong, b, span');
    for (const h of Array.from(headings)) {
      if (h !== el && !h.contains(el) && h.textContent) {
        const txt = h.textContent.trim();
        if (txt.length > 1 && txt.length < 120) {
          return txt;
        }
      }
    }

    return undefined;
  }

  private findParentLegendText(el: HTMLElement): string | undefined {
    const fieldset = el.closest('fieldset');
    if (fieldset) {
      const legend = fieldset.querySelector('legend');
      if (legend?.textContent) {
        return legend.textContent.trim();
      }
    }
    return undefined;
  }

  public generateCssSelector(el: HTMLElement): string {
    if (el.id) return `#${CSS.escape(el.id)}`;
    const name = el.getAttribute('name');
    if (name) return `${el.tagName.toLowerCase()}[name="${CSS.escape(name)}"]`;

    // Semantic data attributes
    const dataTestId = el.getAttribute('data-testid') || el.getAttribute('data-qa') || el.getAttribute('data-id');
    if (dataTestId) return `[data-testid="${CSS.escape(dataTestId)}"]`;

    // DOM hierarchy selector
    let path = el.tagName.toLowerCase();
    let parent = el.parentElement;
    if (parent) {
      const index = Array.from(parent.children).indexOf(el) + 1;
      path = `${parent.tagName.toLowerCase()} > ${path}:nth-child(${index})`;
    }
    return path;
  }
}

export const fieldScanner = new FieldScanner();
