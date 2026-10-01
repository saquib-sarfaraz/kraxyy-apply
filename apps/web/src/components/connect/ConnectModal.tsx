import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Sparkles,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { api } from '../../services/api';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: string;
  source?: string;
}

const CATEGORIES = [
  'Website',
  'Chrome Extension',
  'Application / Auto-fill',
  'Bug / Problem',
  'Partnership',
  'Other'
] as const;

export const ConnectModal: React.FC<ConnectModalProps> = ({
  isOpen,
  onClose,
  defaultCategory = 'Website',
  source = 'website'
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<string>(defaultCategory);
  const [message, setMessage] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);

  // Status & Validation
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const modalRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSuccess(false);
      setErrorMessage(null);
      setErrors({});
      // Focus name input after animation
      setTimeout(() => nameInputRef.current?.focus(), 100);
      // Lock background scroll
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submitting, onClose]);

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Please enter your name';
    }

    if (!email.trim()) {
      newErrors.email = 'Please enter your email';
    } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!category) {
      newErrors.category = 'Please select what we can help with';
    }

    if (!message.trim()) {
      newErrors.message = 'Please enter a message';
    } else if (message.trim().length < 5) {
      newErrors.message = 'Message must be at least 5 characters';
    } else if (message.length > 2000) {
      newErrors.message = 'Message cannot exceed 2000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!validate()) {
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      await api.post('/contact', {
        name: name.trim(),
        email: email.trim(),
        category,
        message: message.trim(),
        source,
        attachmentUrl: fileName ? `[Attached: ${fileName}]` : undefined
      });

      setSuccess(true);
      // Clear form inputs
      setName('');
      setEmail('');
      setMessage('');
      setFileName(null);
    } catch (err: any) {
      console.error('Contact submission error:', err);
      setErrorMessage(
        err.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit');
        return;
      }
      setFileName(file.name);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="connect-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-charcoal/40 backdrop-blur-sm transition-opacity duration-300"
      onClick={(e) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node) && !submitting) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="w-full sm:max-w-lg bg-cream rounded-t-3xl sm:rounded-2xl border border-beige shadow-modal max-h-[92vh] sm:max-h-[88vh] overflow-y-auto flex flex-col transition-all duration-300 transform scale-100"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-beige/60 flex items-start justify-between bg-white/60 sticky top-0 backdrop-blur-md z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-olive-50 border border-olive/20 text-[10px] font-mono font-bold uppercase tracking-wider text-olive mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Direct Support & Inquiries</span>
            </div>
            <h2
              id="connect-modal-title"
              className="text-xl sm:text-2xl font-display font-extrabold text-charcoal tracking-tight"
            >
              Connect with Kraxyy
            </h2>
            <p className="text-xs text-charcoal-muted leading-relaxed max-w-sm">
              Have a question, found a problem, or want to work together? Send us a message.
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={submitting}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-charcoal-muted hover:text-charcoal hover:bg-cream-dark transition shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 pt-4 flex-1">
          {success ? (
            /* Success State */
            <div className="py-8 sm:py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-olive-50 border border-olive/20 text-olive flex items-center justify-center mx-auto animate-bounce-subtle">
                <CheckCircle2 className="w-8 h-8 text-olive" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-display font-extrabold text-charcoal">
                  Message sent successfully.
                </h3>
                <p className="text-xs sm:text-sm text-charcoal-muted max-w-xs mx-auto leading-relaxed">
                  Thanks for reaching out. We'll get back to you soon.
                </p>
              </div>

              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="btn-tactile px-6 py-2.5 bg-olive text-cream rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-olive-hover transition shadow-soft"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Submission Form */
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Name & Email Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="connect-name"
                    className="block text-xs font-semibold text-charcoal mb-1"
                  >
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={nameInputRef}
                    id="connect-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors({ ...errors, name: '' });
                    }}
                    placeholder="Your name"
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-white text-charcoal placeholder:text-charcoal-muted/50 focus:outline-none focus:ring-2 focus:ring-olive/30 transition ${
                      errors.name ? 'border-red-400 bg-red-50/20' : 'border-beige hover:border-olive/50'
                    }`}
                  />
                  {errors.name && (
                    <p className="text-[10px] text-red-600 mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="connect-email"
                    className="block text-xs font-semibold text-charcoal mb-1"
                  >
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="connect-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    placeholder="you@example.com"
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-white text-charcoal placeholder:text-charcoal-muted/50 focus:outline-none focus:ring-2 focus:ring-olive/30 transition ${
                      errors.email ? 'border-red-400 bg-red-50/20' : 'border-beige hover:border-olive/50'
                    }`}
                  />
                  {errors.email && (
                    <p className="text-[10px] text-red-600 mt-1">{errors.email}</p>
                  )}
                </div>
              </div>

              {/* Category Dropdown */}
              <div>
                <label
                  htmlFor="connect-category"
                  className="block text-xs font-semibold text-charcoal mb-1"
                >
                  What can we help with? <span className="text-red-500">*</span>
                </label>
                <select
                  id="connect-category"
                  required
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    if (errors.category) setErrors({ ...errors, category: '' });
                  }}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-beige bg-white text-charcoal hover:border-olive/50 focus:outline-none focus:ring-2 focus:ring-olive/30 transition cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-[10px] text-red-600 mt-1">{errors.category}</p>
                )}
              </div>

              {/* Message Area */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="connect-message"
                    className="block text-xs font-semibold text-charcoal"
                  >
                    Message <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] font-mono text-charcoal-muted">
                    {message.length}/2000
                  </span>
                </div>
                <textarea
                  id="connect-message"
                  required
                  rows={4}
                  maxLength={2000}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (errors.message) setErrors({ ...errors, message: '' });
                  }}
                  placeholder="Tell us what you need help with, report an issue, or propose a partnership..."
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-white text-charcoal placeholder:text-charcoal-muted/50 focus:outline-none focus:ring-2 focus:ring-olive/30 transition resize-none leading-relaxed ${
                    errors.message ? 'border-red-400 bg-red-50/20' : 'border-beige hover:border-olive/50'
                  }`}
                />
                {errors.message && (
                  <p className="text-[10px] text-red-600 mt-1">{errors.message}</p>
                )}
              </div>

              {/* Optional Attachment */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-charcoal">
                    Screenshot / attachment{' '}
                    <span className="text-charcoal-muted font-normal text-[11px]">(optional)</span>
                  </span>
                  {fileName && (
                    <button
                      type="button"
                      onClick={() => setFileName(null)}
                      className="text-[10px] text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="mt-1.5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                    id="connect-attachment-input"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-3.5 py-2 border border-dashed border-beige hover:border-olive bg-white/70 rounded-xl text-xs text-charcoal-muted hover:text-charcoal flex items-center justify-center gap-2 transition"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-olive" />
                    <span>{fileName || 'Add screenshot or document (max 5MB)'}</span>
                  </button>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-tactile w-full py-3.5 bg-olive text-cream rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-olive-hover transition shadow-soft flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed group"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-mustard" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Message</span>
                      <ArrowRight className="w-3.5 h-3.5 text-mustard transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
