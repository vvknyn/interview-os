/**
 * Curated Product Management Question Bank
 * Inspired by Lewis Lin's "Decode and Conquer" and PM interview frameworks
 */

export interface PMQuestion {
    id: string;
    category: 'product-sense' | 'estimation' | 'strategy' | 'execution' | 'behavioral' | 'technical' | 'design';
    difficulty: 'junior' | 'mid' | 'senior' | 'director+';
    question: string;
    topics: string[];
    framework?: 'CIRCLES' | 'RICE' | 'AARRR' | 'HEART' | 'BML' | 'ROOT-CAUSE';
    keyPoints: string[];
    commonPitfalls?: string[];
}

/**
 * PRODUCT SENSE: Understanding user needs and product thinking
 */
const productSenseQuestions: PMQuestion[] = [
    {
        id: 'ps-001',
        category: 'product-sense',
        difficulty: 'mid',
        question: 'How would you improve Instagram Stories?',
        topics: ['product improvement', 'user research', 'metrics'],
        framework: 'CIRCLES',
        keyPoints: [
            'Clarify: What type of user? Creators vs consumers?',
            'Identify pain points: Discovery, engagement, creation friction',
            'Prioritize: Use RICE or impact/effort matrix',
            'Propose solutions with clear user benefit',
            'Define success metrics: Engagement rate, time spent, completion rate'
        ],
        commonPitfalls: ['Jumping to solutions without understanding users', 'Not defining success metrics']
    },
    {
        id: 'ps-002',
        category: 'product-sense',
        difficulty: 'senior',
        question: 'Should Amazon launch a social network? Why or why not?',
        topics: ['product strategy', 'market analysis', 'competitive landscape'],
        framework: 'CIRCLES',
        keyPoints: [
            'Analyze Amazon\'s core competencies and mission',
            'Identify potential synergies with existing products',
            'Evaluate competitive landscape and differentiation',
            'Consider build vs buy vs partner options',
            'Assess risks: Brand dilution, execution complexity'
        ],
        commonPitfalls: ['Not considering Amazon\'s existing social features', 'Ignoring competitive moats']
    },
    {
        id: 'ps-003',
        category: 'product-sense',
        difficulty: 'mid',
        question: 'Design a product for elderly people to stay connected with family.',
        topics: ['product design', 'user empathy', 'accessibility'],
        framework: 'CIRCLES',
        keyPoints: [
            'User research: Physical limitations, tech familiarity, emotional needs',
            'Simplicity is key: Large buttons, voice interface, minimal steps',
            'Consider caregivers as secondary users',
            'Focus on photo/video sharing, health updates, scheduling',
            'Privacy and safety considerations'
        ],
        commonPitfalls: ['Assuming elderly users can\'t learn technology', 'Over-complicating the interface']
    },
    {
        id: 'ps-004',
        category: 'product-sense',
        difficulty: 'junior',
        question: 'How would you prioritize features for the next release of a mobile app?',
        topics: ['prioritization', 'roadmap', 'stakeholder management'],
        framework: 'RICE',
        keyPoints: [
            'Gather inputs: User feedback, data analysis, business goals',
            'Use RICE: Reach, Impact, Confidence, Effort',
            'Balance quick wins with strategic bets',
            'Consider dependencies and technical debt',
            'Communicate trade-offs to stakeholders'
        ],
        commonPitfalls: ['Only focusing on loudest customer requests', 'Ignoring technical considerations']
    },
    {
        id: 'ps-005',
        category: 'product-sense',
        difficulty: 'senior',
        question: 'Your key metric dropped 20% this week. How do you investigate?',
        topics: ['metrics analysis', 'root cause analysis', 'debugging'],
        framework: 'ROOT-CAUSE',
        keyPoints: [
            'Clarify the metric and time range',
            'Check for external factors: Seasonality, competition, market changes',
            'Segment the data: By user type, platform, geography',
            'Review recent changes: Releases, experiments, pricing',
            'Formulate hypotheses and validate with data',
            'Communicate findings and action plan'
        ],
        commonPitfalls: ['Jumping to conclusions', 'Not considering seasonality', 'Ignoring external factors']
    }
];

