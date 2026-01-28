"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { SearchHome } from "@/components/layout/SearchHome";
import { EmptyState } from "./EmptyState";
import { LoadingState } from "./LoadingState";
import { ProgressBar } from "@/components/ui/progress-bar"; // Import ProgressBar
import { CompanyRecon } from "./CompanyRecon";
import { MarketIntel } from "./MarketIntel";
import { MatchSection } from "./MatchSection";
import { QuestionsGrid } from "./QuestionsGrid";
import { ReverseQuestions } from "./ReverseQuestions";
import { ContextModal } from "@/components/modals/ContextModal";


import { CompanyReconData, MatchData, QuestionsData, ReverseQuestionsData, StarStory } from "@/types";
import { fetchRecon, fetchMatch, fetchQuestions, fetchReverse, generateGenericJSON, generateGenericText } from "@/actions/generate-context";
import { saveStories, fetchStories } from "@/actions/save-story";
import { fetchProfile, updateResume } from "@/actions/profile";
import { exportToPDF } from "@/actions/export-pdf";
import { useDebouncedCallback } from "use-debounce";

export function DashboardContainer() {
    // Router and URL params
    const router = useRouter();
    const searchParams = useSearchParams();

    // Global State
    const [company, setCompany] = useState("");
    const [round, setRound] = useState("hr");
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

    // User Data
    const [resume, setResume] = useState("");
    const [stories, setStories] = useState<StarStory[]>([]);
    const [context, setContext] = useState("");

    // Modals
    const [isContextOpen, setIsContextOpen] = useState(false);
    const [isExportingPDF, setIsExportingPDF] = useState(false);

    // Cache helpers
    const getCacheKey = (comp: string, rnd: string) => `interview-os-cache-${comp.toLowerCase()}-${rnd}`;

    const saveToCache = (comp: string, rnd: string, data: any) => {
        try {
            const cacheData = {
                timestamp: Date.now(),
                company: comp,
                round: rnd,
                reconData: data.reconData,
                matchData: data.matchData,
                questionsData: data.questionsData,
                reverseData: data.reverseData
            };
            sessionStorage.setItem(getCacheKey(comp, rnd), JSON.stringify(cacheData));
        } catch (e) {
            console.error("Failed to save to cache:", e);
        }
    };

    const loadFromCache = (comp: string, rnd: string) => {
        try {
            const cached = sessionStorage.getItem(getCacheKey(comp, rnd));
            if (!cached) return null;

            const cacheData = JSON.parse(cached);
            // Cache expires after 1 hour
            if (Date.now() - cacheData.timestamp > 60 * 60 * 1000) {
                sessionStorage.removeItem(getCacheKey(comp, rnd));
                return null;
            }
            return cacheData;
        } catch (e) {
            console.error("Failed to load from cache:", e);
            return null;
        }
    };


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

            // Load Resume
            const { data: profileData } = await fetchProfile();
            if (profileData && profileData.resume_text) {
                setResume(profileData.resume_text);
            }

            // Restore state from URL
            const urlCompany = searchParams.get('company');
            const urlRound = searchParams.get('round');
            const urlSearched = searchParams.get('searched');

            if (urlCompany && urlRound && urlSearched === 'true') {
                setCompany(urlCompany);
                setRound(urlRound);
                setHasSearched(true);

                // Try to load from cache
                const cached = loadFromCache(urlCompany, urlRound);
                if (cached) {
                    setReconData(cached.reconData);
                    setMatchData(cached.matchData);
                    setQuestionsData(cached.questionsData);
                    setReverseData(cached.reverseData);
                    setViewState("dashboard");
                }
            }
        };
        loadData();
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

    const getFullContext = () => `
    RESUME SUMMARY:
    ${resume}
    
    ADDITIONAL STORIES / CONTEXT (USER EDITABLE):
    ${getStoriesContext()}
  `;

    const handleAnalyze = async () => {
        if (!company) return;

        // Check cache first
        const cached = loadFromCache(company, round);
        if (cached) {
            setReconData(cached.reconData);
            setMatchData(cached.matchData);
            setQuestionsData(cached.questionsData);
            setReverseData(cached.reverseData);
            setHasSearched(true);
            setViewState("dashboard");

            // Update URL
            const params = new URLSearchParams();
            params.set('company', company);
            params.set('round', round);
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
            setLoadingText(`Analyzing ${company}...`);
            setProgress(10);
            const reconRes = await fetchRecon(company);
            if (reconRes.error) throw new Error(reconRes.error);
            if (reconRes.data) setReconData(reconRes.data);
            setProgress(30);

            // Step 2: Match (50%)
            setLoadingText("Matching your profile...");
            const matchRes = await fetchMatch(company, round, resume, storiesText);
            if (matchRes.error) throw new Error(matchRes.error);
            if (matchRes.data) setMatchData(matchRes.data);
            setProgress(60);

            // Step 3: Questions (75%)
            setLoadingText("Generating interview questions...");
            const qsRes = await fetchQuestions(company, round);
            if (qsRes.error) throw new Error(qsRes.error);
            if (qsRes.data) setQuestionsData(qsRes.data);
            setProgress(85);

            // Step 4: Reverse (100%)
            setLoadingText("Finalizing strategy...");
            const revRes = await fetchReverse(company, round, resume, storiesText);
            if (revRes.error) throw new Error(revRes.error);
            if (revRes.data) setReverseData(revRes.data);
            setProgress(100);

            // Save to cache
            saveToCache(company, round, {
                reconData: reconRes.data,
                matchData: matchRes.data,
                questionsData: qsRes.data,
                reverseData: revRes.data
            });

            // Update URL
            const params = new URLSearchParams();
            params.set('company', company);
            params.set('round', round);
            params.set('searched', 'true');
            router.push(`/dashboard?${params.toString()}`);

            await new Promise(r => setTimeout(r, 500)); // Small pause to show 100%
            setViewState("dashboard");

        } catch (e: any) {
            console.error(e);
            setError(e.message || "Analysis failed due to an unexpected error.");
            setViewState("error");
        } finally {
            setLoading(false);
        }
    };

    const handleRoundChange = async (newRound: string) => {
        setRound(newRound);
        if (viewState !== "dashboard") return;

        // Partial Update
        setLoading(true);
        // Ideally user UI would show a small spinner, but we'll use global loading for simplicity or just blocking
        // For now blocking overlay
        const prevText = loadingText;
        setLoadingText(`Re-calibrating for ${newRound.toUpperCase()} round...`);
        setViewState("loading"); // Optional: switch back to full loading or keep dashboard visible with overlay

        const storiesText = getStoriesContext();

        const promptMatch = `
        I am Vivek.
        Full Context: ${getFullContext()}
        Target: ${company}. Interview Round: ${newRound}.
        Task: Identify up to 5 relevant professional experiences (companies or roles) from the Resume Context that are best suited for this specific interview round.
        IMPORTANT: Write the "reasoning" as a VERBATIM spoken script in the FIRST PERSON. Do not list stats immediately. Start with a professional summary, then weave in the Selected Experiences naturally. This is the exact text the candidate will say when asked 'Tell me about yourself'.
        Return JSON: { "matched_entities": ["Experience1", "Experience2"], "headline": "Headline", "reasoning": "Reasoning (markdown, verbatim script)" }
    `;

        const promptQuestions = `
        Target: ${company}. Round: ${newRound}.
        Generate 20 specific interview questions.
        Return JSON: { "questions": ["Q1", "Q2", ... "Q20"] }
    `;

        const promptReverse = `
        Target: ${company}. Round: ${newRound}.
        Candidate Profile: ${getFullContext()}
        Generate 5 strategic, high-level questions for the candidate to ask the interviewer at the end.
        Tailor these questions based on the candidate's background (Resume Context) and the specific interview round.
        Focus on growth, challenges, and culture.
        Return JSON: { "reverse_questions": ["Q1", "Q2", "Q3", "Q4", "Q5"] }
    `;

        try {
            const [match, qs, rev] = await Promise.all([
                generateGenericJSON(promptMatch),
                generateGenericJSON(promptQuestions),
                generateGenericJSON(promptReverse)
            ]);

            if (match) setMatchData(match);
            if (qs) setQuestionsData(qs);
            if (rev) setReverseData(rev);

            setViewState("dashboard");
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setLoadingText(prevText);
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
        Context: Vivek is interviewing at ${company} for a ${round} round.
        Selected Experiences: ${entitiesStr}
        Full Resume & Data: ${getFullContext()}
        
        Task: Write a short headline and detailed reasoning explaining why specifically the Selected Experiences (${entitiesStr}) make him a great fit for this role/company.
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

    const handleGenerateStrategy = async (index: number, question: string) => {
        const prompt = `
        Context: Vivek is interviewing at ${company}.
        Question: "${question}"
        Full Resume & Data: ${getFullContext()}
        Task: Select the best story from the Resume Context that answers this specific question.
        
        CRITICAL INSTRUCTION: You MUST find a connection, even if it is distant or abstract.
        - NEVER say "there isn't a direct story" or "no specific experience".
        - If no direct match exists, pivot to a related soft skill (e.g., adaptability, problem-solving, rapid learning) from the resume and frame it as the answer.
        - Be creative and persuasive. Your goal is to help Vivek answer this question using *something* from his background.

        If there is a matching STAR script in the JSON data, USE IT verbatim as the answer.
        
        Write a short STAR method outline. Format: Use HTML <strong> tags for the S/T/A/R headers.
    `;
        return generateGenericText(prompt);
    };

    const handleRegenerateQuestions = async () => {
        if (!questionsData) return;
        // Ideally show loading state in QuestionsGrid
        const contextInjection = context ? `IMPORTANT - TAILOR QUESTIONS USING THIS CONTEXT: "${context}".` : "";
        const promptQuestions = `
        Target: ${company}. Round: ${round}.
        ${contextInjection}
        Generate 20 specific interview questions.
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
        Target: ${company}. Round: ${round}.
        Candidate Profile: ${getFullContext()}
        Generate 5 strategic, high-level questions for the candidate to ask the interviewer at the end.
        Tailor these questions based on the candidate's background (Resume Context) and the specific interview round.
        Focus on growth, challenges, and culture.
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
        } catch (error: any) {
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
        setError(null);
        setLoading(false);
        setProgress(0);
        setLoadingText("");

        // Clear URL params
        router.push('/dashboard');
    };

    if (!hasSearched) {
        return (
            <>
                <SearchHome
                    company={company}
                    setCompany={setCompany}
                    round={round}
                    setRound={setRound}
                    onAnalyze={handleAnalyze}

                    isAnalyzing={loading}
                />
                <ContextModal
                    isOpen={isContextOpen}
                    onClose={() => setIsContextOpen(false)}
                    context={context}
                    setContext={setContext}
                    onSave={handleSaveContext}
                />


            </>
        );
    }

    return (
        <div className="bg-background min-h-screen flex flex-col font-sans text-foreground">
            <Header
                company={company}
                setCompany={setCompany}
                round={round}
                setRound={handleRoundChange}
                onAnalyze={handleAnalyze}
                isAnalyzing={loading}
                onExportPDF={viewState === "dashboard" ? handleExportPDF : undefined}
                isExportingPDF={isExportingPDF}
                onReset={handleReset}
            />

            <main className="flex-1 w-full p-4 md:p-6">
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
                    <div className="mx-auto max-w-3xl space-y-16 py-8 animate-in fade-in duration-500">
                        {/* Company Recon */}
                        {reconData && <CompanyRecon data={reconData} />}

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
                                onTweak={() => setIsContextOpen(true)}
                                onGenerateStrategy={handleGenerateStrategy}
                            />
                        )}

                        {/* Reverse Questions */}
                        {reverseData && (
                            <ReverseQuestions
                                questions={reverseData.reverse_questions}
                                onRegenerate={handleRegenerateReverse}
                            />
                        )}
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


        </div>
    );
}
