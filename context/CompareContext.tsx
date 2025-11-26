'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SelectedPlan {
    id: string;
    name: string;
    scheme: string;
}

interface CompareContextType {
    selectedPlans: SelectedPlan[];
    togglePlan: (plan: SelectedPlan) => void;
    clearSelection: () => void;
    isOpen: boolean;
    setIsOpen: (v: boolean) => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: React.ReactNode }) {
    const [selectedPlans, setSelectedPlans] = useState<SelectedPlan[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('compare_plans');
        if (saved) {
            setSelectedPlans(JSON.parse(saved));
            setIsOpen(true);
        }
    }, []);

    // Save to localStorage on change
    useEffect(() => {
        localStorage.setItem('compare_plans', JSON.stringify(selectedPlans));
    }, [selectedPlans]);

    const togglePlan = (plan: SelectedPlan) => {
        setSelectedPlans(prev => {
            const exists = prev.find(p => p.id === plan.id);
            if (exists) {
                return prev.filter(p => p.id !== plan.id);
            }
            if (prev.length >= 3) return prev; // Max 3 plans
            return [...prev, plan];
        });
        setIsOpen(true);
    };

    const clearSelection = () => {
        setSelectedPlans([]);
        setIsOpen(false);
        localStorage.removeItem('compare_plans');
    };

    return (
        <CompareContext.Provider value={{ selectedPlans, togglePlan, clearSelection, isOpen, setIsOpen }}>
            {children}
        </CompareContext.Provider>
    );
}

export function useCompare() {
    const context = useContext(CompareContext);
    if (!context) throw new Error('useCompare must be used within a CompareProvider');
    return context;
}