'use client';

import { useState } from 'react';
import {
    Shield,
    Activity,
    Stethoscope,
    Baby,
    Scan,
    Scissors,
    Pill,
    Zap,
    CheckCircle2,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import clsx from 'clsx';

interface Benefit {
    category: string;
    benefit_name: string;
    rule_logic: any;
    display_text: string | null;
}

// Map database categories to Icons
const CATEGORY_ICONS: Record<string, any> = {
    'Hospitalization': Shield,
    'Oncology': Activity,
    'Chronic': Pill,
    'Maternity': Baby,
    'Scopes': Scan,
    'Day Surgery': Scissors,
    'Specialist': Stethoscope,
    'Emergency': Zap,
};

export default function PlanDetails({ benefits }: { benefits: Benefit[] | undefined }) {
    // Track which accordion sections are open
    // Default: 'Hospitalization' is always open initially
    const [openSections, setOpenSections] = useState<string[]>(['Hospitalization']);

    if (!benefits || benefits.length === 0) {
        return (
            <div className="mt-8 p-6 bg-slate-50 rounded-xl border border-slate-200 text-center text-slate-500">
                No detailed benefit data available for this plan yet.
            </div>
        );
    }

    // Group benefits by Category
    const groupedBenefits = benefits.reduce((acc, item) => {
        const cat = item.category || 'General';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {} as Record<string, Benefit[]>);

    // Toggle Handler
    const toggleSection = (category: string) => {
        setOpenSections(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    return (
        <div className="mt-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-600" />
                Coverage Details
            </h3>

            <div className="grid grid-cols-1 gap-4">
                {Object.entries(groupedBenefits).map(([category, items]) => {
                    const Icon = CATEGORY_ICONS[category] || CheckCircle2;
                    const isOpen = openSections.includes(category);

                    return (
                        <div
                            key={category}
                            className={clsx(
                                "bg-white rounded-xl border transition-all duration-300 overflow-hidden",
                                isOpen ? "border-blue-200 shadow-md" : "border-slate-200 shadow-sm hover:border-blue-100"
                            )}
                        >
                            {/* Accordion Header */}
                            <button
                                onClick={() => toggleSection(category)}
                                className="w-full flex items-center justify-between p-4 text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={clsx(
                                        "p-2 rounded-lg transition-colors",
                                        isOpen ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600 group-hover:bg-blue-100"
                                    )}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <h4 className={clsx(
                                        "font-bold text-lg transition-colors",
                                        isOpen ? "text-blue-900" : "text-slate-700"
                                    )}>
                                        {category}
                                    </h4>
                                </div>
                                {isOpen ? (
                                    <ChevronUp className="w-5 h-5 text-blue-500" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-slate-400" />
                                )}
                            </button>

                            {/* Accordion Content */}
                            {isOpen && (
                                <div className="p-4 pt-0 border-t border-blue-50/50 bg-slate-50/50">
                                    <ul className="space-y-4 mt-4">
                                        {items.map((benefit, idx) => (
                                            <li key={idx} className="flex gap-3 items-start animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div className="mt-1.5 min-w-[6px] h-1.5 bg-blue-400 rounded-full" />
                                                <div>
                                                    <p className="font-semibold text-slate-900 text-sm">
                                                        {benefit.benefit_name}
                                                    </p>
                                                    <p className="text-slate-600 text-xs leading-relaxed mt-1">
                                                        {benefit.display_text || 'Standard scheme rules apply.'}
                                                    </p>

                                                    {/* Technical Rule Badge */}
                                                    {benefit.rule_logic?.deductible > 0 && (
                                                        <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-red-50 text-red-700 border border-red-100 text-[10px] font-bold uppercase rounded tracking-wide">
                                                            <AlertTriangle className="w-3 h-3" />
                                                            Deductible: R{benefit.rule_logic.deductible.toLocaleString()}
                                                        </span>
                                                    )}
                                                    {benefit.rule_logic?.co_pay && (
                                                        <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-orange-50 text-orange-700 border border-orange-100 text-[10px] font-bold uppercase rounded tracking-wide">
                                                            Co-Pay: {benefit.rule_logic.co_pay}
                                                        </span>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Helper component for the badge icon
function AlertTriangle({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
        </svg>
    )
}