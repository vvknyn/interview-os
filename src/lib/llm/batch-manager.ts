/**
 * Intelligent Gemini API Request Batching Manager
 * 
 * Problem: Multiple concurrent LLM calls create excessive quota usage
 * Solution: Batch concurrent requests into a single LLM call with structured output
 * 
 * Example: If 3 components request generation simultaneously:
 * - WITHOUT batching: 3 separate API calls
 * - WITH batching: 1 API call with all 3 requests, parse response into 3 parts
 */

interface PendingRequest {
    id: string;
    prompt: string;
    resolve: (response: string) => void;
    reject: (error: Error) => void;
    timestamp: number;
}

class GeminiBatchManager {
    private queue: PendingRequest[] = [];
    private batchTimer: NodeJS.Timeout | null = null;
    private readonly BATCH_DELAY_MS = 100; // Wait 100ms to collect requests
    private readonly MAX_BATCH_SIZE = 5; // Max requests per batch
    private executeCallback: ((requests: PendingRequest[]) => Promise<void>) | null = null;

    /**
     * Set the execution callback that will handle the batched requests
     */
    setExecutor(executor: (requests: PendingRequest[]) => Promise<void>) {
        this.executeCallback = executor;
    }

    /**
     * Add a request to the batch queue
     * Returns a promise that resolves when the request is processed
     */
    async add(prompt: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const request: PendingRequest = {
                id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                prompt,
                resolve,
                reject,
                timestamp: Date.now()
            };

            this.queue.push(request);

            // If queue is full, execute immediately
            if (this.queue.length >= this.MAX_BATCH_SIZE) {
                this.executeBatch();
            } else if (!this.batchTimer) {
                // Otherwise, schedule batch execution
                this.batchTimer = setTimeout(() => this.executeBatch(), this.BATCH_DELAY_MS);
            }
        });
    }

    /**
     * Execute the current batch
     */
    private async executeBatch() {
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
            this.batchTimer = null;
        }

        if (this.queue.length === 0) return;

        const batch = this.queue.splice(0, this.MAX_BATCH_SIZE);

        if (!this.executeCallback) {
            // Fallback: execute individually if no batch executor is set
            console.warn("[GeminiBatchManager] No executor set, falling back to individual execution");
            batch.forEach(req => req.reject(new Error("No batch executor configured")));
            return;
        }

        try {
            await this.executeCallback(batch);
        } catch (error) {
            console.error("[GeminiBatchManager] Batch execution failed:", error);
            batch.forEach(req => req.reject(error as Error));
        }
    }

    /**
     * Get the current queue size
     */
    getQueueSize(): number {
        return this.queue.length;
    }
}

// Singleton instance
export const geminiBatchManager = new GeminiBatchManager();
