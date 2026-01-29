import { Sparkle } from "@phosphor-icons/react";

export function EmptyState() {
    return (
        <div className="text-center py-20 fade-in">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
                <Sparkle size={40} weight="fill" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Ready to prepare?</h2>
            <p className="text-gray-500 max-w-md mx-auto">
                Search for any company and role above. Get personalized interview strategies, questions, and insights tailored to your background.
            </p>
        </div>
    );
}
