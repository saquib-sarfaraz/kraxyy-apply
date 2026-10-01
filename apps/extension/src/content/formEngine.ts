import { FieldTaxonomyType, IDetectedField, FieldFillStatus } from '@kraxyy/types';
import { setNativeInputValue, setNativeSelectValue, setContentEditableValue } from './frameworkSetter';
import { comboboxHandler } from './comboboxHandler';

export interface AutofillOptions {
  overwriteExisting?: boolean;
  fieldIdToOverwrite?: string;
}

export interface AutofillSummary {
  totalDetected: number;
  totalVerified: number;
  totalNeedsAttention: number;
  totalSkippedExisting: number;
  totalManualRequired: number;
  totalFailed: number;
  fields: Array<
    IDetectedField & {
      status: FieldFillStatus;
      filledValue?: string;
      verifiedValue?: string;
      existingValue?: string;
      manualReason?: string;
    }
  >;
}

export class FormEngine {
  /**
   * Safely fills compatible fields using candidate profile data with full verification.
   * NEVER submits the form.
   */
  async fillForm(
    detectedFields: IDetectedField[],
    profile: Record<FieldTaxonomyType, string | boolean>,
    options: AutofillOptions = {}
  ): Promise<AutofillSummary> {
    const results: AutofillSummary['fields'] = [];

    let totalVerified = 0;
    let totalNeedsAttention = 0;
    let totalSkippedExisting = 0;
    let totalManualRequired = 0;
    let totalFailed = 0;

    for (const field of detectedFields) {
      const el = document.querySelector<HTMLElement>(field.selector);

      if (!el) {
        results.push({
          ...field,
          status: 'NOT_FOUND',
          manualReason: 'Element no longer in DOM'
        });
        totalFailed++;
        continue;
      }

      // 1. Check for File Upload Inputs (Resume / CV)
      if (field.elementType === 'file' || field.taxonomyType === 'RESUME') {
        this.highlightField(el, 'attention');
        results.push({
          ...field,
          status: 'MANUAL_REQUIRED',
          manualReason: 'Resume upload requires your action (drag & drop or browse)'
        });
        totalManualRequired++;
        continue;
      }

      // 2. Check for Legal / Consent Checkboxes
      if (field.elementType === 'checkbox' && this.isLegalConsentField(field)) {
        this.highlightField(el, 'attention');
        results.push({
          ...field,
          status: 'NEEDS_ATTENTION',
          manualReason: 'Please review and accept legal/consent policy'
        });
        totalNeedsAttention++;
        continue;
      }

      // 3. Existing User Input Guard
      const currentVal = this.readElementValue(el, field.elementType);
      const isExisting = Boolean(currentVal && currentVal.trim().length > 0 && currentVal !== 'false');
      const shouldOverwrite = options.overwriteExisting || options.fieldIdToOverwrite === field.id;

      if (isExisting && !shouldOverwrite) {
        results.push({
          ...field,
          status: 'SKIPPED_EXISTING',
          existingValue: currentVal,
          manualReason: `Existing value preserved: "${currentVal}"`
        });
        totalSkippedExisting++;
        continue;
      }

      if (field.taxonomyType === 'UNKNOWN') {
        results.push({
          ...field,
          status: 'NOT_FOUND',
          manualReason: 'Field type is unknown'
        });
        totalFailed++;
        continue;
      }

      // 4. Check if profile contains data for this canonical field
      const profileVal = profile[field.taxonomyType];

      if (profileVal === undefined || profileVal === null || profileVal === '') {
        results.push({
          ...field,
          status: 'NEEDS_ATTENTION',
          manualReason: 'No matching data in your Kraxyy profile'
        });
        totalNeedsAttention++;
        this.highlightField(el, 'attention');
        continue;
      }

      const strValue = String(profileVal);

      // Sensitive fields that always require attention/confirmation
      const sensitiveTaxonomies: FieldTaxonomyType[] = [
        'WORK_AUTHORIZATION',
        'VISA_SPONSORSHIP',
        'SPONSORSHIP_REQUIRED',
        'DEMOGRAPHIC',
        'CUSTOM_QUESTION'
      ];

      try {
        let fillResult: { verified: boolean; actualValue: string; error?: string };

        // Route to specialized handler based on element type
        if (field.elementType === 'combobox') {
          fillResult = await comboboxHandler.selectComboboxOption(el, strValue);
        } else if (field.elementType === 'select' && el instanceof HTMLSelectElement) {
          fillResult = await setNativeSelectValue(el, strValue);
        } else if (field.elementType === 'contenteditable') {
          fillResult = await setContentEditableValue(el, strValue);
        } else if (field.elementType === 'radio' && el instanceof HTMLInputElement) {
          fillResult = await this.handleRadioField(el, strValue);
        } else if (field.elementType === 'checkbox' && el instanceof HTMLInputElement) {
          fillResult = await this.handleCheckboxField(el, strValue);
        } else if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
          fillResult = await setNativeInputValue(el, strValue);
        } else {
          fillResult = { verified: false, actualValue: '', error: 'Unsupported element type' };
        }

        if (fillResult.verified) {
          if (sensitiveTaxonomies.includes(field.taxonomyType)) {
            this.highlightField(el, 'attention');
            results.push({
              ...field,
              status: 'NEEDS_ATTENTION',
              filledValue: strValue,
              verifiedValue: fillResult.actualValue,
              manualReason: 'Review sensitive authorization/demographic answer'
            });
            totalNeedsAttention++;
            totalVerified++;
          } else {
            this.highlightField(el, 'verified');
            results.push({
              ...field,
              status: 'VERIFIED',
              filledValue: strValue,
              verifiedValue: fillResult.actualValue
            });
            totalVerified++;
          }
        } else {
          this.highlightField(el, 'failed');
          results.push({
            ...field,
            status: 'FAILED',
            manualReason: fillResult.error || 'Page rejected external value'
          });
          totalFailed++;
        }
      } catch (err) {
        this.highlightField(el, 'failed');
        results.push({
          ...field,
          status: 'FAILED',
          manualReason: `Fill error: ${(err as Error).message}`
        });
        totalFailed++;
      }
    }

