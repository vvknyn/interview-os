import { useState, useEffect, useCallback, KeyboardEvent, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Gear, SignOut, MagnifyingGlass, WarningCircle, Link as LinkIcon, FileText, Briefcase, Globe } from "@phosphor-icons/react";
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
import { Textarea } from "@/components/ui/textarea";
import { ContextModal } from "@/components/modals/ContextModal";
import { AuthPopover } from "@/components/auth/auth-popover";
import { NavMenu } from "@/components/layout/NavMenu";
import { ModelSwitcher } from "./ModelSwitcher";
import { signOut } from "@/actions/auth";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

import { CompanyReconData, MatchData, QuestionsData, ReverseQuestionsData, StarStory, SourceItem, TechnicalData, CodingChallenge, ProviderConfig, SystemDesignData } from "@/types";
import { fetchRecon, fetchMatch, fetchQuestions, fetchReverse, generateGenericJSON, generateGenericText, fetchTechnicalQuestions, fetchCodingChallenge, explainTechnicalConcept, extractCompaniesFromResume, fetchSystemDesignQuestions, checkApiHealth, generateInterviewPlan } from "@/actions/generate-context";
import { fetchUrlContent } from "@/actions/fetch-url";
import { updateModelSettings, fetchProfile, updateResume, saveProviderApiKeys } from "@/actions/profile";
import { KnowledgeSection } from "@/components/dashboard/KnowledgeSection";
import { llmCache } from "@/lib/llm/cache";
import { PrivacyNotice } from "@/components/ui/privacy-notice";
import { CodingWorkspace } from "@/components/dashboard/CodingWorkspace";
import { InterviewCache } from "@/lib/interview-cache";
import { RateLimiter } from "@/lib/rate-limiter";
import { fetchServerCache, saveServerCache } from "@/actions/cache";
import { loadEnhancedCache, saveEnhancedCache, canMakeRequest, recordRequest } from "@/lib/cache-helpers";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { PageLayout } from "@/components/layout/PageLayout";
import { User as UserIcon, ChatCircleDots, Code, GraduationCap, Question } from "@phosphor-icons/react";
import { QuestionsLoader, ReverseQuestionsLoader, SectionLoader } from "@/components/dashboard/SectionLoaders";
import { ApiKeyConfigModal } from "@/components/dashboard/ApiKeyConfigModal";
// import { OnboardingWizard } from "@/components/dashboard/OnboardingWizard"; // Removed
import { saveStories, fetchStories } from "@/actions/save-story";
import { fetchSources } from "@/actions/sources";
import { exportToPDF } from "@/actions/export-pdf";
import { parseSearchQuery } from "@/actions/search";
import { quickParseSearchQuery } from "@/lib/search-utils";
import { useDebouncedCallback } from "use-debounce";
import { PrepSettings, QuestionSettings, loadPrepSettings } from "./PrepSettings";

