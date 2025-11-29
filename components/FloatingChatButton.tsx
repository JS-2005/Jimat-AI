"use client";

import { Button } from "@/components/ui/button";
import { MessageCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FloatingChatButtonProps {
    onClick: () => void;
    isOpen: boolean;
}

export function FloatingChatButton({ onClick, isOpen }: FloatingChatButtonProps) {
    return (
        <div className="fixed bottom-6 right-6 z-50">
            <AnimatePresence mode="wait">
                <motion.div
                    key={isOpen ? "close" : "open"}
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                >
                    <Button
                        onClick={onClick}
                        size="icon"
                        className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-white"
                    >
                        {isOpen ? (
                            <X className="h-6 w-6" />
                        ) : (
                            <MessageCircle className="h-6 w-6" />
                        )}
                    </Button>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
