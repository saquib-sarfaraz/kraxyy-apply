import { IDetectedField } from '@kraxyy/types';
import { applicationPageDetector, ApplicationDetectionResult } from './applicationDetector';
import { fieldScanner } from './fieldScanner';

export interface FormDetectionSummary {
  isApplicationForm: boolean;
  confidence: number;
  autofillReady?: boolean;
  fieldCount?: number;
  fillableFieldCount?: number;
  manualRequiredCount?: number;
  fields: IDetectedField[];
  companyName?: string;
  jobTitle?: string;
  stepInfo?: {
    currentStep?: number;
    totalSteps?: number;
    stepName?: string;
  };
  metrics?: any;
  detectionSignals?: any;
  uninspectableFramesCount?: number;
}

export class FieldDetector {
  /**
   * Universal Form Detector bridging to the new ApplicationPageDetector
   */
  public detectForm(root: Document | ShadowRoot = document): FormDetectionSummary {
    const result = applicationPageDetector.detectApplication(root);
    return {
      isApplicationForm: result.isApplicationPage,
      confidence: result.confidence,
      autofillReady: result.autofillReady,
      fieldCount: result.fieldCount,
      fillableFieldCount: result.fillableFieldCount,
      manualRequiredCount: result.manualRequiredCount,
      fields: result.detectedFields,
      companyName: result.companyName,
      jobTitle: result.jobTitle,
      stepInfo: result.stepInfo,
      metrics: result.metrics,
      detectionSignals: result.detectionSignals,
      uninspectableFramesCount: result.uninspectableFramesCount
    };
  }

  public generateCssSelector(el: HTMLElement): string {
    return fieldScanner.generateCssSelector(el);
  }
}

export const fieldDetector = new FieldDetector();
