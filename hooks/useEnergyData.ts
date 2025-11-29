"use client";

import { useState, useEffect } from "react";
import Papa from "papaparse";

export interface EnergyData {
    Household_ID: string;
    Date: string;
    Energy_Consumption_kWh: number;
    Household_Size: number;
    Avg_Temperature_C: number;
    Has_AC: string;
    Peak_Hours_Usage_kWh: number;
}

export interface AggregatedStats {
    totalConsumption: number;
    avgDailyConsumption: number;
    totalHouseholds: number;
    acAdoptionRate: number;
    dailyTrend: { date: string; consumption: number }[];
    householdSizeTrend: { size: number; consumption: number }[];
}

export function useEnergyData() {
    const [data, setData] = useState<EnergyData[]>([]);
    const [stats, setStats] = useState<AggregatedStats | null>(null);
    const [loading, setLoading] = useState(true);

    const calculateStats = (data: EnergyData[]) => {
        const totalConsumption = data.reduce((acc, curr) => acc + (curr.Energy_Consumption_kWh || 0), 0);
        const uniqueHouseholds = new Set(data.map((d) => d.Household_ID)).size;
        const acHouseholds = new Set(data.filter((d) => d.Has_AC === "Yes").map((d) => d.Household_ID)).size;

        // Daily Trend
        const dailyMap = new Map<string, number>();
        data.forEach((d) => {
            const current = dailyMap.get(d.Date) || 0;
            dailyMap.set(d.Date, current + (d.Energy_Consumption_kWh || 0));
        });
        const dailyTrend = Array.from(dailyMap.entries())
            .map(([date, consumption]) => ({ date, consumption: parseFloat(consumption.toFixed(2)) }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Household Size Trend
        const sizeMap = new Map<number, { total: number; count: number }>();
        data.forEach((d) => {
            if (!d.Household_Size) return;
            const current = sizeMap.get(d.Household_Size) || { total: 0, count: 0 };
            sizeMap.set(d.Household_Size, { total: current.total + d.Energy_Consumption_kWh, count: current.count + 1 });
        });
        const householdSizeTrend = Array.from(sizeMap.entries())
            .map(([size, { total, count }]) => ({ size, consumption: parseFloat((total / count).toFixed(2)) }))
            .sort((a, b) => a.size - b.size);

        setStats({
            totalConsumption: parseFloat(totalConsumption.toFixed(2)),
            avgDailyConsumption: parseFloat((totalConsumption / data.length).toFixed(2)),
            totalHouseholds: uniqueHouseholds,
            acAdoptionRate: parseFloat(((acHouseholds / uniqueHouseholds) * 100).toFixed(1)),
            dailyTrend,
            householdSizeTrend,
        });
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch("/GG.csv");
                const reader = response.body?.getReader();
                const result = await reader?.read();
                const decoder = new TextDecoder("utf-8");
                const csv = decoder.decode(result?.value);

                Papa.parse(csv, {
                    header: true,
                    dynamicTyping: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        const parsedData = results.data as EnergyData[];
                        setData(parsedData);
                        calculateStats(parsedData);
                        setLoading(false);
                    },
                });
            } catch (error) {
                console.error("Error fetching data:", error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return { data, stats, loading };
}
