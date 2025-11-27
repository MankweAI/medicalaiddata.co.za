import { SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------
// 1. Types & Interfaces (Enhanced for Granularity)
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

export interface FinancialProfile {
    monthlyPremium: number;
    annualPremium: number;
    // Granular Threshold Data (Crucial for "Gap Gauge")
    savings: {
        annualAllocation: number;
        monthlyAllocation: number;
        isPooled: boolean; // True for classic (pooled), False for KeyCare
    };
    thresholds: {
        annualThreshold: number;
        selfPaymentGap: number;
        limitedAboveThreshold: number; // For Priority Plans
    };
    // Incentive Data (Crucial for "Reward Stacker")
    incentives: {
        baseFund: number;
        potentialBoost: number;
        maxFund: number;
    };
}

// ---------------------------------------------------------
// 2. The Pricing Engine (The Brain)
// ---------------------------------------------------------

export class PricingEngine {

    /**
     * E-E-A-T Compliance: Standard Disclaimer Generator
     * Must be displayed on any page rendering financial data.
     */
    static getDisclaimer(): string {
        return "Disclaimer: medicalaiddata.co.za is a data aggregation platform, not a registered financial services provider (FSP) or medical scheme. All calculations are mathematical models based on publicly available scheme rules for the 2026 benefit year. Values are estimates and do not constitute financial advice. Please verify final quotes with the scheme directly.";
    }

    /**
     * Calculates the full financial profile.
     * Upgraded to return granular objects for visualization tools.
     */
    static calculateProfile(contributionData: any, members: UserScenario['memberCount'], income: number = 0): FinancialProfile {
        if (!contributionData) {
            return this.getZeroProfile();
        }

        // 1. Calculate Premium (Existing Logic)
        const premium = this.calculatePremium(contributionData, members, income);

        // 2. Calculate Thresholds (Enhanced Logic for "The Chronic Warrior")
        const thresholdData = this.calculateThresholds(contributionData, members);

        // 3. Calculate Incentives (New Logic for "The Digital Native")
        const incentiveData = this.calculateIncentives(contributionData, members);

        return {
            monthlyPremium: premium,
            annualPremium: premium * 12,
            savings: {
                annualAllocation: thresholdData.annualMSA,
                monthlyAllocation: thresholdData.annualMSA / 12,
                isPooled: thresholdData.annualMSA > 0
            },
            thresholds: {
                annualThreshold: thresholdData.threshold,
                selfPaymentGap: thresholdData.selfPaymentGap,
                limitedAboveThreshold: thresholdData.limitedATB
            },
            incentives: incentiveData
        };
    }

    /**
     * Internal: Premium Calculation
     */
    private static calculatePremium(contributionData: any, members: UserScenario['memberCount'], income: number): number {
        let matrix = contributionData.pricing_matrix;
        if (typeof matrix === 'string') {
            try { matrix = JSON.parse(matrix); } catch (e) { return 0; }
        }

        let mainPrice = 0, adultPrice = 0, childPrice = 0;

        // Logic A: Income Banded (KeyCare)
        if (contributionData.pricing_model === 'Income_Banded' && Array.isArray(matrix)) {
            const activeBand = matrix.find((b: any) => {
                const min = Number(b.min) || 0;
                const max = Number(b.max) || Number.MAX_SAFE_INTEGER;
                return income >= min && income <= max;
            });

            const band = activeBand || matrix[0]; // Fallback to lowest
            mainPrice = Number(band?.main) || 0;
            adultPrice = Number(band?.adult) || 0;
            childPrice = Number(band?.child) || 0;
        }
        // Logic B: Fixed Pricing
        else {
            mainPrice = Number(matrix?.main) || 0;
            adultPrice = Number(matrix?.adult) || 0;
            childPrice = Number(matrix?.child) || 0;
        }

        return (mainPrice * members.main) + (adultPrice * members.adult) + (childPrice * members.child);
    }

    /**
     * Internal: Threshold Calculation (Refined for Granularity)
     * Extracts variables needed for the "Gap Gauge"
     */
    private static calculateThresholds(contributionData: any, members: UserScenario['memberCount']) {
        let ts = contributionData.threshold_structure;
        let msa = contributionData.msa_structure;

        if (typeof ts === 'string') try { ts = JSON.parse(ts); } catch { ts = null; }
        if (typeof msa === 'string') try { msa = JSON.parse(msa); } catch { msa = null; }

        if (!ts) return { annualMSA: 0, selfPaymentGap: 0, threshold: 0, limitedATB: 0 };

        // 1. Annual MSA Calculation
        let annualMSA = 0;
        if (ts.msa_allocation_main) {
            // Priority/Comprehensive style (Specific Rand amounts defined in structure)
            annualMSA = (Number(ts.msa_allocation_main) * members.main) +
                (Number(ts.msa_allocation_adult) * members.adult) +
                (Number(ts.msa_allocation_child) * members.child);
        } else if (msa?.type === 'Fixed' && msa?.value) {
            // Smart Saver style (Fixed amount per person)
            annualMSA = Number(msa.value) * (members.main + members.adult + members.child);
        }

        // 2. Annual Threshold Calculation
        // Checks for explicit main/adult/child thresholds (Priority/Comprehensive) vs single threshold (Saver)
        const mainThresh = Number(ts.annual_threshold_main || ts.annual_threshold || 0);
        const adultThresh = Number(ts.annual_threshold_adult || ts.annual_threshold || 0);
        const childThresh = Number(ts.annual_threshold_child || ts.child_threshold || 0);

        const totalThreshold = (mainThresh * members.main) +
            (adultThresh * members.adult) +
            (childThresh * members.child);

        // 3. Self-Payment Gap (SPG)
        // We calculate this dynamically rather than relying on a static DB field to ensure accuracy for different family sizes
        const spg = Math.max(0, totalThreshold - annualMSA);

        // 4. Limited Above Threshold Benefit (LATB) - Specific to Priority Series
        let latb = 0;
        if (ts.latb_limit_main) {
            latb = (Number(ts.latb_limit_main) * members.main) +
                (Number(ts.latb_limit_adult) * members.adult) +
                (Number(ts.latb_limit_child) * members.child);
        }

        return { annualMSA, selfPaymentGap: spg, threshold: totalThreshold, limitedATB: latb };
    }

    /**
     * Internal: Incentive Calculation (New for "Reward Stacker")
     * Extracts PHF (Personal Health Fund) data
     */
    private static calculateIncentives(contributionData: any, members: UserScenario['memberCount']) {
        // NOTE: This assumes 'phf_values' is passed or available. 
        // In the current DB schema, this might need to be joined from the plan_series or stored in a JSONB column.
        // For now, we simulate safe extraction if the data is present in the `benefits` or `meta` JSON.

        // This is a placeholder logic assuming 'phf_structure' might be added to contributions or handled via a separate lookup.
        // If not present, return 0.
        return {
            baseFund: 0,
            potentialBoost: 0,
            maxFund: 0
        };
    }

    private static getZeroProfile(): FinancialProfile {
        return {
            monthlyPremium: 0,
            annualPremium: 0,
            savings: { annualAllocation: 0, monthlyAllocation: 0, isPooled: false },
            thresholds: { annualThreshold: 0, selfPaymentGap: 0, limitedAboveThreshold: 0 },
            incentives: { baseFund: 0, potentialBoost: 0, maxFund: 0 }
        };
    }
}