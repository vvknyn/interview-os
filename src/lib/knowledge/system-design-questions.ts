/**
 * Curated System Design & Architecture Question Bank
 * Inspired by Lewis Lin's "Decode and Conquer" and industry-standard system design interviews
 */

export interface SystemDesignQuestion {
    id: string;
    category: 'fundamentals' | 'scalability' | 'distributed' | 'high-availability' | 'design' | 'advanced';
    difficulty: 'junior' | 'mid' | 'senior' | 'staff+';
    question: string;
    topics: string[]; // e.g., ['caching', 'redis', 'cache-invalidation']
    answerFramework?: 'PEDALS' | 'CIRCLES' | 'CAP' | 'TRADE-OFFS'; // Framework to use for answering
    keyPoints: string[]; // Key concepts to cover in answer
    commonPitfalls?: string[]; // Things candidates often miss
}

/**
 * FUNDAMENTALS: Core concepts every engineer should know
 */
const fundamentalsQuestions: SystemDesignQuestion[] = [
    {
        id: 'fund-001',
        category: 'fundamentals',
        difficulty: 'junior',
        question: 'What is the CAP theorem and what are its implications for distributed systems?',
        topics: ['CAP theorem', 'distributed systems', 'consistency', 'availability', 'partition tolerance'],
        answerFramework: 'CAP',
        keyPoints: [
            'CAP stands for Consistency, Availability, and Partition Tolerance',
            'A distributed system can only guarantee two out of three properties simultaneously',
            'In the presence of a network partition, you must choose between consistency and availability',
            'Examples: CP (MongoDB), AP (Cassandra), CA (traditional RDBMS - but not truly distributed)'
        ],
        commonPitfalls: ['Not explaining what happens during network partitions', 'Confusing consistency with ACID']
    },
    {
        id: 'fund-002',
        category: 'fundamentals',
        difficulty: 'junior',
        question: 'Explain the difference between horizontal scaling and vertical scaling. When would you use each?',
        topics: ['scaling', 'horizontal scaling', 'vertical scaling', 'architecture'],
        answerFramework: 'TRADE-OFFS',
        keyPoints: [
            'Vertical scaling: Add more resources (CPU, RAM) to existing machines',
            'Horizontal scaling: Add more machines to distribute the load',
            'Vertical scaling is simpler but has hardware limits',
            'Horizontal scaling is more complex but scales indefinitely',
            'Use vertical for databases with strong consistency needs, horizontal for stateless services'
        ],
        commonPitfalls: ['Not mentioning cost implications', 'Ignoring complexity trade-offs']
    },
    {
        id: 'fund-003',
        category: 'fundamentals',
        difficulty: 'mid',
        question: 'What are the different consistency models in distributed systems? Compare strong consistency, eventual consistency, and causal consistency.',
        topics: ['consistency models', 'distributed systems', 'eventual consistency', 'strong consistency'],
        answerFramework: 'TRADE-OFFS',
        keyPoints: [
            'Strong consistency: All reads see the most recent write (linearizability)',
            'Eventual consistency: All replicas will eventually converge to the same value',
            'Causal consistency: Preserves the order of causally related operations',
            'Sequential consistency: All operations appear in some sequential order',
            'Trade-offs: Strong = slow but accurate, Eventual = fast but may be stale'
        ],
        commonPitfalls: ['Not explaining performance implications', 'Missing real-world examples']
    },
    {
        id: 'fund-004',
        category: 'fundamentals',
        difficulty: 'mid',
        question: 'What is database sharding and how does it differ from replication?',
        topics: ['database', 'sharding', 'replication', 'partitioning'],
        answerFramework: 'TRADE-OFFS',
        keyPoints: [
            'Sharding: Horizontally partitioning data across multiple databases',
            'Replication: Copying the same data to multiple databases',
            'Sharding increases capacity and throughput, replication increases availability',
            'Common sharding strategies: Hash-based, Range-based, Geographic',
            'Challenges: Cross-shard queries, hotspots, resharding'
        ],
        commonPitfalls: ['Confusing sharding with replication', 'Not mentioning shard key selection']
    },
    {
        id: 'fund-005',
        category: 'fundamentals',
        difficulty: 'junior',
        question: 'What is the difference between SQL and NoSQL databases? When would you choose one over the other?',
        topics: ['database', 'SQL', 'NoSQL', 'data modeling'],
        answerFramework: 'TRADE-OFFS',
        keyPoints: [
            'SQL: Relational, ACID, structured schema, strong consistency',
            'NoSQL: Non-relational, eventual consistency, flexible schema, horizontal scaling',
            'Use SQL for complex queries, transactions, and structured data',
            'Use NoSQL for high-volume unstructured data, rapid iteration, and horizontal scaling',
            'Types of NoSQL: Document (MongoDB), Key-Value (Redis), Column (Cassandra), Graph (Neo4j)'
        ],
        commonPitfalls: ['Presenting as binary choice', 'Not mentioning polyglot persistence']
    },
    {
        id: 'fund-006',
        category: 'fundamentals',
        difficulty: 'mid',
        question: 'Explain ACID properties in databases. How do they relate to distributed systems?',
        topics: ['ACID', 'transactions', 'database', 'distributed systems'],
        keyPoints: [
            'Atomicity: All or nothing, transactions complete fully or not at all',
            'Consistency: Database moves from one valid state to another',
            'Isolation: Concurrent transactions don\'t interfere with each other',
            'Durability: Committed data is never lost',
            'In distributed systems, ACID is hard to achieve - hence BASE (Basically Available, Soft state, Eventual consistency)'
        ],
        commonPitfalls: ['Not explaining why ACID is difficult in distributed systems']
    },
    {
        id: 'fund-007',
        category: 'fundamentals',
        difficulty: 'senior',
        question: 'What is the two-phase commit protocol? What are its limitations?',
        topics: ['distributed transactions', '2PC', 'consensus', 'coordination'],
        keyPoints: [
            'Prepare phase: Coordinator asks all participants to prepare',
            'Commit phase: If all agree, coordinator tells all to commit',
            'Ensures atomicity across distributed systems',
            'Limitations: Blocking protocol, coordinator is SPOF, slow performance',
            'Alternatives: 3PC, Saga pattern, eventual consistency'
        ],
        commonPitfalls: ['Not mentioning SPOF issue', 'Missing modern alternatives']
    },
    {
        id: 'fund-008',
        category: 'fundamentals',
        difficulty: 'junior',
        question: 'What is idempotency and why is it important in distributed systems?',
        topics: ['idempotency', 'API design', 'distributed systems', 'reliability'],
        keyPoints: [
            'Idempotent operation: Can be applied multiple times without changing result beyond initial application',
            'Important for handling retries and network failures',
            'Examples: PUT is idempotent, POST is not',
            'Implementation: Use unique request IDs, database constraints',
            'Critical for at-least-once delivery semantics'
        ],
        commonPitfalls: ['Not giving concrete examples', 'Missing implementation strategies']
    }
];

