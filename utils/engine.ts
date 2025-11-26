import { SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------
// 1. Types & Interfaces
// ---------------------------------------------------------

export interface UserScenario {
    planId: string;
    income?: number;
    memberCount: {
        main: number;
        adult: number;
        child: number;
    };
}

// ---------------------------------------------------------
// 2. The Pricing Engine (The Brain)
// ---------------------------------------------------------

export class PricingEngine {

    /**
     * Calculates the total monthly premium.
     * NOW INCLUDES: Auto-JSON parsing and detailed error logging.
     */
    static calculatePremium(contributionData: any, members: UserScenario['memberCount'], income: number = 0): number {
        if (!contributionData) {
            console.warn("⚠️ PricingEngine: No contribution data received.");
            return 0;
        }

        // 1. SAFE PARSING: Handle potential stringified JSON from DB
        let matrix = contributionData.pricing_matrix;
        if (typeof matrix === 'string') {
            try {
                matrix = JSON.parse(matrix);
            } catch (e) {
                console.error("❌ PricingEngine: Failed to parse pricing_matrix string", e);
                return 0;
            }
        }

        let mainPrice = 0;
        let adultPrice = 0;
        let childPrice = 0;

        // 2. LOGIC A: Income Banded (KeyCare)
        if (contributionData.pricing_model === 'Income_Banded') {
            if (!Array.isArray(matrix)) {
                console.error("❌ PricingEngine: Income Banded model expects array, got:", matrix);
                return 0;
            }

            // Find the correct band based on income
            // We assume "min" and "max" fields exist. 
            // If "max" is missing (e.g. top band), we treat it as infinite.
            const activeBand = matrix.find((b: any) => {
                const min = Number(b.min) || 0;
                const max = Number(b.max) || Number.MAX_SAFE_INTEGER;
                return income >= min && income <= max;
            });

            if (!activeBand) {
                console.warn(`⚠️ PricingEngine: No income band found for income R${income}`);
                // Fallback to lowest band if not found, to prevent R0 display
                const fallback = matrix[0];
                mainPrice = Number(fallback.main) || 0;
                adultPrice = Number(fallback.adult) || 0;
                childPrice = Number(fallback.child) || 0;
            } else {
                mainPrice = Number(activeBand.main) || 0;
                adultPrice = Number(activeBand.adult) || 0;
                childPrice = Number(activeBand.child) || 0;
            }
        }

        // 3. LOGIC B: Fixed Pricing (Core, Smart, etc.)
        else {
            // Ensure we are accessing the object correctly
            // Sometimes it might be wrapped or direct
            mainPrice = Number(matrix.main) || 0;
            adultPrice = Number(matrix.adult) || 0;
            childPrice = Number(matrix.child) || 0;
        }

        // 4. Final Math
        const total = (mainPrice * members.main) +
            (adultPrice * members.adult) +
            (childPrice * members.child);

        // DEBUG LOG: Remove this line once working
        // console.log(`💰 Calc: ${contributionData.pricing_model} | Main: R${mainPrice} x ${members.main} | Total: R${total}`);

        return total;
    }

    /**
     * Calculates Thresholds (MSA, Gap, ATB).
     */
    static calculateThresholds(contributionData: any, members: UserScenario['memberCount']) {
        if (!contributionData) return { annualMSA: 0, selfPaymentGap: 0, threshold: 0, limitedATB: 0 };

        // Safe Parsing for Structures
        let ts = contributionData.threshold_structure;
        let msa = contributionData.msa_structure;

        if (typeof ts === 'string') ts = JSON.parse(ts);
        if (typeof msa === 'string') msa = JSON.parse(msa);

        if (!ts || msa?.type === 'None') {
            return { annualMSA: 0, selfPaymentGap: 0, threshold: 0, limitedATB: 0 };
        }

        // 1. Annual MSA
        let annualMSA = 0;
        if (msa.type === 'Percentage') {
            // If percentage, we usually need the total premium first. 
            // For simplicity here, we assume the DB stored the "Fixed Annual Amount" in threshold_structure
            // as per our SQL script (msa_allocation_main, etc.)
            // If your schema stores just "25%", we'd need to multiply premium * 0.25 * 12
            // Checking if explicit amounts exist:
            if (ts.msa_allocation_main) {
                annualMSA = (Number(ts.msa_allocation_main) * members.main) +
                    (Number(ts.msa_allocation_adult) * members.adult) +
                    (Number(ts.msa_allocation_child) * members.child);
            }
        } else if (msa.type === 'Fixed') {
            // Logic for Smart Saver (Fixed Amount)
            const fixedVal = Number(msa.value) || 0;
            annualMSA = fixedVal * (members.main + members.adult + members.child);
        }

        // 2. Annual Threshold
        const threshold = (Number(ts.annual_threshold_main || ts.annual_threshold) * members.main) +
            (Number(ts.annual_threshold_adult || ts.annual_threshold) * members.adult) +
            (Number(ts.annual_threshold_child || ts.child_threshold || 0) * members.child);

        // 3. Self-Payment Gap
        const gap = Math.max(0, threshold - annualMSA);

        return { annualMSA, selfPaymentGap: gap, threshold, limitedATB: 0 };
    }
}