/**
 * ESTIMATION: Market sizing and Fermi problems
 */
const estimationQuestions: PMQuestion[] = [
    {
        id: 'est-001',
        category: 'estimation',
        difficulty: 'junior',
        question: 'How many Uber rides are completed in San Francisco per day?',
        topics: ['market sizing', 'estimation', 'assumptions'],
        keyPoints: [
            'Population of SF: ~900K, metro area ~4.7M',
            'Estimate ridership rate: What % uses rideshare?',
            'Frequency: How often per week?',
            'Adjustments: Tourists, commuters, events',
            'Sanity check against known data points'
        ],
        commonPitfalls: ['Not stating assumptions clearly', 'Forgetting to sanity check']
    },
    {
        id: 'est-002',
        category: 'estimation',
        difficulty: 'mid',
        question: 'Estimate the revenue of Spotify in the US.',
        topics: ['revenue estimation', 'business model', 'market analysis'],
        keyPoints: [
            'User base: ~180M US users (estimate % of 330M population)',
            'Premium conversion: ~45% are premium subscribers',
            'ARPU: $10/month individual, $15 family, $5 student',
            'Ad revenue from free tier',
            'Show math clearly: Users × ARPU × 12 months'
        ],
        commonPitfalls: ['Forgetting different subscription tiers', 'Ignoring ad revenue']
    },
    {
        id: 'est-003',
        category: 'estimation',
        difficulty: 'senior',
        question: 'How much does Google make from Google Maps?',
        topics: ['revenue streams', 'B2B vs B2C', 'platform economics'],
        keyPoints: [
            'Direct revenue: Google Maps Platform API (businesses)',
            'Indirect revenue: Local search ads, driving traffic to Search',
            'Strategic value: Data for self-driving, competitive moat',
            'Estimate API revenue: # of businesses × API calls × pricing',
            'Estimate ad attribution from Maps to Search'
        ],
        commonPitfalls: ['Only considering direct revenue', 'Missing strategic value']
    }
];

/**
 * STRATEGY: Business strategy and competitive analysis
 */
const strategyQuestions: PMQuestion[] = [
    {
        id: 'str-001',
        category: 'strategy',
        difficulty: 'senior',
        question: 'What should Netflix\'s strategy be for the next 5 years?',
        topics: ['business strategy', 'competitive analysis', 'market trends'],
        keyPoints: [
            'Current position: Content library, subscriber base, global reach',
            'Threats: Disney+, HBO Max, ad-supported tiers, password sharing',
            'Opportunities: Gaming, live sports, international expansion',
            'Strategic options: Vertical integration, ad tier, partnerships',
            'Recommendation with clear rationale'
        ],
        commonPitfalls: ['Not acknowledging competitive pressures', 'Vague recommendations']
    },
    {
        id: 'str-002',
        category: 'strategy',
        difficulty: 'director+',
        question: 'You\'re the CEO of Airbnb. What\'s your 3-year strategy?',
        topics: ['executive strategy', 'market expansion', 'platform dynamics'],
        keyPoints: [
            'Strengthen core: Trust & safety, host quality, experiences',
            'Expand TAM: Long-term stays, business travel, experiences',
            'Defensive moats: Supply relationships, brand, network effects',
            'New bets: Airbnb-managed properties, travel fintech',
            'Operational excellence: Profitability, efficiency'
        ],
        commonPitfalls: ['Ignoring regulatory challenges', 'Not prioritizing initiatives']
    },
    {
        id: 'str-003',
        category: 'strategy',
        difficulty: 'mid',
        question: 'How would you launch a competitor to Slack?',
        topics: ['go-to-market', 'competitive strategy', 'differentiation'],
        keyPoints: [
            'Identify Slack\'s weaknesses: Price, complexity, enterprise features',
            'Target segment: SMB vs Enterprise vs specific verticals',
            'Differentiation: Integration depth, pricing, specific use cases',
            'GTM strategy: Freemium, PLG, enterprise sales',
            'Success metrics and milestones'
        ],
        commonPitfalls: ['Underestimating switching costs', 'Not defining clear differentiation']
    }
];

/**
 * EXECUTION: Getting things done, working with teams
 */
