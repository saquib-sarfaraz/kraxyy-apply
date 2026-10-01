import { FIELD_PATTERNS, canonicalizeTaxonomyType } from '@kraxyy/shared';
import { FieldTaxonomyType, IDetectedField, DetectedElementType } from '@kraxyy/types';
import { ScannedElementMetadata } from './fieldScanner';

export class ApplicationFieldClassifier {
  /**
   * Classifies a scanned element into a canonical FieldTaxonomyType with
   * confidence rating and an array of matching detection signals.
   */
  public classify(meta: ScannedElementMetadata): IDetectedField {
    const signals: string[] = [];
    let bestType: FieldTaxonomyType | 'UNKNOWN' = 'UNKNOWN';
    let highestScore = 0;

    const el = meta.element;
    const tagName = (meta.tagName as any) || 'input';
    const elementType = this.resolveElementType(meta);

    // Normalize signal text components
    const nameStr = (meta.name || '').toLowerCase();
    const idStr = (meta.id || '').toLowerCase();
    const placeholderStr = (meta.placeholder || '').toLowerCase();
    const labelStr = (meta.labelText || '').toLowerCase();
    const subLabelStr = (meta.subLabelText || '').toLowerCase();
    const ariaStr = (meta.ariaLabel || '').toLowerCase();
    const autocompleteStr = (meta.autocomplete || '').toLowerCase();
    const nearbyStr = (meta.nearbyText || '').toLowerCase();
    const legendStr = (meta.parentLegendText || '').toLowerCase();

    // Combined context bag
    const contextBag = [
      labelStr,
      subLabelStr,
      ariaStr,
      placeholderStr,
      nameStr,
      idStr,
      nearbyStr,
      legendStr
    ].filter(Boolean).join(' ');

    // 1. Check Autocomplete Attribute (High-confidence native signal)
    if (meta.autocomplete) {
      signals.push(`autocomplete="${meta.autocomplete}"`);
      const autoMatch = this.matchAutocomplete(autocompleteStr);
      if (autoMatch) {
        bestType = autoMatch;
        highestScore = 0.98;
        signals.push(`native_autocomplete_matched="${autoMatch}"`);
      }
    }

    // 1b. Check Native Input Types (High confidence)
    if (meta.type === 'tel' && highestScore < 0.90) {
      bestType = 'PHONE';
      highestScore = 0.90;
      signals.push('native_type_tel');
    } else if (meta.type === 'email' && highestScore < 0.90) {
      bestType = 'EMAIL';
      highestScore = 0.92;
      signals.push('native_type_email');
    }

    // 2. Check File Upload input specifically for Resume / CV
    if (meta.type === 'file' || contextBag.includes('resume') || contextBag.includes('curriculum vitae') || contextBag.includes('attach cv') || idStr.includes('resume') || nameStr.includes('resume')) {
      if (contextBag.includes('cover') || contextBag.includes('letter')) {
        bestType = 'COVER_LETTER';
        highestScore = Math.max(highestScore, 0.92);
        signals.push('file_input_cover_letter_context');
      } else {
        bestType = 'RESUME';
        highestScore = Math.max(highestScore, 0.95);
        signals.push('file_input_resume_context');
      }
    }

    // 3. Evaluate Pattern Catalog across all signals
    if (highestScore < 0.95) {
      for (const pattern of FIELD_PATTERNS) {
        let patternScore = 0;
        const patternMatches: string[] = [];

        // Exact attribute match (highest priority)
        if (pattern.exactAttributes) {
          for (const attr of pattern.exactAttributes) {
            const lowAttr = attr.toLowerCase();
            if (nameStr === lowAttr || idStr === lowAttr || autocompleteStr === lowAttr) {
              patternScore += 0.70;
              patternMatches.push(`exact_attr="${attr}"`);
              break;
            }
          }
        }

        // Label / Sub-label keyword matches
        if (labelStr || subLabelStr) {
          const matchedKws = pattern.keywords.filter((kw) =>
            labelStr.includes(kw) || subLabelStr.includes(kw)
          );
          if (matchedKws.length > 0) {
            patternScore += 0.55;
            patternMatches.push(`label_keyword="${matchedKws[0]}"`);
          }
        }

        // Aria-label or Placeholder match
        if (ariaStr || placeholderStr) {
          const matchedKws = pattern.keywords.filter((kw) =>
            ariaStr.includes(kw) || placeholderStr.includes(kw)
          );
          if (matchedKws.length > 0) {
            patternScore += 0.45;
            patternMatches.push(`placeholder_or_aria="${matchedKws[0]}"`);
          }
        }

        // Name or ID substring match
        const matchedNameId = pattern.keywords.filter((kw) =>
          nameStr.includes(kw) || idStr.includes(kw)
        );
        if (matchedNameId.length > 0) {
          patternScore += 0.40;
          patternMatches.push(`name_or_id_sub="${matchedNameId[0]}"`);
        }

        // Legend or Nearby text match (fallback support)
        if (legendStr || nearbyStr) {
          const matchedContext = pattern.keywords.filter((kw) =>
            legendStr.includes(kw) || nearbyStr.includes(kw)
          );
          if (matchedContext.length > 0) {
            patternScore += 0.25;
            patternMatches.push(`nearby_text="${matchedContext[0]}"`);
          }
        }

        if (patternScore > highestScore && patternScore >= 0.40) {
          highestScore = patternScore;
          bestType = canonicalizeTaxonomyType(pattern.type);
          signals.push(...patternMatches);
        }
      }
    }

    // 4. Disambiguation Heuristics
    // A. Disambiguate Full Name vs First / Last Name
    if (bestType === 'FULL_NAME') {
      if (contextBag.includes('first') || contextBag.includes('given') || idStr.includes('first') || nameStr.includes('first') || idStr.includes('fname')) {
        bestType = 'FIRST_NAME';
        signals.push('disambiguated_to_first_name');
      } else if (contextBag.includes('last') || contextBag.includes('family') || contextBag.includes('surname') || idStr.includes('last') || nameStr.includes('last') || idStr.includes('lname')) {
        bestType = 'LAST_NAME';
        signals.push('disambiguated_to_last_name');
      }
    }

    // B. Native HTML input[type="email"]
    if (meta.type === 'email' && bestType === 'UNKNOWN') {
      bestType = 'EMAIL';
      highestScore = Math.max(highestScore, 0.90);
      signals.push('native_type_email');
    }

    // C. Native HTML input[type="tel"]
    if (meta.type === 'tel' && bestType === 'UNKNOWN') {
      bestType = 'PHONE';
      highestScore = Math.max(highestScore, 0.90);
      signals.push('native_type_tel');
    }

    // D. Jotform specific numbered IDs (first_3, last_3, input_4_phone, etc.)
    if (bestType === 'UNKNOWN' || highestScore < 0.70) {
      if (idStr.startsWith('first_') || idStr.includes('_first') || subLabelStr.includes('first name')) {
        bestType = 'FIRST_NAME';
        highestScore = 0.92;
        signals.push('jotform_first_name_match');
      } else if (idStr.startsWith('last_') || idStr.includes('_last') || subLabelStr.includes('last name')) {
        bestType = 'LAST_NAME';
        highestScore = 0.92;
        signals.push('jotform_last_name_match');
      }
    }

    // E. Campus & Application Form Fallback Heuristics
    if (bestType === 'UNKNOWN') {
      if (contextBag.includes('college') || contextBag.includes('university') || contextBag.includes('institute') || contextBag.includes('campus')) {
        bestType = 'UNIVERSITY';
        highestScore = 0.88;
        signals.push('campus_college_heuristic');
      } else if (contextBag.includes('course') || contextBag.includes('department') || contextBag.includes('dept') || contextBag.includes('branch') || contextBag.includes('stream')) {
        bestType = 'FIELD_OF_STUDY';
        highestScore = 0.86;
        signals.push('campus_department_heuristic');
      } else if (contextBag.includes('current year') || contextBag.includes('year of study') || contextBag.includes('passing year') || contextBag.includes('passout year') || contextBag.includes('batch')) {
        bestType = 'GRADUATION_DATE';
        highestScore = 0.85;
        signals.push('campus_year_heuristic');
      } else if (contextBag.includes('role') || contextBag.includes('position') || contextBag.includes('applied for') || contextBag.includes('designation')) {
        bestType = 'JOB_TITLE';
        highestScore = 0.85;
        signals.push('application_role_heuristic');
      } else if (meta.tagName === 'textarea') {
        if (contextBag.includes('why') || contextBag.includes('cover') || contextBag.includes('interest')) {
          bestType = 'COVER_LETTER';
          highestScore = 0.85;
          signals.push('textarea_cover_letter_heuristic');
        } else if (contextBag.includes('about') || contextBag.includes('bio') || contextBag.includes('summary') || contextBag.includes('describe')) {
          bestType = 'SUMMARY';
          highestScore = 0.85;
          signals.push('textarea_summary_heuristic');
        } else {
          bestType = 'CUSTOM_QUESTION';
          highestScore = 0.80;
          signals.push('textarea_custom_question_heuristic');
        }
      }
    }

    // Extract current existing value
    const currentValue = this.extractCurrentValue(el, elementType);

    // Initial fillStatus: file uploads and custom questions are MANUAL_REQUIRED
    const status: 'MANUAL_REQUIRED' | undefined = (meta.type === 'file' || bestType === 'RESUME' || bestType === 'CUSTOM_QUESTION') ? 'MANUAL_REQUIRED' : undefined;

    return {
      id: meta.id || meta.name || `field-${Math.random().toString(36).substring(2, 9)}`,
      selector: meta.selector,
      name: meta.name,
      tagName: tagName as any,
      elementType,
      inputType: meta.type,
      taxonomyType: bestType,
      confidence: Math.min(1, Math.round(highestScore * 100) / 100),
      label: meta.labelText || meta.subLabelText || meta.placeholder || meta.name || undefined,
      currentValue,
      existingValue: currentValue || undefined,
      isShadowDom: meta.isShadowDom,
      frameId: meta.frameId,
      signals: Array.from(new Set(signals)),
      status
    };
  }

