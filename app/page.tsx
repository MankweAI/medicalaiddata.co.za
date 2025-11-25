import { supabase } from '@/lib/supabase';
import PlanCalculator from '@/components/PlanCalculator';

// Force dynamic rendering so we always get fresh DB data
export const dynamic = 'force-dynamic';

export default async function MedicalAidPage() {
  // Fetch Plans + Financials + Benefits (Joined)
  const { data, error } = await supabase
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
        rule_logic
      )
    `)
    .order('name');

  // Mock data if DB fails (or if using placeholder)
  let plans = data;

  if (error || !plans) {
    console.warn("Using mock data due to DB error or missing data");
    plans = [
      {
        id: 'mock-1',
        name: 'Classic Comprehensive',
        slug: 'classic-comprehensive',
        type: 'Comprehensive',
        target_personas: { description: 'Families needing extensive cover' },
        contributions: [{ pricing_model: 'standard', pricing_matrix: {}, msa_structure: {}, threshold_structure: {} }],
        benefits: [{ category: 'Hospital', benefit_name: 'Unlimited', rule_logic: '100%' }]
      },
      {
        id: 'mock-2',
        name: 'Classic Saver',
        slug: 'classic-saver',
        type: 'Saver',
        target_personas: { description: 'Healthy individuals' },
        contributions: [{ pricing_model: 'savings', pricing_matrix: {}, msa_structure: {}, threshold_structure: {} }],
        benefits: [{ category: 'Savings', benefit_name: 'MSA', rule_logic: '25%' }]
      }
    ];
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">

        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            Medical Aid Calculator 2026
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Compare Discovery Health plans instantly. Our engine calculates your exact premium, savings, and hidden network penalties.
          </p>
        </div>

        {/* The Client Component takes over here */}
        <PlanCalculator plans={plans} />

      </div>
    </main>
  );
}