const executionQuestions: PMQuestion[] = [
    {
        id: 'exe-001',
        category: 'execution',
        difficulty: 'mid',
        question: 'How do you handle disagreements with engineering on technical approach?',
        topics: ['stakeholder management', 'technical collaboration', 'conflict resolution'],
        keyPoints: [
            'Seek to understand: Ask questions, listen actively',
            'Establish shared goals: User value, business impact',
            'Trade-offs discussion: Time, quality, scope',
            'Data-driven decision making',
            'Escalation as last resort, with clear framing'
        ],
        commonPitfalls: ['Pulling rank as PM', 'Not respecting technical expertise']
    },
    {
        id: 'exe-002',
        category: 'execution',
        difficulty: 'senior',
        question: 'How do you decide when to cut scope vs. delay launch?',
        topics: ['trade-offs', 'decision making', 'launch strategy'],
        keyPoints: [
            'Evaluate: What\'s the minimum lovable product?',
            'Consider: Market timing, competitive pressure, commitments',
            'Analyze: Technical debt implications of rushing',
            'Stakeholder alignment: Sales, marketing, support readiness',
            'Framework: Reversible vs irreversible decisions'
        ],
        commonPitfalls: ['Always defaulting to one approach', 'Not involving stakeholders']
    },
    {
        id: 'exe-003',
        category: 'execution',
        difficulty: 'junior',
        question: 'Walk me through how you would launch a new feature.',
        topics: ['launch planning', 'cross-functional coordination', 'go-to-market'],
        framework: 'BML',
        keyPoints: [
            'Pre-launch: QA, beta testing, documentation, training',
            'Launch plan: Rollout strategy (% rollout, A/B test)',
            'Communication: Internal (sales, support) and external (users, press)',
            'Monitoring: Dashboards, alerts, on-call rotation',
            'Post-launch: Iteration based on feedback and data'
        ],
        commonPitfalls: ['Underestimating support/docs needs', 'No rollback plan']
    }
];

/**
 * DESIGN: Product design and UX
 */
const designQuestions: PMQuestion[] = [
    {
        id: 'des-001',
        category: 'design',
        difficulty: 'mid',
        question: 'Design a checkout experience for an e-commerce app.',
        topics: ['UX design', 'conversion optimization', 'user flows'],
        framework: 'CIRCLES',
        keyPoints: [
            'User goals: Fast, secure, confident purchase',
            'Key screens: Cart review, shipping, payment, confirmation',
            'Reduce friction: Guest checkout, saved info, one-click buy',
            'Trust signals: Security badges, clear pricing, return policy',
            'Mobile considerations: Thumb-friendly, minimal typing'
        ],
        commonPitfalls: ['Too many steps', 'Hidden costs revealed late']
    },
    {
        id: 'des-002',
        category: 'design',
        difficulty: 'senior',
        question: 'How would you design a dashboard for small business owners?',
        topics: ['dashboard design', 'data visualization', 'user segmentation'],
        keyPoints: [
            'User research: What decisions do they make daily/weekly?',
            'Key metrics: Revenue, customers, inventory, cash flow',
            'Information hierarchy: Most important at a glance',
            'Actionability: Insights that drive action, not just data',
            'Customization vs. opinionated defaults'
        ],
        commonPitfalls: ['Too much data without insights', 'Not considering mobile usage']
    }
];

/**
 * TECHNICAL: Technical PM questions
 */
const technicalQuestions: PMQuestion[] = [
    {
        id: 'tech-001',
        category: 'technical',
        difficulty: 'mid',
        question: 'Explain how you would approach building a recommendation system.',
        topics: ['ML basics', 'recommendation systems', 'technical depth'],
        keyPoints: [
            'Problem framing: What are we recommending? To whom?',
            'Data requirements: User behavior, item metadata, context',
            'Approaches: Collaborative filtering, content-based, hybrid',
            'Cold start problem: New users, new items',
            'Evaluation: Precision, recall, engagement metrics'
        ],
        commonPitfalls: ['Getting too technical without business context', 'Ignoring cold start']
    },
    {
        id: 'tech-002',
        category: 'technical',
        difficulty: 'senior',
        question: 'How would you design the architecture for a real-time bidding system?',
        topics: ['system design', 'latency requirements', 'scale'],
        keyPoints: [
            'Requirements: <100ms response, millions of QPS',
            'Components: Bid request handling, ML model inference, auction logic',
            'Caching strategy: Pre-compute bids, feature stores',
            'Data pipeline: Real-time and batch processing',
            'Failure handling: Graceful degradation, fallback bids'
        ],
        commonPitfalls: ['Not addressing latency constraints', 'Missing failure scenarios']
    }
];

