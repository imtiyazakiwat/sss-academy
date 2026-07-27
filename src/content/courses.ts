/**
 * Course catalogue.
 *
 * `title`, `durationMonths` and `summary` are verbatim from the legacy site's
 * courses.php. `topics` are decomposed from the same summary copy — no new
 * curriculum claims are introduced.
 */

export type CourseTrack = "data" | "testing" | "cloud" | "programming" | "bi";

export interface Course {
  slug: string;
  title: string;
  /** Short label used in dense UI */
  short: string;
  durationMonths: number;
  track: CourseTrack;
  level: "Beginner" | "Beginner to Advanced" | "Intermediate";
  summary: string;
  /** Marketing one-liner distilled from the summary */
  outcome: string;
  topics: string[];
  featured: boolean;
}

export const trackLabels: Record<CourseTrack, string> = {
  data: "Data Engineering",
  testing: "Quality & Testing",
  cloud: "Cloud Platforms",
  programming: "Programming",
  bi: "Analytics & BI",
};

export const courses: Course[] = [
  {
    slug: "sql",
    title: "SQL",
    short: "SQL",
    durationMonths: 1,
    track: "data",
    level: "Beginner to Advanced",
    summary:
      "Master SQL from Basics to Advanced including Joins, Subqueries, CTEs, Window Functions, ETL Validation and Real-Time Projects with Interview Preparation.",
    outcome:
      "Write production-grade queries and validate data like a working engineer.",
    topics: [
      "SQL fundamentals and query structure",
      "Joins and set operations",
      "Subqueries and correlated subqueries",
      "Common Table Expressions (CTEs)",
      "Window functions",
      "ETL validation with SQL",
      "Real-time projects",
      "Interview preparation",
    ],
    featured: true,
  },
  {
    slug: "python",
    title: "Python",
    short: "Python",
    durationMonths: 3,
    track: "programming",
    level: "Beginner to Advanced",
    summary:
      "Learn Python programming from basics to advanced concepts including OOPs, File Handling, APIs, Pandas, Automation, and real-world project development.",
    outcome:
      "Go from first script to shipping automation and data pipelines in Python.",
    topics: [
      "Core Python syntax and data structures",
      "Object-oriented programming",
      "File handling",
      "Working with APIs",
      "Data analysis with Pandas",
      "Scripting and automation",
      "Real-world project development",
    ],
    featured: true,
  },
  {
    slug: "etl-testing",
    title: "ETL Testing",
    short: "ETL Testing",
    durationMonths: 2,
    track: "testing",
    level: "Beginner to Advanced",
    summary:
      "Master ETL Testing concepts including data validation, source-to-target testing, data warehouse testing, SQL validation, and real-time project scenarios.",
    outcome:
      "The flagship track behind most of our MNC placements.",
    topics: [
      "ETL concepts and testing lifecycle",
      "Data validation techniques",
      "Source-to-target mapping and testing",
      "Data warehouse testing",
      "SQL-based validation",
      "Real-time project scenarios",
    ],
    featured: true,
  },
  {
    slug: "pyspark",
    title: "PySpark",
    short: "PySpark",
    durationMonths: 2,
    track: "data",
    level: "Intermediate",
    summary:
      "Learn Big Data processing using PySpark, DataFrames, Spark SQL, transformations, actions, and data validation for enterprise-level applications.",
    outcome: "Process data at enterprise scale with Spark.",
    topics: [
      "Big Data and Spark architecture",
      "PySpark DataFrames",
      "Spark SQL",
      "Transformations and actions",
      "Data validation at scale",
      "Enterprise application patterns",
    ],
    featured: true,
  },
  {
    slug: "data-warehousing",
    title: "Data Warehousing",
    short: "DWH",
    durationMonths: 1,
    track: "data",
    level: "Beginner",
    summary:
      "Understand Data Warehouse architecture, dimensional modeling, fact and dimension tables, ETL processes, and business intelligence concepts.",
    outcome:
      "The conceptual backbone every data and ETL role assumes you already have.",
    topics: [
      "Data warehouse architecture",
      "Dimensional modeling",
      "Fact and dimension tables",
      "ETL processes",
      "Business intelligence concepts",
    ],
    featured: true,
  },
  {
    slug: "automation-testing",
    title: "Automation Testing",
    short: "Automation",
    durationMonths: 3,
    track: "testing",
    level: "Beginner to Advanced",
    summary:
      "Gain expertise in Selenium, API Testing, Test Automation Frameworks, Python Automation, and industry-standard testing practices.",
    outcome: "Build test frameworks teams actually maintain.",
    topics: [
      "Selenium WebDriver",
      "API testing",
      "Test automation frameworks",
      "Python automation",
      "Industry-standard testing practices",
    ],
    featured: true,
  },
  {
    slug: "power-bi",
    title: "Power BI",
    short: "Power BI",
    durationMonths: 2,
    track: "bi",
    level: "Beginner to Advanced",
    summary:
      "Learn Power BI from basics to advanced, including data modeling, DAX, Power Query, dashboard creation, data visualization, and business reporting.",
    outcome: "Turn raw tables into dashboards leadership actually reads.",
    topics: [
      "Power BI fundamentals",
      "Data modeling",
      "DAX",
      "Power Query",
      "Dashboard creation",
      "Data visualization",
      "Business reporting",
    ],
    featured: false,
  },
  {
    slug: "databricks",
    title: "Databricks",
    short: "Databricks",
    durationMonths: 2,
    track: "cloud",
    level: "Intermediate",
    summary:
      "Learn Databricks for Big Data and Cloud Analytics, including Spark, Delta Lake, Data Engineering, ETL pipelines, and real-world projects.",
    outcome: "The lakehouse skillset showing up in every data engineering JD.",
    topics: [
      "Databricks workspace and clusters",
      "Spark on Databricks",
      "Delta Lake",
      "Data engineering workflows",
      "ETL pipelines",
      "Real-world projects",
    ],
    featured: false,
  },
  {
    slug: "azure-data-factory",
    title: "Azure Data Factory",
    short: "ADF",
    durationMonths: 2,
    track: "cloud",
    level: "Intermediate",
    summary:
      "Learn Azure Data Factory pipelines, data integration, cloud ETL processes, triggers, monitoring, and real-world data migration projects.",
    outcome: "Orchestrate cloud ETL end to end on Azure.",
    topics: [
      "ADF pipelines and activities",
      "Data integration",
      "Cloud ETL processes",
      "Triggers and scheduling",
      "Monitoring and alerting",
      "Real-world data migration projects",
    ],
    featured: false,
  },
  {
    slug: "numpy",
    title: "NumPy",
    short: "NumPy",
    durationMonths: 1,
    track: "programming",
    level: "Beginner",
    summary:
      "Master NumPy for numerical computing, arrays, mathematical operations, data manipulation, and performance optimization in Python applications.",
    outcome: "The numerical foundation under Pandas, Spark and every ML stack.",
    topics: [
      "Numerical computing basics",
      "Arrays and broadcasting",
      "Mathematical operations",
      "Data manipulation",
      "Performance optimization in Python",
    ],
    featured: false,
  },
  {
    slug: "snowflake",
    title: "Snowflake",
    short: "Snowflake",
    durationMonths: 2,
    track: "cloud",
    level: "Intermediate",
    summary:
      "Master Snowflake Cloud Data Warehouse, including SQL, data loading, Snowpipe, Time Travel, Streams, Tasks, and real-world data engineering projects.",
    outcome: "Own the cloud warehouse that modern data teams run on.",
    topics: [
      "Snowflake architecture",
      "SQL on Snowflake",
      "Data loading and Snowpipe",
      "Time Travel",
      "Streams and Tasks",
      "Real-world data engineering projects",
    ],
    featured: false,
  },
];

export const featuredCourses = courses.filter((c) => c.featured);

export function getCourse(slug: string): Course | undefined {
  return courses.find((c) => c.slug === slug);
}

export function relatedCourses(slug: string, limit = 3): Course[] {
  const current = getCourse(slug);
  if (!current) return courses.slice(0, limit);
  const sameTrack = courses.filter(
    (c) => c.slug !== slug && c.track === current.track,
  );
  const rest = courses.filter(
    (c) => c.slug !== slug && c.track !== current.track,
  );
  return [...sameTrack, ...rest].slice(0, limit);
}

export function durationLabel(months: number): string {
  return months === 1 ? "1 month" : `${months} months`;
}
