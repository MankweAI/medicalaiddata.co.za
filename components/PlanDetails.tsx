'use client';

import {
    Shield,
    Activity,
    Stethoscope,
    Baby,
    Scan,
    Scissors,
    Pill,
    Zap,
    CheckCircle2
} from 'lucide-react';

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
    if (!benefits || benefits.length === 0) {
        return (
            <div className="mt-8 p-6 bg-slate-50 rounded-xl border border-slate-200 text-center text-slate-500">
                No detailed benefit data available for this plan yet.
            </div>
        );
    }

    // 1. Group benefits by Category
    const groupedBenefits = benefits.reduce((acc, item) => {
        const cat = item.category || 'General';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {} as Record<string, Benefit[]>);

    return (
        <div className="mt-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-600" />
                Coverage Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(groupedBenefits).map(([category, items]) => {
                    const Icon = CATEGORY_ICONS[category] || CheckCircle2;

                    return (
                        <div key={category} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <Icon className="w-5 h-5" />
                                </div>
                                <h4 className="font-bold text-slate-800 text-lg">{category}</h4>
                            </div>

                            <ul className="space-y-4">
                                {items.map((benefit, idx) => (
                                    <li key={idx} className="flex gap-3 items-start">
                                        <div className="mt-1 min-w-[4px] h-4 bg-blue-200 rounded-full" />
                                        <div>
                                            <p className="font-semibold text-slate-900 text-sm">
                                                {benefit.benefit_name}
                                            </p>
                                            <p className="text-slate-500 text-xs leading-relaxed mt-1">
                                                {benefit.display_text || 'Standard scheme rules apply.'}
                                            </p>
                                            {/* Optional: Show technical rule for power users */}
                                            {benefit.rule_logic?.deductible > 0 && (
                                                <span className="inline-block mt-2 px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold uppercase rounded">
                                                    Deductible: R{benefit.rule_logic.deductible}
                                                </span>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