/**
 * SCALABILITY: Load balancing, caching, CDN, database optimization
 */
const scalabilityQuestions: SystemDesignQuestion[] = [
    {
        id: 'scale-001',
        category: 'scalability',
        difficulty: 'junior',
        question: 'What is a load balancer and what algorithms can it use to distribute traffic?',
        topics: ['load balancing', 'algorithms', 'high availability'],
        answerFramework: 'TRADE-OFFS',
        keyPoints: [
            'Distributes incoming requests across multiple servers',
            'Algorithms: Round Robin, Least Connections, IP Hash, Weighted Round Robin',
            'Layer 4 (transport) vs Layer 7 (application) load balancing',
            'Health checks to detect failed servers',
            'Examples: NGINX, HAProxy, AWS ELB'
        ],
        commonPitfalls: ['Not explaining health checks', 'Missing layer 4 vs 7 distinction']
    },
    {
        id: 'scale-002',
        category: 'scalability',
        difficulty: 'mid',
        question: 'Explain different caching strategies: write-through, write-back, write-around, and cache-aside.',
        topics: ['caching', 'cache strategies', 'performance'],
        answerFramework: 'TRADE-OFFS',
        keyPoints: [
            'Write-through: Write to cache and database simultaneously',
            'Write-back: Write to cache, async write to database',
            'Write-around: Write directly to database, bypass cache',
            'Cache-aside (lazy loading): App checks cache, loads from DB if miss',
            'Trade-offs: Consistency vs performance vs complexity'
        ],
        commonPitfalls: ['Not explaining when to use each', 'Missing consistency implications']
    },
    {
        id: 'scale-003',
        category: 'scalability',
        difficulty: 'mid',
        question: 'What is cache invalidation and what are the main strategies?',
        topics: ['caching', 'cache invalidation', 'TTL'],
        keyPoints: [
            'Two hard problems: naming things and cache invalidation',
            'TTL (Time To Live): Expire after fixed duration',
            'Event-based invalidation: Invalidate on data updates',
            'LRU (Least Recently Used) eviction',
            'Write-through invalidation: Update cache on write',
            'Trade-offs: Stale data vs cache hit rate vs complexity'
        ],
        commonPitfalls: ['Not mentioning the classic "two hard problems" quote']
    },
    {
        id: 'scale-004',
        category: 'scalability',
        difficulty: 'junior',
        question: 'What is a CDN (Content Delivery Network) and how does it improve performance?',
        topics: ['CDN', 'performance', 'latency', 'edge computing'],
        keyPoints: [
            'Geographically distributed servers that cache static content',
            'Reduces latency by serving content from nearest edge location',
            'Offloads traffic from origin servers',
            'Use cases: Images, videos, CSS/JS files, static HTML',
            'Examples: Cloudflare, Akamai, AWS CloudFront'
        ],
        commonPitfalls: ['Not explaining edge locations']
    },
    {
        id: 'scale-005',
        category: 'scalability',
        difficulty: 'senior',
        question: 'How would you design a caching layer for a high-traffic e-commerce site? Consider cache warming, thundering herd, and cache penetration.',
        topics: ['caching', 'cache warming', 'thundering herd', 'cache penetration'],
        answerFramework: 'TRADE-OFFS',
        keyPoints: [
            'Cache warming: Pre-populate cache with frequently accessed data',
            'Thundering herd: Many requests for expired key hit database simultaneously',
            'Solution: Lock/semaphore on cache miss, background refresh before expiry',
            'Cache penetration: Queries for non-existent keys bypass cache',
            'Solution: Bloom filters, cache null results with short TTL',
            'Use Redis/Memcached with proper eviction policies'
        ],
        commonPitfalls: ['Not addressing all three problems', 'Missing practical solutions']
    },
    {
        id: 'scale-006',
        category: 'scalability',
        difficulty: 'mid',
        question: 'What is database indexing and what are the trade-offs?',
        topics: ['database', 'indexing', 'B-tree', 'performance'],
        keyPoints: [
            'Data structure that improves query speed',
            'B-tree indexes for range queries, Hash indexes for equality',
            'Primary index on primary key, secondary indexes on other columns',
            'Trade-offs: Faster reads vs slower writes, more storage',
            'Composite indexes for multi-column queries'
        ],
        commonPitfalls: ['Not mentioning write penalty', 'Missing index types']
    },
    {
        id: 'scale-007',
        category: 'scalability',
        difficulty: 'senior',
        question: 'How would you handle database connection pooling at scale? What problems can arise?',
        topics: ['database', 'connection pooling', 'scalability'],
        keyPoints: [
            'Reuse database connections instead of creating new ones',
            'Pool size tuning: Too small = bottleneck, too large = resource exhaustion',
            'Problems: Connection leaks, timeouts, max connections limit',
            'Solutions: HikariCP, PgBouncer, proper timeout configuration',
            'Monitor pool metrics: active connections, idle connections, wait time'
        ],
        commonPitfalls: ['Not discussing pool sizing']
    },
    {
        id: 'scale-008',
        category: 'scalability',
        difficulty: 'mid',
        question: 'Explain database read replicas. How do they improve scalability?',
        topics: ['database', 'replication', 'read replicas', 'scalability'],
        keyPoints: [
            'Read replicas: Copies of primary database that handle read queries',
            'Primary handles writes, replicas handle reads',
            'Reduces load on primary database',
            'Replication lag: Replicas may be slightly behind primary',
            'Use cases: Analytics, reporting, geographic distribution'
        ],
        commonPitfalls: ['Not mentioning replication lag', 'Missing write bottleneck issue']
    }
];

