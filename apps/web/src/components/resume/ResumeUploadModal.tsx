import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { IResume } from '@kraxyy/types';
import {
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  X,
  Briefcase,
  GraduationCap,
  Award
} from 'lucide-react';

interface ResumeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (resume: IResume) => void;
  initialFile?: File | null;
}

type StepType = 'IDLE' | 'UPLOADING' | 'EXTRACTING' | 'REASONING' | 'BUILDING' | 'READY';

export const ResumeUploadModal: React.FC<ResumeUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialFile
}) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<StepType>('IDLE');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [selectedFileName, setSelectedFileName] = useState('');

  const resetState = () => {
    setStep('IDLE');
    setProgress(0);
    setErrorMessage('');
    setParsedData(null);
    setSelectedFileName('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  useEffect(() => {
    if (isOpen && initialFile) {
      processUpload(initialFile);
    } else if (!isOpen) {
      resetState();
    }
  }, [isOpen, initialFile]);

  const processUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 10MB limit.');
      return;
    }

    setSelectedFileName(file.name);
    setErrorMessage('');
    setStep('UPLOADING');
    setProgress(15);

    // Progression timers for smooth UX
    const timer1 = setTimeout(() => {
      setStep('EXTRACTING');
      setProgress(40);
    }, 600);

    const timer2 = setTimeout(() => {
      setStep('REASONING');
      setProgress(70);
    }, 1200);

    const timer3 = setTimeout(() => {
      setStep('BUILDING');
      setProgress(90);
    }, 1800);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post<any>('/resumes/upload', formData);

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      const resumeObj = res?.resume || res;
      const profileObj = res?.profile;
      const suggested = resumeObj?.parsedDraft?.suggestedData || resumeObj?.parsedData || profileObj || {};

      setParsedData(suggested);
      setProgress(100);
      setStep('READY');

      if (onSuccess) {
        onSuccess(resumeObj);
      }
    } catch (err) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setErrorMessage((err as Error).message || 'Failed to analyze resume. Please try again.');
      setStep('IDLE');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUpload(file);
    }
  };

  if (!isOpen) return null;

  const skillsCount =
    parsedData?.skills?.length ||
    parsedData?.professional?.skills?.length ||
    0;

  const experienceCount = parsedData?.experiences?.length || 0;
  const educationCount = parsedData?.educations?.length || 0;
  const candidateName =
    parsedData?.personal?.firstName && parsedData?.personal?.lastName
      ? `${parsedData.personal.firstName} ${parsedData.personal.lastName}`
      : parsedData?.personal?.firstName || parsedData?.personal?.name || 'Candidate';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-card border border-beige shadow-lg max-w-lg w-full p-6 sm:p-8 space-y-6 relative">
        {/* Close Button */}
        {step !== 'UPLOADING' && step !== 'EXTRACTING' && step !== 'REASONING' && step !== 'BUILDING' && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-charcoal-muted hover:text-charcoal p-1.5 rounded-full hover:bg-beige-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* STEP 1: INITIAL UPLOAD PROMPT */}
        {step === 'IDLE' && (
          <div className="space-y-5 text-center">
            <div className="w-14 h-14 bg-olive-50 rounded-2xl flex items-center justify-center mx-auto text-olive border border-olive/10 shadow-xs">
              <UploadCloud className="w-7 h-7 text-mustard" />
            </div>

            <div>
              <h3 className="text-xl font-editorial font-bold text-olive">
                Upload Your Resume
              </h3>
              <p className="text-xs sm:text-sm text-charcoal-muted mt-1 max-w-sm mx-auto leading-relaxed">
                Upload your PDF or DOCX resume. Kraxyy will automatically read your background and build your candidate profile.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-subtle text-left">
                {errorMessage}
              </div>
            )}

            <label className="block border-2 border-dashed border-beige hover:border-olive/60 bg-cream-50/50 hover:bg-cream-50 rounded-xl p-8 cursor-pointer transition text-center group">
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <FileText className="w-8 h-8 text-charcoal-muted group-hover:text-olive mx-auto mb-2 transition" />
              <p className="text-xs font-bold text-charcoal group-hover:text-olive transition">
                Click to browse or drop your resume here
              </p>
              <p className="text-[11px] text-charcoal-muted mt-1">
                Supports PDF, DOCX (Up to 10MB)
              </p>
            </label>
          </div>
        )}

        {/* STEP 2-4: ANIMATED ANALYZING STATE */}
        {(step === 'UPLOADING' ||
          step === 'EXTRACTING' ||
          step === 'REASONING' ||
          step === 'BUILDING') && (
          <div className="space-y-6 py-4 text-center">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-beige/60 border-t-olive animate-spin"></div>
              <Sparkles className="w-6 h-6 text-mustard" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold font-editorial text-olive">
                {step === 'UPLOADING' && 'Uploading resume...'}
                {step === 'EXTRACTING' && 'Reading resume text...'}
                {step === 'REASONING' && 'Understanding experience & skills...'}
                {step === 'BUILDING' && 'Building your profile...'}
              </h3>
              <p className="text-xs text-charcoal-muted max-w-xs mx-auto">
                {selectedFileName || 'Analyzing candidate credentials'}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-cream rounded-full h-2 overflow-hidden border border-beige/60">
                <div
                  className="bg-olive h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-charcoal-muted font-medium">
                <span>Resume Analysis</span>
                <span>{progress}%</span>
              </div>
            </div>

            {/* Micro steps indicators */}
            <div className="grid grid-cols-4 gap-2 pt-2 text-[10px] font-semibold text-charcoal-muted">
              <span className={step !== 'UPLOADING' ? 'text-olive' : 'text-charcoal'}>
                1. Upload
              </span>
              <span className={step === 'REASONING' || step === 'BUILDING' ? 'text-olive' : ''}>
                2. Read
              </span>
              <span className={step === 'BUILDING' ? 'text-olive' : ''}>
                3. Understand
              </span>
              <span className="">
                4. Profile
              </span>
            </div>
          </div>
        )}

        {/* STEP 5: CELEBRATORY SUCCESS STATE */}
        {step === 'READY' && (
          <div className="space-y-6 text-center animate-fade-in">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-700 border border-green-200/80 shadow-xs">
              <CheckCircle2 className="w-8 h-8 text-green-700" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-2xl font-editorial font-bold text-olive">
                Your profile is ready.
              </h3>
              <p className="text-xs sm:text-sm text-charcoal-muted max-w-sm mx-auto leading-relaxed">
                We created it from your resume. Review anything you want to change.
              </p>
            </div>

            {/* Summary Pill Badges */}
            <div className="grid grid-cols-3 gap-2 bg-cream-50 p-4 rounded-xl border border-beige/80 text-xs text-charcoal">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-muted block">
                  Candidate
                </span>
                <span className="font-semibold block truncate">{candidateName}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-muted block">
                  Skills Found
                </span>
                <span className="font-semibold block">{skillsCount} skills</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-muted block">
                  History
                </span>
                <span className="font-semibold block">
                  {experienceCount} jobs, {educationCount} edu
                </span>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => {
                  handleClose();
                  navigate('/profile?from=resume-upload');
                }}
                className="w-full py-3 bg-olive text-white rounded-subtle font-semibold text-xs hover:bg-olive-hover transition flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Review Profile</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  handleClose();
                  navigate('/match');
                }}
                className="w-full py-2.5 bg-white border border-beige text-charcoal rounded-subtle font-semibold text-xs hover:border-olive transition flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-mustard" />
                <span>Go to Job Matches</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
