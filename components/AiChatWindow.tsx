"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Bot, X, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { chatWithGemini } from "@/app/actions/chat";
import { useEnergyData } from "@/hooks/useEnergyData";
import { useDashboard } from "@/contexts/DashboardContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
    id: string;
    role: "user" | "ai";
    content: string;
}

interface AiChatWindowProps {
    isOpen: boolean;
    onClose: () => void;
}

const INITIAL_MESSAGES: Message[] = [
    {
        id: "1",
        role: "ai",
        content: "Hello! I'm your AI assistant. How can I help you today?",
    },
];

export function AiChatWindow({ isOpen, onClose }: AiChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { dashboardData, predictionData } = useDashboard();
    const { stats } = useEnergyData(); // Keep as fallback/supplementary
    const pathname = usePathname();

    const getPageContext = (path: string) => {
        switch (path) {
            case "/":
                return "CURRENT PAGE: Home/Landing Page. The user is on the main introduction page of Jimat AI. They can navigate to Dashboard or Predict features.\n";
            case "/dashboard":
                return "CURRENT PAGE: Dashboard. The user is viewing their energy consumption overview, bill analysis, and historical usage charts.\n";
            case "/predict":
                return "CURRENT PAGE: Prediction. The user is using the AI forecasting tool to predict future usage and simulate solar panel savings.\n";
            default:
                return `CURRENT PAGE: ${path}. The user is browsing this specific section.\n`;
        }
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: inputValue,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputValue("");
        setIsLoading(true);

        try {
            let context = "You are an AI assistant for the Jimat AI. Your role is to analyze the energy data and help users understand their consumption patterns. \n\n";
            context += "CRITICAL INSTRUCTIONS:\n";
            context += "1. Answer questions ONLY related to the provided website data.\n";
            context += "2. You are ENCOURAGED to provide actionable improvement suggestions and energy-saving tips based on the data trends.\n";
            context += "3. If the user asks about something unrelated to energy or the dashboard, politely decline.\n\n";
            context += "4. All currency values are in Malaysian Ringgit (RM).\n";
            context += "5. FORMATTING: Use Markdown to make responses visually appealing. Use bullet points for lists, **bold** for key numbers, and separate sections with newlines. Avoid long paragraphs.\n\n";

            // Inject Page Context
            context += `=== CONTEXT ===\n`;
            context += getPageContext(pathname);
            context += `\n`;

            if (dashboardData) {
                context += `=== CURRENT BILL ANALYSIS ===\n`;
                context += `Billing Period: ${dashboardData.billSummary.billingPeriod}\n`;
                context += `Total Amount: RM ${dashboardData.billSummary.totalAmount.toFixed(2)}\n`;

                context += `\nMetrics:\n`;
                context += `- Average Usage: ${dashboardData.metrics.averageUsage} kWh\n`;
                context += `- Daily Usage: ${dashboardData.metrics.dailyUsage} kWh\n`;
                context += `- Generation Cost: RM ${dashboardData.metrics.generationCost}/kWh\n`;

                context += `\nCost Breakdown:\n`;
                dashboardData.costBreakdown.forEach(item => {
                    context += `- ${item.name}: RM ${Math.abs(item.value).toFixed(2)}\n`;
                });

                context += `\nUsage History (Last 6 Months):\n`;
                dashboardData.usageHistory.forEach(item => {
                    context += `- ${item.month}: ${item.usage} kWh (RM ${item.cost})\n`;
                });
                context += `\n`;
            }

            if (predictionData) {
                context += `=== AI PREDICTION ===\n`;
                if (predictionData.mode === 'solar') {
                    context += `Mode: Solar Analysis\n`;
                    context += `Predicted Consumption: ${predictionData.consumption} kWh\n`;
                    context += `Solar Generation: ${predictionData.generation} kWh\n`;
                    context += `Net Energy: ${predictionData.net_energy} kWh\n`;
                    context += `Bill Impact: ${predictionData.net_energy && predictionData.net_energy > 0 ? "Profit" : "Cost"} of RM ${Math.abs(predictionData.bill_impact || 0).toFixed(2)}\n`;
                    if (predictionData.net_energy && predictionData.net_energy > 0) {
                        context += `Status: Eco-Friendly (Surplus Generation)\n`;
                    } else {
                        context += `Status: Energy Deficit\n`;
                    }
                } else {
                    context += `Mode: Standard Prediction\n`;
                    context += `Predicted Consumption: ${predictionData.prediction.toFixed(2)} kWh\n`;
                    context += `Status: ${predictionData.status}\n`;
                    context += `Safe Threshold: ${predictionData.threshold} kWh\n`;
                    if (predictionData.prediction > predictionData.threshold) {
                        context += `ALERT: Usage is predicted to exceed the safe threshold.\n`;
                    }
                }
                // Add Estimated Bill & Smart Advice
                if (predictionData.bill) {
                    context += `=== ESTIMATED BILL & ADVICE ===\n`;
                    context += `Estimated Monthly Bill: RM ${predictionData.bill.toFixed(2)}\n`;
                    context += `Estimated Monthly Usage: ${(predictionData.monthly_kwh || 0).toFixed(0)} kWh\n`;

                    if (predictionData.suggestions && predictionData.suggestions.length > 0) {
                        context += `Smart Suggestions:\n`;
                        predictionData.suggestions.forEach(suggestion => {
                            context += `- ${suggestion}\n`;
                        });
                    }
                }
                context += `\n`;
            }

            if (!dashboardData && !predictionData && stats) {
                context += `=== GENERAL HOUSEHOLD STATS (Fallback) ===\n`;
                context += `- Total Consumption: ${stats.totalConsumption} kWh\n`;
                context += `- Avg Daily Usage: ${stats.avgDailyConsumption} kWh\n`;
                context += `- AC Adoption Rate: ${stats.acAdoptionRate}%\n\n`;
            } else if (!dashboardData && !predictionData && !stats) {
                context += "No specific dashboard data is currently loaded. Ask the user to upload a bill or run a prediction.\n";
            }

            const result = await chatWithGemini(userMessage.content, context);

            if (!result.success) {
                throw new Error(result.error);
            }

            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                role: "ai",
                content: result.data || "I couldn't generate a response.",
            };
            setMessages((prev) => [...prev, aiResponse]);
        } catch (error: any) {
            console.error("Failed to generate content:", error);
            const errorResponse: Message = {
                id: (Date.now() + 1).toString(),
                role: "ai",
                content: error.message || "Sorry, I encountered an error. Please try again.",
            };
            setMessages((prev) => [...prev, errorResponse]);
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    // Clear Chat History
    const handleClearChat = () => {
        setMessages(INITIAL_MESSAGES);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="fixed bottom-24 right-4 md:right-6 z-50 w-[90vw] md:w-[380px] h-[60vh] md:h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100 bg-primary/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Bot className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm text-gray-900">AI Assistant</h3>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                    Online
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                onClick={handleClearChat}
                                title="Clear Chat History"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600" onClick={onClose}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
                        <div className="space-y-4">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : "flex-row"
                                        }`}
                                >
                                    {message.role === "ai" && (
                                        <Avatar className="w-8 h-8 border border-gray-100">
                                            <AvatarImage src="/bot-avatar.png" />
                                            <AvatarFallback className="bg-primary/10 text-primary text-xs">AI</AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div
                                        className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-sm ${message.role === "user"
                                            ? "bg-primary text-primary-foreground rounded-tr-none"
                                            : "bg-white border border-gray-100 text-gray-800 rounded-tl-none"
                                            }`}
                                    >
                                        {message.role === "ai" ? (
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    h1: ({ ...props }) => <h1 className="text-lg font-bold mt-4 mb-2 text-primary" {...props} />,
                                                    h2: ({ ...props }) => <h2 className="text-base font-bold mt-3 mb-2 text-gray-900" {...props} />,
                                                    h3: ({ ...props }) => <h3 className="text-sm font-bold mt-2 mb-1 text-gray-800" {...props} />,
                                                    p: ({ ...props }) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                                                    ul: ({ ...props }) => <ul className="list-disc list-outside ml-4 mb-2 space-y-1" {...props} />,
                                                    ol: ({ ...props }) => <ol className="list-decimal list-outside ml-4 mb-2 space-y-1" {...props} />,
                                                    li: ({ ...props }) => <li className="pl-1" {...props} />,
                                                    strong: ({ ...props }) => <span className="font-bold text-primary/90" {...props} />,
                                                    blockquote: ({ ...props }) => <blockquote className="border-l-4 border-primary/20 pl-3 italic my-2 text-gray-600" {...props} />,
                                                    code: ({ ...props }) => <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-pink-600" {...props} />,
                                                }}
                                            >
                                                {message.content}
                                            </ReactMarkdown>
                                        ) : (
                                            message.content
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-3 flex-row">
                                    <Avatar className="w-8 h-8 border border-gray-100">
                                        <AvatarImage src="/bot-avatar.png" />
                                        <AvatarFallback className="bg-primary/10 text-primary text-xs">AI</AvatarFallback>
                                    </Avatar>
                                    <div className="bg-white border border-gray-100 text-gray-800 rounded-tl-none p-4 rounded-2xl text-sm shadow-sm flex items-center gap-2">
                                        <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                                        <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                                        <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-gray-100 bg-white">
                        <form onSubmit={handleSendMessage} className="flex gap-2">
                            <Input
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 bg-gray-50 border-gray-200 focus-visible:ring-primary"
                                disabled={isLoading}
                            />
                            <Button type="submit" size="icon" disabled={!inputValue.trim() || isLoading} className="shrink-0">
                                <Send className="w-4 h-4" />
                            </Button>
                        </form>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
