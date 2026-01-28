"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Gear, SignOut, MagnifyingGlass, WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { EmptyState } from "./EmptyState";
import { LoadingState } from "./LoadingState";
import { ProgressBar } from "@/components/ui/progress-bar";
import { CompanyRecon } from "./CompanyRecon";
import { MatchSection } from "./MatchSection";
import { QuestionsGrid } from "./QuestionsGrid";
import { ReverseQuestions } from "./ReverseQuestions";
import { Input } from "@/components/ui/input";
import { ContextModal } from "@/components/modals/ContextModal";
import { signOut } from "@/actions/auth";

import { CompanyReconData, MatchData, QuestionsData, ReverseQuestionsData, StarStory, SourceItem, TechnicalData, CodingChallenge } from "@/types";
import { fetchRecon, fetchMatch, fetchQuestions, fetchReverse, generateGenericJSON, generateGenericText, fetchTechnicalQuestions, fetchCodingChallenge, explainTechnicalConcept } from "@/actions/generate-context";
import { KnowledgeSection } from "@/components/dashboard/KnowledgeSection";
import { CodingWorkspace } from "@/components/dashboard/CodingWorkspace";
import { OnboardingWizard } from "@/components/dashboard/OnboardingWizard";
import { saveStories, fetchStories } from "@/actions/save-story";
import { fetchSources } from "@/actions/sources";
import { fetchProfile, updateResume } from "@/actions/profile";
import { exportToPDF } from "@/actions/export-pdf";
import { parseSearchQuery } from "@/actions/search";
import { useDebouncedCallback } from "use-debounce";