/**
 * BEHAVIORAL: Leadership and past experience
 */
const behavioralQuestions: PMQuestion[] = [
    {
        id: 'beh-001',
        category: 'behavioral',
        difficulty: 'junior',
        question: 'Tell me about a product you launched and what you learned.',
        topics: ['past experience', 'reflection', 'growth'],
        keyPoints: [
            'Context: Company, product, your role',
            'Challenge: What was hard about it?',
            'Actions: What specifically did you do?',
            'Results: Quantified impact',
            'Learnings: What would you do differently?'
        ],
        commonPitfalls: ['Vague on personal contribution', 'No quantified results']
    },
    {
        id: 'beh-002',
        category: 'behavioral',
        difficulty: 'mid',
        question: 'Describe a time you had to make a decision with incomplete information.',
        topics: ['decision making', 'ambiguity', 'judgment'],
        keyPoints: [
            'Situation: What information was missing? Why urgent?',
            'Analysis: What did you know? What could you quickly learn?',
            'Decision framework: How did you decide?',
            'Action: What did you decide and do?',
            'Outcome: Result and validation of decision'
        ],
        commonPitfalls: ['Choosing a trivial example', 'Not showing structured thinking']
    },
    {
        id: 'beh-003',
        category: 'behavioral',
        difficulty: 'senior',
        question: 'Tell me about a time you influenced without authority.',
        topics: ['influence', 'leadership', 'stakeholder management'],
        keyPoints: [
            'Context: Who needed to be influenced? Why was it hard?',
            'Approach: How did you build alignment?',
            'Tactics: Data, storytelling, relationship building',
            'Obstacles: What resistance did you face?',
            'Outcome: Did you succeed? What did you learn?'
        ],
        commonPitfalls: ['Example where you had authority', 'Not showing empathy for others\' perspectives']
    }
];

/**
 * Combined question bank
 */
export const PM_QUESTIONS: PMQuestion[] = [
    ...productSenseQuestions,
    ...estimationQuestions,
    ...strategyQuestions,
    ...executionQuestions,
    ...designQuestions,
    ...technicalQuestions,
    ...behavioralQuestions
];

/**
 * Helper function to select PM questions
 */
export function selectPMQuestions(
    seniority: 'junior' | 'mid' | 'senior' | 'director+',
    count: number = 12,
    categories?: PMQuestion['category'][]
): PMQuestion[] {
    let filtered = PM_QUESTIONS;

    // Filter by category if specified
    if (categories && categories.length > 0) {
        filtered = filtered.filter(q => categories.includes(q.category));
    }

    // Filter by difficulty (include current and one level below)
    const difficultyLevels: PMQuestion['difficulty'][] = ['junior', 'mid', 'senior', 'director+'];
    const seniorityIndex = difficultyLevels.indexOf(seniority);
    const allowedDifficulties = difficultyLevels.slice(Math.max(0, seniorityIndex - 1), seniorityIndex + 2);

    filtered = filtered.filter(q => allowedDifficulties.includes(q.difficulty));

    // Shuffle and take requested count
    const shuffled = filtered.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

/**
 * Detect PM seniority from title
 */
export function detectPMSeniority(position: string): 'junior' | 'mid' | 'senior' | 'director+' {
    const lower = position.toLowerCase();

    if (lower.includes('director') || lower.includes('vp') || lower.includes('head of') || lower.includes('chief')) {
        return 'director+';
    }
    if (lower.includes('senior') || lower.includes('lead') || lower.includes('principal')) {
        return 'senior';
    }
    if (lower.includes('associate') || lower.includes('junior') || lower.includes('apm')) {
        return 'junior';
    }

    return 'mid';
}
