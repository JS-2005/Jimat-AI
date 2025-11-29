"use client";

import React, { createContext, useContext, useState } from "react";

interface DashboardData {
    usageHistory: { month: string; usage: number; cost: number }[];
    billSummary: {
        totalAmount: number;
        billingPeriod: string;
    };
    metrics: {
        averageUsage: number;
        dailyUsage: number;
        generationCost: number;
        networkCharge: number;
        capacityCharge: number;
        greenIncentive: number;
    };
    costBreakdown: { name: string; value: number; color: string }[];
}

interface PredictionResult {
    prediction: number;
    status: string;
    threshold: number;
    mode?: 'solar' | 'standard';
    net_energy?: number;
    bill_impact?: number;
    consumption?: number;
    generation?: number;
    bill?: number;
    monthly_kwh?: number;
    suggestions?: string[];
}

interface DashboardContextType {
    dashboardData: DashboardData | null;
    setDashboardData: (data: DashboardData | null) => void;
    predictionData: PredictionResult | null;
    setPredictionData: (data: PredictionResult | null) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [predictionData, setPredictionData] = useState<PredictionResult | null>(null);

    return (
        <DashboardContext.Provider
            value={{
                dashboardData,
                setDashboardData,
                predictionData,
                setPredictionData,
            }}
        >
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboard() {
    const context = useContext(DashboardContext);
    if (context === undefined) {
        throw new Error("useDashboard must be used within a DashboardProvider");
    }
    return context;
}