  private resolveElementType(meta: ScannedElementMetadata): DetectedElementType {
    if (meta.role === 'combobox' || meta.ariaLabelledBy === 'listbox') return 'combobox';
    if (meta.isContentEditable) return 'contenteditable';
    if (meta.type === 'radio') return 'radio';
    if (meta.type === 'checkbox') return 'checkbox';
    if (meta.type === 'file') return 'file';
    if (meta.tagName === 'textarea') return 'textarea';
    if (meta.tagName === 'select') return 'select';
    return 'input';
  }

  private matchAutocomplete(auto: string): FieldTaxonomyType | null {
    const map: Record<string, FieldTaxonomyType> = {
      'given-name': 'FIRST_NAME',
      'family-name': 'LAST_NAME',
      'name': 'FULL_NAME',
      'email': 'EMAIL',
      'tel': 'PHONE',
      'tel-national': 'PHONE',
      'street-address': 'ADDRESS',
      'address-line1': 'ADDRESS',
      'address-level2': 'CITY',
      'address-level1': 'STATE',
      'postal-code': 'POSTAL_CODE',
      'country-name': 'COUNTRY',
      'organization-title': 'JOB_TITLE',
      'organization': 'COMPANY'
    };
    return map[auto] || null;
  }

  private extractCurrentValue(el: HTMLElement, type: DetectedElementType): string {
    if (el instanceof HTMLInputElement) {
      if (el.type === 'checkbox' || el.type === 'radio') {
        return el.checked ? 'true' : '';
      }
      return el.value?.trim() || '';
    }
    if (el instanceof HTMLTextAreaElement) {
      return el.value?.trim() || '';
    }
    if (el instanceof HTMLSelectElement) {
      return el.value?.trim() || '';
    }
    if (type === 'contenteditable') {
      return el.textContent?.trim() || '';
    }
    return '';
  }
}

export const applicationFieldClassifier = new ApplicationFieldClassifier();