    return {
      totalDetected: detectedFields.length,
      totalVerified,
      totalNeedsAttention,
      totalSkippedExisting,
      totalManualRequired,
      totalFailed,
      fields: results
    };
  }

  private async handleRadioField(el: HTMLInputElement, value: string): Promise<{ verified: boolean; actualValue: string; error?: string }> {
    const normValue = value.toLowerCase().trim();
    const radioVal = (el.value || '').toLowerCase().trim();
    const label = (el.labels?.[0]?.innerText || '').toLowerCase().trim();

    // Check if this radio button matches candidate's answer
    const isYes = normValue === 'true' || normValue === 'yes' || normValue === '1';
    const isNo = normValue === 'false' || normValue === 'no' || normValue === '0';

    let shouldCheck = false;
    if (isYes && (radioVal === 'yes' || radioVal === '1' || radioVal === 'true' || label.includes('yes'))) {
      shouldCheck = true;
    } else if (isNo && (radioVal === 'no' || radioVal === '0' || radioVal === 'false' || label.includes('no'))) {
      shouldCheck = true;
    } else if (radioVal === normValue || label === normValue) {
      shouldCheck = true;
    }

    if (shouldCheck) {
      el.checked = true;
      el.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      el.dispatchEvent(new Event('click', { bubbles: true, composed: true }));
      return { verified: el.checked, actualValue: el.value };
    }

    return { verified: false, actualValue: '', error: 'Radio option does not match candidate profile answer' };
  }

  private async handleCheckboxField(el: HTMLInputElement, value: string): Promise<{ verified: boolean; actualValue: string; error?: string }> {
    const shouldCheck = value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes';
    el.checked = shouldCheck;
    el.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    el.dispatchEvent(new Event('click', { bubbles: true, composed: true }));
    return { verified: el.checked === shouldCheck, actualValue: String(el.checked) };
  }

  private readElementValue(el: HTMLElement, type?: string): string {
    if (el instanceof HTMLInputElement) {
      if (el.type === 'checkbox' || el.type === 'radio') return el.checked ? 'true' : '';
      return el.value || '';
    }
    if (el instanceof HTMLTextAreaElement) return el.value || '';
    if (el instanceof HTMLSelectElement) {
      const opt = el.options[el.selectedIndex];
      return opt ? opt.text || opt.value : '';
    }
    if (type === 'contenteditable') return (el.textContent || el.innerText || '').trim();
    if (type === 'combobox') return (el.innerText || el.textContent || '').trim();
    return '';
  }

  private isLegalConsentField(field: IDetectedField): boolean {
    const combined = `${field.name || ''} ${field.id} ${field.label || ''}`.toLowerCase();
    const consentWords = ['terms', 'privacy', 'consent', 'agree', 'waive', 'policy', 'certify', 'background check'];
    return consentWords.some((word) => combined.includes(word));
  }

  private highlightField(el: HTMLElement, variant: 'verified' | 'attention' | 'failed') {
    const colors = {
      verified: { border: '#525B31', bg: 'rgba(82, 91, 49, 0.08)' },
      attention: { border: '#B18B40', bg: 'rgba(177, 139, 64, 0.10)' },
      failed: { border: '#B91C1C', bg: 'rgba(185, 28, 28, 0.08)' }
    };

    const cfg = colors[variant];
    el.style.outline = `2px solid ${cfg.border}`;
    el.style.outlineOffset = '1px';
    el.style.backgroundColor = cfg.bg;
    el.style.transition = 'all 0.3s ease';

    const cleanup = () => {
      el.style.outline = '';
      el.style.outlineOffset = '';
      el.style.backgroundColor = '';
      el.removeEventListener('focus', cleanup);
    };

    el.addEventListener('focus', cleanup);
    setTimeout(cleanup, 9000);
  }

  clearFields(fields: IDetectedField[]) {
    for (const field of fields) {
      const el = document.querySelector<HTMLElement>(field.selector);
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        el.value = '';
        el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        el.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      }
    }
  }
}

export const formEngine = new FormEngine();