export function DashboardContainer() {
    // Router and URL params
    const router = useRouter();
    const searchParams = useSearchParams();

    // Global State - Single search query
    const [searchQuery, setSearchQuery] = useState("");
    const [searchError, setSearchError] = useState<string | null>(null);
    const [authPopoverOpen, setAuthPopoverOpen] = useState(false);

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

    // Calculate if role is technical (for optimistic tab rendering)
    const isTechnicalRole = /technical|coding|system design|engineer|developer/i.test(round) || /swe|software|engineer|developer/i.test(position);
    // User Data
    const [resume, setResume] = useState("");
    const [stories, setStories] = useState<StarStory[]>([]);
    const [sources, setSources] = useState<SourceItem[]>([]);
    const [context, setContext] = useState("");
    const [user, setUser] = useState<User | null>(null);

    // Refs for always-current values (avoid stale closure issues)
    const resumeRef = useRef("");
    const storiesRef = useRef<StarStory[]>([]);

    // Keep refs in sync with state
    useEffect(() => {
        resumeRef.current = resume;
    }, [resume]);

    useEffect(() => {
        storiesRef.current = stories;
    }, [stories]);
    const [modelProvider, setModelProvider] = useState<'groq' | 'gemini' | 'openai'>('groq');
    const [modelId, setModelId] = useState('llama-3.3-70b-versatile');
    const [apiKeys, setApiKeys] = useState<{ groq?: string; gemini?: string; openai?: string }>({});

    // Question generation settings
    const [prepSettings, setPrepSettings] = useState<QuestionSettings>({
        questions: 20,
        reverse: 5,
        technical: 5,
        systemDesign: 10
    });

    // New State for Job Context & Companies
    const [jobUrl, setJobUrl] = useState("");
    const [jobContext, setJobContext] = useState("");
    const [jobInputMode, setJobInputMode] = useState<"url" | "text">("url"); // Added state
    const [isFetchingJob, setIsFetchingJob] = useState(false);
    const [resumeCompanies, setResumeCompanies] = useState<string[]>([]);

    // Modals & UI State
    const [isContextOpen, setIsContextOpen] = useState(false);
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const [isAuthChecked, setIsAuthChecked] = useState(false);
    const [isGuest, setIsGuest] = useState(false);
    const [isRegeneratingMatch, setIsRegeneratingMatch] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Individual section loading states - tracks whether each section is still loading
    const [sectionLoading, setSectionLoading] = useState<{
        match: boolean;
        questions: boolean;
        reverse: boolean;
        technical: boolean;
        coding: boolean;
        systemDesign: boolean;
    }>({
        match: false,
        questions: false,
        reverse: false,
        technical: false,
        coding: false,
        systemDesign: false
    });

    // Dashboard UI State
    const [activeSection, setActiveSection] = useState("section-match");
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // API Key Configuration Modal State
    const [keyConfigOpen, setKeyConfigOpen] = useState(false);
    const [keyConfigProvider, setKeyConfigProvider] = useState<'groq' | 'gemini' | 'openai'>('groq');

    // Scroll to top when switching sections
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [activeSection]);

    // Cache helpers
    const getCacheKey = (comp: string, pos: string, rnd: string) => `interview-os-cache-${comp.toLowerCase()}-${pos.toLowerCase()}-${rnd.toLowerCase()}`;


    const saveToCache = (comp: string, pos: string, rnd: string, data: { reconData?: CompanyReconData, matchData?: MatchData, questionsData?: QuestionsData, reverseData?: ReverseQuestionsData, technicalData?: TechnicalData, codingChallenge?: CodingChallenge, systemDesignData?: SystemDesignData }, hasContext: boolean) => {
        try {
            const cacheData = {
                timestamp: Date.now(),
                company: comp,
                position: pos,
                round: rnd,
                hasContext, // Store if this data was generated with context
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

    // Load User Data (Resume, Stories, Profile)
    // Returns the resume text so callers can check for stale cache
    const fetchUserData = useCallback(async (): Promise<string> => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        setIsAuthChecked(true);

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
        let resumeText = "";
        const { data: profileData } = await fetchProfile();
        if (profileData) {
            console.log("[Dashboard] Profile Data:", profileData);
            if (profileData.resume_text && profileData.resume_text.length > 50) {
                console.log("[Dashboard] Found resume_text length:", profileData.resume_text.length);
                resumeText = profileData.resume_text;
                setResume(profileData.resume_text);
                resumeRef.current = profileData.resume_text;
            } else {
                console.log("[Dashboard] No resume_text in database, checking localStorage fallback");
                // Fallback: Try to load from Resume Builder localStorage
                if (typeof window !== 'undefined') {
                    const RESUME_STORAGE_KEY = "interview-os-resume-data";
                    const savedResume = localStorage.getItem(RESUME_STORAGE_KEY);
                    if (savedResume) {
                        try {
                            const resumeData = JSON.parse(savedResume);
                            // Convert structured resume to text
                            const textParts: string[] = [];
                            if (resumeData.profile) {
                                textParts.push(`${resumeData.profile.profession || ''} | ${resumeData.profile.email || ''} | ${resumeData.profile.location || ''}`);
                            }
                            if (resumeData.generatedSummary) {
                                textParts.push(`SUMMARY:\n${resumeData.generatedSummary}`);
                            }
                            if (resumeData.experience?.length > 0) {
                                textParts.push("EXPERIENCE:");
                                resumeData.experience.forEach((exp: any) => {
                                    textParts.push(`${exp.role || ''} at ${exp.company || ''} (${exp.dates || ''})\n${exp.description || ''}`);
                                });
                            }
                            if (resumeData.competencies?.length > 0) {
                                textParts.push("SKILLS:");
                                resumeData.competencies.forEach((comp: any) => {
                                    textParts.push(`${comp.category || 'Skills'}: ${(comp.skills || []).join(", ")}`);
                                });
                            }
                            if (resumeData.education?.length > 0) {
                                textParts.push("EDUCATION:");
                                resumeData.education.forEach((edu: any) => {
                                    textParts.push(`${edu.degree || ''} at ${edu.institution || ''} (${edu.year || ''})`);
                                });
                            }
                            const localResumeText = textParts.join("\n\n");
                            if (localResumeText.length > 50) {
                                resumeText = localResumeText;
                                setResume(localResumeText);
                                resumeRef.current = localResumeText;
                                console.log("[Dashboard] Loaded resume from localStorage fallback, length:", localResumeText.length);
                            }
                        } catch (e) {
                            console.warn("Failed to parse localStorage resume fallback", e);
                        }
                    }
                }
            }

            // Load user model preference
            if (profileData.preferred_model) {
                let provider: 'groq' | 'gemini' | 'openai' = 'groq';
                let model = profileData.preferred_model;

                if (profileData.preferred_model.startsWith('gemini')) provider = 'gemini';
                else if (profileData.preferred_model.startsWith('gpt')) provider = 'openai';
                else provider = 'groq';

                setModelProvider(provider);
                setModelId(model);
            }

            // Load API keys from database first, then fallback to localStorage
            let keysLoaded = false;

            // First try provider_api_keys (parsed from custom_api_key JSON in fetchProfile)
            const profileDataAny = profileData as any;
            if (profileDataAny.provider_api_keys && typeof profileDataAny.provider_api_keys === 'object') {
                const keys = profileDataAny.provider_api_keys as { groq?: string; gemini?: string; openai?: string };
                if (Object.keys(keys).length > 0) {
                    setApiKeys(keys);
                    keysLoaded = true;
                    console.log("[DashboardContainer] Loaded API keys from database (JSONB):", Object.keys(keys));
                }
            }

            // Fallback to custom_api_key (legacy TEXT column)
            if (!keysLoaded && profileData.custom_api_key) {
                try {
                    const parsed = JSON.parse(profileData.custom_api_key);
                    if (parsed && typeof parsed === 'object') {
                        setApiKeys(parsed);
                        keysLoaded = true;
                        console.log("[DashboardContainer] Loaded API keys from database (TEXT):", Object.keys(parsed));
                    }
                } catch (e) {
                    console.error("Failed to parse API keys from profile:", e);
                }
            }

            // Fallback to localStorage if no keys in database
            if (!keysLoaded && typeof window !== 'undefined') {
                const guestKeys = localStorage.getItem('guest_api_keys');
                if (guestKeys) {
                    try {
                        const parsed = JSON.parse(guestKeys);
                        setApiKeys(parsed);
                        console.log("[DashboardContainer] Loaded API keys from localStorage (fallback):", Object.keys(parsed));

                        // Sync localStorage keys to database if user is logged in
                        if (user?.id) {
                            console.log("[DashboardContainer] Syncing localStorage keys to database for user:", user.id);
                            updateModelSettings(guestKeys, "").catch(e =>
                                console.warn("Failed to sync keys to database:", e)
                            );
                        }
                    } catch (e) {
                        console.error("Failed to parse guest API keys:", e);
                    }
                }
            }
        } else {
            // Guest mode: Load from localStorage
            console.log("[DashboardContainer] Guest mode - loading from localStorage");

            // Try to load resume from Resume Builder localStorage
            const RESUME_STORAGE_KEY = "interview-os-resume-data";
            const savedResume = localStorage.getItem(RESUME_STORAGE_KEY);
            if (savedResume) {
                try {
                    const resumeData = JSON.parse(savedResume);
                    // Convert structured resume to text for RAG context
                    const textParts: string[] = [];
                    if (resumeData.profile) {
                        textParts.push(`${resumeData.profile.profession || ''} | ${resumeData.profile.email || ''} | ${resumeData.profile.location || ''}`);
                    }
                    if (resumeData.generatedSummary) {
                        textParts.push(`SUMMARY:\n${resumeData.generatedSummary}`);
                    }
                    if (resumeData.experience?.length > 0) {
                        textParts.push("EXPERIENCE:");
                        resumeData.experience.forEach((exp: any) => {
                            textParts.push(`${exp.role || ''} at ${exp.company || ''} (${exp.dates || ''})\n${exp.description || ''}`);
                        });
                    }
                    if (resumeData.competencies?.length > 0) {
                        textParts.push("SKILLS:");
                        resumeData.competencies.forEach((comp: any) => {
                            textParts.push(`${comp.category || 'Skills'}: ${(comp.skills || []).join(", ")}`);
                        });
                    }
                    if (resumeData.education?.length > 0) {
                        textParts.push("EDUCATION:");
                        resumeData.education.forEach((edu: any) => {
                            textParts.push(`${edu.degree || ''} at ${edu.institution || ''} (${edu.year || ''})`);
                        });
                    }
                    resumeText = textParts.join("\n\n");
                    if (resumeText.length > 50) {
                        setResume(resumeText);
                        resumeRef.current = resumeText;
                        console.log("[DashboardContainer] Loaded resume from localStorage, length:", resumeText.length);
                    }
                } catch (e) {
                    console.warn("Failed to parse saved resume", e);
                }
            }

            // Load API keys
            const guestKeysJson = localStorage.getItem('guest_api_keys');
            const guestModel = localStorage.getItem('guest_model');

            // Parse model preference
            let provider: 'groq' | 'gemini' | 'openai' = 'groq';
            let model = 'llama-3.3-70b-versatile';

            if (guestModel && guestModel.includes(':')) {
                const parts = guestModel.split(':');
                provider = parts[0] as 'groq' | 'gemini' | 'openai';
                model = parts.slice(1).join(':');
            }

            setModelProvider(provider);
            setModelId(model);

            // Load API keys - try new format first
            if (guestKeysJson) {
                try {
                    const keys = JSON.parse(guestKeysJson);
                    setApiKeys(keys);
                    console.log("[DashboardContainer] Loaded API keys from localStorage:", Object.keys(keys));
                } catch (e) {
                    console.warn("Failed to parse guest API keys", e);
                }
            } else {
                // Fallback to old format (guest_api_key - single key)
                const legacyKey = localStorage.getItem('guest_api_key');
                if (legacyKey) {
                    if (legacyKey.trim().startsWith('{')) {
                        try {
                            const keys = JSON.parse(legacyKey);
                            setApiKeys(keys);
                        } catch (e) {
                            console.warn("Failed to parse legacy guest API key", e);
                        }
                    } else {
                        setApiKeys({ [provider]: legacyKey });
                    }
                }
            }
        }
        return resumeText;
    }, []);

    // Helper: Build model config from state for AI calls
    const modelConfig: Partial<ProviderConfig> = {
        provider: modelProvider,
        model: modelId,
        apiKey: apiKeys[modelProvider]
    };

    // Manual Refresh - Force new analysis (Bypass Cache)
    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchUserData();

        // If we have an active search, re-analyze
        if (hasSearched && searchQuery) {
            // Pass forceRefresh=true
            await handleAnalyze(true);
        }
        setIsRefreshing(false);
    };

    // Auto-refresh on focus or visibility change
    useEffect(() => {
        const onFocus = () => {
            fetchUserData();
        };
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchUserData();
            }
        };
        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onVisibilityChange);
        return () => {
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [fetchUserData]);

    // Load prep settings from localStorage
    useEffect(() => {
        setPrepSettings(loadPrepSettings());
    }, []);

    // Initial Data Load and URL State Restoration
    useEffect(() => {
        const loadData = async () => {
            const userResume = await fetchUserData();
            const hasUserContext = userResume.length > 20;

            const supabase = createClient();
            // Listen for auth changes
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                setUser(session?.user ?? null);
                if (event === 'SIGNED_OUT') {
                    setStories([]);
                    setApiKeys({}); // Clear API keys on sign out
                    setResume("");  // Clear resume
                    setResumeCompanies([]); // Clear companies

                    // Clear guest keys from localStorage
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('guest_api_keys');
                        localStorage.removeItem('guest_api_key');
                        localStorage.removeItem('guest_model');
                        console.log("[DashboardContainer] Cleared guest keys on sign out");
                    }
                }
            });



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
                        const cached = await loadEnhancedCache(state.company, state.position, state.round);
                        // Don't use stale cache if user has resume but cache has no matchData
                        const shouldUseCache = cached && (cached.hasContext === hasUserContext) && (!hasUserContext || (hasUserContext && cached.matchData));
                        if (shouldUseCache && cached) {
                            setReconData(cached.reconData);
                            setMatchData(cached.matchData);
                            setQuestionsData(cached.questionsData);
                            setReverseData(cached.reverseData);
                            setTechnicalData(cached.technicalData);
                            setCodingChallenge(cached.codingChallenge);
                            setSystemDesignData(cached.systemDesignData);
                            setHasSearched(true);
                            setViewState("dashboard");
                        } else if (cached) {
                            // Restore partial data but trigger re-analysis for match
                            setReconData(cached.reconData);
                            setQuestionsData(cached.questionsData);
                            setReverseData(cached.reverseData);
                            setTechnicalData(cached.technicalData);
                            setCodingChallenge(cached.codingChallenge);
                            setSystemDesignData(cached.systemDesignData);
                            setHasSearched(true);
                            setViewState("dashboard");
                            // matchData left as null - auto-analyze effect will trigger
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
                const cached = await loadEnhancedCache(urlCompany, urlPosition, urlRound);
                // Don't use stale cache if user has resume but cache has no matchData
                const shouldUseCacheUrl = cached && (cached.hasContext === hasUserContext) && (!hasUserContext || (hasUserContext && cached.matchData));
                if (shouldUseCacheUrl && cached) {
                    setReconData(cached.reconData);
                    setMatchData(cached.matchData);
                    setQuestionsData(cached.questionsData);
                    setReverseData(cached.reverseData);
                    setTechnicalData(cached.technicalData);
                    setCodingChallenge(cached.codingChallenge);
                    setSystemDesignData(cached.systemDesignData);
                    setViewState("dashboard");
                } else if (cached) {
                    // Restore partial data but trigger re-analysis for match
                    setReconData(cached.reconData);
                    setQuestionsData(cached.questionsData);
                    setReverseData(cached.reverseData);
                    setTechnicalData(cached.technicalData);
                    setCodingChallenge(cached.codingChallenge);
                    setSystemDesignData(cached.systemDesignData);
                    setViewState("dashboard");
                    // matchData left as null - auto-analyze effect will trigger
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
    // Watch for resume changes and auto-save
    useEffect(() => {
        // Skip initial load
        debouncedSaveResume(resume);
    }, [resume, debouncedSaveResume]);

    // Auto-extract companies from resume for the Included Experiences dropdown
    useEffect(() => {
        const extractCompanies = async () => {
            // Only extract if we have a resume and haven't extracted yet
            if (!resume || resume.length < 50 || resumeCompanies.length > 0) return;

            console.log("[Dashboard] Extracting companies from resume...");
            try {
                // Use the current model config
                const result = await extractCompaniesFromResume(resume, modelConfig);
                if (result.data && result.data.length > 0) {
                    console.log("[Dashboard] Extracted companies:", result.data);
                    setResumeCompanies(result.data);
                }
            } catch (e) {
                console.error("Failed to extract companies:", e);
            }
        };

        extractCompanies();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resume]); // Only re-run if resume changes drastically (and we don't have companies)


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

    // Fix: fetchUserData handles state updates, but we need ensure checking the latest state or fallback
    const checkApiKey = (prov: 'groq' | 'gemini' | 'openai'): string | undefined => {
        // 1. Check state
        if (apiKeys[prov] && apiKeys[prov]!.trim() !== '') return apiKeys[prov];

        // 2. Fallback to localStorage (Guest keys)
        if (typeof window !== 'undefined') {
            try {
                const guestKeys = localStorage.getItem('guest_api_keys');
                if (guestKeys) {
                    const parsed = JSON.parse(guestKeys);
                    if (parsed[prov] && parsed[prov].trim() !== '') {
                        console.log("[DashboardContainer] Recovered API key from localStorage for", prov);
                        // Sync state opportunistically
                        setApiKeys(prev => ({ ...prev, ...parsed }));
                        return parsed[prov];
                    }
                }
            } catch (e) {
                console.warn("Failed to check localStorage for keys:", e);
            }
        }
        return undefined;
    };

    const handleAnalyze = async (forceRefresh: boolean = false) => {
        if (!searchQuery.trim()) {
            setSearchError("Please enter company name, position, and interview round.");
            return;
        }

        // Validate API key exists for the selected provider before starting
        const currentApiKey = checkApiKey(modelProvider);

        console.log("[DashboardContainer] handleAnalyze check:", {
            modelProvider,
            hasKey: !!currentApiKey,
            keyLength: currentApiKey?.length
        });

        if (!currentApiKey) {
            const providerName = modelProvider.charAt(0).toUpperCase() + modelProvider.slice(1);
            setSearchError(`No API key configured for ${providerName}. Please click the model switcher and configure your API key.`);
            // Open the API key config modal for the current provider
            console.log("[DashboardContainer] Opening modal due to missing key for:", modelProvider);
            setKeyConfigProvider(modelProvider);
            setKeyConfigOpen(true);
            return;
        }

        // Build config with the verified key (don't rely on stale state)
        const activeModelConfig: Partial<ProviderConfig> = {
            provider: modelProvider,
            model: modelId,
            apiKey: currentApiKey
        };

        console.log("[DashboardContainer] Using activeModelConfig:", {
            provider: activeModelConfig.provider,
            model: activeModelConfig.model,
            hasKey: !!activeModelConfig.apiKey
        });

        setSearchError(null);
        setLoading(true);
        setLoadingText("Parsing your query...");

        // Try quick parse first (instant, client-side)
        let parsed = quickParseSearchQuery(searchQuery);

        // If quick parse fails, try server-side LLM parsing with timeout
        if (!parsed) {
            try {
                parsed = await parseSearchQuery(searchQuery, activeModelConfig);
            } catch (e) {
                console.error("Parse failed:", e);
            }
        }

        if (!parsed) {
            setSearchError("Could not understand your query. Please enter in format: Company, Position, Round (e.g., Google, Software Engineer, Technical)");
            setLoading(false);
            return;
        }

        // Update parsed values
        setCompany(parsed.company);
        setPosition(parsed.position);
        setRound(parsed.round);

        // Use refs for current values (avoids stale closure issues)
        const currentResume = resumeRef.current || resume;
        const currentStories = storiesRef.current || stories;

        // Check cache first
        // Fix: Don't use cache if we have a resume but the cache has no match data (stale "Resume Required" state)
        const hasContext = currentResume.length > 20 || currentStories.length > 0;
        console.log("[DashboardContainer] Context check:", {
            resumeLength: currentResume.length,
            storiesCount: currentStories.length,
            hasContext,
            resumeStateLength: resume.length,
            resumeRefLength: resumeRef.current.length
        });

        // Skip Cache if forceRefresh is true
        if (!forceRefresh) {
            const cached = await loadEnhancedCache(parsed.company, parsed.position, parsed.round);
            const shouldUseCache = cached && (cached.hasContext === hasContext) && (!hasContext || (hasContext && cached.matchData));

            if (shouldUseCache && cached) {
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
                params.set('position', parsed.position);
                params.set('round', parsed.round);
                params.set('searched', 'true');
                router.push(`/?${params.toString()}`);
                return;
            }
        }


        // Check rate limit before making API calls (cache miss)
        const supabase = createClient();
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
            const rateLimitCheck = canMakeRequest(currentUser.id);
            if (!rateLimitCheck.allowed) {
                setSearchError(rateLimitCheck.message || "Rate limit exceeded");
                setLoading(false);
                return;
            }
            // Record this request for rate limiting
            recordRequest(currentUser.id);
        }

        const LOADING_MESSAGES = [
            "Analyzing company profile and culture...",
            "Reviewing job requirements...",
            "Identifying key interview themes...",
            "Formulating personalized strategy...",
            "Drafting potential interview questions...",
            "Designing technical challenges...",
            "Finalizing your interview plan..."
        ];

        setHasSearched(true);
        setViewState("loading");
        setLoading(true);
        setError(null);
        setProgress(5);

        let messageIndex = 0;
        setLoadingText(LOADING_MESSAGES[0]);

        // Simulated progress interval
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                // Slower progress as it gets higher, capping at 90%
                if (prev >= 90) return 90;
                const increment = prev < 50 ? 5 : 2;
                return prev + increment;
            });

            // Rotate messages every few ticks (approx every 3s)
            if (Date.now() % 3000 < 500 && messageIndex < LOADING_MESSAGES.length - 1) {
                messageIndex++;
                setLoadingText(LOADING_MESSAGES[messageIndex]);
            }
        }, 800);

        const storiesText = getStoriesContext();
        try {
            // Generate Interview Plan (Batched Backend Action)
            // This replaces the complex sequential frontend logic with a robust backend orchestrator
            setLoadingText("Generating comprehensive interview plan...");

            const settings = {
                modelConfig: activeModelConfig,
                prepSettings
            };

            const result = await generateInterviewPlan(
                parsed.company,
                parsed.position,
                parsed.round,
                currentResume,
                storiesText,
                settings,
                forceRefresh
            );

            if (result.error) {
                throw new Error(result.error);
            }

            // Batch State Updates
            if (result.reconData) setReconData(result.reconData);
            if (result.matchData) setMatchData(result.matchData);
            if (result.questionsData) setQuestionsData(result.questionsData);
            if (result.reverseData) setReverseData(result.reverseData);
            if (result.technicalData) setTechnicalData(result.technicalData);
            if (result.codingChallenge) setCodingChallenge(result.codingChallenge);
            if (result.systemDesignData) setSystemDesignData(result.systemDesignData);

            if (result.fromCache) {
                console.log("[Dashboard] Loaded full plan from Server Cache");
            } else {
                console.log("[Dashboard] Generated new plan from Server");
            }

            // Sync State for Persistence
            const newState = {
                searchQuery: searchQuery,
                company: parsed.company,
                position: parsed.position,
                round: parsed.round,
                reconData: result.reconData,
                matchData: result.matchData,
                questionsData: result.questionsData,
                reverseData: result.reverseData,
                technicalData: result.technicalData,
                codingChallenge: result.codingChallenge,
                systemDesignData: result.systemDesignData,
                hasSearched: true,
                loading: false,
                viewState: "dashboard",
                timestamp: Date.now()
            };
            localStorage.setItem('dashboard_state', JSON.stringify(newState));

            setHasSearched(true);
            setViewState("dashboard");
            setHasSearched(true);
            setViewState("dashboard");
            setLoading(false);
            setProgress(100);

            // Clear simulated progress
            clearInterval(progressInterval);

            // Update URL
            const params = new URLSearchParams();
            params.set('company', parsed.company);
            params.set('position', parsed.position);
            params.set('round', parsed.round);
            params.set('searched', 'true');
            router.push(`/?${params.toString()}`);

        } catch (e: unknown) {
            console.error("[DashboardContainer] Analysis Error:", e);

            let errorMessage = "Analysis failed due to an unexpected error.";

            if (e instanceof Error) {
                errorMessage = e.message;
            } else if (typeof e === "string") {
                errorMessage = e;
            } else if (typeof e === "object" && e && "error" in e) {
                errorMessage = String((e as any).error);
            } else if (typeof e === "object" && e && "message" in e) {
                errorMessage = String((e as any).message);
            }

            setError(errorMessage);
            setViewState("error");
            setLoading(false); // Ensure loading is off
            clearInterval(progressInterval); // Clear on error
        } finally {
            setLoading(false);
            setProgress(100); // Ensure progress completes
            setLoadingText("");
            clearInterval(progressInterval); // Clear in finally block too for safety
            console.log("[DashboardContainer] handleAnalyze complete");
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

            Task: Write a COMPREHENSIVE, DETAILED "Tell me about yourself" script.
            
            CRITICAL INSTRUCTIONS:
            1. **Length Goal**: 450-600 words (3-4 minutes spoken). THIS MUST BE LONG AND DETAILED.
            2. **Structure (4 Distinct Sections)**:
               - **Paragraph 1 (The Foundation)**: Education & early career context. Set the stage detailedly. (~80-100 words)
               - **Paragraph 2 (The Growth)**: Middleware/earlier relevant roles. Don't just list titles—explain *challenges* and *wins*. (~120-150 words)
               - **Paragraph 3 (The Peak)**: Most recent/senior roles. Deep dive into specific projects, leadership, and impact. Highlight: ${entitiesStr}. (~120-150 words)
               - **Paragraph 4 ( The Alignment)**: Why you are here. Connect your specific "Peak" skills to [Company]'s mission/product. (~80-100 words)
            3. **Style**: Conversational but professional. "Let me walk you through my journey..."
            4. **CRITICAL**: Do NOT summarize. EXPAND on your points.
            5. **FIRST PERSON**: "I started..."

            STRICT RULES:
            - **Data Source**: Use ONLY the Resume/Stories for candidate facts.
            - **Relevance**: Focus on experience relevant to ${position}. 
            - **NO NUMBERS/METRICS**: Do NOT include specific figures, percentages, or KPIs.

            Return JSON: {
                "headline": "A punchy 5-8 word headline summarizing the candidate's fit",
                "reasoning": "The full first-person script in markdown format (combine all 4 paragraphs into one text)"
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
        // Pass true for uniqueness, use prepSettings.questions for count
        const res = await fetchQuestions(company, position, round, modelConfig, true, prepSettings.questions);
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

                CRITICAL INSTRUCTIONS - DATA & SPECIFICS:
                1. EXTRACT EXACT NUMBERS from the resume/stories: percentages (25%, 40%), dollar amounts ($50K, $1M), timeframes (3 months, 2 weeks), team sizes (5 engineers, 12 people), user counts (10K users, 1M DAU).
                2. If the resume mentions "improved performance" - find the actual number or estimate based on context (e.g., "reduced latency by approximately 30%").
                3. NEVER use vague phrases like "significantly improved", "greatly enhanced", "substantial impact". ALWAYS quantify.
                4. The Result section MUST contain at least 2-3 specific metrics or outcomes.
                5. Reference specific technologies, tools, or methodologies mentioned in the resume.

                ANTI-VAGUENESS RULES:
                - BAD: "Led a team to improve the system"
                - GOOD: "Led a team of 5 engineers over 3 months to reduce API latency from 800ms to 200ms"
                - BAD: "Increased revenue significantly"
                - GOOD: "Increased conversion rate by 18%, adding $2.3M in annual revenue"

                If exact numbers aren't in the resume, use reasonable estimates with qualifiers like "approximately" or "roughly" - but NEVER leave metrics out entirely.

                FORMAT YOUR RESPONSE AS:
                **Situation:** [2-3 sentences with specific context - team size, company stage, timeline]
                **Task:** [1-2 sentences with clear, measurable objective]
                **Action:** [3-5 sentences with specific technical/strategic steps taken]
                **Result:** [2-3 sentences with QUANTIFIED impact - percentages, dollar amounts, time saved, users impacted. THIS IS MANDATORY.]
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

                Task: Provide a structured PM interview answer with SPECIFIC DATA AND METRICS.

                CRITICAL - DATA REQUIREMENTS:
                1. When discussing metrics, use SPECIFIC numbers (e.g., "target 15% increase in DAU", "reduce churn from 8% to 5%")
                2. When estimating market size or impact, show your math (e.g., "10M users × $5 ARPU = $50M TAM")
                3. When prioritizing, assign actual scores or percentages
                4. Reference specific examples from your experience with real metrics
                5. NEVER use vague terms like "significant", "substantial", "many users" - QUANTIFY everything

                FORMAT YOUR RESPONSE WITH CLEAR SECTIONS:
                ${framework === 'CIRCLES' ? `
                **Comprehend:** Clarify the question and constraints (include specific user segments, market size)
                **Identify:** Identify the user and their needs (with % breakdown of user types)
                **Report:** Report user needs and pain points (quantify impact)
                **Cut:** Prioritize the most important needs (use a scoring framework)
                **List:** List potential solutions (with estimated effort/impact)
                **Evaluate:** Evaluate trade-offs (compare with specific metrics)
                **Summarize:** Recommend with expected outcomes (target metrics)
                ` : framework === 'RICE' ? `
                **Reach:** How many users affected? (specific numbers)
                **Impact:** What's the impact per user? (1-3 scale with rationale)
                **Confidence:** How confident are we? (% with data sources)
                **Effort:** How much work is required? (person-weeks/months)
                **Prioritization:** Final score and recommendation
                ` : `
                **Understanding:** Clarify the problem (with specific constraints and metrics)
                **Analysis:** Break down the key factors (with data points)
                **Approach:** Your proposed solution (with timeline and milestones)
                **Trade-offs:** Consider alternatives (with quantified comparison)
                **Metrics:** Success metrics with specific targets (e.g., "increase retention from 60% to 75%")
                `}

                Reference the candidate's past experience with specific results where relevant.
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

                Task: Provide a structured case study answer with SPECIFIC DATA AND METRICS throughout.

                CRITICAL - DATA REQUIREMENTS:
                1. When estimating, show your math explicitly (e.g., "1M users × 10% conversion × $50 = $5M")
                2. Use specific numbers for all assumptions (not "many" or "some" - use "approximately 500K" or "roughly 15%")
                3. Provide concrete timelines (not "soon" - use "within 3 months" or "by Q2")
                4. Reference specific metrics from your experience when drawing parallels

                FORMAT YOUR RESPONSE AS:
                **Clarifying Questions:** What would you ask? (with why each matters for the analysis)
                **Framework:** Structure your analysis (with specific categories and weightings)
                **Analysis:** Key insights with DATA POINTS (market sizes, growth rates, conversion rates, costs)
                **Recommendation:** Your proposed solution with EXPECTED OUTCOMES (target metrics, ROI estimate, timeline)
                **Next Steps:** Implementation plan with specific milestones and success criteria

                Draw from the candidate's experience with SPECIFIC RESULTS where relevant.
            `;
            return generateGenericText(prompt, modelConfig);
        }

        const prompt = `
            Context: Interview at ${company} for ${position}.
            Question: "${questionText}"
            Category: ${category}
            ${keyPoints.length > 0 ? `Key points to address: ${keyPoints.join(', ')}` : ''}
            Full Resume & Data: ${getFullContext()}

            Task: Provide a well-structured, comprehensive answer to this interview question.

            CRITICAL - DATA REQUIREMENTS:
            1. EXTRACT AND USE specific numbers from the resume/stories: percentages, dollar amounts, timeframes, team sizes, user counts
            2. NEVER use vague phrases like "significantly improved" or "greatly enhanced" - ALWAYS quantify
            3. If exact numbers aren't available, use reasonable estimates with "approximately" or "roughly"
            4. Include at least 2-3 specific metrics or data points in your answer

            FORMAT YOUR RESPONSE WITH:
            - Clear structure using **bold headers**
            - Bullet points where appropriate
            - SPECIFIC examples with DATA (numbers, percentages, timeframes)
            - Quantified outcomes and results
            - Keep it concise but thorough
        `;
        return generateGenericText(prompt, modelConfig);
    };

    // Auto-analyze if we have search params but missing data (e.g. from URL restore or Resume addition)
    useEffect(() => {
        if (!hasSearched) return;
        if (loading) return;
        if (viewState === 'error') return;

        const hasResume = resume.length > 20;
        const missingMatch = hasResume && !matchData;
        const noData = viewState === 'empty';

        // Only auto-trigger if we need data
        if (missingMatch || noData) {
            // Debounce slightly to ensure state is settled
            const timer = setTimeout(() => {
                handleAnalyze();
            }, 100);
            return () => clearTimeout(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resume.length, hasSearched, matchData, viewState, loading]);



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
        Return JSON: { "reverse_questions": [{ "type": "Category Name", "question": "The question text" }] }
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
        // Clear cache
        const keys = Object.keys(sessionStorage);
        keys.forEach(key => {
            if (key.startsWith('interview-os-cache-')) {
                sessionStorage.removeItem(key);
            }
        });
        localStorage.removeItem('dashboard_state');

        // Reset all state
        setSearchQuery("");
        setCompany("");
        setPosition("");
        setRound("");
        setJobUrl("");
        setJobContext("");
        setReconData(null);
        setMatchData(null);
        setQuestionsData(null);
        setReverseData(null);
        setTechnicalData(null);
        setCodingChallenge(null);
        setSystemDesignData(null);
        setHasSearched(false);
        setViewState("empty");
        setSearchError(null);
        router.push("/");
    };

    const handleModelChange = async (provider: 'groq' | 'gemini' | 'openai', model: string) => {
        // Check if the new provider has an API key configured
        const hasKey = apiKeys[provider] && apiKeys[provider]!.trim() !== '';

        if (!hasKey) {
            // Open the API key config modal for the new provider
            const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
            setSearchError(`No API key configured for ${providerName}. Please configure it to use this provider.`);
            setKeyConfigProvider(provider);
            setKeyConfigOpen(true);
            // Still update the selection so user knows what they picked
        }

        setModelProvider(provider);
        setModelId(model);

        // Persist to database/localStorage
        const compositeModel = `${provider}:${model}`;
        try {
            const res = await updateModelSettings("", compositeModel); // Empty key means keep existing

            if (res.error && res.error === "Unauthorized") {
                // Guest mode: save to localStorage
                localStorage.setItem('guest_model', compositeModel);
            }
        } catch (e) {
            console.error("Failed to save model settings:", e);
        }
    };

    // API Key Configuration
    const handleConfigureKey = (provider: 'groq' | 'gemini' | 'openai') => {
        setKeyConfigProvider(provider);
        setKeyConfigOpen(true);
    };

    const handleSaveApiKey = async (provider: 'groq' | 'gemini' | 'openai', key: string) => {
        console.log("[DashboardContainer] handleSaveApiKey called for:", provider);
        const newKeys = { ...apiKeys, [provider]: key };

        // Update state immediately
        setApiKeys(newKeys);

        // Always save to localStorage for immediate availability & backup
        localStorage.setItem('guest_api_keys', JSON.stringify(newKeys));
        console.log("[DashboardContainer] Saved to localStorage");

        // Get fresh user data from Supabase (don't rely on potentially stale state)
        const supabase = createClient();
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        // Save to database (priority for persistence)
        if (currentUser?.id) {
            try {
                console.log("[DashboardContainer] Saving to database for user:", currentUser.id);

                const result = await Promise.race([
                    saveProviderApiKeys(newKeys),
                    new Promise<{ error: string }>((_, reject) =>
                        setTimeout(() => reject(new Error("Save timed out after 10s")), 10000)
                    )
                ]);

                if (result && 'error' in result && result.error) {
                    console.error("[DashboardContainer] DB save failed:", result.error);
                    // localStorage still has the backup
                } else {
                    console.log("[DashboardContainer] DB save successful - keys are persisted");
                }
            } catch (error) {
                console.error("[DashboardContainer] DB save error:", error);
                // localStorage still has the backup
            }
        } else {
            console.log("[DashboardContainer] Guest mode - keys saved to localStorage only");
        }
    };


    const [isRegeneratingAll, setIsRegeneratingAll] = useState(false);

    const handleRegenerateAll = async () => {
        if (isRegeneratingAll || !company || !position || !round) return;

        setIsRegeneratingAll(true);
        try {
            // Clear sessionStorage caches
            const keys = Object.keys(sessionStorage);
            keys.forEach(key => {
                if (key.startsWith('interview-os-cache-')) {
                    sessionStorage.removeItem(key);
                }
            });

            // Re-run the full analysis
            await handleAnalyze();
        } catch (e) {
            console.error("Regenerate all failed:", e);
        } finally {
            setIsRegeneratingAll(false);
        }
    };

    if (!isAuthChecked) {
        return <LoadingState message="Verifying session..." />;
    }

    // Removed blocking check for user/guest to allow open access

    if (!hasSearched) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background transition-all duration-500">
                {/* Top Right Actions */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                    <ModelSwitcher
                        provider={modelProvider}
                        model={modelId}
                        onModelChange={handleModelChange}
                        apiKeys={apiKeys}
                        onConfigureKey={handleConfigureKey}
                    />
                    <NavMenu
                        user={user}
                        onSignInClick={() => setAuthPopoverOpen(true)}
                        onSignOut={async () => {
                            localStorage.clear();
                            const supabase = createClient();
                            await supabase.auth.signOut();
                            router.refresh();
                        }}
                    />
                    <AuthPopover open={authPopoverOpen} onOpenChange={setAuthPopoverOpen} showTrigger={false} />
                </div>

                {/* Main Content - Centered Search */}
                <div className={`w-full max-w-2xl transition-all duration-500 ${loading ? 'opacity-50' : ''}`}>
                    {/* Title */}
                    <div className="mb-12 text-center">
                        <h1 className="text-[56px] font-semibold tracking-tighter leading-none mb-3">
                            Intervu
                        </h1>
                        <p className="text-muted-foreground text-base">
                            Your job application workspace
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
                            className="h-14 text-base border-border/50 focus-visible:border-foreground bg-transparent pl-12 pr-14 transition-colors"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                            autoFocus
                            disabled={loading}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <PrepSettings
                                settings={prepSettings}
                                onChange={setPrepSettings}
                                jobUrl={jobUrl}
                                onJobUrlChange={setJobUrl}
                                jobContext={jobContext}
                                onJobContextChange={setJobContext}
                                isFetchingJob={isFetchingJob}
                                onFetchJobContext={handleFetchJobContext}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-1 mb-6">
                        <p className="text-muted-foreground/60 text-xs font-medium tracking-wide">
                            Enter company name, position, and interview round — the AI will understand natural language
                        </p>
                    </div>

                    {/* Error Message */}
                    {searchError && (
                        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm mb-4 animate-in fade-in slide-in-from-top-1">
                            <WarningCircle size={18} weight="fill" />
                            <span>{searchError}</span>
                        </div>
                    )}

                    {/* Action Button */}
                    <Button
                        onClick={() => handleAnalyze(false)}
                        disabled={loading}
                        className="h-14 w-full bg-slate-900 text-white hover:bg-slate-800 font-medium text-lg shadow-sm mt-12 transition-all hover:scale-[1.01] active:scale-[0.99]"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin"></div>
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

                {/* API Key Configuration Modal */}
                <ApiKeyConfigModal
                    open={keyConfigOpen}
                    onOpenChange={setKeyConfigOpen}
                    provider={keyConfigProvider}
                    currentKey={apiKeys[keyConfigProvider]}
                    onSave={handleSaveApiKey}
                />
            </div >
        );
    }



    // ... existing code ...

    return (
        <PageLayout
            fullWidth
            header={
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
                    onOpenSidebar={() => setIsMobileSidebarOpen(true)}
                    modelProvider={modelProvider}
                    modelId={modelId}
                    onModelChange={handleModelChange}
                    apiKeys={apiKeys}
                    onConfigureKey={handleConfigureKey}
                    onRegenerateAll={viewState === "dashboard" ? handleRegenerateAll : undefined}
                    isRegeneratingAll={isRegeneratingAll}
                    prepSettings={prepSettings}
                    onPrepSettingsChange={setPrepSettings}
                    jobUrl={jobUrl}
                    onJobUrlChange={setJobUrl}
                    jobContext={jobContext}
                    onJobContextChange={setJobContext}
                    isFetchingJob={isFetchingJob}
                    onFetchJobContext={handleFetchJobContext}
                />
            }
            className="w-full"
        >
            {viewState === "empty" && (
                <>
                    <PrivacyNotice />
                    <EmptyState />
                </>
            )}
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
                    <div className="border border-destructive/20 bg-destructive/5 text-destructive px-6 py-5 rounded-lg max-w-lg w-full">
                        <h3 className="font-semibold text-base mb-2 text-center">Analysis Error</h3>
                        <p className="text-sm opacity-90 mb-4 text-center">{error || "Something went wrong."}</p>

                        {/* Action buttons */}
                        <div className="flex flex-col gap-2">
                            <Button
                                variant="outline"
                                className="w-full bg-background hover:bg-destructive/5 border-destructive/20"
                                onClick={() => {
                                    setError(null);
                                    setViewState("empty");
                                    handleAnalyze();
                                }}
                            >
                                Try Again
                            </Button>

                            {/* Offer to switch providers if the error suggests it */}
                            {(error?.toLowerCase().includes("rate limit") ||
                                error?.toLowerCase().includes("quota") ||
                                error?.toLowerCase().includes("timeout") ||
                                error?.toLowerCase().includes("switch")) && (
                                    <div className="pt-2 border-t border-destructive/10">
                                        <p className="text-xs text-muted-foreground mb-2 text-center">Try a different provider:</p>
                                        <div className="flex gap-2 justify-center">
                                            {modelProvider !== 'groq' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-xs"
                                                    onClick={() => {
                                                        if (apiKeys.groq) {
                                                            handleModelChange('groq', 'llama-3.3-70b-versatile');
                                                            setError(null);
                                                            setViewState("empty");
                                                            setTimeout(() => handleAnalyze(), 100);
                                                        } else {
                                                            handleConfigureKey('groq');
                                                        }
                                                    }}
                                                >
                                                    {apiKeys.groq ? 'Switch to Groq' : 'Setup Groq'}
                                                </Button>
                                            )}
                                            {modelProvider !== 'gemini' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-xs"
                                                    onClick={() => {
                                                        if (apiKeys.gemini) {
                                                            handleModelChange('gemini', 'gemini-flash-latest');
                                                            setError(null);
                                                            setViewState("empty");
                                                            setTimeout(() => handleAnalyze(), 100);
                                                        } else {
                                                            handleConfigureKey('gemini');
                                                        }
                                                    }}
                                                >
                                                    {apiKeys.gemini ? 'Switch to Gemini' : 'Setup Gemini'}
                                                </Button>
                                            )}
                                            {modelProvider !== 'openai' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-xs"
                                                    onClick={() => {
                                                        if (apiKeys.openai) {
                                                            handleModelChange('openai', 'gpt-4o-mini');
                                                            setError(null);
                                                            setViewState("empty");
                                                            setTimeout(() => handleAnalyze(), 100);
                                                        } else {
                                                            handleConfigureKey('openai');
                                                        }
                                                    }}
                                                >
                                                    {apiKeys.openai ? 'Switch to OpenAI' : 'Setup OpenAI'}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}

                            {/* Show configure key button if error is about missing/invalid key */}
                            {(error?.toLowerCase().includes("api key") ||
                                error?.toLowerCase().includes("unauthorized") ||
                                error?.toLowerCase().includes("invalid")) && (
                                    <Button
                                        variant="default"
                                        className="w-full"
                                        onClick={() => handleConfigureKey(modelProvider)}
                                    >
                                        <Gear size={16} className="mr-2" />
                                        Configure {modelProvider.charAt(0).toUpperCase() + modelProvider.slice(1)} API Key
                                    </Button>
                                )}

                            <Button
                                variant="ghost"
                                className="w-full text-muted-foreground"
                                onClick={() => setViewState("empty")}
                            >
                                Go Back
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {viewState === "dashboard" && (
                <div className="w-full px-6 md:px-8 pt-4 pb-8 animate-in fade-in duration-500">
                    {/* Three-Column Layout: Sidebar | Main | Recon */}
                    <div className="flex flex-col lg:flex-row gap-4 relative">
                        {/* Left Sidebar - Navigation */}
                        <DashboardSidebar
                            activeSection={activeSection}
                            onSelectSection={setActiveSection}
                            sections={[
                                // Strategy Section - Always show, will display error if no resume
                                { id: "section-match", label: "Strategy", icon: UserIcon },
                                { id: "section-questions", label: "Questions", icon: ChatCircleDots },
                                // Show technical tabs immediately for technical roles (optimistic rendering)
                                ...(isTechnicalRole || technicalData ? [{ id: "section-knowledge", label: "Knowledge", icon: GraduationCap }] : []),
                                ...(isTechnicalRole || codingChallenge ? [{ id: "section-coding", label: "Coding Workspace", icon: Code }] : []),
                                { id: "section-reverse", label: "Reverse Questions", icon: Question }
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
                            isOpen={isMobileSidebarOpen}
                            onClose={() => setIsMobileSidebarOpen(false)}
                        />

                        {/* Center Column - Interview Content */}
                        <div className="flex-1 min-w-0 space-y-8">

                            {/* Context Badges - Indicators of what's fueling the AI */}
                            <div className="flex items-center gap-2 px-1">
                                {resume && resume.length > 50 && (
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-100/50 shadow-sm">
                                        <FileText size={12} weight="fill" />
                                        <span>Resume Context</span>
                                    </div>
                                )}
                                {jobContext && jobContext.length > 20 && (
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium border border-emerald-100/50 shadow-sm">
                                        <LinkIcon size={12} weight="bold" />
                                        <span>Job Post Context</span>
                                    </div>
                                )}
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-[10px] font-medium border border-purple-100/50 shadow-sm">
                                    <Globe size={12} weight="fill" />
                                    <span>Web Knowledge</span>
                                </div>
                            </div>

                            {/* Match Section - Always mounted, hidden when not active */}
                            <div
                                id="section-match"
                                className={activeSection === "section-match" ? "animate-in fade-in slide-in-from-bottom-4 duration-500" : "hidden"}
                            >
                                {matchData ? (
                                    <MatchSection
                                        data={matchData}
                                        onAddMatch={handleAddMatch}
                                        onRemoveMatch={handleRemoveMatch}
                                        allowedMatches={resumeCompanies}
                                        jobContext={jobContext}
                                    />
                                ) : loading || isRegeneratingMatch ? (
                                    /* Loading state - show skeleton while fetching */
                                    <SectionLoader message="Generating your personalized match strategy..." />
                                ) : resume.length > 20 ? (
                                    /* Has resume but no match data - something went wrong */
                                    <section className="animate-in fade-in pt-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand">
                                                <UserIcon size={20} weight="fill" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-semibold">Match Strategy</h2>
                                                <p className="text-sm text-muted-foreground">Your pitch, tailored to the role</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center justify-center py-8 px-6 bg-muted/20 rounded-xl border border-dashed border-border">
                                            <p className="text-sm text-muted-foreground text-center mb-4">
                                                Strategy not generated yet. Click below to generate a personalized match strategy.
                                            </p>
                                            <Button
                                                variant="default"
                                                onClick={async () => {
                                                    if (!company || !position || !round) return;
                                                    setIsRegeneratingMatch(true);
                                                    try {
                                                        const storiesText = getStoriesContext();
                                                        // Pass empty array for companies to allow AI to select best matches
                                                        const res = await fetchMatch(company, position, round, resume, storiesText, getSourcesContext(), jobContext, modelConfig, []);
                                                        if (res.data) setMatchData(res.data);
                                                    } catch (e) {
                                                        console.error("Failed to generate match:", e);
                                                    } finally {
                                                        setIsRegeneratingMatch(false);
                                                    }
                                                }}
                                                disabled={isRegeneratingMatch}
                                            >
                                                {isRegeneratingMatch ? "Generating..." : "Generate Strategy"}
                                            </Button>
                                        </div>
                                    </section>
                                ) : (
                                    /* No resume - show prompt to add one */
                                    <section className="animate-in fade-in pt-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand">
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
                                                Add your resume in the Resume Builder to generate a personalized match strategy for this role.
                                            </p>
                                            <Link href="/resume-builder">
                                                <Button variant="default">
                                                    <FileText size={16} className="mr-2" />
                                                    Go to Resume Builder
                                                </Button>
                                            </Link>
                                        </div>
                                    </section>
                                )}
                            </div>

                            {/* Questions Grid - Always mounted, hidden when not active */}
                            <div
                                id="section-questions"
                                className={activeSection === "section-questions" ? "animate-in fade-in slide-in-from-bottom-4 duration-500" : "hidden"}
                            >
                                {questionsData ? (
                                    <QuestionsGrid
                                        questions={[
                                            ...questionsData.questions,
                                            ...(systemDesignData?.questions || [])
                                        ]}
                                        onGenerateStrategy={handleGenerateStrategy}
                                        company={company}
                                        position={position}
                                        round={round}
                                    />
                                ) : (
                                    <SectionLoader message="Loading interview questions..." />
                                )}
                            </div>

                            {/* Technical Knowledge Section - Always mounted when applicable */}
                            {(isTechnicalRole || technicalData) && (
                                <div
                                    id="section-knowledge"
                                    className={activeSection === "section-knowledge" ? "animate-in fade-in slide-in-from-bottom-4 duration-500" : "hidden"}
                                >
                                    {technicalData ? (
                                        <>
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand">
                                                    <GraduationCap size={20} weight="fill" />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-semibold">Technical Knowledge</h2>
                                                    <p className="text-sm text-muted-foreground">Key concepts to review for this role</p>
                                                </div>
                                            </div>
                                            <KnowledgeSection
                                                data={technicalData}
                                                onExplain={async (q) => {
                                                    return await explainTechnicalConcept(q);
                                                }}
                                            />
                                        </>
                                    ) : (
                                        <SectionLoader message="Loading technical knowledge areas..." />
                                    )}
                                </div>
                            )}

                            {/* Coding Live Workspace - Always mounted when applicable */}
                            {(isTechnicalRole || codingChallenge) && (
                                <div
                                    id="section-coding"
                                    className={activeSection === "section-coding" ? "animate-in fade-in slide-in-from-bottom-4 duration-500" : "hidden"}
                                >
                                    {codingChallenge ? (
                                        <>
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand">
                                                    <Code size={20} weight="fill" />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-semibold">Coding Workspace</h2>
                                                    <p className="text-sm text-muted-foreground">Practice coding challenges in a live environment</p>
                                                </div>
                                            </div>
                                            <CodingWorkspace challenge={codingChallenge} />
                                        </>
                                    ) : (
                                        <SectionLoader message="Generating coding challenge..." />
                                    )}
                                </div>
                            )}

                            {/* Reverse Questions - Always mounted */}
                            <div
                                id="section-reverse"
                                className={activeSection === "section-reverse" ? "animate-in fade-in slide-in-from-bottom-4 duration-500" : "hidden"}
                            >
                                {reverseData ? (
                                    <ReverseQuestions
                                        questions={reverseData.reverse_questions}
                                    />
                                ) : (
                                    <SectionLoader message="Generating questions to ask the interviewer..." />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ContextModal
                isOpen={isContextOpen}
                onClose={() => setIsContextOpen(false)}
                context={context}
                setContext={setContext}
                onSave={handleSaveContext}
            />

            {/* API Key Configuration Modal */}
            <ApiKeyConfigModal
                open={keyConfigOpen}
                onOpenChange={setKeyConfigOpen}
                provider={keyConfigProvider}
                currentKey={apiKeys[keyConfigProvider]}
                onSave={handleSaveApiKey}
            />
        </PageLayout>
    );
}
