"use client";

import { useState } from "react";
import { FloatingChatButton } from "./FloatingChatButton";
import { AiChatWindow } from "./AiChatWindow";

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <FloatingChatButton isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
            <AiChatWindow isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}
