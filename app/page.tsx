import { supabase } from '@/lib/supabase';
import PlanCalculator from '@/components/PlanCalculator';
import { AlertCircle } from 'lucide-react';

// Force dynamic rendering so we always get fresh DB data
export const dynamic = 'force-dynamic';

export default async function MedicalAidPage() {
  // 1. Fetch Plans + Financials + Benefits + SCHEME NAME
  const { data: plans, error } = await supabase
    .from('plans')
    .select(`
      id,
      name,
      slug,
      type,
      target_personas,
      plan_series (
        schemes (
          name
        )
      ),
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
    .order('name');

  // 2. Handle Database Errors Explicitly
  if (error) {
    console.error("❌ Supabase Connection Error:", error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow-lg border border-red-200 max-w-2xl w-full">
          <div className="flex items-center gap-3 mb-4 text-red-700">
            <AlertCircle className="w-6 h-6" />
            <h2 className="text-xl font-bold">Database Connection Failed</h2>
          </div>
          <p className="text-slate-600 mb-4">
            The application could not fetch the medical aid plans.
          </p>
          <div className="bg-slate-900 text-slate-50 p-4 rounded-md font-mono text-sm overflow-x-auto">
            {JSON.stringify(error, null, 2)}
          </div>
        </div>
      </div>
    );
  }

  // 3. Handle Empty Database
  if (!plans || plans.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-yellow-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow-lg border border-yellow-200 text-center">
          <h2 className="text-xl font-bold text-yellow-800 mb-2">No Plans Found</h2>
          <p className="text-slate-600">
            The database connection is working, but the 'plans' table is empty.
          </p>
          <p className="text-sm text-slate-400 mt-4">
            Run the SQL Injection Scripts in Supabase to populate data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">

        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            Medical Aid Calculator 2026
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Compare Discovery Health & Bonitas plans instantly.
          </p>
        </div>

        {/* The Client Component */}
        <PlanCalculator plans={plans} />

      </div>
    </main>
  );
}