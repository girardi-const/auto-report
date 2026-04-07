'use client';

import { useState, useEffect, useCallback } from 'react';

const TUTORIAL_KEY = 'girardi_tutorial_seen';

export function useTutorial() {
    const [isOpen, setIsOpen] = useState(false);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setHydrated(true);
        const seen = localStorage.getItem(TUTORIAL_KEY);
        if (!seen) {
            setIsOpen(true);
        }
    }, []);

    const openTutorial = useCallback(() => {
        setIsOpen(true);
    }, []);

    const closeTutorial = useCallback(() => {
        setIsOpen(false);
        localStorage.setItem(TUTORIAL_KEY, 'true');
    }, []);

    const resetTutorial = useCallback(() => {
        localStorage.removeItem(TUTORIAL_KEY);
        setIsOpen(true);
    }, []);

    return { isOpen, hydrated, openTutorial, closeTutorial, resetTutorial };
}
