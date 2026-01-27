interface LoadingStateProps {
    message: string;
}

export function LoadingState({ message }: LoadingStateProps) {
    return (
        <div className="text-center py-20 fade-in">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Gemini is Thinking...</h2>
            <p className="text-gray-500" id="loading-text">{message}</p>
        </div>
    );
}
