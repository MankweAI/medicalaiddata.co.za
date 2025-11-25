"use client";

import React from 'react';

interface Plan {
    id: string;
    name: string;
    slug: string;
    type: string;
    target_personas: any;
    contributions: any;
    benefits: any[];
}

interface PlanCalculatorProps {
    plans: Plan[] | null;
}

export default function PlanCalculator({ plans }: PlanCalculatorProps) {
    return (
        <div className="p-4 bg-white rounded shadow">
            <h2 className="text-xl font-bold mb-4">Plan Calculator</h2>
            <p>Select a plan to see details.</p>
            {/* Placeholder for calculator logic */}
            <div className="mt-4">
                {plans?.map((plan) => (
                    <div key={plan.id} className="mb-2 p-2 border rounded">
                        <h3 className="font-semibold">{plan.name}</h3>
                        <p className="text-sm text-gray-600">{plan.type}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