/**
 * DISTRIBUTED SYSTEMS: Consensus, leader election, distributed transactions
 */
const distributedSystemsQuestions: SystemDesignQuestion[] = [
    {
        id: 'dist-001',
        category: 'distributed',
        difficulty: 'senior',
        question: 'What is the Raft consensus algorithm? How does it ensure consistency?',
        topics: ['consensus', 'Raft', 'leader election', 'distributed systems'],
        keyPoints: [
            'Consensus algorithm for replicated state machines',
            'Leader election: One node is elected as leader',
            'Log replication: Leader replicates log to followers',
            'Safety: Only committed entries can be applied',
            'Simpler alternative to Paxos',
            'Used in etcd, Consul'
        ],
        commonPitfalls: ['Not comparing to Paxos']
    },
    {
        id: 'dist-002',
        category: 'distributed',
        difficulty: 'senior',
        question: 'Explain the Byzantine Generals Problem and its relevance to distributed systems.',
        topics: ['Byzantine fault tolerance', 'consensus', 'distributed systems'],
        keyPoints: [
            'Problem of reaching consensus when some nodes may be malicious',
            'Requires 3f+1 nodes to tolerate f Byzantine faults',
            'Relevant for blockchains and untrusted environments',
            'PBFT (Practical Byzantine Fault Tolerance) is common solution',
            'Not needed in trusted environments (use Raft/Paxos instead)'
        ],
        commonPitfalls: ['Not explaining when Byzantine tolerance is needed']
    },
    {
        id: 'dist-003',
        category: 'distributed',
        difficulty: 'mid',
        question: 'What is eventual consistency? Provide real-world examples.',
        topics: ['eventual consistency', 'distributed systems', 'consistency models'],
        keyPoints: [
            'Guarantee that all replicas will eventually converge to same value',
            'No guarantee of when convergence happens',
            'Examples: DNS propagation, DynamoDB, Cassandra',
            'Good for high availability and partition tolerance (AP in CAP)',
            'Conflict resolution strategies: Last-write-wins, vector clocks, CRDTs'
        ],
        commonPitfalls: ['Not giving real examples', 'Missing conflict resolution']
    },
    {
        id: 'dist-004',
        category: 'distributed',
        difficulty: 'senior',
        question: 'What are vector clocks and how do they help with causality tracking?',
        topics: ['vector clocks', 'causality', 'distributed systems', 'versioning'],
        keyPoints: [
            'Data structure to capture causality in distributed systems',
            'Each node maintains a vector of logical timestamps',
            'Can detect concurrent updates vs causally related updates',
            'Used in Dynamo, Riak for conflict detection',
            'Alternative: Version vectors, Lamport timestamps'
        ],
        commonPitfalls: ['Not explaining how to compare vector clocks']
    },
    {
        id: 'dist-005',
        category: 'distributed',
        difficulty: 'staff+',
        question: 'Explain the Gossip protocol. When would you use it?',
        topics: ['gossip protocol', 'distributed systems', 'epidemic protocols'],
        keyPoints: [
            'Peer-to-peer communication protocol for spreading information',
            'Each node periodically shares state with random neighbors',
            'Eventually all nodes receive the information',
            'Fault tolerant and scalable',
            'Use cases: Service discovery (Consul), failure detection, database replication (Cassandra)',
            'Trade-off: Eventual consistency, network overhead'
        ],
        commonPitfalls: ['Not mentioning probabilistic guarantees']
    },
    {
        id: 'dist-006',
        category: 'distributed',
        difficulty: 'mid',
        question: 'What is a distributed hash table (DHT)? How does consistent hashing work?',
        topics: ['DHT', 'consistent hashing', 'distributed systems'],
        keyPoints: [
            'DHT: Decentralized data structure for key-value lookups',
            'Consistent hashing: Hash keys and nodes onto a ring',
            'Each node responsible for keys between it and predecessor',
            'Adding/removing nodes only affects immediate neighbors',
            'Virtual nodes for better load distribution',
            'Used in Cassandra, DynamoDB, Chord'
        ],
        commonPitfalls: ['Not explaining virtual nodes', 'Missing failure scenarios']
    }
];

