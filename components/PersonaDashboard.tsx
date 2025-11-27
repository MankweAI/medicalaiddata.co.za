'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PricingEngine, FinancialProfile } from '@/utils/engine';
import { PersonaEngine, UserProfile, PlanRisk } from '@/utils/persona';
import { AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

// Placeholder imports for Step 4 (Hero Tools)
// You will create these in the next step. For now, they render simple text.
const GapGauge = ({ profile }: { profile: any }) => <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl mb-6 text-center text-indigo-800 font-bold">🚀 Hero Tool: Gap Gauge Loading...</div>;
const RewardStacker = ({ profile }: { profile: any }) => <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl mb-6 text-center text-blue-800 font-bold">💎 Hero Tool: Reward Stacker Loading...</div>;
const IncomeSlider = ({ onChange }: { onChange: (val: number) => void }) => <div className="p-4 bg-green-50 border border-green-100 rounded-xl mb-6 text-center text-green-800 font-bold">💸 Hero Tool: Income Slider Loading...</div>;

export default function PersonaDashboard({ persona, plans, content }: { persona: string, plans: any[], content: any }) {
    const searchParams = useSearchParams();

    // 1. Hydrate State from URL (The "Scale" Strategy)
    const [income, setIncome] = useState<number>(Number(searchParams.get('income')) || 0);
    const [members, setMembers] = useState({
        main: Number(searchParams.get('main')) || 1,
        adult: Number(searchParams.get('adult')) || 0,
        child: Number(searchParams.get('child')) || 0
    });

    // 2. Determine User Profile for Logic Engine
    const userProfile: UserProfile = {
        persona: persona as any,
        needs: PersonaEngine.getDefaultsForPersona(persona as any)
    };

    // 3. Conditional Hero Rendering
    const renderHeroTool = () => {
        switch (persona) {
            case 'The Chronic Warrior': return <GapGauge profile={{ income, members }} />;
            case 'The Digital Native': return <RewardStacker profile={{ income, members }} />;
            case 'The Budget Conscious': return <IncomeSlider onChange={setIncome} />;
            default: return null;
        }
    };

    return (
        <div className="animate-in fade-in duration-500">
            {/* HERO SECTION: The "Computational Authority" */}
            <div className="mb-10">
                {renderHeroTool()}
            </div>

            {/* SCENARIO WARS: The Plan List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => {
                    // RUN THE ENGINES
                    const risks = PersonaEngine.validatePlan(plan.name, userProfile);
                    const financials = PricingEngine.calculateProfile(plan.contributions[0], members, income);

                    const isHighRisk = risks.some(r => r.level === 'HIGH');

                    return (
                        <div key={plan.id} className={clsx(
                            "relative bg-white rounded-2xl border transition-all hover:shadow-lg flex flex-col",
                            isHighRisk ? "border-red-200" : "border-slate-200"
                        )}>
                            {/* RISK HEADER */}
                            {isHighRisk && (
                                <div className="bg-red-50 px-4 py-2 rounded-t-2xl flex items-start gap-2 border-b border-red-100">
                                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                                    <p className="text-xs text-red-700 font-medium leading-tight">
                                        {risks.find(r => r.level === 'HIGH')?.warning}
                                    </p>
                                </div>
                            )}

                            <div className="p-6 flex-grow">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-bold text-slate-900 text-lg">{plan.name}</h3>
                                    <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded">
                                        {plan.plan_series?.schemes?.name || 'Medical Aid'}
                                    </span>
                                </div>

                                {/* PRICE DISPLAY (Scenario-Based) */}
                                <div className="mb-6">
                                    <div className="text-3xl font-black text-slate-900" suppressHydrationWarning>
                                        {new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(financials.monthlyPremium)}
                                    </div>
                                    <div className="text-xs text-slate-500 font-medium mt-1">
                                        Per month for your family
                                    </div>
                                </div>

                                {/* KEY INSIGHT (From Pricing Engine) */}
                                {financials.savings.isPooled && (
                                    <div className="bg-green-50 rounded-lg p-3 mb-4 border border-green-100">
                                        <div className="flex items-center gap-2 text-green-800 font-bold text-xs mb-1">
                                            <CheckCircle className="w-3 h-3" /> Medical Savings Account
                                        </div>
                                        <div className="text-green-900 font-bold text-sm">
                                            R{financials.savings.annualAllocation.toLocaleString()} / year
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
                                <button className="w-full py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
                                    View Full Scenarios <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-12 text-center text-xs text-slate-400 max-w-2xl mx-auto leading-relaxed">
                {PricingEngine.getDisclaimer()}
            </div>
        </div>
    );
}
