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
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
            {/* Top Right Actions */}
            <div className="absolute top-4 right-4 flex items-center gap-1">
                <Link href="/settings">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-foreground transition-colors"
                        title="Settings"
                    >
                        <Gear size={18} weight="regular" />
                    </Button>
                </Link>
                <form action={signOut}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive transition-colors"
                        title="Sign Out"
                    >
                        <SignOut size={18} weight="regular" />
                    </Button>
                </form>
            </div>

            {/* Main Content */}
            <div className="w-full max-w-md -mt-24">
                {/* Title */}
                <div className="mb-16 text-center">
                    <h1 className="text-[56px] font-semibold tracking-tighter leading-none mb-3">
                        InterviewOS
                    </h1>
                    <p className="text-muted-foreground text-base">
                        AI-powered interview preparation
                    </p>
                </div>

                {/* Search Input */}
                <div className="space-y-3">
                    <div className="group">
                        <Input
                            type="text"
                            placeholder="Company name"
                            className="h-12 text-base border-border/50 focus-visible:border-foreground bg-transparent px-4 transition-colors"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                        />
                    </div>

                    {/* Round Selector */}
                    <Select value={round} onValueChange={setRound}>
                        <SelectTrigger className="h-12 border-border/50 focus:border-foreground bg-transparent text-muted-foreground">
                            <SelectValue placeholder="Interview round" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="hr">HR Screening</SelectItem>
                            <SelectItem value="technical">Technical</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="roleplay">Role Play</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Action Button */}
                    <Button
                        onClick={onAnalyze}
                        disabled={isAnalyzing}
                        className="h-12 w-full bg-foreground text-background hover:bg-foreground/90 font-medium transition-all"
                    >
                        {isAnalyzing ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border border-background border-t-transparent rounded-full animate-spin"></div>
                                Analyzing
                            </div>
                        ) : (
                            "Start preparing"
                        )}
                    </Button>
                </div>
            </div>

            {/* Footer hint */}
            <div className="absolute bottom-6 text-muted-foreground text-xs">
                Press <kbd className="px-1.5 py-0.5 border border-border rounded">Enter</kbd> to begin
            </div>
        </div>
    );
}
