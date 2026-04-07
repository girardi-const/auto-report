'use client';

import React, { createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import { useTutorial } from '@/hooks/useTutorial';
import TutorialModal from './TutorialModal';

interface TutorialContextType {
    openTutorial: () => void;
    resetTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export function TutorialProvider({ children }: { children: React.ReactNode }) {
    const { isOpen, hydrated, openTutorial, closeTutorial, resetTutorial } = useTutorial();
    const pathname = usePathname();
    const isSignIn = pathname.startsWith('/sign-in');

    return (
        <TutorialContext.Provider value={{ openTutorial, resetTutorial }}>
            {children}
            {hydrated && !isSignIn && <TutorialModal isOpen={isOpen} onClose={closeTutorial} />}
        </TutorialContext.Provider>
    );
}

export function useTutorialContext() {
    const context = useContext(TutorialContext);
    if (!context) {
        throw new Error('useTutorialContext must be used within a TutorialProvider');
    }
    return context;
}
