/**
 * In-memory registry of AbortControllers for active imports.
 * Allows the cancel endpoint to signal a running processImport to stop.
 */

const controllers = new Map<string, AbortController>();

/** Register a new import and return its AbortController. */
export function registerImport(importId: string): AbortController {
    const ac = new AbortController();
    controllers.set(importId, ac);
    return ac;
}

/** Abort a running import. Returns true if the import was found and aborted. */
export function cancelImport(importId: string): boolean {
    const ac = controllers.get(importId);
    if (!ac) return false;
    ac.abort();
    controllers.delete(importId);
    return true;
}

/** Remove the controller after normal completion (no abort). */
export function unregisterImport(importId: string): void {
    controllers.delete(importId);
}
