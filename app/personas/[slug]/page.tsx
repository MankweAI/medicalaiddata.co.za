import { supabase } from '@/lib/supabase';
import PlanCalculator from '@/components/PlanCalculator';
import { ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

// Force dynamic rendering for fresh data
export const dynamic = 'force-dynamic';

// 1. Define the "Content Logic" for each Persona
const PERSONA_CONTENT: Record<string, any> = {
    'The Chronic Warrior': {
        title: 'Best Medical Aid for Chronic Conditions (2026)',
        description: 'You need comprehensive cover for the 27 Chronic Disease List (CDL) conditions and potentially the Additional Disease List (ADL). These plans prioritize medication access over low premiums.',
        pros: ['Full cover for chronic meds at network pharmacies', 'Access to Diabetes and Cardio Care programmes'],
        cons: ['Higher premiums to subsidize risk', 'Strict formulary adherence required'],
    },
    'The Digital Native': {
        title: 'Best Tech-First Medical Aid Plans',
        description: 'Maximize your efficiency with plans that reward digital engagement. Use "Ask Discovery" for referrals and track your health to unlock your Personal Health Fund.',
        pros: ['R0 Video GP Consults', 'Up to R24,000 in Personal Health Funds', 'Efficiency discounts on premiums'],
        cons: ['Heavy penalties for analog/offline behavior', 'Strict network restrictions'],
    },
    'The Budget Conscious': {
        title: 'Affordable Medical Aid for Cost-Conscious Families',
        description: 'Entry-level cover that protects you from catastrophic hospital events without breaking the bank. Focuses on essential network hospitals and state facilities.',
        pros: ['Lowest market premiums', 'Unlimited hospital cover in network'],
        cons: ['No savings account (MSA)', 'Restricted provider lists'],
    },
    // Add default fallback
    'default': {
        title: 'Compare Medical Aid Plans',
        description: 'Find the perfect plan for your lifestyle and budget.',
        pros: [],
        cons: []
    }
};

// UPDATED: Type definition includes Promise for params
export default async function PersonaPage({ params }: { params: Promise<{ slug: string }> }) {

    // FIX: Await the params object before accessing slug
    const { slug } = await params;

    // 2. Decode the Slug (e.g. "the-chronic-warrior" -> "The Chronic Warrior")
    const personaName = slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    // 3. Fetch ONLY plans matching this Persona
    const { data: plans, error } = await supabase
        .from('plans')
        .select(`
      id,
      name,
      slug,
      type,
      target_personas,
      contributions (
        pricing_model,
        pricing_matrix,
        msa_structure,
        threshold_structure
      ),
      benefits (
        category,
        benefit_name,
        rule_logic,
        display_text
      )
    `)
        .contains('target_personas', [personaName]) // <--- THE MAGIC FILTER
        .order('name');

    const content = PERSONA_CONTENT[personaName] || PERSONA_CONTENT['default'];

    return (
        <main className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-6xl mx-auto">

                {/* Breadcrumb */}
                <Link href="/" className="flex items-center text-sm text-slate-500 hover:text-blue-600 mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to All Plans
                </Link>

                {/* Header Section */}
                <div className="mb-12 text-center max-w-3xl mx-auto">
                    <div className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 font-bold text-xs uppercase tracking-wider rounded-full mb-4">
                        {personaName} Edition
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
                        {content.title}
                    </h1>
                    <p className="text-lg text-slate-600 leading-relaxed">
                        {content.description}
                    </p>
                </div>

                {/* Pros & Cons Grid */}
                {(content.pros.length > 0 || content.cons.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                        <div className="bg-green-50/50 border border-green-100 p-6 rounded-xl">
                            <h3 className="text-green-800 font-bold mb-4 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5" /> Why this fits you
                            </h3>
                            <ul className="space-y-3">
                                {content.pros.map((pro: string, i: number) => (
                                    <li key={i} className="flex items-start gap-3 text-green-900/80 text-sm">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                                        {pro}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-amber-50/50 border border-amber-100 p-6 rounded-xl">
                            <h3 className="text-amber-800 font-bold mb-4 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" /> What to watch out for
                            </h3>
                            <ul className="space-y-3">
                                {content.cons.map((con: string, i: number) => (
                                    <li key={i} className="flex items-start gap-3 text-amber-900/80 text-sm">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                        {con}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {/* The Calculator (Pre-filtered by the DB Query above) */}
                {plans && plans.length > 0 ? (
                    <div className="bg-white p-1 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
                        <PlanCalculator plans={plans} />
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                        <p className="text-slate-500">No plans found specifically matching "{personaName}".</p>
                        <Link href="/" className="text-blue-600 font-bold hover:underline mt-2 inline-block">
                            View all plans
                        </Link>
                    </div>
                )}

            </div>
        </main>
    );
}