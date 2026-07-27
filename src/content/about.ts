/**
 * Institutional copy. Story, vision, mission and founder bio are carried over
 * verbatim from the legacy about.php.
 */

export const stats = [
  { value: 1000, suffix: "+", label: "Students placed" },
  { value: 11, suffix: "", label: "Courses offered" },
  { value: 26, suffix: "+", label: "Years of industry experience" },
] as const;

export const story = {
  eyebrow: "Our story",
  heading: "Built by someone who spent 26 years on the other side of the interview table",
  paragraphs: [
    "SSS Academy was founded with a simple vision — to bridge the gap between academic learning and real-world industry requirements. After spending more than 26 years in the IT industry working with technologies such as SQL, Oracle, Automation Testing, and Quality Engineering, our founder recognized that many students and professionals possessed theoretical knowledge but lacked the practical skills required by employers.",
    "To address this challenge, SSS Academy was established as a platform where learning goes beyond textbooks. We focus on hands-on training, real-time projects, interview preparation, and industry best practices to ensure that every student is job-ready.",
    "Over the years, we have helped aspiring IT professionals gain confidence, develop technical expertise, and secure rewarding careers in leading organizations. Today, SSS Academy continues its mission of empowering students through quality education, practical learning, and career-focused training programs.",
  ],
} as const;

export const vision = {
  title: "Our vision",
  body: "To empower students and working professionals with industry-relevant IT skills, enabling them to build successful careers in the technology sector. We strive to become a trusted learning platform known for quality training, practical knowledge, and career growth opportunities.",
} as const;

export const mission = {
  title: "Our mission",
  body: "Our mission is to provide practical, industry-oriented training that equips students and professionals with the skills, confidence, and knowledge needed to excel in their careers and achieve their professional goals.",
} as const;

export const founder = {
  name: "Sangamesh A.K",
  role: "Founder & Director",
  photo: "/img/founder.webp",
  bio: "With over 26 years of experience in the IT industry, our founder is a seasoned professional specializing in SQL, Oracle Database, Quality Engineering, and Automation Testing. Throughout his career, he has successfully delivered enterprise-level projects and mentored numerous professionals across various domains. His deep technical expertise and passion for teaching have helped many students build successful careers in the IT industry. Under his leadership, SSS Academy is committed to providing practical, industry-focused training that bridges the gap between learning and real-world implementation.",
  tags: ["Mentor", "Trainer", "Career Guide"],
  expertise: [
    "SQL",
    "Oracle Database",
    "Quality Engineering",
    "Automation Testing",
  ],
} as const;

/**
 * The "problem" beat of the homepage narrative. Framed from the founding
 * insight already stated on the legacy about page.
 */
export const problem = {
  eyebrow: "The gap",
  heading: "A degree gets you the interview. It does not get you the offer.",
  body: "Most candidates walk in with theory and walk out without an offer — not for lack of ability, but because nobody made them build, break and defend real data pipelines before the interview.",
  points: [
    {
      title: "Theory without a keyboard",
      body: "Concepts memorised for exams collapse the moment an interviewer asks you to write a window function on the spot.",
    },
    {
      title: "No real-time exposure",
      body: "Employers ask about source-to-target validation, failed loads and edge cases. Coursework rarely goes there.",
    },
    {
      title: "Untrained interview instinct",
      body: "Knowing the answer and being able to deliver it under pressure are two different skills.",
    },
  ],
} as const;

/** The "how we fix it" beat. Derived from the training approach on about.php. */
export const approach = {
  eyebrow: "How we train",
  heading: "Hands-on first, theory in service of it",
  steps: [
    {
      step: "01",
      title: "Fundamentals, taught properly",
      body: "Structured sessions that take you from basics to advanced with no gaps left to fill later.",
    },
    {
      step: "02",
      title: "Real-time projects",
      body: "You work on project scenarios modelled on live enterprise data work, not toy datasets.",
    },
    {
      step: "03",
      title: "Interview preparation",
      body: "Mock interviews, resume guidance and technical drilling until answering feels routine.",
    },
    {
      step: "04",
      title: "Placement assistance",
      body: "Continued support through the job search — the part most institutes quietly skip.",
    },
  ],
} as const;

/** Trust signals. Each maps to a claim already made on the legacy site. */
export const trustSignals = [
  {
    title: "26+ years of industry experience",
    body: "Trained by a practitioner who delivered enterprise projects in SQL, Oracle and Quality Engineering.",
  },
  {
    title: "1000+ students placed",
    body: "A placement record built over years, not a launch-week claim.",
  },
  {
    title: "Placement assistance included",
    body: "Mock interviews, resume guidance and job-search support come with the training.",
  },
  {
    title: "Real-time project work",
    body: "Every track ends in project scenarios drawn from actual enterprise requirements.",
  },
] as const;

export const faqs = [
  {
    q: "Do I need an IT background to join?",
    a: "No. Our tracks start from fundamentals and build up to advanced topics, so freshers and career-changers can start from zero. Working professionals can join specific advanced tracks directly.",
  },
  {
    q: "What does placement assistance actually include?",
    a: "Mock interviews, resume guidance, technical interview preparation and continued support during your job search. Over 1000 students have been placed to date.",
  },
  {
    q: "Which course should I start with?",
    a: "For most people aiming at data or testing roles, SQL is the entry point, followed by ETL Testing. If you are targeting programming or automation, start with Python. Call us and we will map a path to the role you want.",
  },
  {
    q: "Are the classes practical or theory-based?",
    a: "Practical. Every track includes hands-on work and real-time project scenarios, because that is what interviews actually test.",
  },
  {
    q: "How long are the courses?",
    a: "Between one and three months depending on the track. SQL, Data Warehousing and NumPy run for a month; ETL Testing, PySpark, Power BI, Databricks, Azure Data Factory and Snowflake run for two; Python and Automation Testing run for three.",
  },
  {
    q: "Where are you located?",
    a: "Above IDBI Bank on B.K. College Road, Ambedkar Nagar, Chikkodi, Karnataka 591201. We are open Monday to Friday 9 AM to 8 PM and Saturday 9 AM to 6 PM.",
  },
] as const;
