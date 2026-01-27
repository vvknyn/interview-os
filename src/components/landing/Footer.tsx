import Link from "next/link";
import { Sparkles } from "lucide-react";

export function Footer() {
    return (
        <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
            <div className="mx-auto max-w-7xl overflow-hidden px-6 py-12 sm:py-20 lg:px-8">
                <div className="flex justify-center mb-8">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                            <Sparkles className="h-4 w-4" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                            InterviewOS
                        </span>
                    </Link>
                </div>
                <nav className="-mb-6 columns-2 sm:flex sm:justify-center sm:space-x-12" aria-label="Footer">
                    <div className="pb-6">
                        <Link href="#" className="text-sm leading-6 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                            About
                        </Link>
                    </div>
                    <div className="pb-6">
                        <Link href="#features" className="text-sm leading-6 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                            Features
                        </Link>
                    </div>
                    <div className="pb-6">
                        <Link href="#" className="text-sm leading-6 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                            Privacy
                        </Link>
                    </div>
                    <div className="pb-6">
                        <Link href="#" className="text-sm leading-6 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                            Terms
                        </Link>
                    </div>
                </nav>
                <p className="mt-10 text-center text-xs leading-5 text-slate-500">
                    &copy; {new Date().getFullYear()} InterviewOS. All rights reserved.
                </p>
            </div>
        </footer>
    );
}