export function DashboardContainer() {
    // Router and URL params
    const router = useRouter();
    const searchParams = useSearchParams();

    // Global State - Single search query
    const [searchQuery, setSearchQuery] = useState("");
    const [searchError, setSearchError] = useState<string | null>(null);

    // Parsed values from search query
    const [company, setCompany] = useState("");
    const [position, setPosition] = useState("");
    const [round, setRound] = useState("");

    const [loading, setLoading] = useState(false);
    const [loadingText, setLoadingText] = useState("");
    const [progress, setProgress] = useState(0); // Progress State
    const [viewState, setViewState] = useState<"empty" | "loading" | "dashboard" | "error">("empty");
    const [hasSearched, setHasSearched] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Data State
    const [reconData, setReconData] = useState<CompanyReconData | null>(null);
    const [matchData, setMatchData] = useState<MatchData | null>(null);
    const [questionsData, setQuestionsData] = useState<QuestionsData | null>(null);
    const [reverseData, setReverseData] = useState<ReverseQuestionsData | null>(null);
    const [technicalData, setTechnicalData] = useState<TechnicalData | null>(null);
    const [codingChallenge, setCodingChallenge] = useState<CodingChallenge | null>(null);

    // User Data
    const [resume, setResume] = useState("");
    const [stories, setStories] = useState<StarStory[]>([]);
    const [sources, setSources] = useState<SourceItem[]>([]);
    const [context, setContext] = useState("");

    // Modals
    const [isContextOpen, setIsContextOpen] = useState(false);
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);

    // Cache helpers
    const getCacheKey = (comp: string, pos: string, rnd: string) => `interview-os-cache-${comp.toLowerCase()}-${pos.toLowerCase()}-${rnd.toLowerCase()}`;


    const saveToCache = (comp: string, pos: string, rnd: string, data: { reconData?: CompanyReconData, matchData?: MatchData, questionsData?: QuestionsData, reverseData?: ReverseQuestionsData, technicalData?: TechnicalData, codingChallenge?: CodingChallenge }) => {
        try {
            const cacheData = {
                timestamp: Date.now(),
                company: comp,
                position: pos,
                round: rnd,
                reconData: data.reconData,
                matchData: data.matchData,
                questionsData: data.questionsData,
                reverseData: data.reverseData,
                technicalData: data.technicalData,
                codingChallenge: data.codingChallenge
            };
            sessionStorage.setItem(getCacheKey(comp, pos, rnd), JSON.stringify(cacheData));
        } catch (e) {
            console.error("Failed to save to cache:", e);
        }
    };

    const loadFromCache = (comp: string, pos: string, rnd: string) => {
        try {
            const cached = sessionStorage.getItem(getCacheKey(comp, pos, rnd));
            if (!cached) return null;

            const cacheData = JSON.parse(cached);
            // Cache expires after 1 hour
            if (Date.now() - cacheData.timestamp > 60 * 60 * 1000) {
                sessionStorage.removeItem(getCacheKey(comp, pos, rnd));
                return null;
            }
            return cacheData;
        } catch (e) {
            console.error("Failed to load from cache:", e);
            return null;
        }
    };

    // Parse search query using Server Action
    // Imported from @/actions/search



    // Initial Data Load and URL State Restoration
    useEffect(() => {
        const loadData = async () => {
            // Load Stories
            const { data: storiesData } = await fetchStories();
            if (storiesData) {
                try {
                    const parsed = JSON.parse(storiesData);
                    if (Array.isArray(parsed)) setStories(parsed);
                } catch (e) {
                    console.log("Could not parse stories as JSON.");
                }
            }

            // Load Sources
            const { data: sourcesData } = await fetchSources();
            if (sourcesData) {
                setSources(sourcesData);
            }

            // Load Resume
            const { data: profileData } = await fetchProfile();
            if (profileData && profileData.resume_text) {
                setResume(profileData.resume_text);
            }

            // Check for Onboarding
            // If no resume AND no stories (parsed from earlier), show onboarding
            // Note: stories state update is async, so we use local variable if we want immediate check, 
            // but for simplicity we can check the data we just fetched.
            const hasStories = storiesData && storiesData !== "[]";
            const hasResume = profileData && profileData.resume_text && profileData.resume_text.length > 0;

            if (!hasStories && !hasResume) {
                setShowOnboarding(true);
            }

            // Restore state from URL
            const urlCompany = searchParams.get('company');
            const urlPosition = searchParams.get('position');
            const urlRound = searchParams.get('round');
            const urlSearched = searchParams.get('searched');

            if (urlCompany && urlPosition && urlRound && urlSearched === 'true') {
                setCompany(urlCompany);
                setPosition(urlPosition);
                setRound(urlRound);
                setSearchQuery(`${urlCompany}, ${urlPosition}, ${urlRound}`);
                setHasSearched(true);

                // Try to load from cache
                const cached = loadFromCache(urlCompany, urlPosition, urlRound);
                if (cached) {
                    setReconData(cached.reconData);
                    setMatchData(cached.matchData);
                    setQuestionsData(cached.questionsData);
                    setReverseData(cached.reverseData);
                    setTechnicalData(cached.technicalData);
                    setCodingChallenge(cached.codingChallenge);
                    setViewState("dashboard");
                }
            }
        };
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    // Auto-save Resume with Debounce
    const debouncedSaveResume = useDebouncedCallback(async (text: string) => {
        if (typeof text === 'string') {
            await updateResume(text);
        }
    }, 2000);

    // Watch for resume changes
    useEffect(() => {
        // Skip initial load
        debouncedSaveResume(resume);
    }, [resume, debouncedSaveResume]);

    // Derived: Serialize Stories for Gemini
    const getStoriesContext = () => {
        if (stories.length === 0) return "";
        return stories.map(s => `
            STORY TITLE: ${s.title}
            SITUATION: ${s.situation}
            TASK: ${s.task}
            ACTION: ${s.action}
            RESULT: ${s.result}
        `).join("\n\n");
    };

    const getSourcesContext = () => {
        if (sources.length === 0) return "";
        return sources.map(s => `
            SOURCE (${s.type}): ${s.title}
            CONTENT: ${s.content}
        `).join("\n\n");
    };

    const getFullContext = () => `
    RESUME SUMMARY:
    ${resume}
    
    ADDITIONAL STORIES / CONTEXT (USER EDITABLE):
    ${getStoriesContext()}

    ADDITIONAL SOURCES:
    ${getSourcesContext()}
  `;

    const handleAnalyze = async () => {
        if (!searchQuery.trim()) {
            setSearchError("Please enter company name, position, and interview round.");
            return;
        }

        setSearchError(null);
        setLoading(true);
        setLoadingText("Parsing your query...");

        // Parse the search query using LLM
        const parsed = await parseSearchQuery(searchQuery);

        if (!parsed) {
            setSearchError("Could not understand your query. Please enter in format: Company, Position, Round (e.g., Google, Software Engineer, Technical)");
            setLoading(false);
            return;
        }

        // Update parsed values
        setCompany(parsed.company);
        setPosition(parsed.position);
        setRound(parsed.round);

        // Check cache first
        const cached = loadFromCache(parsed.company, parsed.position, parsed.round);
        if (cached) {
            setReconData(cached.reconData);
            setMatchData(cached.matchData);
            setQuestionsData(cached.questionsData);
            setReverseData(cached.reverseData);
            setTechnicalData(cached.technicalData);
            setCodingChallenge(cached.codingChallenge);
            setHasSearched(true);
            setViewState("dashboard");
            setLoading(false);

            // Update URL
            const params = new URLSearchParams();
            params.set('company', parsed.company);
            params.set('position', parsed.position);
            params.set('round', parsed.round);
            params.set('searched', 'true');
            router.push(`/dashboard?${params.toString()}`);
            return;
        }

        setHasSearched(true);
        setViewState("loading");
        setLoading(true);
        setError(null);
        setProgress(0); // Reset progress

        const storiesText = getStoriesContext();

        try {
            // Step 1: Recon (25%)
            setLoadingText(`Analyzing ${parsed.company}...`);
            setProgress(10);
            const reconRes = await fetchRecon(parsed.company, parsed.position);
            if (reconRes.error) throw new Error(reconRes.error);
            if (reconRes.data) setReconData(reconRes.data);
            setProgress(30);

            // Step 2: Match (50%)
            setLoadingText("Matching your profile...");
            const matchRes = await fetchMatch(parsed.company, parsed.position, parsed.round, resume, storiesText, getSourcesContext());
            if (matchRes.error) throw new Error(matchRes.error);
            if (matchRes.data) setMatchData(matchRes.data);
            setProgress(60);

            // Step 3: Questions (75%)
            setLoadingText("Generating questions...");
            const questionsRes = await fetchQuestions(parsed.company, parsed.position, parsed.round);
            if (questionsRes.error) throw new Error(questionsRes.error);
            if (questionsRes.data) setQuestionsData(questionsRes.data);
            setProgress(85);

            // Step 4: Reverse (100%)
            setLoadingText("Finalizing strategy...");
            const revRes = await fetchReverse(company, position, round, resume, storiesText, getSourcesContext());
            if (revRes.error) throw new Error(revRes.error);
            if (revRes.data) setReverseData(revRes.data);

            // Step 5: Technical Checks (Parallel if Technical/Coding round)
            const isTechnical = /technical|coding|system design|engineer|developer/i.test(round) || /swe|software|engineer|developer/i.test(position);
            if (isTechnical) {
                setLoadingText("Adding technical challenges...");
                const [techRes, codeRes] = await Promise.all([
                    fetchTechnicalQuestions(company, position, round, getSourcesContext()),
                    fetchCodingChallenge(company, position, round)
                ]);

                if (techRes.data) setTechnicalData(techRes.data);
                if (codeRes.data) setCodingChallenge(codeRes.data);
            }

            setProgress(100);

            // Save to cache
            saveToCache(parsed.company, parsed.position, parsed.round, {
                reconData: reconRes.data,
                matchData: matchRes.data,
                questionsData: questionsRes.data,
                reverseData: revRes.data,
                technicalData: technicalData || undefined,
                codingChallenge: codingChallenge || undefined
            });

            // Update URL
            const params = new URLSearchParams();
            params.set('company', parsed.company);
            params.set('position', parsed.position);
            params.set('round', parsed.round);
            params.set('searched', 'true');
            router.push(`/dashboard?${params.toString()}`);

            await new Promise(r => setTimeout(r, 500)); // Small pause to show 100%
            setViewState("dashboard");

        } catch (e: unknown) {
            console.error(e);
            const error = e as Error;
            setError(error.message || "Analysis failed due to an unexpected error.");
            setViewState("error");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateMatches = async (newMatches: string[]) => {
        // Optimistic update
        if (!matchData) return;
        const updatedMatchData = { ...matchData, matched_entities: newMatches };
        setMatchData(updatedMatchData);

        // AI Refresh of text
        const entitiesStr = newMatches.join(", ");
        const prompt = `
        Context: Candidate is interviewing at ${company} for a ${position} role in a ${round} interview.
        Selected Experiences: ${entitiesStr}
        Full Resume & Data: ${getFullContext()}
        
        Task: Write a short headline and detailed reasoning explaining why specifically the Selected Experiences (${entitiesStr}) make them a great fit for the ${position} role at ${company}.
        IMPORTANT: Write the "reasoning" as a VERBATIM spoken script in the FIRST PERSON. Do not list stats immediately. Start with a professional summary, then weave in the Selected Experiences naturally. This is the exact text the candidate will say when asked 'Tell me about yourself'.
        Return JSON: { "headline": "Short punchy headline", "reasoning": "Explanation in markdown (verbatim script)" }
    `;

        // We update text silently or show small loading indicators in component (not impl here yet)
        // For now just await
        const res = await generateGenericJSON(prompt);
        if (res) {
            setMatchData({ ...updatedMatchData, headline: res.headline, reasoning: res.reasoning });
        }
    };

    const handleAddMatch = (match: string) => {
        if (!matchData) return;
        if (matchData.matched_entities.includes(match)) return;
        handleUpdateMatches([...matchData.matched_entities, match]);
    };

    const handleRemoveMatch = (match: string) => {
        if (!matchData) return;
        handleUpdateMatches(matchData.matched_entities.filter(m => m !== match));
    };

    const handleGenerateStrategy = async (index: number, questionItem: any) => {
        // Fallback for types if needed
        const questionText = typeof questionItem === 'string' ? questionItem : questionItem.question;
        const category = typeof questionItem === 'object' ? questionItem.category : 'Behavioral';

        // Behavioral -> STAR Method (Uses Resume)
        if (category === 'Behavioral') {
            const prompt = `
                Context: Candidate is interviewing at ${company} for a ${position} role.
                Question: "${questionText}"
                Full Resume & Data: ${getFullContext()}
                Task: Select the best story from the Resume Context that answers this specific question for a ${position} role.
                
                CRITICAL INSTRUCTION: You MUST find a connection, even if it is distant or abstract.
                - NEVER say "there isn't a direct story" or "no specific experience".
                - If no direct match exists, pivot to a related soft skill (e.g., adaptability, problem-solving, rapid learning) from the resume and frame it as the answer.
                - Be creative and persuasive. Your goal is to help the candidate answer this question using *something* from their background.

                If there is a matching STAR script in the JSON data, USE IT verbatim as the answer.
                
                Write a short STAR method outline. Format: Use HTML <strong> tags for the S/T/A/R headers.
            `;
            return generateGenericText(prompt);
        }

        // Knowledge/Coding/etc -> Direct Answer (No Resume)
        else {
            const prompt = `
                Context: Interview at ${company} for ${position}.
                Question: "${questionText}"
                
                Task: Provide a high-quality, direct answer to this interview question. 
                Do NOT use the candidate's resume or personal stories.
                Provide a factual, technical, or conceptual answer as appropriate.
                
                If it's a Coding question, provide a brief algorithm approach then code snippet.
                If it's a Case Study, provide a structured breakdown.
            `;
            return generateGenericText(prompt);
        }
    };

    const handleRegenerateQuestions = async () => {
        if (!questionsData) return;
        // Ideally show loading state in QuestionsGrid
        const contextInjection = context ? `IMPORTANT - TAILOR QUESTIONS USING THIS CONTEXT: "${context}".` : "";
        const promptQuestions = `
        Target: ${company}. Position: ${position}. Round: ${round}.
        ${contextInjection}
        Generate 20 specific interview questions for a ${position} role at ${company} during a ${round} interview.
        Return JSON: { "questions": ["Q1", "Q2", ... "Q20"] }
    `;
        const res = await generateGenericJSON(promptQuestions);
        if (res) setQuestionsData(res);
    };

    const handleSaveContext = () => {
        setIsContextOpen(false);
        handleRegenerateQuestions();
    };



    const handleRegenerateReverse = async () => {
        const promptReverse = `
        Target: ${company}. Position: ${position}. Round: ${round}.
        Candidate Profile: ${getFullContext()}
        Generate 5 strategic, high-level questions for a ${position} candidate to ask the interviewer at the end of a ${round} interview at ${company}.
        Tailor these questions based on the candidate's background and the specific interview round.
        Focus on growth, challenges, and culture relevant to the ${position} role.
        Return JSON: { "reverse_questions": ["Q1", "Q2", "Q3", "Q4", "Q5"] }
    `;
        const res = await generateGenericJSON(promptReverse);
        if (res) setReverseData(res);
    };

    const handleExportPDF = async () => {
        if (!reconData || !matchData || !questionsData || !reverseData) {
            alert('Please complete the analysis before exporting to PDF.');
            return;
        }

        setIsExportingPDF(true);
        try {
            const result = await exportToPDF({
                company,
                round,
                reconData,
                matchData,
                questionsData,
                reverseData,
                resume,
                stories: getStoriesContext()
            });

            if (result.success && result.pdf) {
                // Create download link
                const link = document.createElement('a');
                link.href = result.pdf;
                link.download = `${company}-${round}-interview-prep.pdf`;
                link.click();
            } else {
                alert(`Failed to export PDF: ${result.error || 'Unknown error'}`);
            }
        } catch (error: unknown) {
            console.error('Export error:', error);
            alert('Failed to export PDF. Please try again.');
        } finally {
            setIsExportingPDF(false);
        }
    };

    const handleReset = () => {
        // Reset all state
        setHasSearched(false);
        setViewState("empty");
        setReconData(null);
        setMatchData(null);
        setQuestionsData(null);
        setReverseData(null);
        setTechnicalData(null);
        setCodingChallenge(null);
        setError(null);
        setLoading(false);
        setProgress(0);
        setLoadingText("");

        // Clear URL params
        router.push('/dashboard');
    };

    if (!hasSearched) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background transition-all duration-500">
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

                {/* Main Content - Centered Search */}
                <div className={`w-full max-w-2xl transition-all duration-500 ${loading ? 'opacity-50' : ''}`}>
                    {/* Title */}
                    <div className="mb-12 text-center">
                        <h1 className="text-[56px] font-semibold tracking-tighter leading-none mb-3">
                            InterviewOS
                        </h1>
                        <p className="text-muted-foreground text-base">
                            AI-powered interview preparation
                        </p>
                    </div>

                    <div className="group relative">
                        <MagnifyingGlass
                            size={20}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                            weight="regular"
                        />
                        <Input
                            type="text"
                            placeholder="e.g. Google, Software Engineer, Technical Round"
                            className="h-14 text-base border-border/50 focus-visible:border-foreground bg-transparent pl-12 pr-4 transition-colors"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                            autoFocus
                            disabled={loading}
                        />
                    </div>
                    <p className="text-muted-foreground text-xs px-1">
                        Enter company name, position, and interview round — the AI will understand natural language
                    </p>

                    {/* Error Message */}
                    {searchError && (
                        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                            <WarningCircle size={18} weight="fill" />
                            <span>{searchError}</span>
                        </div>
                    )}

                    {/* Action Button */}
                    <Button
                        onClick={handleAnalyze}
                        disabled={loading}
                        className="h-12 w-full bg-foreground text-background hover:bg-foreground/90 font-medium transition-all"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border border-background border-t-transparent rounded-full animate-spin"></div>
                                {loadingText || "Analyzing..."}
                            </div>
                        ) : (
                            "Start preparing"
                        )}
                    </Button>
                </div>


                {/* Footer hint */}
                <div className="absolute bottom-6 text-muted-foreground text-xs">
                    Press <kbd className="px-1.5 py-0.5 border border-border rounded">Enter</kbd> to begin
                </div>

                <ContextModal
                    isOpen={isContextOpen}
                    onClose={() => setIsContextOpen(false)}
                    context={context}
                    setContext={setContext}
                    onSave={handleSaveContext}
                />
            </div >
        );
    }

    return (
        <div className="bg-background min-h-screen flex flex-col font-sans text-foreground">
            <Header
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onAnalyze={handleAnalyze}
                isAnalyzing={loading}
                onExportPDF={viewState === "dashboard" ? handleExportPDF : undefined}
                isExportingPDF={isExportingPDF}
                onReset={handleReset}
                error={searchError}
                company={company}
                position={position}
                round={round}
            />

            <main className="flex-1 w-full">
                {viewState === "empty" && <EmptyState />}
                {viewState === "loading" && (
                    <div className="flex flex-col items-center justify-center space-y-6 py-20 animate-in fade-in">
                        <LoadingState message={loadingText} />
                        <div className="w-full max-w-sm">
                            <ProgressBar progress={progress} />
                        </div>
                    </div>
                )}
                {viewState === "error" && (
                    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
                        <div className="border border-destructive/20 bg-destructive/5 text-destructive px-6 py-4 rounded-lg max-w-md w-full text-center">
                            <h3 className="font-semibold text-base mb-2">Analysis Error</h3>
                            <p className="text-sm opacity-90">{error || "Something went wrong."}</p>
                            <Button variant="outline" className="mt-4 bg-background hover:bg-destructive/5 border-destructive/20" onClick={() => setViewState("empty")}>Try Again</Button>
                        </div>
                    </div>
                )}

                {viewState === "dashboard" && (
                    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 animate-in fade-in duration-500">
                        {/* Two-Column Layout */}
                        <div className="flex flex-col lg:flex-row gap-8">
                            {/* Left Column - Interview Content */}
                            <div className="flex-1 min-w-0 space-y-12">
                                {/* Match Section */}
                                {matchData && (
                                    <MatchSection
                                        data={matchData}
                                        onAddMatch={handleAddMatch}
                                        onRemoveMatch={handleRemoveMatch}
                                    />
                                )}

                                {/* Questions */}
                                {questionsData && (
                                    <QuestionsGrid
                                        questions={questionsData.questions}
                                        onRegenerate={handleRegenerateQuestions}
                                        onGenerateStrategy={handleGenerateStrategy}
                                    />
                                )}

                                {/* Technical Knowledge Section */}
                                {technicalData && (
                                    <KnowledgeSection
                                        data={technicalData}
                                        onExplain={async (q) => {
                                            return await explainTechnicalConcept(q);
                                        }}
                                    />
                                )}

                                {/* Coding Live Workspace */}
                                {codingChallenge && (
                                    <CodingWorkspace challenge={codingChallenge} />
                                )}

                                {/* Reverse Questions */}
                                {reverseData && (
                                    <ReverseQuestions
                                        questions={reverseData.reverse_questions}
                                        onRegenerate={handleRegenerateReverse}
                                    />
                                )}
                            </div>

                            {/* Right Column - Company Info (Sticky) */}
                            <div className="lg:w-80 xl:w-96 shrink-0">
                                <div className="lg:sticky lg:top-20">
                                    {reconData && <CompanyRecon data={reconData} />}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <ContextModal
                isOpen={isContextOpen}
                onClose={() => setIsContextOpen(false)}
                context={context}
                setContext={setContext}
                onSave={handleSaveContext}
            />

            <OnboardingWizard
                isOpen={showOnboarding}
                onComplete={() => setShowOnboarding(false)}
            />

        </div>
    );
}
