import { Brain, MagnifyingGlass, CaretDown, Gear, SignOut } from "@phosphor-icons/react";
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
import { signOut } from "@/actions/auth";

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
        <div className="bg-background min-h-screen flex flex-col items-center justify-center p-4 animate-in fade-in duration-700">

            {/* Top Right Settings */}
            <div className="absolute top-6 right-6 flex items-center gap-2">
                <Link href="/settings">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full w-10 h-10 transition-all"
                        title="Settings"
                    >
                        <Gear size={20} weight="fill" />
                    </Button>
                </Link>
                <form action={signOut}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-full w-10 h-10 transition-all"
                        title="Sign Out"
                    >
                        <SignOut size={20} weight="fill" />
                    </Button>
                </form>
            </div>

            <div className="w-full max-w-xl flex flex-col items-center gap-10 -mt-20">

                {/* Logo Area */}
                <div className="flex flex-col items-center gap-2">
                    <div className="bg-primary text-primary-foreground flex h-12 w-12 items-center justify-center rounded-xl shadow-none mb-4">
                        <Brain size={24} weight="fill" />
                    </div>
                    <h1 className="text-foreground text-4xl font-bold tracking-tight">InterviewOS</h1>
                    <p className="text-muted-foreground text-center text-lg">
                        Master your interview with AI-driven insights.
                    </p>
                </div>

                {/* Search Box Container */}
                <div className="w-full space-y-4">
                    <div className="bg-card border-border hover:border-primary/50 group flex w-full items-center gap-3 rounded-2xl border px-4 py-3 transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                        <MagnifyingGlass size={20} className="text-muted-foreground group-focus-within:text-primary transition-colors" weight="bold" />
                        <Input
                            type="text"
                            placeholder="Target Company (e.g. Google)..."
                            className="text-foreground placeholder:text-muted-foreground flex-1 border-none bg-transparent p-0 text-lg font-medium shadow-none focus-visible:ring-0"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Select value={round} onValueChange={setRound}>
                            <SelectTrigger className="bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/50 col-span-2 h-11 rounded-xl border px-4 text-sm font-medium shadow-none transition-colors">
                                <SelectValue placeholder="Select Round" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="hr">HR Screening</SelectItem>
                                <SelectItem value="technical">Technical Deep Dive</SelectItem>
                                <SelectItem value="manager">Hiring Manager</SelectItem>
                                <SelectItem value="roleplay">Role Play Simulation</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button
                            onClick={onAnalyze}
                            disabled={isAnalyzing}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground h-11 w-full rounded-xl font-semibold shadow-none transition-all"
                        >
                            {isAnalyzing ? (
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                    Thinking
                                </div>
                            ) : (
                                "Start Prep"
                            )}
                        </Button>
                    </div>
                </div>

            </div>

            <div className="absolute bottom-8 text-muted-foreground text-xs font-medium tracking-wide opacity-50">
                PRESS <span className="font-bold">ENTER</span> TO SEARCH
            </div>

        </div>
    );
}
