"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronRight, ChevronLeft, Check, Sparkles } from "lucide-react";

export function CreateStoryScreen() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const steps = [
    { id: 1, title: "Who" },
    { id: 2, title: "Where" },
    { id: 3, title: "Problem" },
    { id: 4, title: "Solution" },
    { id: 5, title: "Read" },
  ];

  const characters = [
    { id: 1, title: "A Brave Fox", img: "/images/lesson-story.png", bg: "bg-snow-primary/10" },
    { id: 2, title: "A Baby Penguin", img: "/images/lesson-math.png", bg: "bg-snow-warning/10" },
    { id: 3, title: "Two Kind Friends", img: "/images/lesson-social.png", bg: "bg-snow-aqua/10" },
  ];

  return (
    <div className="relative flex h-full min-h-[760px] flex-col">
      {/* Stepper Header */}
      <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4 hide-scrollbar">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isPassed = step.id < currentStep;
          
          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`flex items-center gap-2 ${isActive ? 'scale-110 origin-left' : 'opacity-60'} transition-all`}>
                  <div className={`grid size-8 place-items-center rounded-full text-sm font-black ${
                    isActive ? 'bg-snow-primary text-white shadow-md' :
                    isPassed ? 'bg-snow-primary-soft text-snow-primary' :
                    'bg-white border-2 border-snow-border text-snow-muted'
                  }`}>
                    {isPassed ? <Check className="size-4" /> : step.id}
                  </div>
                  <span className={`font-black ${isActive ? 'text-snow-primary-dark text-lg' : 'text-snow-muted text-sm'}`}>
                    {step.title}
                  </span>
                </div>
              </div>
              
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="w-12 md:w-24 h-1 mx-4 rounded-full bg-snow-border relative overflow-hidden">
                  <div className={`absolute top-0 left-0 h-full bg-snow-primary transition-all duration-500 ${isPassed ? 'w-full' : 'w-0'}`}></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="text-center mb-10 mt-4">
          <div className="inline-flex items-center gap-2 px-4 py-1 bg-snow-primary/10 rounded-full mb-4">
            <Sparkles className="size-4 text-snow-primary" />
            <span className="text-xs font-black text-snow-primary uppercase tracking-wider">Step {currentStep}</span>
          </div>
        <h1 className="text-4xl font-black text-snow-primary-dark md:text-5xl">Who is the hero of our story?</h1>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto px-4">
          {characters.map((char) => {
            const isSelected = selectedOption === char.id;
            return (
              <button
                key={char.id}
                onClick={() => setSelectedOption(char.id)}
                className={`group relative flex flex-col items-center p-4 bg-white rounded-3xl transition-all duration-300 text-left ${
                  isSelected 
                    ? `ring-4 ring-snow-primary ring-offset-4 shadow-xl scale-105 ${char.bg}` 
                    : 'border-2 border-snow-border hover:border-snow-primary/50 hover:shadow-md hover:-translate-y-1'
                }`}
              >
                {/* Character Image */}
                <div className="w-full aspect-[3/4] relative rounded-2xl overflow-hidden mb-4 bg-snow-surface-soft">
                  <Image src={char.img} alt={char.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                
                {/* Character Title */}
                <h3 className={`text-xl font-black w-full text-center ${isSelected ? 'text-snow-primary-dark' : 'text-snow-muted group-hover:text-snow-primary-dark'}`}>
                  {char.title}
                </h3>
                
                {/* Selection Checkmark */}
                {isSelected && (
                  <div className="absolute -top-3 -right-3 grid size-10 place-items-center rounded-full bg-snow-primary text-white shadow-lg">
                    <Check className="size-6" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-snow-border p-4 flex items-center justify-between rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50">
        <button 
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          className={`flex items-center gap-2 px-6 py-4 rounded-full font-bold text-lg transition-colors ${
            currentStep === 1 ? 'text-snow-muted opacity-50 cursor-not-allowed' : 'text-snow-primary-dark hover:bg-snow-surface-soft'
          }`}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="size-5" /> Go Back
        </button>
        
        <button 
          onClick={() => setCurrentStep(Math.min(5, currentStep + 1))}
          className={`flex items-center gap-2 px-10 py-4 rounded-full font-black text-lg transition-all shadow-md ${
            selectedOption 
              ? 'bg-snow-primary text-white hover:bg-snow-primary-dark hover:-translate-y-1 hover:shadow-lg' 
              : 'bg-snow-surface-soft text-snow-muted cursor-not-allowed'
          }`}
          disabled={!selectedOption}
        >
          Next Step <ChevronRight className="size-5" />
        </button>
      </div>
    </div>
  );
}
