import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

export function Hero() {
    return (
        <section className="relative overflow-hidden bg-white pt-32 pb-16 dark:bg-slate-950 lg:pt-48 lg:pb-32">
            {/* Background gradients */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-50 opacity-50 blur-[100px] rounded-full dark:bg-indigo-950/30" />
            <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-purple-50 opacity-40 blur-[100px] rounded-full dark:bg-purple-950/20" />

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">

                    <div className="flex flex-col items-start pt-8 text-left lg:pt-0">
                        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/50 px-3 py-1 text-sm font-medium text-indigo-600 dark:border-indigo-900/50 dark:bg-indigo-900/20 dark:text-indigo-400">
                            <Sparkles className="h-4 w-4" />
                            <span>AI-Powered Career Growth</span>
                        </div>

                        <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
                            Master Your <br className="hidden lg:block" />
                            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Interview Stories</span>
                        </h1>

                        <p className="mt-6 text-lg text-slate-600 dark:text-slate-400 sm:text-xl max-w-xl">
                            Organize, refine, and perfect your professional experiences using the STAR method. Let AI help you craft compelling narratives that land your dream job.
                        </p>

                        <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white transition-all bg-slate-900 rounded-xl hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                            >
                                Start for Free
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                            <Link
                                href="#how-it-works"
                                className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-slate-700 transition-all bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-750"
                            >
                                See How It Works
                            </Link>
                        </div>

                        <div className="mt-10 flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-indigo-500" />
                                <span>STAR Method Framework</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-indigo-500" />
                                <span>AI-Driven Feedback</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
                        <div className="relative rounded-2xl bg-slate-900/5 p-2 ring-1 ring-inset ring-slate-900/10 lg:-m-4 lg:rounded-2xl lg:p-4 dark:bg-white/5 dark:ring-white/10">
                            <div className="relative overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-slate-900/10 dark:bg-slate-900 dark:ring-white/10">
                                {/* Placeholder for a dashboard screenshot or UI mock */}
                                <div className="aspect-[4/3] w-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                                    <div className="w-[90%] h-[90%] bg-white dark:bg-slate-950 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 p-6">
                                        <div className="space-y-4">
                                            <div className="h-8 w-1/3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                                            <div className="space-y-2">
                                                <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                                                <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                                                <div className="h-4 w-4/6 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                                            </div>
                                            <div className="pt-4 flex gap-3">
                                                <div className="h-20 w-full bg-indigo-50 dark:bg-indigo-900/20 rounded border border-indigo-100 dark:border-indigo-800/50" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
