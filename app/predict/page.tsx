"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Zap, Leaf, CheckCircle, ArrowRight, Loader2, Sun, TrendingUp, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/contexts/DashboardContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function PredictPage() {
    const { predictionData, setPredictionData } = useDashboard();
    const [formData, setFormData] = useState({
        dayOfWeek: "Monday",
        temp: "26.5",
        familySize: "4",
        hasAC: "Yes",
        peakUsage: "0.5",
        hasSolar: false,
        solarSize: "5.0"
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setPredictionData(null);

        const payload = {
            Day: formData.dayOfWeek,
            Avg_Temperature_C: parseFloat(formData.temp),
            Household_Size: parseInt(formData.familySize),
            Has_AC: formData.hasAC,
            Peak_Hours_Usage_kWh: parseFloat(formData.peakUsage),
            Has_Solar: formData.hasSolar,
            Solar_Panel_Size_kW: formData.hasSolar ? parseFloat(formData.solarSize) : 0
        };

        try {
            const response = await fetch("/api/predict", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to fetch prediction");
            }

            const data = await response.json();

            // --- ⚡ FRONTEND LOGIC START ⚡ ---
            // In solar mode, 'prediction' is net usage, 'consumption' is gross usage.
            // We want gross usage for bill calculation if ignoring solar.
            const dailyKwh = data.consumption || data.prediction || 0;
            const monthlyKwh = dailyKwh * 30;
            const estimatedBill = calculateBill(monthlyKwh);

            // --- SMART SUGGESTIONS LOGIC ---
            const newSuggestions: string[] = [];

            // 1. Weekend Check
            if (formData.dayOfWeek === "Saturday" || formData.dayOfWeek === "Sunday") {
                newSuggestions.push("⚠️ Weekend Alert: Energy rates/usage are typically higher on weekends. Avoid running all heavy appliances at once.");
            }

            // 2. AC Check
            if (formData.hasAC === "Yes") {
                newSuggestions.push("❄️ AC Detected: Air conditioning is your biggest cost. Setting it to 24°C instead of 20°C can save up to 20% on your bill.");
            }

            // 3. High Usage Check (General)
            if (monthlyKwh > 300) {
                newSuggestions.push("📈 High Consumption: Your predicted usage is above average (>300 kWh). Consider checking for 'Vampire Power' devices on standby.");
            } else if (newSuggestions.length === 0) {
                // If no other warnings, give a positive message
                newSuggestions.push("✅ Great Job! Your energy usage pattern is very efficient.");
            }
            // --- LOGIC END ---

            // Recalculate status based on prediction and threshold to ensure consistency
            const threshold = data.threshold || 20; // Default threshold if missing
            const calculatedStatus = dailyKwh > threshold ? "CRITICAL" : "Safe";

            setPredictionData({
                ...data,
                prediction: dailyKwh, // Override API prediction with gross daily usage
                status: calculatedStatus, // Override API status with calculated one
                bill: estimatedBill,
                monthly_kwh: monthlyKwh,
                suggestions: newSuggestions
            });

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to get prediction. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const inputClassName = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

    // Prepare chart data
    const chartData = predictionData ? (
        predictionData.mode === 'solar' ? [
            { name: 'Usage', value: predictionData.consumption || 0, fill: '#ef4444' },
            { name: 'Solar Gen', value: predictionData.generation || 0, fill: '#ca8a04' }
        ] : [
            { name: 'Usage', value: predictionData.prediction || 0, fill: predictionData.status === 'CRITICAL' ? '#ea580c' : '#22c55e' }
        ]
    ) : [];

    return (
        <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">Energy Forecast AI</h2>
                    <p className="text-gray-500">Predict future consumption and optimize with solar</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Parameters (1 col) */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border-gray-200 shadow-sm h-full">
                        <CardHeader>
                            <CardTitle>Prediction Parameters</CardTitle>
                            <CardDescription>Enter details to forecast energy consumption</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Day of Week</label>
                                    <select
                                        className={inputClassName}
                                        value={formData.dayOfWeek}
                                        onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                                    >
                                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                                            <option key={day} value={day}>{day}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Temp (°C)</label>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            value={formData.temp}
                                            onChange={(e) => setFormData({ ...formData, temp: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Family Size</label>
                                        <Input
                                            type="number"
                                            min="1"
                                            step="1"
                                            value={formData.familySize}
                                            onChange={(e) => setFormData({ ...formData, familySize: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Has AC?</label>
                                        <select
                                            className={inputClassName}
                                            value={formData.hasAC}
                                            onChange={(e) => setFormData({ ...formData, hasAC: e.target.value })}
                                        >
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Peak Hour Usage (kWh)</label>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span className="cursor-help text-gray-400 hover:text-gray-600">
                                                            <Info className="h-4 w-4" />
                                                        </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="bg-slate-900 text-white border-slate-800">
                                                        <p className="max-w-xs">Estimated energy consumption during peak hours (8:00 AM - 10:00 PM). Higher usage during these times may increase costs.</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            value={formData.peakUsage}
                                            onChange={(e) => setFormData({ ...formData, peakUsage: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <label className="flex items-center gap-3 mb-3 cursor-pointer group relative w-fit select-none">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                className="peer sr-only"
                                                checked={formData.hasSolar}
                                                onChange={(e) => setFormData({ ...formData, hasSolar: e.target.checked })}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                                            I have Solar Panels
                                        </span>
                                    </label>

                                    <div className={cn(
                                        "transition-all duration-300 overflow-hidden",
                                        formData.hasSolar ? "max-h-24 opacity-100 mt-2" : "max-h-0 opacity-0"
                                    )}>
                                        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                                            <label className="text-xs font-bold text-yellow-700 uppercase tracking-wider mb-1 block">Panel Size (kW)</label>
                                            <Input
                                                type="number"
                                                step="0.5"
                                                min="0"
                                                value={formData.solarSize}
                                                onChange={(e) => setFormData({ ...formData, solarSize: e.target.value })}
                                                className="bg-white border-yellow-300 font-bold text-gray-800 focus-visible:ring-yellow-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full"
                                    size="lg"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin h-5 w-5 mr-2" />
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            Calculate Forecast
                                            <ArrowRight className="h-4 w-4 ml-2" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Results (2 cols) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Results Card */}
                    <Card className={cn(
                        "border-gray-200 shadow-sm transition-all duration-500 h-fit",
                        predictionData ? "opacity-100" : "opacity-50 grayscale"
                    )}>
                        <CardHeader>
                            <CardTitle>Forecast Results</CardTitle>
                            <CardDescription>
                                {predictionData ? "Analysis complete" : "Run a prediction to see results"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {predictionData ? (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {predictionData.mode === 'solar' ? (
                                        // Solar Mode Results
                                        <>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <MetricCard
                                                    title="Net Impact"
                                                    value={`RM ${Math.abs(predictionData.bill_impact || 0).toFixed(2)}`}
                                                    icon={<Leaf className="w-5 h-5 text-green-600" />}
                                                    subtext={(predictionData.net_energy || 0) > 0 ? "Profit Generated" : "Estimated Cost"}
                                                    highlight={(predictionData.net_energy || 0) > 0}
                                                    iconBg="bg-green-100"
                                                />
                                                <MetricCard
                                                    title="Solar Generation"
                                                    value={`${predictionData.generation} kWh`}
                                                    icon={<Sun className="w-5 h-5 text-yellow-600" />}
                                                    subtext="Daily Production"
                                                    iconBg="bg-yellow-100"
                                                />
                                            </div>

                                            <AlertBox
                                                type={(predictionData.net_energy || 0) > 0 ? "success" : "warning"}
                                                title={(predictionData.net_energy || 0) > 0 ? "Eco-Friendly Status" : "Energy Deficit"}
                                                message={(predictionData.net_energy || 0) > 0
                                                    ? "Great job! Your solar panels are covering 100% of your needs."
                                                    : "You are consuming more than you generate. Consider reducing AC usage."}
                                                icon={(predictionData.net_energy || 0) > 0 ? Leaf : Zap}
                                            />
                                        </>
                                    ) : (
                                        // Standard Mode Results
                                        <>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <MetricCard
                                                    title="Predicted Usage"
                                                    value={`${(predictionData.prediction || 0).toFixed(2)} kWh`}
                                                    icon={<Zap className="w-5 h-5 text-blue-600" />}
                                                    subtext="Daily Consumption"
                                                    iconBg="bg-blue-100"
                                                />
                                                <MetricCard
                                                    title="Safe Threshold"
                                                    value={`${predictionData.threshold} kWh`}
                                                    icon={<CheckCircle className="w-5 h-5 text-slate-600" />}
                                                    subtext="Recommended Limit"
                                                    iconBg="bg-slate-100"
                                                />
                                            </div>

                                            <AlertBox
                                                type={predictionData.status === "Safe" ? "success" : "warning"}
                                                title={predictionData.status === "Safe" ? "Efficiency Good" : "High Usage Alert"}
                                                message={predictionData.status === "Safe"
                                                    ? "Your consumption is within the safe threshold."
                                                    : "Your predicted usage is above the safe threshold."}
                                                icon={predictionData.status === "Safe" ? CheckCircle : AlertTriangle}
                                            />
                                        </>
                                    )}

                                    {/* Chart Section */}
                                    <div className="h-[200px] w-full mt-6 bg-gray-50 rounded-xl p-4 border border-gray-100">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                                <RechartsTooltip
                                                    cursor={{ fill: 'transparent' }}
                                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                />
                                                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                                                    {chartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                                    ))}
                                                </Bar>
                                                {predictionData.mode !== 'solar' && (
                                                    <ReferenceLine y={predictionData.threshold} stroke="#94a3b8" strokeDasharray="6 6" strokeWidth={2} />
                                                )}
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[300px] text-center text-gray-400 space-y-4">
                                    <div className="p-4 bg-gray-50 rounded-full">
                                        <TrendingUp className="w-8 h-8 opacity-20" />
                                    </div>
                                    <p>Enter parameters and click &quot;Calculate Forecast&quot; <br /> to see AI predictions here.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Estimated Bill & Smart Advice Card */}
                    <Card className={cn("border-gray-200 shadow-sm transition-all duration-500", predictionData ? "block" : "hidden")}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="h-5 w-5 text-primary" />
                                Estimated Bill & Smart Advice
                            </CardTitle>
                            <CardDescription>
                                Prediction based on Peak Hour Usage (kWh)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-8">

                            {/* LEFT SIDE: Bill Display */}
                            <div className="space-y-6">
                                <div className="text-center md:text-left p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                                        Est. Monthly Bill
                                    </p>
                                    <div className="text-5xl font-bold text-primary tracking-tight">
                                        <span className="text-2xl font-bold mr-1 align-top mt-2 inline-block">RM</span>
                                        {predictionData?.bill?.toFixed(2) || "--"}
                                    </div>
                                    <p className="text-xs text-gray-400 font-medium mt-2">
                                        *Includes RM3.00 minimum charge
                                    </p>
                                </div>

                                <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
                                    <span>Estimates exclude SST (8%) and ICPT adjustments.</span>
                                </div>
                            </div>

                            {/* RIGHT SIDE: Breakdown & Suggestions */}
                            <div className="space-y-4">
                                {/* Data Breakdown */}
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3">
                                    <div className="flex justify-between items-center text-sm border-b border-gray-200 pb-2">
                                        <span className="text-gray-600">Daily Avg:</span>
                                        <span className="font-bold font-mono text-gray-900">{(predictionData?.prediction || 0).toFixed(2)} kWh</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">Monthly Est:</span>
                                        <span className="font-bold font-mono text-gray-900">{(predictionData?.monthly_kwh || 0).toFixed(0)} kWh</span>
                                    </div>
                                </div>

                                {/* Suggestions */}
                                {predictionData?.suggestions && predictionData.suggestions.length > 0 && (
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                        <p className="text-xs font-bold text-blue-700 uppercase mb-3 flex items-center gap-2">
                                            <Zap className="h-3 w-3" /> Jimat-AI Recommendations
                                        </p>
                                        <ul className="space-y-2">
                                            {predictionData.suggestions.map((tip, i) => (
                                                <li key={i} className="text-sm flex gap-2 items-start text-blue-900">
                                                    <span className="mt-1 text-[10px] text-blue-500">🔹</span>
                                                    {tip}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                        </CardContent>
                    </Card>
                </div>
            </div>
        </div >
    );
}

// Helper Components

function MetricCard({ title, value, icon, trend, trendUp, subtext, highlight, iconBg }: any) {
    return (
        <div className={`p-6 rounded-xl border transition-all duration-300 hover:-translate-y-1 ${highlight
            ? 'bg-green-50 border-green-200'
            : 'bg-white border-gray-200 shadow-sm'
            }`}>
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg ${iconBg || 'bg-gray-100'}`}>
                    {icon}
                </div>
                {trend && (
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${trendUp ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                        {trend}
                    </span>
                )}
            </div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
            <p className={`text-2xl font-bold ${highlight ? 'text-green-700' : 'text-gray-900'}`}>{value}</p>
            {subtext && <p className="text-xs text-gray-500 mt-2">{subtext}</p>}
        </div>
    );
}

function AlertBox({ type, title, message, icon: Icon }: any) {
    const styles = type === "success"
        ? "bg-green-50 border-green-100 text-green-800"
        : "bg-orange-50 border-orange-100 text-orange-800";

    const iconColor = type === "success" ? "text-green-500" : "text-orange-500";

    return (
        <div className={cn("border rounded-xl p-4 flex items-start gap-3", styles)}>
            <div className="mt-0.5">
                <Icon className={cn("h-5 w-5", iconColor)} />
            </div>
            <div>
                <h4 className="font-bold text-sm">{title}</h4>
                <p className="text-xs mt-1 leading-relaxed opacity-90">{message}</p>
            </div>
        </div>
    );
}

// Calculation Logic (Malaysian RP4 Tariff - Effective July 2025)
function calculateBill(monthlyKwh: number) {
    if (monthlyKwh <= 0) return 3.00; // Minimum charge fallback

    // 1. Energy Charge
    let energyCharge = 0;
    if (monthlyKwh <= 1500) {
        energyCharge = monthlyKwh * 0.2703;
    } else {
        energyCharge = (1500 * 0.2703) + ((monthlyKwh - 1500) * 0.3703);
    }

    // 2. Capacity Charge (4.55 sen/kWh)
    const capacityCharge = monthlyKwh * 0.0455;

    // 3. Network Charge (12.85 sen/kWh)
    const networkCharge = monthlyKwh * 0.1285;

    // 4. Retail Charge (RM10, waived if < 600kWh)
    const retailCharge = monthlyKwh < 600 ? 0 : 10.00;

    const total = energyCharge + capacityCharge + networkCharge + retailCharge;

    // Minimum Charge RM 3.00
    return Math.max(total, 3.00);
}
