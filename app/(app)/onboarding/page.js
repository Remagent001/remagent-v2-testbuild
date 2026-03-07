"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import StepGettingStarted from "@/components/App/Onboarding/StepGettingStarted";
import StepExperience from "@/components/App/Onboarding/StepExperience";
import StepChannels from "@/components/App/Onboarding/StepChannels";
import StepEducation from "@/components/App/Onboarding/StepEducation";
import StepEmployment from "@/components/App/Onboarding/StepEmployment";
import StepLanguages from "@/components/App/Onboarding/StepLanguages";
import StepAvailability from "@/components/App/Onboarding/StepAvailability";
import StepEnvironment from "@/components/App/Onboarding/StepEnvironment";
import StepHourlyRate from "@/components/App/Onboarding/StepHourlyRate";
import StepPhoto from "@/components/App/Onboarding/StepPhoto";
import StepVideo from "@/components/App/Onboarding/StepVideo";
import StepLocation from "@/components/App/Onboarding/StepLocation";
import StepContact from "@/components/App/Onboarding/StepContact";
import StepAgreement from "@/components/App/Onboarding/StepAgreement";

const STEPS = [
  { num: 1, label: "Getting Started", component: StepGettingStarted },
  { num: 2, label: "Experience", component: StepExperience },
  { num: 3, label: "Channels", component: StepChannels },
  { num: 4, label: "Education", component: StepEducation },
  { num: 5, label: "Employment", component: StepEmployment },
  { num: 6, label: "Languages", component: StepLanguages },
  { num: 7, label: "Availability", component: StepAvailability },
  { num: 8, label: "Environment", component: StepEnvironment },
  { num: 9, label: "Hourly Rate", component: StepHourlyRate },
  { num: 10, label: "Photo", component: StepPhoto },
  { num: 11, label: "Video", component: StepVideo },
  { num: 12, label: "Location", component: StepLocation },
  { num: 13, label: "Contact", component: StepContact },
  { num: 14, label: "Agreement", component: StepAgreement },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [allData, setAllData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load all onboarding data on mount
  useEffect(() => {
    fetch("/api/onboarding/load")
      .then((r) => r.json())
      .then((data) => {
        setAllData(data);
        // Resume where they left off
        const step = data.profile?.onboardingStep || 1;
        setCurrentStep(Math.min(step, 14));
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load your profile data.");
        setLoading(false);
      });
  }, []);

  const saveStep = async (stepNum, stepData) => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: stepNum, data: stepData }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Save failed");
      }
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async (stepData) => {
    const ok = await saveStep(currentStep, stepData);
    if (ok) {
      if (currentStep === 14) {
        router.push("/dashboard");
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSaveExit = async (stepData) => {
    await saveStep(currentStep, stepData);
    router.push("/dashboard");
  };

  const handleSkip = () => {
    if (currentStep < 14) setCurrentStep(currentStep + 1);
  };

  if (loading) {
    return (
      <div className="onboarding-loading">
        <div className="onboarding-spinner" />
        <p>Loading your profile...</p>
      </div>
    );
  }

  const stepConfig = STEPS[currentStep - 1];
  const StepComponent = stepConfig.component;
  const progress = ((currentStep - 1) / 14) * 100;

  return (
    <div className="onboarding">
      {/* Progress header */}
      <div className="onboarding-header">
        <div className="onboarding-header-top">
          <h1 className="onboarding-title">Complete Your Profile</h1>
          <span className="onboarding-step-count">
            Step {currentStep} of 14
          </span>
        </div>
        <div className="onboarding-progress">
          <div className="onboarding-progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <div className="onboarding-step-label">{stepConfig.label}</div>
      </div>

      {/* Error */}
      {error && <div className="form-error">{error}</div>}

      {/* Step content */}
      <div className="onboarding-body">
        <StepComponent
          data={allData}
          onNext={handleNext}
          onBack={handleBack}
          onSaveExit={handleSaveExit}
          onSkip={handleSkip}
          isFirst={currentStep === 1}
          isLast={currentStep === 14}
          saving={saving}
        />
      </div>
    </div>
  );
}
