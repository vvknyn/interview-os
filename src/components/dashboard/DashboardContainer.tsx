"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Gear, SignOut, MagnifyingGlass, WarningCircle, Link as LinkIcon, FileText } from "@phosphor-icons/react";
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
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

import { CompanyReconData, MatchData, QuestionsData, ReverseQuestionsData, StarStory, SourceItem, TechnicalData, CodingChallenge, ProviderConfig, SystemDesignData } from "@/types";
import { fetchRecon, fetchMatch, fetchQuestions, fetchReverse, generateGenericJSON, generateGenericText, fetchTechnicalQuestions, fetchCodingChallenge, explainTechnicalConcept, extractCompaniesFromResume, fetchSystemDesignQuestions } from "@/actions/generate-context";
import { fetchUrlContent } from "@/actions/fetch-url";
import { updateModelSettings, fetchProfile, updateResume } from "@/actions/profile";
import { KnowledgeSection } from "@/components/dashboard/KnowledgeSection";
import { CodingWorkspace } from "@/components/dashboard/CodingWorkspace";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { User as UserIcon, ChatCircleDots, Code, GraduationCap, Question } from "@phosphor-icons/react";
// import { OnboardingWizard } from "@/components/dashboard/OnboardingWizard"; // Removed
import { saveStories, fetchStories } from "@/actions/save-story";
import { fetchSources } from "@/actions/sources";
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
    const [systemDesignData, setSystemDesignData] = useState<SystemDesignData | null>(null);

    // User Data
    const [resume, setResume] = useState("");
    const [stories, setStories] = useState<StarStory[]>([]);
    const [sources, setSources] = useState<SourceItem[]>([]);
    const [context, setContext] = useState("");
    const [user, setUser] = useState<User | null>(null);
    const [modelConfig, setModelConfig] = useState<Partial<ProviderConfig>>({});

    // New State for Job Context & Companies
    const [jobUrl, setJobUrl] = useState("");
    const [jobContext, setJobContext] = useState("");
    const [isFetchingJob, setIsFetchingJob] = useState(false);
    const [resumeCompanies, setResumeCompanies] = useState<string[]>([]);

    // Modals & UI State
    const [isContextOpen, setIsContextOpen] = useState(false);
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const [isAuthChecked, setIsAuthChecked] = useState(false);
    const [isGuest, setIsGuest] = useState(false);
    const [isRegeneratingMatch, setIsRegeneratingMatch] = useState(false);

    // Dashboard UI State
    const [activeSection, setActiveSection] = useState("section-match");

    // Scroll to top when switching sections
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [activeSection]);

    // Cache helpers
    const getCacheKey = (comp: string, pos: string, rnd: string) => `interview-os-cache-${comp.toLowerCase()}-${pos.toLowerCase()}-${rnd.toLowerCase()}`;


    const saveToCache = (comp: string, pos: string, rnd: string, data: { reconData?: CompanyReconData, matchData?: MatchData, questionsData?: QuestionsData, reverseData?: ReverseQuestionsData, technicalData?: TechnicalData, codingChallenge?: CodingChallenge, systemDesignData?: SystemDesignData }) => {
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
                codingChallenge: data.codingChallenge,
                systemDesignData: data.systemDesignData
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

    // Initial Data Load and URL State Restoration
    useEffect(() => {
        const loadData = async () => {
            // Load User
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setIsAuthChecked(true);

            // Listen for auth changes
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                setUser(session?.user ?? null);
                if (event === 'SIGNED_OUT') {
                    setStories([]);
                    // Optional: clear other user-specific data
                }
            });

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
            if (profileData) {
                if (profileData.resume_text) setResume(profileData.resume_text);

                // Load user model preference
                if (profileData.preferred_model) {
                    const config: Partial<ProviderConfig> = { model: profileData.preferred_model };
                    if (profileData.preferred_model.startsWith('gemini')) config.provider = 'gemini';
                    else if (profileData.preferred_model.startsWith('gpt')) config.provider = 'openai';
                    else config.provider = 'groq';

                    // Try global custom key
                    if (profileData.custom_api_key && !profileData.custom_api_key.startsWith('{')) {
                        config.apiKey = profileData.custom_api_key;
                    }
                    setModelConfig(config);
                }
            } else {
                // Guest mode: Load API keys from localStorage
                const guestKey = localStorage.getItem('guest_api_key');
                const guestModel = localStorage.getItem('guest_model');

                if (guestKey && guestModel) {
                    // Parse provider and model from format "provider:model"
                    let provider: 'groq' | 'gemini' | 'openai' = 'groq';
                    let model = 'llama-3.3-70b-versatile';

                    if (guestModel.includes(':')) {
                        const parts = guestModel.split(':');
                        provider = parts[0] as any;
                        model = parts.slice(1).join(':');
                    }

                    // Parse API key (might be JSON with multiple provider keys)
                    let apiKey = guestKey;
                    if (guestKey.trim().startsWith('{')) {
                        try {
                            const keys = JSON.parse(guestKey);
                            apiKey = keys[provider] || "";
                        } catch (e) {
                            console.warn("Failed to parse guest API keys", e);
                        }
                    }

                    setModelConfig({ provider, model, apiKey });
                } else {
                    // Fallback to legacy localStorage format
                    const cachedConfig = localStorage.getItem('interview-os-model-config');
                    if (cachedConfig) {
                        try {
                            setModelConfig(JSON.parse(cachedConfig));
                        } catch (e) { }
                    }
                }
            }



            // Restore dashboard state from localStorage if available
            const savedState = localStorage.getItem('dashboard_state');
            if (savedState) {
                try {
                    const state = JSON.parse(savedState);
                    if (state.searchQuery) setSearchQuery(state.searchQuery);
                    if (state.company) setCompany(state.company);
                    if (state.position) setPosition(state.position);
                    if (state.round) setRound(state.round);
                    if (state.jobUrl) setJobUrl(state.jobUrl);
                    if (state.jobContext) setJobContext(state.jobContext);

                    // Try to restore cached results
                    if (state.company && state.position && state.round) {
                        const cached = loadFromCache(state.company, state.position, state.round);
                        if (cached) {
                            setReconData(cached.reconData);
                            setMatchData(cached.matchData);
                            setQuestionsData(cached.questionsData);
                            setReverseData(cached.reverseData);
                            setTechnicalData(cached.technicalData);
                            setCodingChallenge(cached.codingChallenge);
                            setSystemDesignData(cached.systemDesignData);
                            setHasSearched(true);
                            setViewState("dashboard");
                        }
                    }
                } catch (e) {
                    console.error('Failed to restore dashboard state', e);
                }
            }

            // Restore state from URL (takes precedence over localStorage)
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
                    setSystemDesignData(cached.systemDesignData);
                    setViewState("dashboard");
                }
            }

            // Return cleanup function
            return () => {
                subscription?.unsubscribe();
            };
        };
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    // Save dashboard state to localStorage whenever it changes
    useEffect(() => {
        if (hasSearched) {
            const state = {
                searchQuery,
                company,
                position,
                round,
                jobUrl,
                jobContext
            };
            localStorage.setItem('dashboard_state', JSON.stringify(state));
        }
    }, [searchQuery, company, position, round, jobUrl, jobContext, hasSearched]);

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

        // Extract companies if resume exists and we haven't yet (or if resume changed significantly)
        // For simplicity, we just run it if we have resume and no companies yet
        if (resume && resume.length > 100 && resumeCompanies.length === 0) {
            const extract = async () => {
                const res = await extractCompaniesFromResume(resume, modelConfig);
                if (res.data) {
                    setResumeCompanies(res.data);

                    // Auto-clean: Validate current 'matched_entities' against the clean extraction
                    // This fixes the issue where old cache has "Java", "AWS", etc.
                    if (matchData && matchData.matched_entities) {
                        const cleanList = res.data;
                        const currentMatches = matchData.matched_entities;
                        const validMatches = currentMatches.filter(m =>
                            cleanList.some(c => c.toLowerCase() === m.toLowerCase())
                        );

                        // If we filtered anything out, update the match data
                        if (validMatches.length !== currentMatches.length) {
                            console.log("Cleaning invalid companies from match data:",
                                currentMatches.filter(m => !validMatches.includes(m))
                            );
                            const updatedMatch = { ...matchData, matched_entities: validMatches };
                            setMatchData(updatedMatch);
                            // Optionally trigger a regen of the script if it changed significantly?
                            // For now just update the list so the UI is clean
                        }
                    }
                }
            };
            extract();
        }
    }, [resume, debouncedSaveResume, resumeCompanies.length, modelConfig]);

    // Derived: Serialize Stories for AI
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

    const handleFetchJobContext = async () => {
        if (!jobUrl) return;
        setIsFetchingJob(true);
        setSearchError(null);

        try {
            const res = await fetchUrlContent(jobUrl);
            if (res.data) {
                setJobContext(res.data);

                // Try to intelligently parse company and position from the job description
                const parsed = await parseSearchQuery(`Extract company name and job title from: ${res.data.substring(0, 1000)}`);

                if (parsed && parsed.company && parsed.position) {
                    setCompany(parsed.company);
                    setPosition(parsed.position);
                    // Update search query to reflect parsed values
                    setSearchQuery(`${parsed.company}, ${parsed.position}, ${round || 'Technical Round'}`);
                }
            } else {
                setSearchError(res.error || "Failed to fetch job posting");
            }
        } catch (error) {
            console.error("Job URL fetch error:", error);
            setSearchError("Failed to fetch job posting");
        } finally {
            setIsFetchingJob(false);
        }
    };

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
            setSystemDesignData(cached.systemDesignData);
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
            const reconRes = await fetchRecon(parsed.company, parsed.position, modelConfig);
            if (reconRes.error) throw new Error(reconRes.error);
            if (reconRes.data) setReconData(reconRes.data);
            setProgress(25);

            // Step 1.5: Extract companies from resume if not already done
            let companies = resumeCompanies;
            if (resume && resume.length > 100 && companies.length === 0) {
                setLoadingText("Extracting experience...");
                const extractRes = await extractCompaniesFromResume(resume, modelConfig);
                if (extractRes.data && extractRes.data.length > 0) {
                    companies = extractRes.data;
                    setResumeCompanies(companies);
                }
            }
            setProgress(35);

            // Step 2: Match (50%) - Pass ALL companies by default
            // User Feedback: Don't populate if no resume/context exists to prevent hallucinations
            let matchDataResult = null;
            const hasContext = resume.length > 20 || stories.length > 0;
            if (hasContext) {
                setLoadingText("Matching your profile...");
                const matchRes = await fetchMatch(parsed.company, parsed.position, parsed.round, resume, storiesText, getSourcesContext(), jobContext, modelConfig, companies);
                if (matchRes.error) throw new Error(matchRes.error);
                if (matchRes.data) {
                    setMatchData(matchRes.data);
                    matchDataResult = matchRes.data;
                }
            } else {
                setMatchData(null);
            }
            setProgress(60);

            // Step 3: Questions (75%)
            setLoadingText("Generating questions...");
            const questionsRes = await fetchQuestions(parsed.company, parsed.position, parsed.round, modelConfig);
            if (questionsRes.error) throw new Error(questionsRes.error);
            if (questionsRes.data) setQuestionsData(questionsRes.data);
            setProgress(85);

            // Step 4: Reverse (100%)
            setLoadingText("Finalizing strategy...");
            const revRes = await fetchReverse(company, position, round, resume, storiesText, getSourcesContext(), modelConfig);
            if (revRes.error) throw new Error(revRes.error);
            if (revRes.data) setReverseData(revRes.data);

            // Step 5: Technical Checks (Parallel if Technical/Coding round)
            const isTechnical = /technical|coding|system design|engineer|developer/i.test(round) || /swe|software|engineer|developer/i.test(position);
            if (isTechnical) {
                setLoadingText("Adding technical challenges...");
                const [techRes, codeRes] = await Promise.all([
                    fetchTechnicalQuestions(company, position, round, getSourcesContext(), modelConfig),
                    fetchCodingChallenge(company, position, round, modelConfig)
                ]);

                if (techRes.data) setTechnicalData(techRes.data);
                if (codeRes.data) setCodingChallenge(codeRes.data);
            }

            // Step 6: System Design Questions (if applicable)
            setLoadingText("Checking for system design questions...");
            const sysDesignRes = await fetchSystemDesignQuestions(parsed.company, parsed.position, parsed.round, modelConfig);
            if (sysDesignRes.data && sysDesignRes.data.questions.length > 0) {
                setSystemDesignData(sysDesignRes.data);
            }

            setProgress(100);

            // Save to cache
            saveToCache(parsed.company, parsed.position, parsed.round, {
                reconData: reconRes.data,
                matchData: matchDataResult || undefined,
                questionsData: questionsRes.data,
                reverseData: revRes.data,
                technicalData: technicalData || undefined,
                codingChallenge: codingChallenge || undefined,
                systemDesignData: sysDesignRes.data || undefined
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
        if (!matchData) return;

        // Optimistic update of entities
        const updatedMatchData = { ...matchData, matched_entities: newMatches };
        setMatchData(updatedMatchData);
        setIsRegeneratingMatch(true);

        try {
            // AI Refresh of headline and script
            const entitiesStr = newMatches.join(", ");
            const prompt = `
            Context: Candidate is interviewing at ${company} for a ${position} role in a ${round} interview.
            Selected Experiences/Companies: ${entitiesStr}
            Full Resume & Data: ${getFullContext()}
            ${jobContext ? `\nJob Posting Context:\n${jobContext}` : ""}

            Task: Write a compelling "Tell me about yourself" response for this ${position} interview at ${company}.

            CRITICAL INSTRUCTIONS:
            1. The script MUST specifically highlight experiences from: ${entitiesStr}
            2. Write in FIRST PERSON as the exact words the candidate will speak
            3. Start with a brief professional summary, then naturally weave in the selected experiences
            4. Connect each experience to why it makes them a great fit for ${position} at ${company}
            5. Keep it conversational and natural - this is spoken, not written
            6. Aim for 30-60 seconds when spoken aloud (about 100-150 words)

            STRICT RULES:
            - **Data Source**: Use ONLY the Resume/Stories for candidate facts.
            - **Relevance**: Focus on experience relevant to ${position}. 

            Return JSON: {
                "headline": "A punchy 5-8 word headline summarizing the candidate's fit",
                "reasoning": "The full first-person script in markdown format"
            }
        `;

            const res = await generateGenericJSON(prompt, modelConfig);
            if (res) {
                setMatchData({ ...updatedMatchData, headline: res.headline, reasoning: res.reasoning });
            }
        } catch (e) {
            console.error("Failed to regenerate match script:", e);
        } finally {
            setIsRegeneratingMatch(false);
        }
    };

    const handleRegenerateQuestions = async () => {
        if (!company || !position || !round) return;
        setLoadingText("Refreshing questions...");
        // Pass true for uniqueness
        const res = await fetchQuestions(company, position, round, modelConfig, true);
        if (res.data) setQuestionsData(res.data);
        setLoadingText("");
    };

    const handleAddMatch = (match: string) => {
        if (!matchData) return;
        const entities = matchData.matched_entities || [];
        if (entities.includes(match)) return;
        handleUpdateMatches([...entities, match]);
    };

    const handleRemoveMatch = (match: string) => {
        if (!matchData) return;
        const entities = matchData.matched_entities || [];
        handleUpdateMatches(entities.filter(m => m !== match));
    };

    const handleGenerateStrategy = async (index: number, questionItem: any) => {
        // Fallback for types if needed
        const questionText = typeof questionItem === 'string' ? questionItem : questionItem.question;
        const category = typeof questionItem === 'object' ? questionItem.category : 'Behavioral';
        const keyPoints = questionItem.keyPoints || [];
        const framework = questionItem.framework || questionItem.answerFramework;

        // Behavioral -> STAR Method (Uses Resume)
        if (category === 'Behavioral') {
            const prompt = `
                Context: Candidate is interviewing at ${company} for a ${position} role.
                Question: "${questionText}"
                Full Resume & Data: ${getFullContext()}

                Task: Write a compelling STAR method answer using the candidate's background.

                CRITICAL INSTRUCTIONS:
                - You MUST find a connection from the resume, even if abstract.
                - NEVER say "there isn't a direct story" or "no specific experience".
                - If no direct match, pivot to a transferable skill from the resume.
                - Be creative and persuasive.

                FORMAT YOUR RESPONSE AS:
                **Situation:** [2-3 sentences]
                **Task:** [1-2 sentences]
                **Action:** [3-4 sentences with specific details]
                **Result:** [2-3 sentences with quantified impact if possible]
            `;
            return generateGenericText(prompt, modelConfig);
        }

        // Product Management Questions
        if (category === 'Product Management' || category?.toLowerCase().includes('product')) {
            const frameworkHint = framework ? `Use the ${framework} framework to structure your answer.` : '';
            const keyPointsHint = keyPoints.length > 0 ? `Key points to cover: ${keyPoints.join(', ')}` : '';

            const prompt = `
                Context: Candidate is interviewing at ${company} for a ${position} role.
                Question: "${questionText}"
                ${frameworkHint}
                ${keyPointsHint}
                Full Resume & Data: ${getFullContext()}

                Task: Provide a structured PM interview answer.

                FORMAT YOUR RESPONSE WITH CLEAR SECTIONS:
                ${framework === 'CIRCLES' ? `
                **Comprehend:** Clarify the question and constraints
                **Identify:** Identify the user and their needs
                **Report:** Report user needs and pain points
                **Cut:** Prioritize the most important needs
                **List:** List potential solutions
                **Evaluate:** Evaluate trade-offs
                **Summarize:** Recommend and summarize
                ` : framework === 'RICE' ? `
                **Reach:** How many users affected?
                **Impact:** What's the impact per user?
                **Confidence:** How confident are we?
                **Effort:** How much work is required?
                **Prioritization:** Final recommendation
                ` : `
                **Understanding:** Clarify the problem
                **Analysis:** Break down the key factors
                **Approach:** Your proposed solution
                **Trade-offs:** Consider alternatives
                **Metrics:** How to measure success
                `}

                Use the candidate's background where relevant.
            `;
            return generateGenericText(prompt, modelConfig);
        }

        // System Design Questions
        if (category === 'System Design') {
            const prompt = `
                Context: Interview at ${company} for ${position}.
                Question: "${questionText}"
                ${keyPoints.length > 0 ? `Key points to address: ${keyPoints.join(', ')}` : ''}

                Task: Provide a structured system design answer.

                FORMAT YOUR RESPONSE AS:
                **Requirements:** Functional and non-functional requirements
                **High-Level Design:** Key components and their interactions
                **Deep Dive:** Detailed design of critical components
                **Trade-offs:** Discuss alternatives and why you chose this approach
                **Scalability:** How the system handles growth

                Keep it concise but comprehensive.
            `;
            return generateGenericText(prompt, modelConfig);
        }

        // Coding Questions
        if (category === 'Coding') {
            const prompt = `
                Context: Interview at ${company} for ${position}.
                Question: "${questionText}"

                Task: Provide a coding interview answer.

                FORMAT YOUR RESPONSE AS:
                **Approach:** Explain your algorithm approach
                **Time Complexity:** O(?) analysis
                **Space Complexity:** O(?) analysis
                **Code:**
                \`\`\`
                // Clean, well-commented solution
                \`\`\`
                **Edge Cases:** List important edge cases to handle
            `;
            return generateGenericText(prompt, modelConfig);
        }

        // Case Study Questions
        if (category === 'Case Study') {
            const prompt = `
                Context: Interview at ${company} for ${position}.
                Question: "${questionText}"
                Full Resume & Data: ${getFullContext()}

                Task: Provide a structured case study answer.

                FORMAT YOUR RESPONSE AS:
                **Clarifying Questions:** What would you ask?
                **Framework:** Structure your analysis
                **Analysis:** Key insights and data points
                **Recommendation:** Your proposed solution
                **Next Steps:** Implementation plan

                Draw from the candidate's experience where relevant.
            `;
            return generateGenericText(prompt, modelConfig);
        }

        // Generic fallback for other categories
        const prompt = `
            Context: Interview at ${company} for ${position}.
            Question: "${questionText}"
            Category: ${category}
            ${keyPoints.length > 0 ? `Key points to address: ${keyPoints.join(', ')}` : ''}
            Full Resume & Data: ${getFullContext()}

            Task: Provide a well-structured, comprehensive answer to this interview question.

            FORMAT YOUR RESPONSE WITH:
            - Clear structure using **bold headers**
            - Bullet points where appropriate
            - Specific examples when possible
            - Keep it concise but thorough
        `;
        return generateGenericText(prompt, modelConfig);
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
        const res = await generateGenericJSON(promptReverse, modelConfig);
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
        // Clear all state
        setSearchQuery("");
        setCompany("");
        setPosition("");
        setRound("");
        setJobUrl("");
        setJobContext("");
        setError(null);
        setHasSearched(false);
        setViewState("empty");

        // Clear data
        setReconData(null);
        setMatchData(null);
        setQuestionsData(null);
        setReverseData(null);
        setTechnicalData(null);
        setCodingChallenge(null);
        setSystemDesignData(null);
        setResumeCompanies([]);

        // Clear URL params
        router.push("/dashboard");
    };

    if (!isAuthChecked) {
        return <LoadingState message="Verifying session..." />;
    }

    if (!user && !isGuest) {
        // Redirect to landing page for auth
        router.push("/");
        return <LoadingState message="Redirecting..." />;
    }

    if (!hasSearched) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background transition-all duration-500">
                {/* Top Right Actions */}
                <div className="absolute top-4 right-4 flex items-center gap-1">
                    <Link href="/resume-builder">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-foreground transition-colors"
                            title="Resume Builder"
                        >
                            <FileText size={18} weight="regular" />
                        </Button>
                    </Link>
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
                    {/* Header handles auth state now, but we can keep a manual sign out button or just rely on Header which is not rendered here yet. 
                        Wait, DashboardContainer renders Header? No, Header is rendered below in the main dashboard view.
                        Here inside "hasSearched=false" view, we need the SignOut button.
                    */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={async () => {
                            const supabase = createClient();
                            await supabase.auth.signOut();
                            router.push("/");
                        }}
                        className="h-9 w-9 text-muted-foreground hover:text-destructive transition-colors"
                        title="Sign Out"
                    >
                        <SignOut size={18} weight="regular" />
                    </Button>
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

                    <p className="text-muted-foreground text-xs px-1 mb-4">
                        Enter company name, position, and interview round — the AI will understand natural language
                    </p>

                    {/* Error Message */}
                    {searchError && (
                        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm mb-4">
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

                    {/* Job URL - Subtle optional input below */}
                    <div className="mt-6 pt-4 border-t border-border/30">
                        <div className="flex items-center gap-2">
                            <LinkIcon size={14} className="text-muted-foreground flex-shrink-0" />
                            <Input
                                type="url"
                                placeholder="Have a job posting URL? Paste it here for better context..."
                                className="h-8 text-xs bg-transparent border-transparent hover:border-border/50 focus:border-border focus:bg-secondary/20 transition-all"
                                value={jobUrl}
                                onChange={(e) => setJobUrl(e.target.value)}
                                onBlur={() => {
                                    if (jobUrl && !jobContext) handleFetchJobContext();
                                }}
                            />
                            {isFetchingJob && <span className="text-xs text-muted-foreground animate-pulse flex-shrink-0">Fetching...</span>}
                            {jobContext && !isFetchingJob && <span className="text-xs text-green-600 flex-shrink-0">Added</span>}
                        </div>
                    </div>
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



    // ... existing code ...

    return (
        <div className="bg-background min-h-screen flex flex-col font-sans text-foreground">
            {/* ... Header ... */}
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
                user={user}
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
                        {/* Three-Column Layout: Sidebar | Main | Recon */}
                        <div className="flex flex-col lg:flex-row gap-8 relative">
                            {/* Left Sidebar - Navigation */}
                            <DashboardSidebar
                                activeSection={activeSection}
                                onSelectSection={setActiveSection}
                                sections={[
                                    // Strategy Section - Always show, will display error if no resume
                                    { id: "section-match", label: "Strategy", icon: UserIcon },
                                    ...(questionsData ? [{ id: "section-questions", label: "Questions", icon: ChatCircleDots }] : []),
                                    ...(technicalData ? [{ id: "section-knowledge", label: "Knowledge", icon: GraduationCap }] : []),
                                    ...(codingChallenge ? [{ id: "section-coding", label: "Coding Workspace", icon: Code }] : []),
                                    ...(reverseData ? [{ id: "section-reverse", label: "Reverse Questions", icon: Question }] : [])
                                ]}
                                bottomContent={reconData ? (
                                    <CompanyRecon
                                        data={reconData}
                                        jobUrl={jobUrl}
                                        onJobUrlChange={(url) => {
                                            setJobUrl(url);
                                        }}
                                    />
                                ) : null}
                            />

                            {/* Center Column - Interview Content */}
                            <div className="flex-1 min-w-0 space-y-12">


                                {/* Match Section */}
                                {activeSection === "section-match" && (
                                    <div id="section-match" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        {matchData ? (
                                            <MatchSection
                                                data={matchData}
                                                onAddMatch={handleAddMatch}
                                                onRemoveMatch={handleRemoveMatch}
                                                allowedMatches={resumeCompanies}
                                                jobContext={jobContext}
                                                isRegenerating={isRegeneratingMatch}
                                                onRegenerate={() => handleUpdateMatches(matchData.matched_entities || [])}
                                            />
                                        ) : (
                                            <section className="animate-in fade-in pt-6">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                        <UserIcon size={20} weight="fill" />
                                                    </div>
                                                    <div>
                                                        <h2 className="text-xl font-semibold">Match Strategy</h2>
                                                        <p className="text-sm text-muted-foreground">Your pitch, tailored to the role</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-center justify-center py-16 px-6 bg-muted/20 rounded-xl border border-dashed border-border">
                                                    <WarningCircle size={48} className="text-muted-foreground/50 mb-4" />
                                                    <h3 className="text-lg font-semibold mb-2">Resume Required</h3>
                                                    <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
                                                        Add your resume in Settings to generate a personalized match strategy for this role.
                                                    </p>
                                                    <Link href="/settings">
                                                        <Button variant="default">
                                                            <Gear size={16} className="mr-2" />
                                                            Go to Settings
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </section>
                                        )}
                                    </div>
                                )}

                                {/* Questions Grid - Now includes System Design questions */}
                                {/* Questions Grid - Now includes System Design questions */}
                                {activeSection === "section-questions" && questionsData && (
                                    <div id="section-questions" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <QuestionsGrid
                                            questions={[
                                                ...questionsData.questions,
                                                ...(systemDesignData?.questions || [])
                                            ]}
                                            onRegenerate={handleRegenerateQuestions}
                                            onGenerateStrategy={handleGenerateStrategy}
                                        />
                                    </div>
                                )}

                                {/* Technical Knowledge Section */}
                                {technicalData && activeSection === "section-knowledge" && (
                                    <div id="section-knowledge" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <KnowledgeSection
                                            data={technicalData}
                                            onExplain={async (q) => {
                                                return await explainTechnicalConcept(q);
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Coding Live Workspace */}
                                {codingChallenge && activeSection === "section-coding" && (
                                    <div id="section-coding" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <CodingWorkspace challenge={codingChallenge} />
                                    </div>
                                )}

                                {/* Reverse Questions */}
                                {reverseData && activeSection === "section-reverse" && (
                                    <div id="section-reverse" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <ReverseQuestions
                                            questions={reverseData.reverse_questions}
                                            onRegenerate={handleRegenerateReverse}
                                        />
                                    </div>
                                )}
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



        </div>
    );
}
