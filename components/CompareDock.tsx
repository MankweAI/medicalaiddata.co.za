'use client';

import { useCompare } from '@/context/CompareContext';
import { X, ArrowRight, Layers } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';

export default function CompareDock() {
    const { selectedPlans, togglePlan, clearSelection } = useCompare();

    if (selectedPlans.length === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-3xl px-4 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl shadow-slate-900/50 border border-slate-700 flex items-center justify-between">

                {/* Left: Status */}
                <div className="flex items-center gap-4">
                    <div className="bg-blue-600 p-2.5 rounded-xl">
                        <Layers className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white">
                            Compare Plans <span className="text-blue-400">({selectedPlans.length}/3)</span>
                        </p>
                        <p className="text-xs text-slate-400 hidden sm:block">
                            Select up to 3 plans to compare side-by-side.
                        </p>
                    </div>
                </div>

                {/* Middle: Selected Pills (Desktop only) */}
                <div className="hidden md:flex gap-2 mx-4">
                    {selectedPlans.map(plan => (
                        <button
                            key={plan.id}
                            onClick={() => togglePlan(plan)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-red-900/50 border border-slate-700 rounded-lg text-xs transition-colors group"
                        >
                            <span className="truncate max-w-[100px]">{plan.name}</span>
                            <X className="w-3 h-3 text-slate-500 group-hover:text-red-400" />
                        </button>
                    ))}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={clearSelection}
                        className="text-xs text-slate-400 hover:text-white px-3 py-2"
                    >
                        Clear
                    </button>
                    <Link
                        href={`/compare?plans=${selectedPlans.map(p => p.id).join(',')}`}
                        className={clsx(
                            "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all",
                            selectedPlans.length >= 2
                                ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20"
                                : "bg-slate-800 text-slate-500 cursor-not-allowed"
                        )}
                        onClick={(e) => { if (selectedPlans.length < 2) e.preventDefault(); }}
                    >
                        Compare Now
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

            </div>
        </div>
    );
}