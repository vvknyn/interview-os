
import { TailoringRecommendation } from "@/types/resume";
import { Warning, Info, CheckCircle, FileText, Briefcase, Sparkle, Target } from "@phosphor-icons/react";

export const getPriorityIcon = (priority: TailoringRecommendation['priority']) => {
    switch (priority) {
        case 'high':
            return <Warning size={16} className="text-red-500" />;
        case 'medium':
            return <Info size={16} className="text-yellow-500" />;
        case 'low':
            return <CheckCircle size={16} className="text-green-500" />;
    }
};

export const getPriorityColor = (priority: TailoringRecommendation['priority']) => {
    switch (priority) {
        case 'high':
            return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-800';
        case 'medium':
            return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-200 dark:border-yellow-800';
        case 'low':
            return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-800';
    }
};

export const getCategoryIcon = (category: TailoringRecommendation['category']) => {
    switch (category) {
        case 'summary':
            return <FileText size={14} />;
        case 'experience':
            return <Briefcase size={14} />;
        case 'skills':
            return <Sparkle size={14} />;
        case 'overall':
            return <Target size={14} />;
        default:
            return <Info size={14} />;
    }
};
