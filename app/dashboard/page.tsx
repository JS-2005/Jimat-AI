"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Zap, DollarSign, Printer, ArrowLeft, Leaf, BarChart3, Activity, Loader2 } from "lucide-react";
import { FileUpload } from "@/components/FileUpload";
import { useDashboard } from "@/contexts/DashboardContext";

// Types for our data
interface BillData {
    billing_period: string;
    billing_days?: number;
    total_amount_due: number;
    currency: string;
    total_usage_kwh: number;
    // payment_due_date removed
    breakdown_charges: { description: string; amount: number }[];
    average_daily_usage?: number | null;
    average_monthly_usage?: number | null;
    generation_cost?: number | null;
    green_incentive?: number | null;
    usage_history?: { month: string; usage_kwh: number }[] | null;
}

export default function Dashboard() {
    const [data, setData] = useState<BillData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { setDashboardData } = useDashboard();

    useEffect(() => {
        const storedData = localStorage.getItem("billData");
        if (storedData) {
            try {
                const parsed = JSON.parse(storedData);
                processAndSetData(parsed);
            } catch (e) {
                console.error("Failed to parse bill data", e);
                // Don't redirect, just stay on upload screen
            }
        }
    }, []);

    const processAndSetData = (parsed: any) => {
        // Fallback Logic for Average Monthly Usage
        if (!parsed.average_monthly_usage && parsed.billing_days && parsed.billing_days >= 28 && parsed.billing_days <= 32) {
            parsed.average_monthly_usage = parsed.total_usage_kwh;
        }
        setData(parsed);

        // Sync with Global Context for Chat AI
        const contextData = {
            usageHistory: parsed.usage_history?.map((h: any) => ({
                month: h.month,
                usage: h.usage_kwh,
                cost: 0 // We might not have this in history, default to 0
            })) || [],
            billSummary: {
                totalAmount: parsed.total_amount_due,
                billingPeriod: parsed.billing_period
                // dueDate removed
            },
            metrics: {
                averageUsage: parsed.average_monthly_usage || 0,
                dailyUsage: parsed.average_daily_usage || 0,
                generationCost: parsed.generation_cost || 0,
                networkCharge: 0, // Not explicitly in BillData top level, might be in breakdown
                capacityCharge: 0,
                greenIncentive: parsed.green_incentive || 0
            },
            costBreakdown: parsed.breakdown_charges.map((c: any) => ({
                name: c.description,
                value: c.amount,
                color: "#8884d8" // Default color
            }))
        };
        setDashboardData(contextData);
    };

    const handleAnalyze = async (file: File) => {
        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("/api/analyze", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to analyze bill");
            }

            const result = await response.json();
            localStorage.setItem("billData", JSON.stringify(result));
            processAndSetData(result);
        } catch (err: any) {
            console.error("Analysis Error:", err);
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleBack = () => {
        setData(null);
        localStorage.removeItem("billData");
    };

    const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#6366F1"];

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <h2 className="text-xl font-semibold text-gray-900">Analyzing your bill...</h2>
                <p className="text-gray-500 mt-2">This may take a few moments.</p>
            </div>
        );
    }

    if (!data) {
        return (
            <main className="min-h-screen bg-gray-50 p-6 sm:p-10 font-sans flex flex-col items-center justify-center">
                <div className="max-w-xl w-full space-y-8">
                    <div className="text-center">
                        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
                            Upload Your Bill
                        </h1>
                        <p className="text-gray-500 text-lg">
                            Upload your electricity bill PDF to get a detailed analysis.
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
                        <FileUpload onFileSelect={handleAnalyze} />
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 p-6 sm:p-10 print:p-0 print:bg-white font-sans print:min-h-0">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-3 print:hidden transition-colors text-sm font-medium"
                        >
                            <ArrowLeft className="w-4 h-4" /> Upload New Bill
                        </button>
                        <h1 className="text-4xl font-extrabold text-gray-900 flex items-center gap-3 tracking-tight">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <Zap className="text-yellow-600 w-8 h-8" />
                            </div>
                            Bill Analysis
                            <span className="text-lg font-normal text-gray-500 ml-4 self-end mb-1">
                                {data.billing_period}
                            </span>
                        </h1>
                        <p className="text-gray-500 mt-1 ml-14">Comprehensive breakdown of your energy usage.</p>
                    </div>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm font-medium print:hidden"
                    >
                        <Printer className="w-4 h-4" /> Print Report
                    </button>
                </div>

                {/* Dashboard Content */}
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                    {/* KPI Cards Row 1: Primary Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:grid-cols-4 print:gap-4">
                        {/* Total Due */}
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 print:from-white print:to-white print:bg-white print:border-2 print:border-gray-800 p-6 rounded-2xl shadow-lg print:shadow-none text-white print:text-black transform transition-transform hover:scale-[1.02] print:hover:scale-100">
                            <div className="flex items-center justify-between mb-4 opacity-90">
                                <span className="text-sm font-medium uppercase tracking-wider">Total Due</span>
                                <DollarSign className="w-5 h-5" />
                            </div>
                            <div className="text-3xl font-bold">
                                {data.currency} {data.total_amount_due.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </div>

                        {/* Total Usage */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 print:border-gray-300 print:shadow-none hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 text-gray-500 mb-2">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <Zap className="w-5 h-5 text-green-600" />
                                </div>
                                <span className="text-sm font-medium">Total Usage</span>
                            </div>
                            <div className="text-3xl font-bold text-gray-900 mt-2">
                                {data.total_usage_kwh.toLocaleString()} <span className="text-lg text-gray-500 font-normal">kWh</span>
                            </div>
                        </div>

                        {/* Avg Daily Usage */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 print:border-gray-300 print:shadow-none hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 text-gray-500 mb-2">
                                <div className="p-2 bg-cyan-100 rounded-lg">
                                    <Activity className="w-5 h-5 text-cyan-600" />
                                </div>
                                <span className="text-sm font-medium">Avg Daily Usage</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900 mt-2">
                                {data.average_daily_usage ? `${data.average_daily_usage.toLocaleString()} kWh` : "N/A"}
                            </div>
                        </div>

                        {/* Generation Cost */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 print:border-gray-300 print:shadow-none hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 text-gray-500 mb-2">
                                <div className="p-2 bg-orange-100 rounded-lg">
                                    <Zap className="w-5 h-5 text-orange-600" />
                                </div>
                                <span className="text-sm font-medium">Generation Cost</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900 mt-2">
                                {data.generation_cost ? `${data.currency} ${data.generation_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "N/A"}
                            </div>
                        </div>
                    </div>

                    {/* KPI Cards Row 2: Secondary Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3 print:gap-4">
                        {/* Green Incentive */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 print:border-gray-300 print:shadow-none hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 text-gray-500 mb-2">
                                <div className="p-2 bg-emerald-100 rounded-lg">
                                    <Leaf className="w-5 h-5 text-emerald-600" />
                                </div>
                                <span className="text-sm font-medium">Green Incentive</span>
                            </div>
                            <div className="text-2xl font-bold text-emerald-600 mt-2">
                                {data.green_incentive ? `-${data.currency} ${data.green_incentive.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "None"}
                            </div>
                        </div>

                        {/* Avg Monthly Usage */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 print:border-gray-300 print:shadow-none hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 text-gray-500 mb-2">
                                <div className="p-2 bg-indigo-100 rounded-lg">
                                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                                </div>
                                <span className="text-sm font-medium">Avg Monthly Usage</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900 mt-2">
                                {data.average_monthly_usage ? `${data.average_monthly_usage.toLocaleString()} kWh` : "N/A"}
                            </div>
                        </div>

                        {/* Empty Card to maintain grid or could be removed */}
                        <div className="hidden md:block"></div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:grid-cols-1 print:gap-8">

                        {/* Usage History Chart */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 print:border-gray-300 print:shadow-none break-inside-avoid">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-gray-400" /> Usage History (6 Months)
                                </h3>
                            </div>
                            <div className="h-80 w-full">
                                {data.usage_history && data.usage_history.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={data.usage_history}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                            <Tooltip
                                                cursor={{ fill: '#F3F4F6' }}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                formatter={(value: number) => [`${value} kWh`, 'Usage']}
                                            />
                                            <Bar dataKey="usage_kwh" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-400 flex-col gap-2">
                                        <BarChart3 className="w-10 h-10 opacity-20" />
                                        <p>No history data available</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Detailed List Section */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 print:border-gray-300 print:shadow-none break-inside-avoid">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Charge Details</h3>
                            <div className="space-y-4">
                                {data.breakdown_charges.map((charge, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors border-b border-gray-50 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                            <span className="text-sm font-medium text-gray-700">{charge.description}</span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-900">
                                            {data.currency} {charge.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                ))}

                                <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
                                    <span className="font-bold text-gray-900">Total</span>
                                    <span className="font-bold text-xl text-blue-600">
                                        {data.currency} {data.total_amount_due.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </main>
    );
}