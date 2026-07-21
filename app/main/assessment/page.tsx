// app/main/assessment/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchAssessmentAPI } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// --- TYPE DEFINITIONS ---
interface Question {
  id: number;
  level: string;
  question: string;
  options: string[];
}

interface AssessmentResult {
  message: string;
  final_score: number;
  level: string;
  roadmap_ready: boolean;
}

interface SessionData {
  message: string;
  session: {
    id: number;
    status: string;
    current_step: number;
    draft_data: Record<string, any>;
  };
}

interface SaveStepResponse {
  message: string;
  current_step: number;
}

type FormDataState = Record<string, Record<string, any>>;

export default function AssessmentPage() {
  const router = useRouter();

  // --- STATE MANAGEMENT ---
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<FormDataState>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [assessmentResult, setAssessmentResult] =
    useState<AssessmentResult | null>(null);
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState<boolean>(false); // 👈 Track if session is already done

  // --- API INITIALIZATION ---
  useEffect(() => {
    const initializeSession = async () => {
      try {
        setIsLoading(true);
        const data = await fetchAssessmentAPI<SessionData>("/session/");

        if (data.session) {
          setFormData(data.session.draft_data || {});
          setCurrentStep(data.session.current_step || 1);
        }
      } catch (error: any) {
        // 👇 Instead of redirecting right away, we change the UI state
        if (error.message?.includes("already completed")) {
          setIsAlreadyCompleted(true);
        } else {
          console.error("Session init failed:", error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();
  }, [router]);

  // Load questions specifically when reaching Step 6
  useEffect(() => {
    if (currentStep === 6 && questions.length === 0) {
      const loadQuestions = async () => {
        try {
          setIsLoading(true);
          const data = await fetchAssessmentAPI<Question[]>("/questions/");
          setQuestions(data);
        } catch (error) {
          console.error("Failed to load questions", error);
        } finally {
          setIsLoading(false);
        }
      };
      loadQuestions();
    }
  }, [currentStep, questions.length]);

  // --- HANDLERS ---
  const handleInputChange = (
    step: number,
    field: string | number,
    value: any,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [`step_${step}`]: {
        ...(prev[`step_${step}`] || {}),
        [field]: value,
      },
    }));
  };

  const handleNextClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const stepData = formData[`step_${currentStep}`] || {};

      const response = await fetchAssessmentAPI<SaveStepResponse>(
        "/save-step/",
        {
          method: "POST",
          body: JSON.stringify({
            step_number: currentStep,
            step_data: stepData,
          }),
        },
      );

      setCurrentStep(response.current_step);
    } catch (error) {
      alert("Failed to save progress. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackClick = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmitAssessment = async (
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const result = await fetchAssessmentAPI<AssessmentResult>("/submit/", {
        method: "POST",
        body: JSON.stringify({}),
      });

      setAssessmentResult(result);
    } catch (error: any) {
      alert(error.message || "Submission failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const getValue = (step: number, field: string | number): any => {
    return formData[`step_${step}`]?.[field] ?? "";
  };

  // --- RENDER PRE-COMPLETED SCREEN (PREVENTS AUTO-REDIRECT) ---
  if (isAlreadyCompleted) {
    return (
      <div className="w-full min-h-[85vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 border rounded-lg shadow-sm text-center bg-white">
          <h2 className="text-2xl font-bold mb-4 text-emerald-600">
            Assessment Finished!
          </h2>
          <p className="text-gray-600 mb-6">
            You have already completed this academic assessment. Your profile
            and answers are saved.
          </p>
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={() => router.push("/main/chat")}
          >
            Go to Chat
          </Button>
        </div>
      </div>
    );
  }

  // --- RENDER COMPLETION SCREEN (AFTER NEW SUBMISSION) ---
  if (assessmentResult) {
    return (
      <div className="w-full min-h-[85vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 border rounded-lg shadow-sm text-center bg-white">
          <h2 className="text-2xl font-bold mb-4">Assessment Complete!</h2>
          <p className="text-gray-600 mb-2">Your final score is:</p>
          <p className="text-5xl font-extrabold text-blue-600 mb-4">
            {assessmentResult.final_score}/10
          </p>
          <p className="text-lg font-semibold mb-8">
            Level: {assessmentResult.level}
          </p>
          <Button className="w-full" onClick={() => router.push("/main/chat")}>
            Go to Chat
          </Button>
        </div>
      </div>
    );
  }

  // --- RENDER LOADING (INITIAL) ---
  if (isLoading && currentStep === 1 && !formData.step_1) {
    return (
      <div className="w-full min-h-[85vh] flex items-center justify-center p-4 text-center font-medium text-gray-500">
        Loading your assessment session...
      </div>
    );
  }

  // --- RENDER WIZARD (CENTERED) ---
  return (
    <div className="w-full min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md border rounded-lg p-6 shadow-sm bg-white">
        <div className="mb-6 flex justify-between items-center text-sm text-gray-500">
          <span className="font-medium">Step {currentStep} of 7</span>
          <div className="flex gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className={`h-2 w-8 rounded-full ${
                  i + 1 <= currentStep ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>

        <form>
          <FieldGroup>
            {/* STEP 1: Basic Info */}
            {currentStep === 1 && (
              <FieldSet>
                <FieldLegend>Personal Details</FieldLegend>
                <FieldDescription>Let's get to know you.</FieldDescription>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="name">First Name</FieldLabel>
                    <Input
                      id="name"
                      value={getValue(1, "name")}
                      onChange={(e) =>
                        handleInputChange(1, "name", e.target.value)
                      }
                      placeholder="Leo"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="age">Age Group</FieldLabel>
                    <Select
                      value={getValue(1, "age_group")}
                      onValueChange={(val) =>
                        handleInputChange(1, "age_group", val)
                      }
                    >
                      <SelectTrigger id="age">
                        <SelectValue placeholder="Select age range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="18-24">18-24</SelectItem>
                          <SelectItem value="25-34">25-34</SelectItem>
                          <SelectItem value="35-44">35-44</SelectItem>
                          <SelectItem value="45+">45+</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="language">Native Language</FieldLabel>
                    <Input
                      id="language"
                      value={getValue(1, "native_language")}
                      onChange={(e) =>
                        handleInputChange(1, "native_language", e.target.value)
                      }
                      placeholder="e.g. Spanish"
                    />
                  </Field>
                </FieldGroup>
              </FieldSet>
            )}

            {/* STEP 2: Self-Assessment */}
            {currentStep === 2 && (
              <FieldSet>
                <FieldLegend>Self Assessment</FieldLegend>
                <FieldDescription>
                  Rate your current abilities out of 10.
                </FieldDescription>
                <FieldGroup>
                  <Field>
                    <FieldLabel>Overall Rating</FieldLabel>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={getValue(2, "overall_rating")}
                      onChange={(e) =>
                        handleInputChange(
                          2,
                          "overall_rating",
                          parseInt(e.target.value) || "",
                        )
                      }
                      placeholder="e.g. 6"
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Reading Skill</FieldLabel>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={getValue(2, "reading_skill")}
                      onChange={(e) =>
                        handleInputChange(
                          2,
                          "reading_skill",
                          parseInt(e.target.value) || "",
                        )
                      }
                      placeholder="e.g. 7"
                    />
                  </Field>
                </FieldGroup>
              </FieldSet>
            )}

            {/* STEPS 3-5: Placeholder examples */}
            {currentStep >= 3 && currentStep <= 5 && (
              <FieldSet>
                <FieldLegend>Step {currentStep}: Additional Info</FieldLegend>
                <FieldDescription>
                  Tell us a bit more about your goals.
                </FieldDescription>
                <FieldGroup>
                  <Field>
                    <FieldLabel>Brief description</FieldLabel>
                    <Textarea
                      value={getValue(currentStep, "notes")}
                      onChange={(e) =>
                        handleInputChange(currentStep, "notes", e.target.value)
                      }
                      placeholder="Write here..."
                      className="resize-none"
                    />
                  </Field>
                </FieldGroup>
              </FieldSet>
            )}

            {/* STEP 6: The Academic Quiz */}
            {currentStep === 6 && (
              <FieldSet>
                <FieldLegend>Academic Assessment</FieldLegend>
                <FieldDescription>
                  Select the best answer for each question.
                </FieldDescription>
                <FieldGroup>
                  {isLoading && questions.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Loading questions...
                    </p>
                  ) : (
                    questions.map((q) => (
                      <Field key={q.id}>
                        <FieldLabel className="text-base font-medium">
                          {q.question}
                        </FieldLabel>
                        <div className="flex flex-col gap-2 mt-2 ml-2">
                          {q.options.map((opt, idx) => (
                            <label
                              key={idx}
                              className="flex items-center gap-3 text-sm cursor-pointer"
                            >
                              <input
                                type="radio"
                                name={`question_${q.id}`}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                checked={getValue(6, q.id) === idx}
                                onChange={() => handleInputChange(6, q.id, idx)}
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                        <FieldSeparator className="mt-4" />
                      </Field>
                    ))
                  )}
                </FieldGroup>
              </FieldSet>
            )}

            {/* STEP 7: Submission */}
            {currentStep === 7 && (
              <FieldSet>
                <FieldLegend>Ready to Submit</FieldLegend>
                <FieldDescription>
                  You have completed all questions.
                </FieldDescription>
                <FieldGroup>
                  <Field orientation="horizontal">
                    <Checkbox
                      id="confirm"
                      checked={getValue(7, "confirmed") === true}
                      onCheckedChange={(checked) =>
                        handleInputChange(7, "confirmed", checked)
                      }
                    />
                    <FieldLabel htmlFor="confirm" className="font-normal">
                      I confirm my answers are ready for grading.
                    </FieldLabel>
                  </Field>
                </FieldGroup>
              </FieldSet>
            )}

            {/* --- NAVIGATION BUTTONS --- */}
            <FieldSeparator />
            <Field orientation="horizontal" className="justify-between pt-4">
              <Button
                variant="outline"
                type="button"
                onClick={handleBackClick}
                disabled={currentStep === 1 || isLoading}
              >
                Back
              </Button>

              {currentStep < 7 ? (
                <Button
                  type="button"
                  onClick={handleNextClick}
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Next Step"}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmitAssessment}
                  disabled={isLoading || !getValue(7, "confirmed")}
                >
                  {isLoading ? "Grading..." : "Submit Test"}
                </Button>
              )}
            </Field>
          </FieldGroup>
        </form>
      </div>
    </div>
  );
}
