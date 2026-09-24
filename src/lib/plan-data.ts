/**
 * Static plan content, copied verbatim from the original switch-tracker.html.
 * None of this is user data, so it never goes to the database.
 */

/** [year, monthIndex (0-11), day] — the shape used throughout the original file. */
export type DateTuple = [number, number, number];

export type Milestone = {
  /** Target date. */
  d: DateTuple;
  /** Short label shown under the timeline dot. */
  t: string;
  /** Longer description, used as the dot's tooltip and in the Roadmap list. */
  s: string;
};

export type Week = {
  id: string;
  name: string;
  from: DateTuple;
  to: DateTuple;
  phase: string;
  tasks: string[];
};

export type Difficulty = "E" | "M" | "H";

export type Problem = {
  /** LeetCode problem number; also forms the checklist key ("p:238"). */
  n: number;
  name: string;
  d: Difficulty;
  /** LeetCode URL slug. */
  slug: string;
};

export type ProblemGroup = {
  /** Group title. */
  g: string;
  /** Where in the roadmap this group is scheduled. */
  w: string;
  items: Problem[];
};

export type TopicGroup = { g: string; items: string[] };

/** First and last day of the route timeline in the hero. */
export const START = new Date(2026, 8, 22);
export const END = new Date(2027, 3, 1);

export const MILESTONES: Milestone[] = [
  { d: [2026, 8, 28], t: "Resume live", s: "Resume, LinkedIn and Naukri updated" },
  { d: [2026, 9, 26], t: "270 solved", s: "270 problems; e-commerce Dockerised with CI; 40 target companies listed" },
  { d: [2026, 10, 16], t: "Start applying", s: "DP done; demo deployed; first mock; referrals and applications start" },
  { d: [2026, 11, 13], t: "5+ processes", s: "320+ problems; 5+ active interview processes" },
  { d: [2027, 0, 17], t: "Offers in hand", s: "350+ problems; final rounds done, offers in hand" },
  {
    d: [2027, 0, 31],
    t: "Resign",
    s: "Written offer of 10 LPA+ accepted; resignation submitted (Feb is fine if the best offer lands then)",
  },
  { d: [2027, 3, 1], t: "Join", s: "2-month notice complete; new role starts" },
];

export const WEEKS: Week[] = [
  {
    id: "w1",
    name: "Week 1",
    from: [2026, 8, 22],
    to: [2026, 8, 28],
    phase: "Phase 1: Foundation",
    tasks: [
      "Rewrite resume (summary, experience bullets, project metrics)",
      "Update LinkedIn and Naukri to match",
      "DSA: arrays, hashing, prefix sums, two pointers",
    ],
  },
  {
    id: "w2",
    name: "Week 2",
    from: [2026, 8, 29],
    to: [2026, 9, 5],
    phase: "Phase 1: Foundation",
    tasks: [
      "DSA: sliding window, binary search (incl. on the answer)",
      "Revise Node event loop, streams, worker threads",
    ],
  },
  {
    id: "w3",
    name: "Week 3",
    from: [2026, 9, 6],
    to: [2026, 9, 12],
    phase: "Phase 1: Foundation",
    tasks: [
      "DSA: stacks, monotonic stack, linked lists",
      "Dockerise the e-commerce backend (Dockerfile + compose with Postgres and Redis)",
    ],
  },
  {
    id: "w4",
    name: "Week 4",
    from: [2026, 9, 13],
    to: [2026, 9, 19],
    phase: "Phase 1: Foundation",
    tasks: [
      "DSA: trees and BST",
      "Add a GitHub Actions pipeline (lint, test, build)",
      "Revise PostgreSQL indexing, transactions and Redis patterns",
    ],
  },
  {
    id: "w5",
    name: "Week 5",
    from: [2026, 9, 20],
    to: [2026, 9, 26],
    phase: "Phase 1: Foundation",
    tasks: [
      "DSA: graphs (BFS/DFS, topo sort, Dijkstra, DSU)",
      "Build the list of 40 target companies",
      "Connect with engineers at target companies on LinkedIn",
    ],
  },
  {
    id: "w6",
    name: "Week 6",
    from: [2026, 9, 27],
    to: [2026, 10, 2],
    phase: "Phase 2: Depth",
    tasks: [
      "DSA: DP 1D and 2D",
      "LLD basics: SOLID and the patterns you've used (Strategy, Factory, Observer)",
    ],
  },
  {
    id: "w7",
    name: "Week 7",
    from: [2026, 10, 3],
    to: [2026, 10, 9],
    phase: "Phase 2: Depth",
    tasks: [
      "DSA: DP on strings and knapsack",
      "LLD: LRU cache, rate limiter, parking lot",
      "Write out answers to the project deep-dive questions",
    ],
  },
  {
    id: "w8",
    name: "Week 8",
    from: [2026, 10, 10],
    to: [2026, 10, 16],
    phase: "Phase 2: Depth",
    tasks: [
      "DSA: heaps, greedy, intervals, backtracking, tries",
      "HLD: URL shortener, chat app, your chatbot platform",
      "Deploy a public demo",
      "First mock interview",
    ],
  },
  {
    id: "w9",
    name: "Week 9",
    from: [2026, 10, 17],
    to: [2026, 10, 23],
    phase: "Phase 2: Depth",
    tasks: [
      "Start referral requests and applications (10–15 a week)",
      "Mixed timed practice sets",
    ],
  },
  {
    id: "p3",
    name: "Interviews",
    from: [2026, 10, 24],
    to: [2027, 0, 17],
    phase: "Phase 3: Interview season",
    tasks: [
      "Company-tagged problems for every company in the pipeline",
      "Two mock interviews a week",
      "Get first rounds scheduled before mid-December",
      "Main push mid-January: resume, referrals and readiness at full strength",
      "Log every interview question and fix gaps within 48 hours",
      "Whiteboard the chatbot architecture in under 5 minutes",
    ],
  },
  {
    id: "p4",
    name: "Offer",
    from: [2027, 0, 18],
    to: [2027, 0, 31],
    phase: "Phase 4: Offer and resign",
    tasks: [
      "Line up offers close together and negotiate",
      "Decide in advance how to handle a counter-offer",
      "Accept the offer in writing",
      "Resign by email and agree the last working day",
    ],
  },
  {
    id: "p5",
    name: "Notice",
    from: [2027, 1, 1],
    to: [2027, 2, 31],
    phase: "Notice period",
    tasks: [
      "Documented handover",
      "Collect relieving and experience letters",
      "Keep one backup process warm until joining",
      "Solve 1 problem a day",
    ],
  },
];

