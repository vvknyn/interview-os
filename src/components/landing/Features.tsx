import { BrainCircuit, Keyboard, LineChart, MessageSquareText, Shield, Sparkles } from "lucide-react";

const features = [
    {
        name: "AI-Powered Story Refinement",
        description: "Our advanced AI analyzes your experiences and helps you structure them into perfect STAR stories.",
        icon: Sparkles,
    },
    {
        name: "STAR Method Framework",
        description: "Built-in templates guide you through the Situation, Task, Action, and Result methodology.",
        icon: BrainCircuit,
    },
    {
        name: "Live Interview Mode",
        description: "Practice answering questions in real-time with our distraction-free interview interface.",
        icon: MessageSquareText,
    },
    {
        name: "Performance Analytics",
        description: "Track your progress and identify areas for improvement with detailed insights.",
        icon: LineChart,
    },
    {
        name: "Secure & Private",
        description: "Your career stories are your intellectual property. We keep them encrypted and private.",
        icon: Shield,
    },
    {
        name: "Keyboard First",
        description: "Navigate your entire interview preparation workflow without leaving your keyboard.",
        icon: Keyboard,
    },
];

export function Features() {
    return (
        <section id="features" className="py-24 bg-slate-50 dark:bg-slate-900/50">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl lg:text-center">
                    <h2 className="text-base font-semibold leading-7 text-indigo-600 dark:text-indigo-400">Faster Preparation</h2>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                        Everything you need to ace the interview
                    </p>
                    <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-400">
                        InterviewOS provides a comprehensive suite of tools designed to help you organize your thoughts, refine your stories, and present your best self.
                    </p>
                </div>
                <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                    <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                        {features.map((feature) => (
                            <div key={feature.name} className="flex flex-col">
                                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-slate-900 dark:text-white">
                                    <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-indigo-600">
                                        <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    {feature.name}
                                </dt>
                                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600 dark:text-slate-400">
                                    <p className="flex-auto">{feature.description}</p>
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </div>
        </section>
    );
}