/**
 * HIGH AVAILABILITY: Fault tolerance, redundancy, disaster recovery
 */
const highAvailabilityQuestions: SystemDesignQuestion[] = [
    {
        id: 'ha-001',
        category: 'high-availability',
        difficulty: 'mid',
        question: 'What is a circuit breaker pattern and when would you use it?',
        topics: ['circuit breaker', 'fault tolerance', 'resilience', 'microservices'],
        keyPoints: [
            'Prevents cascading failures by detecting failing services',
            'States: Closed (normal), Open (failing), Half-Open (testing recovery)',
            'After threshold failures, circuit opens and fast-fails',
            'Periodically test if service recovered',
            'Libraries: Hystrix, Resilience4j',
            'Critical for microservices architecture'
        ],
        commonPitfalls: ['Not explaining state transitions']
    },
    {
        id: 'ha-002',
        category: 'high-availability',
        difficulty: 'mid',
        question: 'What is the difference between failover and disaster recovery?',
        topics: ['failover', 'disaster recovery', 'high availability', 'business continuity'],
        keyPoints: [
            'Failover: Automatic switch to redundant system when primary fails',
            'Disaster recovery: Plan to restore operations after catastrophic failure',
            'Failover is seconds/minutes, DR is hours/days',
            'Active-passive vs active-active failover',
            'DR metrics: RTO (Recovery Time Objective), RPO (Recovery Point Objective)'
        ],
        commonPitfalls: ['Not mentioning RTO/RPO']
    },
    {
        id: 'ha-003',
        category: 'high-availability',
        difficulty: 'junior',
        question: 'What is a single point of failure (SPOF) and how do you eliminate it?',
        topics: ['SPOF', 'redundancy', 'high availability'],
        keyPoints: [
            'Component whose failure brings down the entire system',
            'Eliminate through redundancy: multiple instances, replicas',
            'Load balancers can be SPOF - use multiple with failover',
            'Databases can be SPOF - use replication and automatic failover',
            'Network can be SPOF - use multiple availability zones/regions'
        ],
        commonPitfalls: ['Not giving concrete examples']
    },
    {
        id: 'ha-004',
        category: 'high-availability',
        difficulty: 'senior',
        question: 'How would you design a system to achieve 99.99% availability (four nines)?',
        topics: ['SLA', 'availability', 'uptime', 'reliability'],
        keyPoints: [
            '99.99% = ~52 minutes downtime per year',
            'Eliminate SPOFs through redundancy',
            'Multi-region deployment for geographic redundancy',
            'Automated health checks and failover',
            'Graceful degradation: Serve cached/stale data during failures',
            'Monitoring, alerting, and fast incident response',
            'Chaos engineering to test failure scenarios'
        ],
        commonPitfalls: ['Not quantifying downtime allowance', 'Missing monitoring']
    },
    {
        id: 'ha-005',
        category: 'high-availability',
        difficulty: 'mid',
        question: 'What are health checks and heartbeats in distributed systems?',
        topics: ['health checks', 'heartbeats', 'monitoring', 'liveness'],
        keyPoints: [
            'Health checks: Periodic requests to verify service is functioning',
            'Heartbeats: Service sends periodic signals to indicate it\'s alive',
            'Load balancers use health checks to route traffic',
            'Failure detection: Missing heartbeats indicate node failure',
            'Shallow vs deep health checks: TCP vs application-level'
        ],
        commonPitfalls: ['Not explaining difference between health checks and heartbeats']
    },
    {
        id: 'ha-006',
        category: 'high-availability',
        difficulty: 'senior',
        question: 'Explain the concept of bulkheads in system design.',
        topics: ['bulkheads', 'isolation', 'fault tolerance', 'resilience'],
        keyPoints: [
            'Isolate components to prevent cascade failures (like ship compartments)',
            'Examples: Separate thread pools, dedicated resources per service',
            'One failing component doesn\'t exhaust shared resources',
            'Trade-off: Resource overhead vs fault isolation',
            'Used with circuit breakers for comprehensive resilience'
        ],
        commonPitfalls: ['Not using ship analogy', 'Missing trade-offs']
    }
];

