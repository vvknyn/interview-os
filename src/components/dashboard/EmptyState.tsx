import { Sparkle } from "@phosphor-icons/react";

export function EmptyState() {
    return (
        <div className="text-center py-20 fade-in">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
                <Sparkle size={40} weight="fill" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">AI Intelligence Engine</h2>
            <p className="text-gray-500 max-w-md mx-auto">
                Enter any company above. Gemini will analyze it, match multiple stories from your uploaded data, and generate live interview prep assets.
            </p>
        </div>
    );
}