export const WEEKLY: string[] = [
  "12–15 DSA problems, mostly medium, logged with pattern and trick",
  "Re-solved 3 old problems from the log without help",
  "Weekly contest attempted and upsolved",
  "1 LLD or HLD design practised out loud",
  "1 backend topic revised",
  "10–15 applications and 5 referral requests (from Nov 16)",
  "Application tracker updated; follow-ups sent",
  "1–2 mock interviews (from Nov 10)",
];

const P = (n: number, name: string, d: Difficulty, slug: string): Problem => ({ n, name, d, slug });

export const PROBLEMS: ProblemGroup[] = [
  {
    g: "Arrays, hashing, prefix sums",
    w: "Weeks 1–2",
    items: [
      P(238, "Product of Array Except Self", "M", "product-of-array-except-self"),
      P(128, "Longest Consecutive Sequence", "M", "longest-consecutive-sequence"),
      P(49, "Group Anagrams", "M", "group-anagrams"),
      P(347, "Top K Frequent Elements", "M", "top-k-frequent-elements"),
      P(560, "Subarray Sum Equals K", "M", "subarray-sum-equals-k"),
      P(53, "Maximum Subarray", "M", "maximum-subarray"),
      P(41, "First Missing Positive", "H", "first-missing-positive"),
    ],
  },
  {
    g: "Two pointers and sliding window",
    w: "Weeks 1–2",
    items: [
      P(15, "3Sum", "M", "3sum"),
      P(11, "Container With Most Water", "M", "container-with-most-water"),
      P(3, "Longest Substring Without Repeating Characters", "M", "longest-substring-without-repeating-characters"),
      P(424, "Longest Repeating Character Replacement", "M", "longest-repeating-character-replacement"),
      P(438, "Find All Anagrams in a String", "M", "find-all-anagrams-in-a-string"),
      P(76, "Minimum Window Substring", "H", "minimum-window-substring"),
      P(239, "Sliding Window Maximum", "H", "sliding-window-maximum"),
      P(42, "Trapping Rain Water", "H", "trapping-rain-water"),
    ],
  },
  {
    g: "Binary search",
    w: "Week 2",
    items: [
      P(33, "Search in Rotated Sorted Array", "M", "search-in-rotated-sorted-array"),
      P(153, "Find Minimum in Rotated Sorted Array", "M", "find-minimum-in-rotated-sorted-array"),
      P(875, "Koko Eating Bananas", "M", "koko-eating-bananas"),
      P(1011, "Capacity To Ship Packages Within D Days", "M", "capacity-to-ship-packages-within-d-days"),
      P(410, "Split Array Largest Sum", "H", "split-array-largest-sum"),
      P(4, "Median of Two Sorted Arrays", "H", "median-of-two-sorted-arrays"),
    ],
  },
  {
    g: "Stacks",
    w: "Week 3",
    items: [
      P(155, "Min Stack", "M", "min-stack"),
      P(150, "Evaluate Reverse Polish Notation", "M", "evaluate-reverse-polish-notation"),
      P(739, "Daily Temperatures", "M", "daily-temperatures"),
      P(853, "Car Fleet", "M", "car-fleet"),
      P(84, "Largest Rectangle in Histogram", "H", "largest-rectangle-in-histogram"),
    ],
  },
  {
    g: "Linked lists",
    w: "Week 3",
    items: [
      P(142, "Linked List Cycle II", "M", "linked-list-cycle-ii"),
      P(143, "Reorder List", "M", "reorder-list"),
      P(138, "Copy List with Random Pointer", "M", "copy-list-with-random-pointer"),
      P(146, "LRU Cache", "M", "lru-cache"),
      P(23, "Merge k Sorted Lists", "H", "merge-k-sorted-lists"),
      P(25, "Reverse Nodes in k-Group", "H", "reverse-nodes-in-k-group"),
    ],
  },
  {
    g: "Trees and BST",
    w: "Week 4",
    items: [
      P(102, "Binary Tree Level Order Traversal", "M", "binary-tree-level-order-traversal"),
      P(199, "Binary Tree Right Side View", "M", "binary-tree-right-side-view"),
      P(543, "Diameter of Binary Tree", "E", "diameter-of-binary-tree"),
      P(98, "Validate Binary Search Tree", "M", "validate-binary-search-tree"),
      P(230, "Kth Smallest Element in a BST", "M", "kth-smallest-element-in-a-bst"),
      P(236, "Lowest Common Ancestor of a Binary Tree", "M", "lowest-common-ancestor-of-a-binary-tree"),
      P(
        105,
        "Construct Binary Tree from Preorder and Inorder Traversal",
        "M",
        "construct-binary-tree-from-preorder-and-inorder-traversal",
      ),
      P(124, "Binary Tree Maximum Path Sum", "H", "binary-tree-maximum-path-sum"),
      P(297, "Serialize and Deserialize Binary Tree", "H", "serialize-and-deserialize-binary-tree"),
    ],
  },
  {
    g: "Graphs",
    w: "Week 5",
    items: [
      P(200, "Number of Islands", "M", "number-of-islands"),
      P(994, "Rotting Oranges", "M", "rotting-oranges"),
      P(133, "Clone Graph", "M", "clone-graph"),
      P(417, "Pacific Atlantic Water Flow", "M", "pacific-atlantic-water-flow"),
      P(207, "Course Schedule", "M", "course-schedule"),
      P(210, "Course Schedule II", "M", "course-schedule-ii"),
      P(684, "Redundant Connection", "M", "redundant-connection"),
      P(743, "Network Delay Time", "M", "network-delay-time"),
      P(787, "Cheapest Flights Within K Stops", "M", "cheapest-flights-within-k-stops"),
      P(1584, "Min Cost to Connect All Points", "M", "min-cost-to-connect-all-points"),
      P(127, "Word Ladder", "H", "word-ladder"),
      P(329, "Longest Increasing Path in a Matrix", "H", "longest-increasing-path-in-a-matrix"),
    ],
  },
  {
    g: "Dynamic programming",
    w: "Weeks 6–7",
    items: [
      P(198, "House Robber", "M", "house-robber"),
      P(213, "House Robber II", "M", "house-robber-ii"),
      P(322, "Coin Change", "M", "coin-change"),
      P(518, "Coin Change II", "M", "coin-change-ii"),
      P(62, "Unique Paths", "M", "unique-paths"),
      P(139, "Word Break", "M", "word-break"),
      P(300, "Longest Increasing Subsequence", "M", "longest-increasing-subsequence"),
      P(1143, "Longest Common Subsequence", "M", "longest-common-subsequence"),
      P(416, "Partition Equal Subset Sum", "M", "partition-equal-subset-sum"),
      P(5, "Longest Palindromic Substring", "M", "longest-palindromic-substring"),
      P(152, "Maximum Product Subarray", "M", "maximum-product-subarray"),
      P(309, "Best Time to Buy and Sell Stock with Cooldown", "M", "best-time-to-buy-and-sell-stock-with-cooldown"),
      P(72, "Edit Distance", "M", "edit-distance"),
      P(312, "Burst Balloons", "H", "burst-balloons"),
    ],
  },
  {
    g: "Heaps, greedy and intervals",
    w: "Week 8",
    items: [
      P(215, "Kth Largest Element in an Array", "M", "kth-largest-element-in-an-array"),
      P(973, "K Closest Points to Origin", "M", "k-closest-points-to-origin"),
      P(621, "Task Scheduler", "M", "task-scheduler"),
      P(295, "Find Median from Data Stream", "H", "find-median-from-data-stream"),
      P(56, "Merge Intervals", "M", "merge-intervals"),
      P(435, "Non-overlapping Intervals", "M", "non-overlapping-intervals"),
      P(763, "Partition Labels", "M", "partition-labels"),
      P(55, "Jump Game", "M", "jump-game"),
      P(45, "Jump Game II", "M", "jump-game-ii"),
      P(134, "Gas Station", "M", "gas-station"),
    ],
  },
  {
    g: "Backtracking",
    w: "Week 8",
    items: [
      P(78, "Subsets", "M", "subsets"),
      P(46, "Permutations", "M", "permutations"),
      P(39, "Combination Sum", "M", "combination-sum"),
      P(79, "Word Search", "M", "word-search"),
      P(131, "Palindrome Partitioning", "M", "palindrome-partitioning"),
      P(51, "N-Queens", "H", "n-queens"),
    ],
  },
  {
    g: "Tries and bits",
    w: "Week 8",
    items: [
      P(208, "Implement Trie (Prefix Tree)", "M", "implement-trie-prefix-tree"),
      P(211, "Design Add and Search Words Data Structure", "M", "design-add-and-search-words-data-structure"),
      P(212, "Word Search II", "H", "word-search-ii"),
      P(338, "Counting Bits", "E", "counting-bits"),
      P(371, "Sum of Two Integers", "M", "sum-of-two-integers"),
    ],
  },
  {
    g: "Design-style",
    w: "Any time",
    items: [
      P(380, "Insert Delete GetRandom O(1)", "M", "insert-delete-getrandom-o1"),
      P(981, "Time Based Key-Value Store", "M", "time-based-key-value-store"),
      P(355, "Design Twitter", "M", "design-twitter"),
      P(460, "LFU Cache", "H", "lfu-cache"),
    ],
  },
];

