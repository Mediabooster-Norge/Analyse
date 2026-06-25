'use client';

import { CheckCircle2, Loader2 } from 'lucide-react';
import type { AnalysisStepConfig } from './analysis-steps';

export interface AnalysisProgressViewProps {
  analysisSteps: AnalysisStepConfig[];
  effectiveStep: number;
  elapsedTime: number;
  showStepLabel: string;
  showStepDesc?: string;
  /** Spinning loader on current step icon (PageSpeed/competitors async phase) */
  asyncCurrentStep?: boolean;
  /** Optional URL shown above progress */
  websiteUrl?: string;
  showKeepOpenWarning?: boolean;
  resolveStepLabel?: (
    step: AnalysisStepConfig,
    index: number,
    isCurrent: boolean
  ) => string;
}

export function AnalysisProgressView({
  analysisSteps,
  effectiveStep,
  elapsedTime,
  showStepLabel,
  showStepDesc = 'Vennligst vent',
  asyncCurrentStep = false,
  websiteUrl,
  showKeepOpenWarning = true,
  resolveStepLabel,
}: AnalysisProgressViewProps) {
  return (
    <div className="space-y-3 sm:space-y-4">
      {websiteUrl ? (
        <div className="text-center sm:text-left">
          <p className="text-xs text-neutral-500">Analyserer</p>
          <p className="text-sm font-medium text-neutral-900 truncate">{websiteUrl}</p>
        </div>
      ) : null}

      <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-3 sm:p-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative w-12 sm:w-14 h-12 sm:h-14 shrink-0">
            <svg className="w-12 sm:w-14 h-12 sm:h-14 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="#e5e5e5" strokeWidth="3" />
              <circle
                cx="28"
                cy="28"
                r="24"
                fill="none"
                stroke="#737373"
                strokeWidth="3"
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
                strokeDasharray={`${((effectiveStep + 1) / analysisSteps.length) * 150.8} 150.8`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-neutral-700 text-xs sm:text-sm font-semibold">
                {`${effectiveStep + 1}/${analysisSteps.length}`}
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-neutral-900 text-sm sm:text-base font-medium flex items-center gap-2 mb-1">
              {showStepLabel}
              <span className="inline-flex gap-0.5">
                <span
                  className="w-1 h-1 rounded-full bg-neutral-400 animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-1 h-1 rounded-full bg-neutral-400 animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-1 h-1 rounded-full bg-neutral-400 animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </span>
            </p>
            <p className="text-neutral-500 text-xs sm:text-sm">{showStepDesc}</p>
          </div>

          <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-white border border-neutral-200 shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-neutral-900 animate-pulse" />
            <span className="text-xs sm:text-sm font-medium text-neutral-700 tabular-nums">
              {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 overflow-hidden bg-white">
        <div className="divide-y divide-neutral-100">
          {analysisSteps.map((step, index) => {
            const StepIcon = step.icon;
            const isComplete = index < effectiveStep;
            const isCurrent = index === effectiveStep;
            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 px-4 py-2.5 transition-all duration-300 ${
                  isCurrent ? 'bg-neutral-50 border-l-2 border-l-neutral-400 animate-pulse' : ''
                }`}
              >
                <div
                  className={`relative w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-all duration-300 ${
                    isComplete
                      ? 'bg-neutral-900/10'
                      : isCurrent
                        ? 'bg-neutral-200'
                        : 'bg-neutral-100'
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-neutral-900" />
                  ) : isCurrent ? (
                    <>
                      {asyncCurrentStep ? (
                        <Loader2 className="h-3.5 w-3.5 text-neutral-700 animate-spin" />
                      ) : (
                        <StepIcon className="h-3.5 w-3.5 text-neutral-700" />
                      )}
                      <span className="absolute inset-0 rounded-md border border-neutral-300 animate-pulse" />
                    </>
                  ) : (
                    <StepIcon className="h-3.5 w-3.5 text-neutral-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm ${
                      isComplete || isCurrent
                        ? 'text-neutral-900 font-medium'
                        : 'text-neutral-400'
                    }`}
                  >
                    {resolveStepLabel
                      ? resolveStepLabel(step, index, isCurrent)
                      : step.label}
                  </p>
                </div>
                <span
                  className={`text-xs tabular-nums shrink-0 ${
                    isComplete
                      ? 'text-neutral-900'
                      : isCurrent
                        ? 'text-neutral-600'
                        : 'text-neutral-300'
                  }`}
                >
                  {isComplete ? '✓' : isCurrent ? 'Pågår' : step.duration}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-center text-xs text-neutral-400">Vanligvis 1–2 minutter</p>
      {showKeepOpenWarning ? (
        <p className="text-center text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Hold dette vinduet åpent — lukker du det kan analysen gå tapt.
        </p>
      ) : null}
    </div>
  );
}
