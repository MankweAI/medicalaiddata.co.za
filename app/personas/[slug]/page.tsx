import { supabase } from '@/lib/supabase';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';
import PersonaDashboard from '@/components/PersonaDashboard';

// Force dynamic rendering to ensure fresh DB pulls
export const dynamic = 'force-dynamic';

// 1. Content Logic (SEO & Context)
const PERSONA_CONTENT: Record<string, any> = {
    'The Chronic Warrior': {
        title: 'Best Medical Aid for Chronic Conditions (2026)',
        description: 'Stop worrying about running out of funds. We modeled 50+ plans to find the ones that cover your meds and doctor visits.',
        icon: 'Shield',
        color: 'blue'
    },
    'The Digital Native': {
        title: 'Tech-First Medical Aid: Pay Less, Get More',
        description: 'Why pay for a "sleeping" medical aid? Unlock up to R24,000 in day-to-day funding just by tracking your healthy lifestyle.',
        icon: 'Shield',
        color: 'indigo'
    },
    'The Budget Conscious': {
        title: 'Affordable Private Healthcare (Under R1,500)',
        description: 'Get access to private hospitals and doctors without breaking the bank. Income-based pricing for essential cover.',
        icon: 'Shield',
        color: 'green'
    },
    'default': {
        title: 'Medical Aid Plan Comparison',
        description: 'Find the plan that fits your life stage.',
        icon: 'Shield',
        color: 'slate'
    }
};

type Props = {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// 2. Dynamic Metadata (Dominating the SERP)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const personaName = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const content = PERSONA_CONTENT[personaName] || PERSONA_CONTENT['default'];

    return {
        title: content.title,
        description: content.description,
        openGraph: {
            title: content.title,
            description: content.description,
            type: 'website',
        }
    };
}

export default async function PersonaPage({ params }: Props) {
    const { slug } = await params;

    // Decode Slug
    const personaName = slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    // 3. Data Fetching (The "Protected Core")
    // Note: We fetch ALL data here so the client component is instant
    const { data: plans, error } = await supabase
        .from('plans')
        .select(`
            id, name, slug, type, target_personas,
            plan_series ( schemes ( name ) ),
            contributions ( pricing_model, pricing_matrix, msa_structure, threshold_structure ),
            benefits ( category, benefit_name, rule_logic, display_text )
        `)
        .contains('target_personas', [personaName])
        .order('name');

    if (error || !plans) {
        console.error("DB Error:", error);
        return <div className="p-10 text-red-600">Unable to load plans. Please try again.</div>;
    }

    const content = PERSONA_CONTENT[personaName] || PERSONA_CONTENT['default'];

    return (
        <main className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-7xl mx-auto">

                {/* 4. Breadcrumb (Navigation Guardrail) */}
                <Link href="/" className="flex items-center text-sm text-slate-500 hover:text-blue-600 mb-8 transition-colors w-fit">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Triage
                </Link>

                {/* 5. Header Section */}
                <div className="mb-10 animate-in slide-in-from-top-4 duration-500">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-${content.color}-100 text-${content.color}-700 mb-4`}>
                        {personaName} Hub
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 leading-tight">
                        {content.title}
                    </h1>
                    <p className="text-lg text-slate-600 max-w-3xl leading-relaxed">
                        {content.description}
                    </p>
                </div>

                {/* 6. The Living Dashboard (Client Component Handoff) */}
                <PersonaDashboard
                    persona={personaName}
                    plans={plans}
                    content={content}
                />

                {/* 7. SEO Anchor: Semantic Definitions (AI Overview Bait) */}
                <div className="mt-20 border-t border-slate-200 pt-10">
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Key Terms for {personaName}s</h3>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <div className="bg-white p-4 rounded-lg border border-slate-100">
                            <dt className="font-bold text-slate-800 text-sm mb-1">Prescribed Minimum Benefit (PMB)</dt>
                            <dd className="text-slate-600 text-xs leading-relaxed">A set of defined benefits to ensure that all medical scheme members have access to certain minimum health services, regardless of the benefit option they have selected.</dd>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-slate-100">
                            <dt className="font-bold text-slate-800 text-sm mb-1">Self-Payment Gap (SPG)</dt>
                            <dd className="text-slate-600 text-xs leading-relaxed">The difference between your Medical Savings Account (MSA) allocation and the Annual Threshold. During this period, you must pay for day-to-day claims from your own pocket.</dd>
                        </div>
                    </dl>
                </div>

            </div>
        </main>
    );
}