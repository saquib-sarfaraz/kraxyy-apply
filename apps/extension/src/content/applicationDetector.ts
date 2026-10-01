import { IDetectedField } from '@kraxyy/types';
import { fieldScanner, ScanMetrics } from './fieldScanner';
import { applicationFieldClassifier } from './fieldClassifier';
import { applicationConfidenceEngine } from './confidenceEngine';

export interface ApplicationDetectionResult {
  isApplicationPage: boolean;
  confidence: number;
  autofillReady: boolean;
  fieldCount: number;
  fillableFieldCount: number;
  manualRequiredCount: number;
  detectedFields: IDetectedField[];
  frameCount: number;
  shadowRootCount: number;
  detectionSignals: {
    positiveSignals: string[];
    negativeSignals: string[];
    clusterMatches: string[];
    clusterScore: number;
  };
  metrics: ScanMetrics;
  companyName?: string;
  jobTitle?: string;
  stepInfo?: {
    currentStep?: number;
    totalSteps?: number;
    stepName?: string;
  };
  uninspectableFramesCount?: number;
}

export class ApplicationPageDetector {
  /**
   * Universal Application Detector:
   * 1. Scans DOM, Shadow DOMs, and accessible iframes via FieldScanner
   * 2. Classifies elements into canonical taxonomies with signals via ApplicationFieldClassifier
   * 3. Validates semantic field clusters and evaluates confidence via ApplicationConfidenceEngine
   * 4. Separates Application Detection from Autofill Readiness
   */
  public detectApplication(root: Document | ShadowRoot = document): ApplicationDetectionResult {
    console.log('[KRAXYY][APP] Application detector started');
    const doc = root instanceof Document ? root : (root.ownerDocument || document);

    // 1. Scan candidate elements
    const { elements, metrics } = fieldScanner.scan(root);

    // 2. Classify candidate elements into canonical taxonomies
    const detectedFields: IDetectedField[] = [];
    let fillableFieldCount = 0;
    let manualRequiredCount = 0;

    for (const meta of elements) {
      const field = applicationFieldClassifier.classify(meta);
      if (field.taxonomyType !== 'UNKNOWN') {
        detectedFields.push(field);

        if (field.status === 'MANUAL_REQUIRED' || field.taxonomyType === 'RESUME') {
          manualRequiredCount++;
        } else {
          fillableFieldCount++;
        }
      }
    }

    // 3. Evaluate cluster confidence and negative patterns
    const evaluation = applicationConfidenceEngine.evaluate(detectedFields, doc);

    console.log(`[KRAXYY][APP] Fields found: ${detectedFields.length} (Fillable: ${fillableFieldCount}, Manual: ${manualRequiredCount})`);
    console.log(`[KRAXYY][APP] Confidence: ${Math.round(evaluation.confidence * 100)}% (IsApp: ${evaluation.isApplicationPage})`);

    // 4. Determine Autofill Readiness:
    // Only ready if page is verified as an application form AND at least one fillable field exists
    const autofillReady = evaluation.isApplicationPage && fillableFieldCount > 0;

    // 5. Extract metadata and step info
    const { companyName, jobTitle } = this.extractMetadata(doc);
    const stepInfo = this.detectStepInfo(doc);

    return {
      isApplicationPage: evaluation.isApplicationPage,
      confidence: evaluation.confidence,
      autofillReady,
      fieldCount: detectedFields.length,
      fillableFieldCount,
      manualRequiredCount,
      detectedFields,
      frameCount: metrics.frameCount,
      shadowRootCount: metrics.shadowRootCount,
      detectionSignals: {
        positiveSignals: evaluation.positiveSignals,
        negativeSignals: evaluation.negativeSignals,
        clusterMatches: evaluation.clusterMatches,
        clusterScore: evaluation.clusterScore
      },
      metrics,
      companyName,
      jobTitle,
      stepInfo,
      uninspectableFramesCount: metrics.uninspectableFramesCount
    };
  }

  private extractMetadata(doc: Document): { companyName?: string; jobTitle?: string } {
    let companyName: string | undefined;
    let jobTitle: string | undefined;

    const pageTitle = doc.title || '';
    const h1 = doc.querySelector('h1')?.textContent?.trim();

    if (h1 && h1.length < 80) {
      jobTitle = h1;
    } else if (pageTitle) {
      const parts = pageTitle.split(/[-|–•]/);
      if (parts.length >= 2) {
        jobTitle = parts[0].trim();
        companyName = parts[1].trim();
      }
    }

    return { companyName, jobTitle };
  }

  private detectStepInfo(doc: Document): { currentStep?: number; totalSteps?: number; stepName?: string } | undefined {
    const text = doc.body?.textContent || '';
    const stepMatch = text.match(/step\s+(\d+)\s+of\s+(\d+)/i);
    if (stepMatch) {
      return {
        currentStep: parseInt(stepMatch[1], 10),
        totalSteps: parseInt(stepMatch[2], 10)
      };
    }
    return undefined;
  }
}

export const applicationPageDetector = new ApplicationPageDetector();