/**
 * DESIGN PROBLEMS: Open-ended "Design X" questions
 */
const designProblems: SystemDesignQuestion[] = [
    {
        id: 'design-001',
        category: 'design',
        difficulty: 'mid',
        question: 'Design a URL shortening service like TinyURL or Bitly.',
        topics: ['system design', 'URL shortener', 'hashing', 'key generation'],
        answerFramework: 'PEDALS',
        keyPoints: [
            'Requirements: Shorten URLs, redirect, analytics, custom aliases',
            'Scale estimation: Billions of URLs, high read:write ratio',
            'Key generation: Base62 encoding, hash collision handling',
            'Database: SQL for metadata, NoSQL for fast lookups',
            'Caching: Redis for hot URLs',
            'API: POST /shorten, GET /{shortCode}',
            'Challenges: Distributed ID generation, preventing spam'
        ],
        commonPitfalls: ['Not addressing scale', 'Missing collision handling']
    },
    {
        id: 'design-002',
        category: 'design',
        difficulty: 'senior',
        question: 'Design a social media news feed system like Facebook or Instagram.',
        topics: ['system design', 'news feed', 'fanout', 'timeline'],
        answerFramework: 'PEDALS',
        keyPoints: [
            'Requirements: Post content, follow users, view personalized feed',
            'Fanout strategies: Fanout on write (push) vs fanout on read (pull)',
            'Hybrid approach: Pre-compute for most users, on-demand for celebrities',
            'Ranking algorithm: ML-based relevance scoring',
            'Storage: Posts in Cassandra, feed cache in Redis',
            'Challenges: Thundering herd, hot users, real-time updates'
        ],
        commonPitfalls: ['Not discussing fanout trade-offs', 'Missing ranking algorithm']
    },
    {
        id: 'design-003',
        category: 'design',
        difficulty: 'mid',
        question: 'Design a chat system like WhatsApp or Facebook Messenger.',
        topics: ['system design', 'chat', 'websockets', 'real-time'],
        answerFramework: 'PEDALS',
        keyPoints: [
            'Requirements: 1-on-1 chat, group chat, online status, read receipts',
            'WebSocket for bi-directional real-time communication',
            'Message queue for offline message delivery',
            'Database: Cassandra for message history, Redis for online status',
            'Seen status: Track last seen timestamp per user',
            'Group chat: Separate message routing, member management',
            'End-to-end encryption for security'
        ],
        commonPitfalls: ['Not mentioning WebSocket', 'Missing offline message handling']
    },
    {
        id: 'design-004',
        category: 'design',
        difficulty: 'senior',
        question: 'Design a video streaming service like YouTube or Netflix.',
        topics: ['system design', 'video streaming', 'CDN', 'transcoding'],
        answerFramework: 'PEDALS',
        keyPoints: [
            'Requirements: Upload videos, transcode, stream, recommendations',
            'Video transcoding: Multiple resolutions (480p, 720p, 1080p, 4K)',
            'CDN for content delivery: CloudFront, Akamai',
            'Adaptive bitrate streaming: HLS, DASH protocols',
            'Storage: S3 for video files, metadata in SQL/NoSQL',
            'Recommendations: Collaborative filtering, ML models',
            'Challenges: Massive storage, global distribution, copyright detection'
        ],
        commonPitfalls: ['Not discussing transcoding', 'Missing adaptive streaming']
    },
    {
        id: 'design-005',
        category: 'design',
        difficulty: 'senior',
        question: 'Design a ride-sharing service like Uber or Lyft.',
        topics: ['system design', 'ride-sharing', 'geospatial', 'matching'],
        answerFramework: 'PEDALS',
        keyPoints: [
            'Requirements: Match riders with drivers, real-time location, pricing, payments',
            'Geospatial indexing: QuadTree or Geohash for nearby drivers',
            'Matching algorithm: Closest driver, ETA calculation',
            'WebSocket for real-time location updates',
            'Database: PostgreSQL with PostGIS, Redis for active rides',
            'Pricing: Surge pricing based on supply/demand',
            'Challenges: High write throughput, real-time requirements, accuracy'
        ],
        commonPitfalls: ['Not mentioning geospatial indexing', 'Missing surge pricing']
    },
    {
        id: 'design-006',
        category: 'design',
        difficulty: 'mid',
        question: 'Design an API rate limiter.',
        topics: ['system design', 'rate limiting', 'throttling'],
        answerFramework: 'PEDALS',
        keyPoints: [
            'Requirements: Limit requests per user/IP, different tiers',
            'Algorithms: Token bucket, leaky bucket, fixed window, sliding window',
            'Token bucket: Most common, allows bursts',
            'Storage: Redis with TTL for counters',
            'Distributed rate limiting: Sync across instances',
            'Response: 429 Too Many Requests, Retry-After header',
            'Challenges: Distributed synchronization, race conditions'
        ],
        commonPitfalls: ['Not comparing algorithms', 'Missing distributed consideration']
    },
    {
        id: 'design-007',
        category: 'design',
        difficulty: 'senior',
        question: 'Design a web crawler like Googlebot.',
        topics: ['system design', 'web crawler', 'distributed crawling', 'politeness'],
        answerFramework: 'PEDALS',
        keyPoints: [
            'Requirements: Crawl billions of pages, respect robots.txt, avoid duplicates',
            'URL frontier: Queue of URLs to crawl (FIFO, priority queue)',
            'Politeness: Rate limit per domain, obey robots.txt',
            'Duplicate detection: Bloom filter, URL fingerprinting',
            'Distributed crawling: Partition by domain, consistent hashing',
            'Storage: URL metadata in database, content in blob storage',
            'Challenges: Scale, freshness, traps (infinite loops)'
        ],
        commonPitfalls: ['Not mentioning politeness', 'Missing duplicate detection']
    },
    {
        id: 'design-008',
        category: 'design',
        difficulty: 'mid',
        question: 'Design a key-value store like Redis or Memcached.',
        topics: ['system design', 'key-value store', 'caching', 'distributed systems'],
        answerFramework: 'PEDALS',
        keyPoints: [
            'Requirements: GET, PUT, DELETE in O(1), persistence optional',
            'In-memory hash table for fast access',
            'Eviction policies: LRU, LFU, TTL',
            'Persistence: Snapshots (RDB) or append-only log (AOF)',
            'Distribution: Consistent hashing for sharding',
            'Replication: Primary-replica for HA',
            'Challenges: Memory limits, persistence vs speed trade-off'
        ],
        commonPitfalls: ['Not discussing eviction policies', 'Missing persistence strategy']
    },
    {
        id: 'design-009',
        category: 'design',
        difficulty: 'senior',
        question: 'Design a notification system (push notifications, email, SMS).',
        topics: ['system design', 'notifications', 'message queue', 'multi-channel'],
        answerFramework: 'PEDALS',
        keyPoints: [
            'Requirements: Multiple channels (push, email, SMS), user preferences, reliability',
            'Message queue: Kafka or RabbitMQ for async processing',
            'Priority queues: Urgent vs non-urgent notifications',
            'Rate limiting: Avoid spamming users',
            'Third-party integrations: FCM (push), SendGrid (email), Twilio (SMS)',
            'User preferences: Opt-in/opt-out, channel selection',
            'Challenges: Deliverability, idempotency, retry logic'
        ],
        commonPitfalls: ['Not mentioning user preferences', 'Missing rate limiting']
    },
    {
        id: 'design-010',
        category: 'design',
        difficulty: 'mid',
        question: 'Design a search autocomplete system like Google Search.',
        topics: ['system design', 'autocomplete', 'trie', 'caching'],
        answerFramework: 'PEDALS',
        keyPoints: [
            'Requirements: Fast prefix search, ranked suggestions, real-time updates',
            'Data structure: Trie for efficient prefix matching',
            'Ranking: Popularity, personalization, location',
            'Caching: Cache top queries at multiple levels',
            'Database: NoSQL for query logs, aggregation pipeline',
            'API: GET /autocomplete?q={prefix}',
            'Challenges: Huge query volume, freshness, personalization'
        ],
        commonPitfalls: ['Not mentioning trie', 'Missing ranking algorithm']
    }
];

