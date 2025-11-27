'use client';

import { useState, useEffect, useMemo } from 'react';
import { PricingEngine } from '@/utils/engine';
import { AlertTriangle, ChevronDown, Users, Filter } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import PlanDetails from './PlanDetails';

// Define the shape of data passed from the server
interface PlanData {
    id: string;
    name: string;
    slug: string;
    type: string;
    target_personas: string[] | null;
    contributions: any[];
    benefits: any[];
    plan_series?: any;
}

export default function PlanCalculator({ plans }: { plans: PlanData[] | null }) {
    // --- STATE MANAGEMENT ---
    const [activePersona, setActivePersona] = useState<string>('All');
    const [selectedPlanId, setSelectedPlanId] = useState<string>('');
    const [members, setMembers] = useState({ main: 1, adult: 0, child: 0 });
    const [income, setIncome] = useState<number>(0);
    const [networkChoice, setNetworkChoice] = useState<string>('Standard');
    const searchParams = useSearchParams();

    const safePlans = plans || [];

    // --- DERIVED STATE: PERSONAS ---
    const uniquePersonas = useMemo(() => {
        const all = new Set<string>();
        safePlans.forEach(p => {
            if (Array.isArray(p.target_personas)) {
                p.target_personas.forEach(tp => all.add(tp));
            }
        });
        return Array.from(all).sort();
    }, [safePlans]);

    // --- DERIVED STATE: FILTERED PLANS ---
    const filteredPlans = useMemo(() => {
        if (activePersona === 'All') return safePlans;
        return safePlans.filter(p =>
            Array.isArray(p.target_personas) && p.target_personas.includes(activePersona)
        );
    }, [safePlans, activePersona]);

    const selectedPlan = useMemo(() =>
        safePlans.find(p => p.id === selectedPlanId),
        [safePlans, selectedPlanId]);

    // --- EFFECT: AUTO-SELECT ---
    useEffect(() => {
        if (filteredPlans.length > 0) {
            const isCurrentVisible = filteredPlans.find(p => p.id === selectedPlanId);
            if (!isCurrentVisible) {
                setSelectedPlanId(filteredPlans[0].id);
            }
        } else if (safePlans.length > 0 && !selectedPlanId) {
            setSelectedPlanId(safePlans[0].id);
        }
    }, [filteredPlans, selectedPlanId, safePlans]);

    useEffect(() => {
        const urlPlanId = searchParams.get('plan');
        if (urlPlanId && plans?.some(p => p.id === urlPlanId)) {
            setSelectedPlanId(urlPlanId);
            const element = document.getElementById('calculator-view');
            if (element) element.scrollIntoView({ behavior: 'smooth' });
        }
    }, [searchParams, plans]);

    // --- DERIVED STATE: CALCULATIONS ---
    const calculationResult = useMemo(() => {
        if (!selectedPlan || !selectedPlan.contributions?.[0]) return null;

        const contributionData = selectedPlan.contributions[0];

        try {
            // UPDATED: Use the new unified profile calculation
            const profile = PricingEngine.calculateProfile(
                contributionData,
                members,
                income
            );

            // Network Penalty Logic (remains manual for now as it relies on UI state)
            let penalty = 0;
            if (selectedPlan.name.includes("Delta") && networkChoice !== 'Delta') {
                penalty = 11100;
            }

            return {
                premium: profile.monthlyPremium,
                thresholds: {
                    annualMSA: profile.savings.annualAllocation,
                    selfPaymentGap: profile.thresholds.selfPaymentGap
                },
                penalty
            };
        } catch (err) {
            console.error("Calculation Error:", err);
            return null;
        }
    }, [selectedPlan, members, income, networkChoice]);

    // --- HANDLERS ---
    const increment = (key: keyof typeof members) =>
        setMembers(prev => ({ ...prev, [key]: prev[key] + 1 }));
    const decrement = (key: keyof typeof members) =>
        setMembers(prev => ({ ...prev, [key]: Math.max(0, prev[key] - 1) }));

    const getSchemeName = (plan: PlanData) => {
        const series = Array.isArray(plan.plan_series) ? plan.plan_series[0] : plan.plan_series;
        const scheme = Array.isArray(series?.schemes) ? series?.schemes[0] : series?.schemes;
        return scheme?.name || 'Medical Aid';
    };

    if (!selectedPlan) return <div className="p-8 text-center text-slate-500">Loading Plans...</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* LEFT COLUMN: INPUTS */}
            <div className="lg:col-span-2 space-y-6">

                {/* 0. PERSONA FILTER BAR */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-2 mb-3 text-sm font-bold text-slate-500 uppercase tracking-wider">
                        <Filter className="w-4 h-4" /> Filter by Lifestyle
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setActivePersona('All')}
                            className={clsx(
                                "px-4 py-2 text-sm font-bold rounded-full transition-all border",
                                activePersona === 'All'
                                    ? "bg-slate-900 text-white border-slate-900 shadow-md"
                                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                            )}
                        >
                            All Plans
                        </button>
                        {uniquePersonas.map(persona => (
                            <button
                                key={persona}
                                onClick={() => setActivePersona(persona)}
                                className={clsx(
                                    "px-4 py-2 text-sm font-bold rounded-full transition-all border",
                                    activePersona === persona
                                        ? "bg-blue-600 text-white border-blue-600 shadow-md"
                                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                                )}
                            >
                                {persona}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 1. Plan Selector */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Select Medical Aid Plan ({filteredPlans.length} available)
                    </label>
                    <div className="relative">
                        <select
                            value={selectedPlanId}
                            onChange={(e) => setSelectedPlanId(e.target.value)}
                            className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 outline-none text-lg font-medium"
                        >
                            {filteredPlans.map(plan => (
                                <option key={plan.id} value={plan.id}>
                                    {getSchemeName(plan)} — {plan.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-4 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {Array.isArray(selectedPlan.target_personas) && selectedPlan.target_personas.map(persona => (
                            <span key={persona} className={clsx(
                                "px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full border",
                                persona === activePersona
                                    ? "bg-blue-100 text-blue-800 border-blue-200"
                                    : "bg-slate-50 text-slate-500 border-slate-100"
                            )}>
                                {persona}
                            </span>
                        ))}
                    </div>
                </div>

                {/* 2. Member Configuration */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4" /> Who is covered?
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { label: 'Main Member', key: 'main', fixed: true },
                            { label: 'Adult Dependants', key: 'adult', fixed: false },
                            { label: 'Children', key: 'child', fixed: false }
                        ].map((item) => (
                            <div key={item.key} className="bg-slate-50 p-4 rounded-lg flex flex-col items-center justify-center">
                                <span className="text-xs text-slate-500 font-semibold mb-2 uppercase">{item.label}</span>
                                <div className="flex items-center gap-4">
                                    {!item.fixed && (
                                        <button
                                            onClick={() => decrement(item.key as keyof typeof members)}
                                            className="w-8 h-8 rounded-full bg-white border hover:bg-slate-100 text-slate-600 transition-colors"
                                        >-</button>
                                    )}
                                    <span className="text-xl font-bold w-4 text-center">
                                        {members[item.key as keyof typeof members]}
                                    </span>
                                    {!item.fixed && (
                                        <button
                                            onClick={() => increment(item.key as keyof typeof members)}
                                            className="w-8 h-8 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                        >+</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Conditional Inputs */}
                {selectedPlan.contributions[0]?.pricing_model === 'Income_Banded' && (
                    <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200 animate-in fade-in slide-in-from-top-4 duration-300">
                        <h3 className="text-sm font-bold text-yellow-800 mb-2">Monthly Household Income</h3>
                        <p className="text-xs text-yellow-700 mb-4">This plan uses income bands. Please enter your gross monthly income.</p>
                        <input
                            type="number"
                            placeholder="R 0.00"
                            className="w-full p-3 rounded-lg border border-yellow-300 focus:ring-2 focus:ring-yellow-500 outline-none"
                            onChange={(e) => setIncome(Number(e.target.value))}
                        />
                    </div>
                )}

                {selectedPlan.name.includes("Delta") && (
                    <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200 animate-in fade-in slide-in-from-top-4 duration-300">
                        <h3 className="text-sm font-bold text-indigo-800 mb-2">Hospital Network Choice</h3>
                        <p className="text-xs text-indigo-700 mb-4">Will you use a Delta Network Hospital?</p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setNetworkChoice('Delta')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${networkChoice === 'Delta' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-indigo-600 border border-indigo-200'}`}
                            >
                                Yes, Delta Hospital
                            </button>
                            <button
                                onClick={() => setNetworkChoice('Standard')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${networkChoice === 'Standard' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-indigo-600 border border-indigo-200'}`}
                            >
                                No, Any Hospital
                            </button>
                        </div>
                        {networkChoice === 'Standard' && (
                            <div className="mt-3 flex items-start gap-2 text-xs text-red-600 font-bold bg-white p-2 rounded-lg border border-red-100">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                Warning: R11,100 Deductible applies for non-network usage.
                            </div>
                        )}
                    </div>
                )}

            </div>

            {/* RIGHT COLUMN: COST SUMMARY */}
            <div className="lg:col-span-1">
                <div className="sticky top-6 bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
                    <div className="mb-6">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Estimated Monthly Premium</span>
                        <div className="text-4xl font-black mt-1">
                            {calculationResult
                                ? new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(calculationResult.premium)
                                : "---"}
                            <span className="text-lg font-medium text-slate-500">/pm</span>
                        </div>
                    </div>

                    <hr className="border-slate-700 my-6" />

                    {calculationResult && calculationResult.thresholds.annualMSA > 0 && (
                        <div className="space-y-4 animate-in fade-in duration-500">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-300">Annual Medical Savings</span>
                                <span className="font-bold text-green-400">
                                    {new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(calculationResult.thresholds.annualMSA)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-300">Self-Payment Gap</span>
                                <span className="font-bold text-orange-400">
                                    {new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(calculationResult.thresholds.selfPaymentGap)}
                                </span>
                            </div>
                        </div>
                    )}

                    {calculationResult && calculationResult.penalty > 0 && (
                        <div className="mt-6 bg-red-500/10 border border-red-500/50 p-4 rounded-lg animate-pulse">
                            <div className="flex gap-2 text-red-400 font-bold text-sm mb-1">
                                <AlertTriangle className="w-4 h-4" /> Network Penalty
                            </div>
                            <p className="text-xs text-red-200">
                                You will pay <strong>R{calculationResult.penalty}</strong> upfront if you proceed with a planned admission at this hospital.
                            </p>
                        </div>
                    )}

                    <button className="w-full mt-8 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-blue-900/50">
                        Request Quote
                    </button>
                </div>
            </div>

            {selectedPlan && (
                <div className="lg:col-span-3 mt-12 border-t border-slate-200 pt-10">
                    <PlanDetails benefits={selectedPlan.benefits} />
                </div>
            )}

        </div>
    );
}