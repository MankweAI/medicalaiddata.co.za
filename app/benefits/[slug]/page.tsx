import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ArrowLeft, Shield, Activity, Baby, Pill } from 'lucide-react';
import { Metadata } from 'next';
import BenefitPlanCard from '@/components/BenefitPlanCard';

export const dynamic = 'force-dynamic';

const BENEFIT_META: Record<string, any> = {
    'oncology': { title: 'Best Medical Aid for Cancer Cover (2026)', description: 'Compare oncology thresholds, co-payments, and biological drug coverage across top South African schemes.', icon: Activity },
    'maternity': { title: 'Top Medical Aids for Pregnancy & Birth', description: 'Find plans with the best antenatal visits, private ward cover, and pediatrician benefits.', icon: Baby },
    'chronic': { title: 'Chronic Medication Cover Comparison', description: 'Which plans cover more than just the basic 27 CDL conditions? Compare formularies and limits.', icon: Pill },
    'default': { title: 'Medical Aid Benefit Comparison', description: 'Compare specific medical aid benefits side-by-side.', icon: Shield }
};

type Props = {
    params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const meta = BENEFIT_META[slug] || BENEFIT_META['default'];
    return {
        title: meta.title,
        description: meta.description,
    };
}

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
                    {rawData.map((item: any) => {
                        const plan = item.plans;
                        // Safety check: Ensure plan exists
                        if (!plan) return null;

                        const series = Array.isArray(plan.plan_series) ? plan.plan_series[0] : plan.plan_series;
                        const scheme = Array.isArray(series?.schemes) ? series?.schemes[0] : series?.schemes;
                        const schemeName = scheme?.name || 'Medical Aid';

                        // Helper to get a "Price From" value
                        const getPrice = (c: any) => {
                            const matrix = Array.isArray(c?.pricing_matrix) ? c.pricing_matrix[0] : c?.pricing_matrix;
                            if (!matrix) return 'N/A';
                            if (c.pricing_model === 'Income_Banded') {
                                return `From R${matrix.main}`;
                            }
                            return `R${matrix.main}`;
                        };

                        const priceDisplay = getPrice(plan.contributions?.[0]);

                        return (
                            <BenefitPlanCard
                                key={plan.id + item.benefit_name}
                                plan={plan}
                                item={item}
                                schemeName={schemeName}
                                priceDisplay={priceDisplay}
                            />
                        );
                    })}
                </div>

            </div>
        </main>
    );
}