/**
 * ADVANCED TOPICS: Microservices, event sourcing, CQRS
 */
const advancedQuestions: SystemDesignQuestion[] = [
    {
        id: 'adv-001',
        category: 'advanced',
        difficulty: 'staff+',
        question: 'What is event sourcing and when would you use it?',
        topics: ['event sourcing', 'CQRS', 'microservices', 'architecture'],
        answerFramework: 'TRADE-OFFS',
        keyPoints: [
            'Store state changes as sequence of events instead of current state',
            'Append-only log of all events',
            'Rebuild state by replaying events',
            'Benefits: Complete audit trail, temporal queries, event replay',
            'Drawbacks: Complexity, eventual consistency, event schema evolution',
            'Use cases: Financial systems, audit requirements, complex domains'
        ],
        commonPitfalls: ['Not explaining when NOT to use it']
    },
    {
        id: 'adv-002',
        category: 'advanced',
        difficulty: 'staff+',
        question: 'Explain CQRS (Command Query Responsibility Segregation). What problems does it solve?',
        topics: ['CQRS', 'architecture', 'microservices', 'scalability'],
        answerFramework: 'TRADE-OFFS',
        keyPoints: [
            'Separate read and write models',
            'Commands: Modify state, optimized for writes',
            'Queries: Read state, optimized for reads',
            'Often combined with event sourcing',
            'Benefits: Independent scaling, optimized models, flexibility',
            'Drawbacks: Complexity, eventual consistency',
            'Use cases: High read:write ratio, complex business logic'
        ],
        commonPitfalls: ['Not explaining the problem it solves']
    },
    {
        id: 'adv-003',
        category: 'advanced',
        difficulty: 'senior',
        question: 'What is the Saga pattern for distributed transactions?',
        topics: ['saga pattern', 'distributed transactions', 'microservices', 'compensation'],
        answerFramework: 'TRADE-OFFS',
        keyPoints: [
            'Sequence of local transactions with compensation',
            'Two types: Choreography (event-driven) vs Orchestration (coordinator)',
            'Each step has compensating transaction for rollback',
            'Use when 2PC is too slow or not available',
            'Eventual consistency instead of ACID',
            'Challenges: Complexity, partial failures, ordering'
        ],
        commonPitfalls: ['Not explaining compensation']
    },
    {
        id: 'adv-004',
        category: 'advanced',
        difficulty: 'staff+',
        question: 'What are CRDTs (Conflict-free Replicated Data Types) and when would you use them?',
        topics: ['CRDT', 'distributed systems', 'eventual consistency', 'conflict resolution'],
        keyPoints: [
            'Data structures that automatically resolve conflicts',
            'Guarantee eventual consistency without coordination',
            'Types: G-Counter, PN-Counter, LWW-Register, OR-Set',
            'Commutative operations: Order doesn\'t matter',
            'Use cases: Collaborative editing, distributed databases (Riak)',
            'Trade-off: More complex than normal data structures'
        ],
        commonPitfalls: ['Not giving concrete examples']
    },
    {
        id: 'adv-005',
        category: 'advanced',
        difficulty: 'senior',
        question: 'Explain the strangler fig pattern for migrating monoliths to microservices.',
        topics: ['strangler fig', 'microservices', 'migration', 'refactoring'],
        keyPoints: [
            'Incrementally replace parts of monolith with microservices',
            'Proxy/facade routes requests to old or new system',
            'Gradually increase traffic to new services',
            'Eventually "strangle" the monolith completely',
            'Benefits: Low risk, incremental migration',
            'Challenges: Dual maintenance, data synchronization'
        ],
        commonPitfalls: ['Not explaining gradual nature']
    }
];