export const RESUME: string[] = [
  "Rewrite the summary as backend + AI engineer positioning",
  "Add 3–4 impact bullets to Associate Software Engineer",
  "Add 2 bullets to the internship",
  "Move the chatbot under Experience if it's company work",
  "Add numbers to the chatbot (tokens saved, router accuracy, latency)",
  "E-commerce: add scale, design details and a GitHub link",
  "Mental-health AI: clarify 'decentralised' and evaluation",
  "Merge or drop the blogging backend",
  "Regroup skills; remove Eclipse, Visual Studio, EJS",
  "Clickable GitHub, LinkedIn and LeetCode links in the header",
  "One page, ATS-friendly PDF; Experience above Projects",
  "LinkedIn and Naukri headline updated",
];

export const TOPICS: TopicGroup[] = [
  {
    g: "AI engineering",
    items: [
      "LLM evaluation (eval sets, LLM-as-judge, prompt regression tests)",
      "LLM observability and cost control (tracing, token cost, prompt caching)",
      "Model Context Protocol: build an MCP server",
      "Agent safety (prompt injection, tool scopes, human approval)",
      "Advanced RAG (hybrid search, re-ranking, retrieval evals)",
      "Structured outputs with schema validation",
    ],
  },
  {
    g: "Cloud and DevOps",
    items: [
      "Docker and Kubernetes basics",
      "AWS core: EC2, S3, RDS, Lambda, SQS, IAM, CloudWatch",
      "CI/CD with GitHub Actions",
      "Observability: structured logs, metrics, OpenTelemetry",
    ],
  },
  {
    g: "Backend depth",
    items: [
      "Queues and event-driven design (BullMQ, RabbitMQ, Kafka concepts)",
      "Distributed systems: idempotency, retries, outbox pattern",
      "PostgreSQL: query plans, partitioning, PgBouncer, row-level security",
      "NestJS",
    ],
  },
  {
    g: "Broaden options",
    items: ["Python + FastAPI basics", "Working effectively with AI coding assistants"],
  },
  {
    g: "Project upgrades",
    items: [
      "Chatbot: add evaluation and tracing layer",
      "Chatbot: expose tenant tools via an MCP server",
      "Deploy on AWS with an ingestion queue and CI/CD",
    ],
  },
];

export const STAGES: readonly string[] = [
  "Wishlist",
  "Applied",
  "Referred",
  "OA",
  "Interviewing",
  "Final round",
  "Offer",
  "Rejected",
  "Withdrawn",
];

/** Stages that count as an "active process" on the Overview tab. */
export const ACTIVE: readonly string[] = ["Applied", "Referred", "OA", "Interviewing", "Final round"];

export const CHANNELS: readonly string[] = [
  "Referral",
  "LinkedIn",
  "Wellfound",
  "Instahyre",
  "Cutshort",
  "Naukri",
  "Careers page",
  "Direct outreach",
  "Other",
];
