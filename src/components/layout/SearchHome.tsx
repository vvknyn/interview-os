import { Brain, MagnifyingGlass, CaretDown, Gear } from "@phosphor-icons/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { KeyboardEvent } from "react";

interface SearchHomeProps {
    company: string;
    setCompany: (value: string) => void;
    round: string;
    setRound: (value: string) => void;
    onAnalyze: () => void;
    isAnalyzing: boolean;
}

export function SearchHome({
    company,
    setCompany,
    round,
    setRound,
    onAnalyze,
    isAnalyzing
}: SearchHomeProps) {

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            onAnalyze();
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 mesh-gradient-bg animate-in fade-in">

            {/* Top Right Settings */}
            <div className="absolute top-4 right-4 md:top-6 md:right-8">
                <Link href="/settings">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full w-10 h-10 transition-all"
                    >
                        <Gear size={24} weight="fill" />
                    </Button>
                </Link>
            </div>

            <div className="w-full max-w-2xl flex flex-col items-center gap-8 -mt-20">

                {/* Logo Area */}
                <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30 mb-2">
                        <Brain size={48} weight="fill" className="text-white/90" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">Insight</h1>
                </div>

                {/* Search Box Container */}
                <div className="w-full bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow border border-slate-200 p-2 flex items-center gap-2 group focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300">
                    <div className="pl-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                        <MagnifyingGlass size={20} weight="bold" />
                    </div>

                    <Input
                        type="text"
                        placeholder="Target Company (e.g. Google)"
                        className="flex-1 border-none shadow-none focus-visible:ring-0 h-12 text-lg text-slate-700 font-medium placeholder:text-slate-300 bg-transparent px-2"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />

                    <div className="h-8 w-px bg-slate-200 mx-1"></div>

                    <div className="w-48 relative">
                        <Select value={round} onValueChange={setRound}>
                            <SelectTrigger className="w-full border-none shadow-none focus:ring-0 h-12 bg-transparent text-slate-600 font-medium text-sm hover:bg-slate-50 rounded-r-full pr-8">
                                <SelectValue placeholder="Round" />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                    <CaretDown size={14} weight="bold" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="hr">HR Screening</SelectItem>
                                <SelectItem value="technical">Technical Deep Dive</SelectItem>
                                <SelectItem value="manager">Hiring Manager</SelectItem>
                                <SelectItem value="roleplay">Role Play Simulation</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center mt-2">
                    <Button
                        onClick={onAnalyze}
                        disabled={isAnalyzing}
                        className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 h-11 px-8 rounded-md font-medium transition-all shadow-sm"
                    >
                        {isAnalyzing ? "Thinking..." : "Run Analysis"}
                    </Button>
                </div>

            </div>

            {/* Footer / Credits */}
            <div className="absolute bottom-6 text-slate-400 text-xs font-medium tracking-wide">
                Wait, I'm Goated 🐐
            </div>

        </div>
    );
}