/**
 * Combined question bank
 */
export const SYSTEM_DESIGN_QUESTIONS: SystemDesignQuestion[] = [
    ...fundamentalsQuestions,
    ...scalabilityQuestions,
    ...distributedSystemsQuestions,
    ...highAvailabilityQuestions,
    ...designProblems,
    ...advancedQuestions
];

/**
 * Helper function to select questions based on role, difficulty, and topics
 */
export function selectQuestions(
    role: string,
    seniority: 'junior' | 'mid' | 'senior' | 'staff+',
    count: number = 15,
    categories?: SystemDesignQuestion['category'][]
): SystemDesignQuestion[] {
    let filtered = SYSTEM_DESIGN_QUESTIONS;

    // Filter by category if specified
    if (categories && categories.length > 0) {
        filtered = filtered.filter(q => categories.includes(q.category));
    }

    // Filter by difficulty (include current and one level below)
    const difficultyLevels: SystemDesignQuestion['difficulty'][] = ['junior', 'mid', 'senior', 'staff+'];
    const seniorityIndex = difficultyLevels.indexOf(seniority);
    const allowedDifficulties = difficultyLevels.slice(Math.max(0, seniorityIndex - 1), seniorityIndex + 2);

    filtered = filtered.filter(q => allowedDifficulties.includes(q.difficulty));

    // Shuffle and take requested count
    const shuffled = filtered.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

/**
 * Detect seniority level from position title
 */
export function detectSeniority(position: string): 'junior' | 'mid' | 'senior' | 'staff+' {
    const lower = position.toLowerCase();

    if (lower.includes('staff') || lower.includes('principal') || lower.includes('distinguished')) {
        return 'staff+';
    }
    if (lower.includes('senior') || lower.includes('lead')) {
        return 'senior';
    }
    if (lower.includes('junior') || lower.includes('entry') || lower.includes('associate')) {
        return 'junior';
    }

    return 'mid'; // Default
}
