import { Header } from "./Header";
import { Hero } from "./Hero";
import { Features } from "./Features";
import { Footer } from "./Footer";

export function LandingPage() {
    return (
        <div className="bg-white dark:bg-slate-950 min-h-screen font-sans selection:bg-indigo-100 selection:text-indigo-700 dark:selection:bg-indigo-900/30 dark:selection:text-indigo-300">
            <Header />
            <main>
                <Hero />
                <Features />
                {/* Helper for sections */}
                <section id="how-it-works" className="py-24 bg-white dark:bg-slate-950">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl lg:text-center mb-16">
                            <h2 className="text-base font-semibold leading-7 text-indigo-600 dark:text-indigo-400">Workflow</h2>
                            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                                How InterviewOS Works
                            </p>
                        </div>

                        <div className="relative">
                            {/* Simple 3 step process */}
                            <div className="grid md:grid-cols-3 gap-8">
                                <div className="relative p-8 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <div className="absolute -top-4 -left-4 w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg rotate-3">1</div>
                                    <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-white mb-2">Write</h3>
                                    <p className="text-slate-600 dark:text-slate-400">Dump your raw thoughts and experiences into our editor without worrying about format.</p>
                                </div>
                                <div className="relative p-8 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <div className="absolute -top-4 -left-4 w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg -rotate-3">2</div>
                                    <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-white mb-2">Refine</h3>
                                    <p className="text-slate-600 dark:text-slate-400">Use our AI tools to structure your stories into the perfect STAR format automatically.</p>
                                </div>
                                <div className="relative p-8 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <div className="absolute -top-4 -left-4 w-12 h-12 bg-pink-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg rotate-3">3</div>
                                    <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-white mb-2">Practice</h3>
                                    <p className="text-slate-600 dark:text-slate-400">Rehearse your stories with our specific interview mode to build confidence.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
