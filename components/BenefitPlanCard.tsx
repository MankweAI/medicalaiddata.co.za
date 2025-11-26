'use client';

import { useCompare } from '@/context/CompareContext';
import { ChevronRight, Plus, Check } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';

export default function BenefitPlanCard({ plan, item, schemeName, priceDisplay }: any) {
    const { selectedPlans, togglePlan } = useCompare();

    const isSelected = selectedPlans.some((p: any) => p.id === plan.id);

    // Handler for the Compare Checkbox
    const handleCompareClick = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigation
        e.stopPropagation();
        togglePlan({ id: plan.id, name: plan.name, scheme: schemeName });
    };

    return (
        <Link
            href={`/?plan=${plan.id}`}
            className={clsx(
                "group bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-xl transition-all flex flex-col h-full relative",
                isSelected ? "border-blue-500 ring-1 ring-blue-500" : "border-slate-200 hover:border-blue-300"
            )}
        >
            {/* SELECTION HEADER */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 group-hover:bg-blue-50/30 transition-colors">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">{schemeName}</div>
                        <h3 className="text-xl font-bold text-slate-900 leading-snug">{plan.name}</h3>
                    </div>

                    {/* COMPARE TOGGLE BUTTON */}
                    <button
                        onClick={handleCompareClick}
                        className={clsx(
                            "w-8 h-8 rounded-full flex items-center justify-center border transition-all z-10",
                            isSelected
                                ? "bg-blue-600 border-blue-600 text-white"
                                : "bg-white border-slate-300 text-slate-300 hover:border-blue-500 hover:text-blue-500"
                        )}
                    >
                        {isSelected ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    </button>
                </div>

                <div className="mt-2 text-slate-500 text-sm font-medium bg-white px-3 py-1 rounded-full border border-slate-200 w-fit">
                    {priceDisplay} <span className="text-xs">/pm</span>
                </div>
            </div>

            {/* BENEFIT CONTENT */}
            <div className="p-6 flex-grow flex flex-col">
                <div className="mb-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{item.benefit_name}</span>
                    <p className="text-slate-800 font-medium mt-2 leading-relaxed">{item.display_text || "Standard scheme rules apply."}</p>
                </div>

                <div className="flex flex-wrap gap-2 mt-auto pt-4">
                    {item.rule_logic?.threshold && (
                        <span className="px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded border border-green-100">
                            Limit: R<span suppressHydrationWarning>{item.rule_logic.threshold.toLocaleString()}</span>
                        </span>
                    )}
                    {item.rule_logic?.deductible > 0 && (
                        <span className="px-2 py-1 bg-red-50 text-red-700 text-[10px] font-bold rounded border border-red-100">
                            Deductible: R<span suppressHydrationWarning>{item.rule_logic.deductible.toLocaleString()}</span>
                        </span>
                    )}
                    {item.rule_logic?.co_pay && <span className="px-2 py-1 bg-orange-50 text-orange-700 text-[10px] font-bold rounded border border-orange-100">Co-Pay: {item.rule_logic.co_pay}</span>}
                </div>
            </div>
        </Link>
    );
}