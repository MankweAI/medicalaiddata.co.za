import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, AlertTriangle, Shield, Activity, Baby, Pill } from 'lucide-react';
import { Metadata } from 'next';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// --- CONFIGURATION ---
const BENEFIT_META: Record<string, any> = {
    'oncology': {
        title: 'Best Medical Aid for Cancer Cover (2026)',
        description: 'Compare oncology thresholds, co-payments, and biological drug coverage across top South African schemes.',
        icon: Activity
    },
    'maternity': {
        title: 'Top Medical Aids for Pregnancy & Birth',
        description: 'Find plans with the best antenatal visits, private ward cover, and pediatrician benefits.',
        icon: Baby
    },
    'chronic': {
        title: 'Chronic Medication Cover Comparison',
        description: 'Which plans cover more than just the basic 27 CDL conditions? Compare formularies and limits.',
        icon: Pill
    },
    'default': {
        title: 'Medical Aid Benefit Comparison',
        description: 'Compare specific medical aid benefits side-by-side.',
        icon: Shield
    }
};

type Props = {
    params: Promise<{ slug: string }>;
};

// 1. SEO Metadata Generator
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const meta = BENEFIT_META[slug] || BENEFIT_META['default'];
    return {
        title: meta.title,
        description: meta.description,
    };
}

// 2. The Page Component
export default async function BenefitPage({ params }: Props) {
    const { slug } = await params;

    // Normalize Slug (e.g. "oncology" -> "Oncology")
    const categoryKey = slug.charAt(0).toUpperCase() + slug.slice(1);

    // Fetch Plans that specifically have this benefit defined
    const { data: rawData, error } = await supabase
        .from('benefits')
        .select(`
      category,
      benefit_name,
      rule_logic,
      display_text,
      plans (
        id,
        name,
        slug,
        type,
        plan_series (
          schemes (name)
        ),
        contributions (
          pricing_matrix,
          pricing_model
        )
      )
    `)
        .ilike('category', `%${categoryKey}%`)
        .order('plan_id');

    if (error) {
        console.error("DB Error:", error);
        return <div className="p-10 text-red-600">Error loading benefit data.</div>;
    }

    if (!rawData || rawData.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 p-10 flex flex-col items-center justify-center">
                <div className="text-xl font-bold text-slate-700 mb-2">No Data Found</div>
                <p className="text-slate-500 mb-4">No benefits found for category: "{categoryKey}"</p>
                <Link href="/" className="text-blue-600 hover:underline">Return Home</Link>
            </div>
        );
    }

    const meta = BENEFIT_META[slug] || BENEFIT_META['default'];
    const Icon = meta.icon;

    return (
        <main className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-6xl mx-auto">

                <Link href="/" className="flex items-center text-sm text-slate-500 hover:text-blue-600 mb-8 transition-colors w-fit">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
                </Link>

                <div className="mb-12 text-center max-w-3xl mx-auto animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="inline-flex p-3 bg-blue-100 text-blue-600 rounded-xl mb-4">
                        <Icon className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 mb-4 leading-tight">
                        {meta.title}
                    </h1>
                    <p className="text-lg text-slate-600">
                        {meta.description}
                    </p>
                </div>

                {/* COMPARISON GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rawData.map((item: any) => {
                        const plan = item.plans;
                        // Safety check: Ensure plan exists (handling orphan benefits)
                        if (!plan) return null;

                        // Handle array vs object for plan_series (Supabase quirk)
                        const series = Array.isArray(plan.plan_series) ? plan.plan_series[0] : plan.plan_series;
                        const scheme = Array.isArray(series?.schemes) ? series?.schemes[0] : series?.schemes;
                        const schemeName = scheme?.name || 'Medical Aid';

                        // Helper to get a "Price From" value
                        const getPrice = (c: any) => {
                            // Handle array (Income Banded) vs Object (Fixed)
                            const matrix = Array.isArray(c?.pricing_matrix) ? c.pricing_matrix[0] : c?.pricing_matrix;

                            if (!matrix) return 'N/A';

                            if (c.pricing_model === 'Income_Banded') {
                                return `From R${matrix.main}`;
                            }
                            return `R${matrix.main}`;
                        };

                        const priceDisplay = getPrice(plan.contributions?.[0]);

                        return (
                            <div key={plan.id + item.benefit_name} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
                                {/* Card Header */}
                                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                    <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                                        {schemeName}
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2 leading-snug">
                                        {plan.name}
                                    </h3>
                                    <div className="text-slate-500 text-sm font-medium bg-white px-3 py-1 rounded-full border border-slate-200 w-fit">
                                        {priceDisplay} <span className="text-xs">/pm</span>
                                    </div>
                                </div>

                                {/* Benefit Detail */}
                                <div className="p-6 flex-grow flex flex-col">
                                    <div className="mb-4">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                                            {item.benefit_name}
                                        </span>
                                        <p className="text-slate-800 font-medium mt-2 leading-relaxed">
                                            {item.display_text || "Standard scheme rules apply."}
                                        </p>
                                    </div>

                                    {/* Technical Rules (Badges) */}
                                    <div className="flex flex-wrap gap-2 mt-auto pt-4">
                                        {item.rule_logic?.threshold && (
                                            <span className="px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded border border-green-100">
                                                Limit: R{item.rule_logic.threshold.toLocaleString()}
                                            </span>
                                        )}
                                        {item.rule_logic?.co_pay && (
                                            <span className="px-2 py-1 bg-orange-50 text-orange-700 text-[10px] font-bold rounded border border-orange-100">
                                                Co-Pay: {item.rule_logic.co_pay}
                                            </span>
                                        )}
                                        {item.rule_logic?.deductible > 0 && (
                                            <span className="px-2 py-1 bg-red-50 text-red-700 text-[10px] font-bold rounded border border-red-100">
                                                Deductible: R{item.rule_logic.deductible}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>
        </main>
    );
}