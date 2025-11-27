// ---------------------------------------------------------
// 1. Types & Interfaces
// ---------------------------------------------------------

export type PersonaType =
    | 'Chronic Warrior'
    | 'Digital Native'
    | 'Family Planner'
    | 'Budget Conscious'
    | 'Regional Resident'
    | 'Executive';

export interface UserProfile {
    persona: PersonaType;
    // Granular flags derived from "Triage" questions
    needs: {
        chronicADL?: boolean;      // Needs Additional Disease List cover?
        orthopedic?: boolean;      // Anticipating joint/back surgery?
        maternity?: boolean;       // Pregnant or planning?
        travel?: boolean;          // Frequent traveler?
        digitalFirst?: boolean;    // Willing to use apps?
    };
    location?: string;             // e.g., "Coastal", "Inland"
}

export interface PlanRisk {
    level: 'HIGH' | 'MEDIUM' | 'LOW';
    warning: string;
    details: string;
}

// ---------------------------------------------------------
// 2. The Exclusion Database (Hardcoded from Rules)
// ---------------------------------------------------------

// Sourced from uploaded plan documents (Smart, KeyCare, Core, etc.)
const EXCLUSION_RULES = [
    {
        // Source: Discovery Smart Series Plan 2026.txt
        condition: (planName: string, needs: UserProfile['needs']) =>
            needs.orthopedic &&
            ['Essential Smart', 'Essential Dynamic Smart', 'Active Smart'].some(p => planName.includes(p)),
        warning: "Joint Replacement Exclusion",
        details: "This plan strictly excludes hip, knee, and shoulder replacements unless it is a PMB emergency. Classic Smart is safer."
    },
    {
        // Source: Discovery Comprehensive Series Plan 2026.txt
        condition: (planName: string, needs: UserProfile['needs']) =>
            needs.chronicADL &&
            planName.includes('Smart Comprehensive'),
        warning: "No ADL Chronic Cover",
        details: "You indicated a need for complex chronic medication. 'Classic Smart Comprehensive' excludes the Additional Disease List (ADL). You must choose 'Classic Comprehensive'."
    },
    {
        // Source: Discovery Core Series Plan 2026.txt
        condition: (planName: string, needs: UserProfile['needs']) =>
            !needs.maternity &&
            planName.includes('Core') &&
            needs.maternity,
        warning: "Private Ward Exclusion",
        details: "Core plans only cover General Ward costs. For maternity, this means no private room unless you pay extra."
    },
    {
        // Source: Discovery KeyCare Series Plan 2026.txt
        condition: (planName: string, needs: UserProfile['needs']) =>
            planName.includes('KeyCare Start Regional') &&
            !needs.digitalFirst,
        warning: "Digital Gatekeeper Risk",
        details: "KeyCare Start requires all GP visits to start online/digitally. If you prefer walking into a doctor's rooms, you will have no cover."
    },
    {
        // Source: Discovery Priority Series Plan 2026.txt
        condition: (planName: string, needs: UserProfile['needs']) =>
            planName.includes('Priority') &&
            needs.chronicADL,
        warning: "Limited ADL Cover",
        details: "Priority plans have limited ADL cover. Once your chronic allowance is reached, you might pay out of pocket."
    }
];

// ---------------------------------------------------------
// 3. The Persona Engine
// ---------------------------------------------------------

export class PersonaEngine {

    /**
     * Validates a specific plan against a user's risk profile.
     * Returns an array of risks (empty if safe).
     */
    static validatePlan(planName: string, profile: UserProfile): PlanRisk[] {
        const risks: PlanRisk[] = [];

        // 1. Run Exclusion Rules
        EXCLUSION_RULES.forEach(rule => {
            if (rule.condition(planName, profile.needs)) {
                risks.push({
                    level: 'HIGH',
                    warning: rule.warning,
                    details: rule.details
                });
            }
        });

        // 2. Persona Mismatches (Marketing Hook Logic)

        // Source: Discovery Smart Series - "Digital Native"
        if (profile.persona === 'Digital Native' &&
            !planName.includes('Smart') &&
            !planName.includes('KeyCare Start')) {
            risks.push({
                level: 'LOW',
                warning: "Low Tech-Value",
                details: "This plan doesn't offer the digital-first incentives (like R0 video consults) that maximize value for your profile."
            });
        }

        // Source: Discovery Core Series - "Chronic Warrior" risk
        if (profile.persona === 'Chronic Warrior' && planName.includes('Core')) {
            risks.push({
                level: 'MEDIUM',
                warning: "No Day-to-Day Funding",
                details: "As a Chronic Warrior, you likely need regular GP visits. Core plans have 0% day-to-day cover."
            });
        }

        return risks;
    }

    /**
     * Helper to determine default "Needs" based on Persona.
     * Used when the user first lands on a Persona Page without filling a detailed form.
     */
    static getDefaultsForPersona(persona: PersonaType): UserProfile['needs'] {
        switch (persona) {
            case 'Chronic Warrior': return { chronicADL: true };
            case 'Family Planner': return { maternity: true };
            case 'Digital Native': return { digitalFirst: true };
            case 'Budget Conscious': return { digitalFirst: false };
            case 'Regional Resident': return { travel: false };
            case 'Executive': return { travel: true, chronicADL: true };
            default: return {};
        }
    }
}
