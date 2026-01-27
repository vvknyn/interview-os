"use client";

import { useState, useEffect } from "react";
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
import { DataModal } from "@/components/modals/DataModal";

import { CompanyReconData, MatchData, QuestionsData, ReverseQuestionsData, StarStory } from "@/types";
import { fetchRecon, fetchMatch, fetchQuestions, fetchReverse, generateGenericJSON, generateGenericText } from "@/actions/generate-context"; // Updated imports
import { saveStories, fetchStories } from "@/actions/save-story"; // Import saveStories

const INITIAL_RESUME = `
1. TELUS HEALTH: Technical Account Manager. Managed $1.7M ARR portfolio. Led critical API transition for 950k users (Zero Defect Launch). Skills: Enterprise Risk, Stakeholder Management, API Migration.
2. ZOPHOP: Team Lead. Increased GPS availability by 35%. Debugged hardware firmware/battery issues in field. Skills: Hardware/IoT, Field Ops, Debugging.
3. TRACXN: Senior Engineer. Overhauled API workflows slashing feature release time. Optimized data pipelines. Skills: Data Engineering, API Design, Startups.
4. OPTYM: Senior Software Engineer. Reduced client onboarding time by 80% via ETL automation. Skills: Logistics, Optimization, SQL.
`;

export function DashboardContainer() {
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
    const [resume, setResume] = useState(INITIAL_RESUME);
    const [stories, setStories] = useState<StarStory[]>([]);
    const [context, setContext] = useState("");

    // Modals
    const [isContextOpen, setIsContextOpen] = useState(false);
    const [isDataOpen, setIsDataOpen] = useState(false);

    // Initial Data Load
    useEffect(() => {
        const loadStories = async () => {
            const { data } = await fetchStories();
            if (data) {
                try {
                    // Try to parse as JSON (new format)
                    const parsed = JSON.parse(data);
                    if (Array.isArray(parsed)) {
                        setStories(parsed);
                    } else {
                        // Legacy: it's just a string, wrapper it or ignore?
                        console.warn("Loaded legacy story format, resetting.");
                    }
                } catch (e) {
                    // If parse fails, it's the old plain text format.
                    // We can try to preserve it or just start fresh. 
                    // For now, let's just log it and maybe start fresh to enforce structure.
                    console.log("Could not parse stories as JSON, assuming legacy text.");
                }
            }
        };
        loadStories();
    }, []);

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
        If there is a matching STAR script in the JSON data, USE IT verbatim as the answer.
        Write a short STAR method outline. Format: Use HTML <strong> tags.
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

    const handleSaveData = async () => {
        setIsDataOpen(false);

        // Persist Stories to Supabase
        if (stories) {
            const res = await saveStories(stories);
            if (res.error) {
                console.error("Failed to save stories:", res.error);
                // Optionally show toast/error, for now log it
            } else {
                console.log("Stories saved to database.");
            }
        }

        // Trigger match refresh if company exists
        if (company && matchData) {
            handleUpdateMatches(matchData.matched_entities);
        }
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

    if (!hasSearched) {
        return (
            <>
                <SearchHome
                    company={company}
                    setCompany={setCompany}
                    round={round}
                    setRound={setRound}
                    onAnalyze={handleAnalyze}
                    onDataClick={() => setIsDataOpen(true)}
                    isAnalyzing={loading}
                />
                <ContextModal
                    isOpen={isContextOpen}
                    onClose={() => setIsContextOpen(false)}
                    context={context}
                    setContext={setContext}
                    onSave={handleSaveContext}
                />

                <DataModal
                    isOpen={isDataOpen}
                    onClose={() => setIsDataOpen(false)}
                    resume={resume}
                    setResume={setResume}
                    stories={stories}
                    setStories={setStories}
                    onSave={handleSaveData}
                />
            </>
        );
    }

    return (
        <div className="min-h-screen flex flex-col font-sans text-slate-900 mesh-gradient-bg">
            <Header
                company={company}
                setCompany={setCompany}
                round={round}
                setRound={handleRoundChange}
                onAnalyze={handleAnalyze}
                onDataClick={() => setIsDataOpen(true)}
                isAnalyzing={loading}
            />

            <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 space-y-8 relative">
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
                        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl max-w-md w-full text-center shadow-sm">
                            <h3 className="font-bold text-lg mb-2">Analysis Error</h3>
                            <p className="text-sm">{error || "Something went wrong."}</p>
                            <Button variant="outline" className="mt-4 bg-white hover:bg-red-50 border-red-200" onClick={() => setViewState("empty")}>Try Again</Button>
                        </div>
                    </div>
                )}

                {viewState === "dashboard" && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        {reconData && <CompanyRecon data={reconData} />}

                        {/* Market Intel */}
                        <MarketIntel businessModel={reconData?.business_model} competitors={reconData?.competitors} />

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

            <DataModal
                isOpen={isDataOpen}
                onClose={() => setIsDataOpen(false)}
                resume={resume}
                setResume={setResume}
                stories={stories}
                setStories={setStories}
                onSave={handleSaveData}
            />
        </div>
    );
}
