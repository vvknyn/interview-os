
import { TailoringRecommendation } from "@/types/resume";
import { AlertTriangle, Info, CheckCircle2, FileText, Briefcase, Sparkles, Target } from "lucide-react";

export const getPriorityIcon = (priority: TailoringRecommendation['priority']) => {
    switch (priority) {
        case 'high':
            return <AlertTriangle className="w-4 h-4 text-red-500" />;
        case 'medium':
            return <Info className="w-4 h-4 text-yellow-500" />;
        case 'low':
            return <CheckCircle2 className="w-4 h-4 text-green-500" />;
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
            return <FileText className="w-3.5 h-3.5" />;
        case 'experience':
            return <Briefcase className="w-3.5 h-3.5" />;
        case 'skills':
            return <Sparkles className="w-3.5 h-3.5" />;
        case 'overall':
            return <Target className="w-3.5 h-3.5" />;
        default:
            return <Info className="w-3.5 h-3.5" />;
    }
};
