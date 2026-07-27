/**
 * Playground lab registry.
 *
 * Every lab is anchored to a course that actually exists in `courses.ts`, and
 * `topics` quotes that course's syllabus lines verbatim — the playground is a
 * practical layer over the syllabus we already publish, not a second, invented
 * catalogue. `assertLabTopics()` at the bottom of this file enforces that at
 * module load, so a typo in a topic string fails the build rather than shipping
 * a lab that claims to teach something the course never listed.
 *
 * Six of the eleven courses (Python, NumPy, Power BI, Automation Testing,
 * Databricks, Azure Data Factory) have no labs here. Their syllabus is not
 * SQL-executable, and a fake console would teach nothing.
 */

import { courses, type Course } from "@/content/courses";

export type LabKind =
  | "query"
  | "etl-pipeline"
  | "validation"
  | "scd"
  | "schema"
  | "challenges"
  | "interview";

export interface Snippet {
  label: string;
  /** Why this query matters, one line. Shown above the Run button. */
  note: string;
  sql: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  /** Index into `options`. */
  answer: number;
  explain: string;
}

export interface Challenge {
  prompt: string;
  hint: string;
  starter: string;
  /** Reference query. Run at check time and compared to the student's rows. */
  solution: string;
  /** When true the student's row order must match the reference exactly. */
  orderMatters?: boolean;
}

export interface InterviewQuestion {
  question: string;
  answer: string;
  /** Course this question is usually asked against. */
  courseSlug: Course["slug"];
}

export interface Lab {
  slug: string;
  title: string;
  /** Sidebar label — short enough for a 15rem rail. */
  short: string;
  kind: LabKind;
  /** Must be a slug from `courses.ts`. Drives grouping and cross-links. */
  courseSlug: Course["slug"];
  /** Verbatim topic lines from that course's `topics` array. */
  topics: string[];
  /** Other courses this lab is also relevant to. */
  alsoCovers?: Course["slug"][];
  summary: string;
  minutes: number;
  /** Two to four short points. Deliberately not prose paragraphs. */
  points: string[];
  /** Shown only in presentation mode, for whoever is teaching. */
  notes: string[];
  snippets?: Snippet[];
  challenges?: Challenge[];
  quiz?: QuizQuestion[];
  /** Set when the lab's SQL is portable but the course's engine is not SQLite. */
  engineNote?: string;
}

export const labs: Lab[] = [
  /* ---------------------------------------------------------------
     SQL
     --------------------------------------------------------------- */
  {
    slug: "sql-basics",
    title: "SQL Playground",
    short: "SQL Playground",
    kind: "query",
    courseSlug: "sql",
    topics: ["SQL fundamentals and query structure"],
    summary:
      "A real SQLite engine in your browser. Write a query, press Run, and the rows come back from a real database — then open the database map to see the tables you just read from.",
    minutes: 20,
    points: [
      "Every table in the sidebar is live. Click one to see its rows immediately.",
      "SELECT runs in single-digit milliseconds, so you can afford to guess and check.",
      "The clause order you write is not the order the engine runs — FROM comes first, SELECT nearly last.",
    ],
    notes: [
      "Open with a bare SELECT *, then add one clause at a time and re-run so the class sees each clause change the result set.",
      "Ask the room to predict the row count before every run. Being wrong out loud is the lesson.",
    ],
    snippets: [
      {
        label: "Select everything",
        note: "Start wide, then narrow. Always know what a table holds first.",
        sql: "SELECT * FROM customer;",
      },
      {
        label: "Pick columns and filter",
        note: "WHERE runs before SELECT, so it can filter on columns you never display.",
        sql: `SELECT customer_name, city, segment
FROM customer
WHERE state = 'Karnataka'
ORDER BY customer_name;`,
      },
      {
        label: "Aggregate with GROUP BY",
        note: "One output row per group. Anything not aggregated must be grouped.",
        sql: `SELECT segment,
       COUNT(*) AS customers,
       ROUND(AVG(amount), 2) AS avg_order
FROM customer c
JOIN orders o ON o.customer_id = c.customer_id
GROUP BY segment
ORDER BY avg_order DESC;`,
      },
      {
        label: "HAVING vs WHERE",
        note: "WHERE filters rows going in, HAVING filters groups coming out.",
        sql: `SELECT city, COUNT(*) AS orders_placed
FROM customer c
JOIN orders o ON o.customer_id = c.customer_id
WHERE o.status = 'Delivered'
GROUP BY city
HAVING COUNT(*) > 2
ORDER BY orders_placed DESC;`,
      },
      {
        label: "NULL is not a value",
        note: "Harsh Vora has no department. = NULL never matches; IS NULL does.",
        sql: `SELECT employee_name, department_id
FROM employee
WHERE department_id IS NULL;`,
      },
    ],
    quiz: [
      {
        question:
          "In a query with WHERE, GROUP BY, HAVING and ORDER BY, which runs first?",
        options: ["SELECT", "WHERE", "GROUP BY", "ORDER BY"],
        answer: 1,
        explain:
          "FROM resolves the source, then WHERE filters rows, then GROUP BY forms groups, then HAVING filters those groups, then SELECT projects, and ORDER BY sorts last.",
      },
      {
        question: "How many rows does SELECT * FROM employee WHERE department_id = NULL return?",
        options: ["1", "0", "8", "An error"],
        answer: 1,
        explain:
          "Comparing anything to NULL yields UNKNOWN, never TRUE, so no row qualifies. You need IS NULL.",
      },
    ],
  },
  {
    slug: "joins",
    title: "Joins & Set Operations",
    short: "Joins & Sets",
    kind: "query",
    courseSlug: "sql",
    topics: ["Joins and set operations"],
    summary:
      "The same two tables, five different joins, five different row counts. Run them back to back and the difference stops being abstract.",
    minutes: 25,
    points: [
      "employee has 8 rows, one with a NULL department — that single row is what separates INNER from LEFT.",
      "A join is a filter and a multiplier at once: matching rows survive, and duplicates on either side fan out.",
      "UNION removes duplicates and sorts; UNION ALL does neither and is faster.",
    ],
    notes: [
      "Run the INNER then the LEFT immediately after. 7 rows versus 8 rows is the entire concept.",
      "SQLite has no RIGHT JOIN in older builds — worth mentioning that swapping table order gives you the same result.",
    ],
    snippets: [
      {
        label: "INNER JOIN — 7 rows",
        note: "Only employees whose department matches. Harsh Vora disappears.",
        sql: `SELECT e.employee_name, d.department_name
FROM employee e
JOIN department d ON d.department_id = e.department_id
ORDER BY e.employee_id;`,
      },
      {
        label: "LEFT JOIN — 8 rows",
        note: "Every employee survives; the unmatched side comes back NULL.",
        sql: `SELECT e.employee_name, d.department_name
FROM employee e
LEFT JOIN department d ON d.department_id = e.department_id
ORDER BY e.employee_id;`,
      },
      {
        label: "Find the orphans",
        note: "A LEFT JOIN with IS NULL on the right side — the anti-join pattern.",
        sql: `SELECT e.employee_name
FROM employee e
LEFT JOIN department d ON d.department_id = e.department_id
WHERE d.department_id IS NULL;`,
      },
      {
        label: "Departments with nobody in them",
        note: "Same pattern, other direction. Sales has no employees assigned.",
        sql: `SELECT d.department_name
FROM department d
LEFT JOIN employee e ON e.department_id = d.department_id
WHERE e.employee_id IS NULL;`,
      },
      {
        label: "Three-table join",
        note: "Joins chain. Each ON only needs to relate to something already in scope.",
        sql: `SELECT c.customer_name, p.product_name, o.quantity, o.amount
FROM orders o
JOIN customer c ON c.customer_id = o.customer_id
JOIN product p  ON p.product_id = o.product_id
WHERE o.amount > 100000
ORDER BY o.amount DESC;`,
      },
      {
        label: "UNION vs UNION ALL",
        note: "Swap UNION for UNION ALL and watch the count change — duplicates return.",
        sql: `SELECT city FROM customer WHERE state = 'Karnataka'
UNION
SELECT city FROM customer WHERE segment = 'Corporate'
ORDER BY city;`,
      },
      {
        label: "EXCEPT and INTERSECT",
        note: "Set operators compare whole rows, and both sides must line up.",
        sql: `SELECT product FROM src_sales
EXCEPT
SELECT product FROM tgt_sales;`,
      },
    ],
    quiz: [
      {
        question:
          "employee has 8 rows and department has 4. An INNER JOIN on department_id returns 7. Why?",
        options: [
          "One department has no employees",
          "One employee has a NULL department_id",
          "The join key is not unique",
          "SQLite drops the last row",
        ],
        answer: 1,
        explain:
          "NULL never equals anything, including another NULL, so that employee finds no match and an INNER JOIN discards it.",
      },
      {
        question: "Which returns rows in the left table with no match on the right?",
        options: [
          "INNER JOIN with IS NULL",
          "LEFT JOIN with a WHERE on the right key IS NULL",
          "UNION ALL",
          "CROSS JOIN",
        ],
        answer: 1,
        explain:
          "That is the anti-join. The LEFT JOIN keeps unmatched rows, and testing the right-hand key for NULL keeps only those.",
      },
    ],
  },
  {
    slug: "subqueries-ctes",
    title: "Subqueries & CTEs",
    short: "Subqueries & CTEs",
    kind: "query",
    courseSlug: "sql",
    topics: [
      "Subqueries and correlated subqueries",
      "Common Table Expressions (CTEs)",
    ],
    summary:
      "Rewrite the same answer four ways — scalar subquery, IN, correlated subquery, CTE — and compare both the readability and the execution plan.",
    minutes: 25,
    points: [
      "A scalar subquery returns exactly one value and can sit anywhere a value can.",
      "A correlated subquery re-runs per outer row. That is why it reads well and scales badly.",
      "A CTE is a named result set. Same plan as a derived table, far better readability.",
    ],
    notes: [
      "Show the correlated version, then the CTE version. Same rows, very different code — and the second one you can actually read out loud.",
      "This is where students stop writing one enormous query and start naming their steps.",
    ],
    snippets: [
      {
        label: "Scalar subquery",
        note: "One value, computed once, compared against every row.",
        sql: `SELECT customer_name, amount
FROM orders o
JOIN customer c ON c.customer_id = o.customer_id
WHERE amount > (SELECT AVG(amount) FROM orders)
ORDER BY amount DESC;`,
      },
      {
        label: "IN with a subquery",
        note: "A set, not a value. Reads like the sentence you would say out loud.",
        sql: `SELECT customer_name, city
FROM customer
WHERE customer_id IN (
  SELECT customer_id FROM orders WHERE status = 'Cancelled'
);`,
      },
      {
        label: "Correlated subquery",
        note: "The inner query references the outer row, so it runs once per customer.",
        sql: `SELECT c.customer_name,
       (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.customer_id) AS orders_placed
FROM customer c
ORDER BY orders_placed DESC, c.customer_name;`,
      },
      {
        label: "EXISTS beats COUNT",
        note: "EXISTS stops at the first match. COUNT(*) > 0 scans everything.",
        sql: `SELECT c.customer_name
FROM customer c
WHERE EXISTS (
  SELECT 1 FROM orders o
  WHERE o.customer_id = c.customer_id AND o.amount > 200000
);`,
      },
      {
        label: "CTE — name your steps",
        note: "Same result as the correlated version, but each step is readable.",
        sql: `WITH customer_totals AS (
  SELECT customer_id,
         COUNT(*) AS orders_placed,
         SUM(amount) AS lifetime_value
  FROM orders
  WHERE status = 'Delivered'
  GROUP BY customer_id
)
SELECT c.customer_name, t.orders_placed, t.lifetime_value
FROM customer_totals t
JOIN customer c ON c.customer_id = t.customer_id
WHERE t.lifetime_value > 100000
ORDER BY t.lifetime_value DESC;`,
      },
      {
        label: "Chained CTEs",
        note: "Each CTE can build on the last. This is how real ETL logic is written.",
        sql: `WITH delivered AS (
  SELECT * FROM orders WHERE status = 'Delivered'
),
by_month AS (
  SELECT strftime('%Y-%m', order_date) AS month,
         SUM(amount) AS revenue
  FROM delivered
  GROUP BY month
)
SELECT month, revenue,
       ROUND(revenue * 100.0 / (SELECT SUM(revenue) FROM by_month), 1) AS pct_of_total
FROM by_month
ORDER BY month;`,
      },
      {
        label: "Recursive CTE",
        note: "How dim_date was generated in this very database.",
        sql: `WITH RECURSIVE seq (n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 12
)
SELECT n AS month_number,
       (SELECT COUNT(*) FROM dim_date d WHERE d.month_number = seq.n) AS days
FROM seq;`,
      },
    ],
    quiz: [
      {
        question: "What makes a subquery correlated?",
        options: [
          "It is inside a WHERE clause",
          "It references a column from the outer query",
          "It returns more than one row",
          "It uses EXISTS",
        ],
        answer: 1,
        explain:
          "The dependency on the outer row is the definition, and it is also why the inner query must be evaluated per outer row.",
      },
      {
        question: "A CTE differs from a subquery mainly in that it…",
        options: [
          "Always runs faster",
          "Is materialised to disk",
          "Is named and can be referenced more than once",
          "Can modify data",
        ],
        answer: 2,
        explain:
          "Naming and reuse are the real wins. The optimiser usually produces the same plan either way.",
      },
    ],
  },
  {
    slug: "window-functions",
    title: "Window Functions",
    short: "Window Functions",
    kind: "query",
    courseSlug: "sql",
    topics: ["Window functions"],
    summary:
      "Aggregate without collapsing rows. Running totals, per-region ranking and month-over-month change, all on the flat sales table.",
    minutes: 25,
    points: [
      "GROUP BY returns one row per group. A window function keeps every row and adds the group's answer alongside.",
      "PARTITION BY chooses the group. ORDER BY inside OVER chooses the running order.",
      "ROW_NUMBER, RANK and DENSE_RANK differ only in how they treat ties.",
    ],
    notes: [
      "Run the GROUP BY version and the OVER version of the same total side by side. 4 rows versus 16 rows makes the point instantly.",
      "The tie-breaking difference between RANK and DENSE_RANK is a standing interview question.",
    ],
    snippets: [
      {
        label: "Aggregate without collapsing",
        note: "Every row survives and carries its region total.",
        sql: `SELECT region, sales_rep, amount,
       SUM(amount) OVER (PARTITION BY region) AS region_total,
       ROUND(amount * 100.0 / SUM(amount) OVER (PARTITION BY region), 1) AS pct_of_region
FROM sales
ORDER BY region, amount DESC;`,
      },
      {
        label: "ROW_NUMBER vs RANK vs DENSE_RANK",
        note: "Same ordering, three different answers wherever values tie.",
        sql: `SELECT region, sales_rep, amount,
       ROW_NUMBER() OVER (ORDER BY amount DESC) AS row_num,
       RANK()       OVER (ORDER BY amount DESC) AS rank_val,
       DENSE_RANK() OVER (ORDER BY amount DESC) AS dense_val
FROM sales
ORDER BY amount DESC;`,
      },
      {
        label: "Top N per group",
        note: "Rank inside a CTE, filter outside. You cannot filter a window in WHERE.",
        sql: `WITH ranked AS (
  SELECT region, sales_rep, amount,
         ROW_NUMBER() OVER (PARTITION BY region ORDER BY amount DESC) AS rn
  FROM sales
)
SELECT region, sales_rep, amount
FROM ranked
WHERE rn = 1
ORDER BY amount DESC;`,
      },
      {
        label: "Running total",
        note: "Add ORDER BY inside OVER and the frame becomes cumulative.",
        sql: `SELECT sale_date, region, amount,
       SUM(amount) OVER (
         PARTITION BY region
         ORDER BY sale_date
         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
       ) AS running_total
FROM sales
ORDER BY region, sale_date;`,
      },
      {
        label: "LAG — compare to the previous row",
        note: "Month-over-month change without a self join.",
        sql: `WITH monthly AS (
  SELECT strftime('%Y-%m', order_date) AS month,
         SUM(amount) AS revenue
  FROM orders
  WHERE status = 'Delivered'
  GROUP BY month
)
SELECT month, revenue,
       LAG(revenue) OVER (ORDER BY month) AS prev_month,
       revenue - LAG(revenue) OVER (ORDER BY month) AS change
FROM monthly
ORDER BY month;`,
      },
      {
        label: "NTILE — bucket the rows",
        note: "Split customers into four spend quartiles.",
        sql: `WITH totals AS (
  SELECT c.customer_name, SUM(o.amount) AS lifetime_value
  FROM orders o
  JOIN customer c ON c.customer_id = o.customer_id
  WHERE o.status = 'Delivered'
  GROUP BY c.customer_name
)
SELECT customer_name, lifetime_value,
       NTILE(4) OVER (ORDER BY lifetime_value DESC) AS quartile
FROM totals
ORDER BY lifetime_value DESC;`,
      },
    ],
    quiz: [
      {
        question: "Two reps tie for second place. Which function gives 1, 2, 2, 3?",
        options: ["ROW_NUMBER", "RANK", "DENSE_RANK", "NTILE"],
        answer: 2,
        explain:
          "DENSE_RANK reuses the tied rank and does not leave a gap. RANK would give 1, 2, 2, 4 and ROW_NUMBER would give 1, 2, 3, 4.",
      },
      {
        question: "Why must a top-N-per-group query wrap the window in a CTE?",
        options: [
          "Window functions are slow",
          "WHERE runs before window functions are evaluated",
          "PARTITION BY is not allowed with ORDER BY",
          "It avoids a full table scan",
        ],
        answer: 1,
        explain:
          "Windows are computed after WHERE and GROUP BY, so the rank does not exist yet when WHERE runs. You need an outer query to filter it.",
      },
    ],
  },
  {
    slug: "sql-challenges",
    title: "SQL Challenges",
    short: "Challenges",
    kind: "challenges",
    courseSlug: "sql",
    topics: ["Real-time projects", "Interview preparation"],
    alsoCovers: ["etl-testing"],
    summary:
      "Ten graded problems drawn from real ETL work. Write the query, press Check, and your result set is compared against the reference answer row by row.",
    minutes: 45,
    points: [
      "Checking compares result sets, not query text — any correct approach passes.",
      "Row order is ignored unless the question explicitly asks for a sort.",
      "Hints are there. Using one is not cheating; guessing blindly is.",
    ],
    notes: [
      "Give the room five minutes per challenge, then have one student drive the projector.",
      "Challenges 4, 7 and 9 are the ones that come up most often in ETL testing interviews.",
    ],
    challenges: [
      {
        prompt:
          "List every customer from Karnataka, showing name and city, sorted by name.",
        hint: "One table, one WHERE, one ORDER BY.",
        starter: "SELECT customer_name, city\nFROM customer\n-- your filter here\n",
        solution:
          "SELECT customer_name, city FROM customer WHERE state = 'Karnataka' ORDER BY customer_name;",
        orderMatters: true,
      },
      {
        prompt:
          "How many orders does each status have? Return status and the count.",
        hint: "GROUP BY the column you are counting within.",
        starter: "SELECT status\nFROM orders\n",
        solution:
          "SELECT status, COUNT(*) AS order_count FROM orders GROUP BY status;",
      },
      {
        prompt:
          "Find the duplicate rows in src_sales: same cid, product and sale_date appearing more than once. Return those three columns plus the number of copies.",
        hint: "GROUP BY all three columns, then HAVING COUNT(*) > 1.",
        starter: "SELECT cid, product, sale_date\nFROM src_sales\n",
        solution: `SELECT cid, product, sale_date, COUNT(*) AS copies
FROM src_sales
GROUP BY cid, product, sale_date
HAVING COUNT(*) > 1;`,
      },
      {
        prompt:
          "Which src_sales rows would fail a NOT NULL check on cid, customer_name or amount? Return src_id and the offending row's three columns.",
        hint: "Three OR'd IS NULL tests.",
        starter: "SELECT src_id, cid, customer_name, amount\nFROM src_sales\n",
        solution: `SELECT src_id, cid, customer_name, amount
FROM src_sales
WHERE cid IS NULL OR customer_name IS NULL OR amount IS NULL;`,
      },
      {
        prompt:
          "Every employee with their department name, including the employee who has no department. Return employee_name and department_name.",
        hint: "An INNER JOIN loses the row. Which join keeps it?",
        starter:
          "SELECT e.employee_name, d.department_name\nFROM employee e\n",
        solution: `SELECT e.employee_name, d.department_name
FROM employee e
LEFT JOIN department d ON d.department_id = e.department_id;`,
      },
      {
        prompt:
          "Total delivered revenue per customer, but only customers above 100000. Return customer_name and the total, highest first.",
        hint: "WHERE filters rows, HAVING filters the groups.",
        starter: "SELECT c.customer_name, SUM(o.amount) AS revenue\nFROM orders o\n",
        solution: `SELECT c.customer_name, SUM(o.amount) AS revenue
FROM orders o
JOIN customer c ON c.customer_id = o.customer_id
WHERE o.status = 'Delivered'
GROUP BY c.customer_name
HAVING SUM(o.amount) > 100000
ORDER BY revenue DESC;`,
        orderMatters: true,
      },
      {
        prompt:
          "Source-to-target reconciliation: which src_sales cid values have no matching row in tgt_sales? Return the distinct cid.",
        hint: "EXCEPT compares whole rows, so select one column from each side.",
        starter: "SELECT DISTINCT cid FROM src_sales\n",
        solution: `SELECT DISTINCT cid FROM src_sales
EXCEPT
SELECT DISTINCT CAST(cid AS TEXT) FROM tgt_sales;`,
      },
      {
        prompt:
          "The highest-value sale in each region. Return region, sales_rep and amount.",
        hint: "ROW_NUMBER inside a CTE, then filter on it outside.",
        starter: "WITH ranked AS (\n  SELECT region, sales_rep, amount\n  FROM sales\n)\n",
        solution: `WITH ranked AS (
  SELECT region, sales_rep, amount,
         ROW_NUMBER() OVER (PARTITION BY region ORDER BY amount DESC) AS rn
  FROM sales
)
SELECT region, sales_rep, amount FROM ranked WHERE rn = 1;`,
      },
      {
        prompt:
          "From dim_customer_scd, return the current version of every customer: customer_id, customer_name, city and segment.",
        hint: "The flag column exists for exactly this query.",
        starter:
          "SELECT customer_id, customer_name, city, segment\nFROM dim_customer_scd\n",
        solution: `SELECT customer_id, customer_name, city, segment
FROM dim_customer_scd
WHERE is_current = 1;`,
      },
      {
        prompt:
          "Monthly delivered revenue for 2025, with the previous month alongside. Return month, revenue and prev_month, oldest first.",
        hint: "Aggregate in a CTE, then LAG over the result.",
        starter:
          "WITH monthly AS (\n  SELECT strftime('%Y-%m', order_date) AS month, SUM(amount) AS revenue\n  FROM orders\n)\n",
        solution: `WITH monthly AS (
  SELECT strftime('%Y-%m', order_date) AS month, SUM(amount) AS revenue
  FROM orders
  WHERE status = 'Delivered'
  GROUP BY month
)
SELECT month, revenue, LAG(revenue) OVER (ORDER BY month) AS prev_month
FROM monthly
ORDER BY month;`,
        orderMatters: true,
      },
    ],
  },

  /* ---------------------------------------------------------------
     ETL Testing
     --------------------------------------------------------------- */
  {
    slug: "etl-pipeline",
    title: "ETL Pipeline Simulator",
    short: "ETL Pipeline",
    kind: "etl-pipeline",
    courseSlug: "etl-testing",
    topics: ["ETL concepts and testing lifecycle"],
    alsoCovers: ["data-warehousing", "azure-data-factory"],
    summary:
      "Run a real ETL job, one stage at a time. Every stage executes actual SQL against the live database — extract, stage, validate, transform, load, reconcile — and you can pause, step back and replay.",
    minutes: 35,
    points: [
      "Nothing here is animated theatre. Each stage runs the SQL shown next to it, and the row counts come back from the database.",
      "src_sales arrives dirty. Watch the reject count at the validation stage and the row count difference at load.",
      "Step backwards and the job re-runs deterministically from the top — the only honest way to rewind a data pipeline.",
    ],
    notes: [
      "Run it once end to end at full speed, then again with Next Step so the class can read each statement.",
      "22 extracted, 8 rejected, 14 loaded. That gap is the whole reason ETL testing is a job. Dwell on it.",
      "Reset before the next batch so the failed-load defects in tgt_sales come back.",
    ],
    quiz: [
      {
        question: "Why load into a staging table instead of straight into the target?",
        options: [
          "Staging is faster to query",
          "It isolates dirty data and lets you validate before the target is touched",
          "Targets cannot accept INSERT",
          "It saves disk space",
        ],
        answer: 1,
        explain:
          "Staging gives you a place to reject, clean and reconcile without ever exposing a half-loaded or invalid state to reporting users.",
      },
      {
        question: "The extract read 22 rows and the target received 14. What should a tester do first?",
        options: [
          "Re-run the job",
          "Raise a defect immediately",
          "Reconcile the counts and account for every rejected row",
          "Increase the batch size",
        ],
        answer: 2,
        explain:
          "A row-count gap is only a defect if it is unexplained. Rejects for nulls, duplicates and orphan keys are expected — but each one must be traceable.",
      },
    ],
  },
  {
    slug: "validation-lab",
    title: "SQL Validation Lab",
    short: "Validation Lab",
    kind: "validation",
    courseSlug: "etl-testing",
    topics: [
      "Data validation techniques",
      "SQL-based validation",
      "Source-to-target mapping and testing",
      "Data warehouse testing",
    ],
    summary:
      "The six checks that make up almost every ETL test plan — metadata, record count, duplicates, nulls, column mapping and minus — each one a real query with its failures highlighted in the result grid.",
    minutes: 40,
    points: [
      "Every check runs against the same seeded defects, so a pass or fail here is a genuine outcome, not a canned message.",
      "Failing rows are marked in the result grid. Red is a defect, amber is a warning worth explaining.",
      "Run the ETL Pipeline lab first and the transformation and target-side MINUS checks turn green, while the source-side checks stay red — a good load rejects bad data, it does not clean the source.",
    ],
    notes: [
      "Metadata validation first. Students always skip it and it is the cheapest defect to find.",
      "On MINUS, run it in both directions. Missing records and extra records are different defects with different owners.",
      "Before the pipeline runs: 4 rows missing and 1 unexpected. After it runs: 0 unexpected but 5 missing, because the rejects are now correctly held back. Ask the room whether that is a pass.",
      "Ask why a duplicate in a source extract is not automatically a bug. Answer: it depends on the declared grain.",
    ],
    quiz: [
      {
        question: "Source has 22 rows, target has 16, and MINUS both ways returns rows on each side. What does that mean?",
        options: [
          "Only missing records",
          "Only extra records",
          "Both missing and unexpected records — two separate defects",
          "The tables are identical",
        ],
        answer: 2,
        explain:
          "Rows on the source-minus-target side are missing from the load. Rows on the target-minus-source side were never sent by the source, which is usually worse.",
      },
      {
        question: "Why is metadata validation run before data validation?",
        options: [
          "It is faster",
          "A datatype or length mismatch will corrupt or truncate data regardless of how clean it is",
          "It is required by SQL",
          "It replaces record count checks",
        ],
        answer: 1,
        explain:
          "If the target column is too narrow or the wrong type, perfectly valid source data still lands wrong. Structure before content.",
      },
      {
        question: "A NOT NULL check fails on 4 of 22 rows. The correct next step is to…",
        options: [
          "Delete the rows",
          "Update them to empty strings",
          "Check the mapping document — the column may legitimately allow nulls",
          "Fail the whole job",
        ],
        answer: 2,
        explain:
          "Whether a null is a defect is defined by the source-to-target mapping, not by preference. Test against the specification.",
      },
    ],
  },
  {
    slug: "interview",
    title: "Interview Mode",
    short: "Interview Mode",
    kind: "interview",
    courseSlug: "etl-testing",
    topics: ["Real-time project scenarios"],
    alsoCovers: ["sql", "data-warehousing"],
    summary:
      "The questions that actually get asked in SQL, ETL testing and data warehousing interviews, with answers hidden until you have tried to answer out loud.",
    minutes: 30,
    points: [
      "Filter by course to drill one area at a time.",
      "Say your answer before you reveal. Reading a good answer feels like knowing it, and it isn't the same thing.",
      "Several answers reference tables in this playground — go and run the query.",
    ],
    notes: [
      "Works well as a closing ten minutes: pick five at random, cold call, reveal, discuss.",
      "Push for the 'why', not the definition. Anyone can recite what SCD Type 2 is.",
    ],
  },

  /* ---------------------------------------------------------------
     Data Warehousing
     --------------------------------------------------------------- */
  {
    slug: "star-schema",
    title: "Schema Visualizer",
    short: "Schema Visualizer",
    kind: "schema",
    courseSlug: "data-warehousing",
    topics: [
      "Data warehouse architecture",
      "Fact and dimension tables",
      "Dimensional modeling",
    ],
    alsoCovers: ["snowflake"],
    summary:
      "Click a dimension and watch its relationship to the fact table light up, its columns appear, and the join that uses it run for real. Then snowflake dim_product and see the same query grow two more joins.",
    minutes: 30,
    points: [
      "fact_sales holds measures and foreign keys, nothing else. Every label lives in a dimension.",
      "The grain of fact_sales is one row per delivered order line. Declare the grain before you model anything.",
      "Star means one join per dimension. Snowflake normalises the dimension, which saves space and costs joins.",
    ],
    notes: [
      "Ask which table you would add a 'customer city' filter to. If anyone says fact_sales, back up.",
      "Toggle snowflake mode and count the joins in the query before and after. That is the entire trade-off.",
    ],
    quiz: [
      {
        question: "What does the grain of a fact table define?",
        options: [
          "How many columns it has",
          "What exactly one row represents",
          "Its storage engine",
          "Which dimensions are conformed",
        ],
        answer: 1,
        explain:
          "Grain is the business meaning of a single row. Get it wrong and every measure double counts or disappears.",
      },
      {
        question: "The main cost of snowflaking a dimension is…",
        options: [
          "More storage",
          "More joins per query",
          "Loss of history",
          "Duplicate facts",
        ],
        answer: 1,
        explain:
          "Normalising removes redundancy and saves space, but every level you split out becomes another join at query time.",
      },
    ],
  },
  {
    slug: "scd-simulator",
    title: "SCD Type Simulator",
    short: "SCD Simulator",
    kind: "scd",
    courseSlug: "data-warehousing",
    topics: ["Dimensional modeling", "Fact and dimension tables"],
    alsoCovers: ["etl-testing"],
    summary:
      "Change a customer's city and watch all three SCD types react at once: Type 1 overwrites and forgets, Type 2 expires the old row and inserts a new version, Type 3 keeps one previous value. Then drag the timeline to query the dimension as of any date.",
    minutes: 35,
    points: [
      "The change runs as real SQL: an UPDATE that closes the current row, then an INSERT that opens the next version.",
      "end_date 9999-12-31 with is_current = 1 marks the live version. Both exist so you can query either way.",
      "Drag the timeline and the 'as of' query re-runs — that is what history actually buys you.",
    ],
    notes: [
      "Make one change, then ask each type the same question: what was this customer's city in March? Only Type 2 can answer.",
      "Point out that Type 2 grows the dimension. Ask what that does to a fact join over five years.",
      "The two-statement pattern — expire then insert — is the thing to memorise.",
    ],
    quiz: [
      {
        question: "A customer moves city and you need reports from last year to keep showing the old city. Which type?",
        options: ["Type 0", "Type 1", "Type 2", "Type 3"],
        answer: 2,
        explain:
          "Only Type 2 preserves full history by versioning rows, which is what lets a historical fact join resolve to the dimension value that was current at the time.",
      },
      {
        question: "In a Type 2 dimension, what identifies the live version of a member?",
        options: [
          "The highest customer_key",
          "is_current = 1, or end_date = 9999-12-31",
          "The lowest start_date",
          "The natural key",
        ],
        answer: 1,
        explain:
          "Both the flag and the open-ended end date mark the current row. The surrogate key only guarantees uniqueness, not recency.",
      },
      {
        question: "What does Type 3 give up compared to Type 2?",
        options: [
          "Nothing",
          "All history beyond one previous value",
          "The surrogate key",
          "Referential integrity",
        ],
        answer: 1,
        explain:
          "Type 3 parks a single prior value in its own column. The second change overwrites the first, so deeper history is gone.",
      },
    ],
  },

  /* ---------------------------------------------------------------
     Portable-SQL labs for the engine-specific courses
     --------------------------------------------------------------- */
  {
    slug: "spark-sql",
    title: "Spark SQL Basics",
    short: "Spark SQL",
    kind: "query",
    courseSlug: "pyspark",
    topics: ["Spark SQL", "Data validation at scale"],
    summary:
      "The Spark SQL patterns that carry over from ordinary SQL — aggregations, joins, windows and validation queries — written the way you would write them against a DataFrame view.",
    minutes: 20,
    engineNote:
      "These queries run on SQLite in your browser, so they are restricted to portable ANSI SQL that behaves identically in Spark. Spark-only syntax and anything that depends on partitioning or the physical plan has to be done on a real cluster.",
    points: [
      "spark.sql() takes the same SELECT you already know. The API is the new part, not the language.",
      "Validation at scale is the same query you would run on a small table — the cost model is what changes.",
      "Anything touching shuffles, partitions or broadcast joins needs a real cluster to be meaningful.",
    ],
    notes: [
      "Emphasise what does not transfer: no plan inspection, no shuffle behaviour, no partition tuning here.",
      "Pair this with the cluster session — students should see the same query run in both places.",
    ],
    snippets: [
      {
        label: "Aggregate a table",
        note: "Identical in Spark SQL. This is the reassuring part.",
        sql: `SELECT category,
       COUNT(*) AS line_items,
       SUM(amount) AS revenue
FROM sales
GROUP BY category
ORDER BY revenue DESC;`,
      },
      {
        label: "Join and filter",
        note: "In Spark the same statement runs over a distributed DataFrame view.",
        sql: `SELECT c.customer_name, SUM(o.amount) AS revenue
FROM orders o
JOIN customer c ON c.customer_id = o.customer_id
WHERE o.status = 'Delivered'
GROUP BY c.customer_name
ORDER BY revenue DESC;`,
      },
      {
        label: "Window function",
        note: "Spark supports the full window syntax. Same results, different engine.",
        sql: `SELECT region, sales_rep, amount,
       RANK() OVER (PARTITION BY region ORDER BY amount DESC) AS region_rank
FROM sales
ORDER BY region, region_rank;`,
      },
      {
        label: "Data quality check",
        note: "The null-and-duplicate profile you would run on landing data.",
        sql: `SELECT COUNT(*) AS total_rows,
       SUM(CASE WHEN cid IS NULL THEN 1 ELSE 0 END) AS null_cid,
       SUM(CASE WHEN customer_name IS NULL THEN 1 ELSE 0 END) AS null_name,
       SUM(CASE WHEN amount IS NULL THEN 1 ELSE 0 END) AS null_amount,
       COUNT(*) - COUNT(DISTINCT cid || '|' || product || '|' || sale_date) AS duplicate_rows
FROM src_sales;`,
      },
    ],
    quiz: [
      {
        question: "Which of these cannot be demonstrated on a single-node engine?",
        options: [
          "GROUP BY semantics",
          "Window function results",
          "Shuffle and partition behaviour",
          "Join result correctness",
        ],
        answer: 2,
        explain:
          "Results are identical on one node. Distribution — shuffles, partitions, broadcast joins — only exists once the data is spread across executors.",
      },
    ],
  },
  {
    slug: "warehouse-sql",
    title: "Warehouse SQL Patterns",
    short: "Warehouse SQL",
    kind: "query",
    courseSlug: "snowflake",
    topics: ["SQL on Snowflake", "Snowflake architecture"],
    summary:
      "The portable half of cloud warehouse SQL — analytic aggregation, dimensional joins and incremental-load patterns — practised here before you run them against a real warehouse.",
    minutes: 20,
    engineNote:
      "Runs on SQLite, so only portable ANSI SQL is used. Snowflake-specific features — Time Travel, Streams, Tasks, Snowpipe, QUALIFY, zero-copy cloning — depend on Snowflake's storage layer and have to be done on a real account.",
    points: [
      "Analytic SQL is the transferable skill; the platform features sit on top of it.",
      "The incremental-load pattern below is the shape almost every warehouse merge takes.",
      "Time Travel, Streams and Tasks are storage-layer features — no browser engine can imitate them honestly.",
    ],
    notes: [
      "Be explicit about the boundary: this lab is the SQL, the cloud session is the platform.",
      "Show the MERGE equivalent on a real account afterwards; SQLite's UPSERT is close but not identical.",
    ],
    snippets: [
      {
        label: "Dimensional aggregation",
        note: "Fact joined to dimensions — the query shape a warehouse exists to serve.",
        sql: `SELECT d.month_name,
       dp.category,
       SUM(f.amount) AS revenue,
       SUM(f.quantity) AS units
FROM fact_sales f
JOIN dim_date d    ON d.date_key = f.date_key
JOIN dim_product dp ON dp.product_key = f.product_key
GROUP BY d.month_number, d.month_name, dp.category
ORDER BY d.month_number, revenue DESC;`,
      },
      {
        label: "Incremental load pattern",
        note: "Insert only what the target does not already have — the portable upsert.",
        sql: `SELECT s.cid, s.customer_name, s.product, s.amount, s.sale_date
FROM stg_sales s
WHERE s.reject_reason IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM tgt_sales t
    WHERE t.cid = s.cid
      AND t.product = s.product
      AND t.sale_date = s.sale_date
  );`,
      },
      {
        label: "Reconciliation summary",
        note: "The one-row report every load should end by writing to a log table.",
        sql: `SELECT
  (SELECT COUNT(*) FROM src_sales) AS source_rows,
  (SELECT COUNT(*) FROM stg_sales) AS staged_rows,
  (SELECT COUNT(*) FROM tgt_sales) AS target_rows,
  (SELECT ROUND(SUM(amount), 2) FROM tgt_sales) AS target_amount;`,
      },
    ],
    quiz: [
      {
        question: "Why can Time Travel not be simulated in a browser SQL engine?",
        options: [
          "It is a SQL syntax extension only",
          "It depends on the warehouse retaining immutable historical file versions in its storage layer",
          "It requires a paid licence check",
          "It is just a synonym for SCD Type 2",
        ],
        answer: 1,
        explain:
          "Time Travel reads earlier immutable versions of micro-partitions kept by the platform's storage layer. Without that storage model there is nothing to travel back to.",
      },
    ],
  },
];

/**
 * Interview Mode content. Grouped by the course a question belongs to, which is
 * also how the lab filters them.
 */
export const interviewQuestions: InterviewQuestion[] = [
  {
    courseSlug: "sql",
    question: "What is the difference between WHERE and HAVING?",
    answer:
      "WHERE filters individual rows before grouping; HAVING filters groups after aggregation. So WHERE cannot reference an aggregate, and HAVING usually does. If a condition can be expressed in WHERE, put it there — filtering earlier means fewer rows to group.",
  },
  {
    courseSlug: "sql",
    question: "Why does COUNT(*) differ from COUNT(column)?",
    answer:
      "COUNT(*) counts rows. COUNT(column) counts rows where that column is not null. In src_sales, COUNT(*) returns 22 but COUNT(amount) returns 21, because one row has a null amount — which is exactly how you spot a null problem in one query.",
  },
  {
    courseSlug: "sql",
    question: "How do you find duplicate records in a table?",
    answer:
      "GROUP BY the columns that define uniqueness, then HAVING COUNT(*) > 1. The important part is agreeing which columns define a duplicate — that comes from the declared grain, not from intuition. In src_sales the business key is cid, product and sale_date.",
  },
  {
    courseSlug: "sql",
    question: "What is the difference between UNION and UNION ALL?",
    answer:
      "UNION removes duplicate rows, which forces a sort or hash to detect them. UNION ALL concatenates and keeps everything. UNION ALL is faster and is the right default unless you specifically need de-duplication.",
  },
  {
    courseSlug: "sql",
    question: "Explain RANK, DENSE_RANK and ROW_NUMBER.",
    answer:
      "All three number rows within a window. ROW_NUMBER is always sequential and breaks ties arbitrarily. RANK gives ties the same number then skips (1, 2, 2, 4). DENSE_RANK gives ties the same number without skipping (1, 2, 2, 3). Use ROW_NUMBER for de-duplication and top-N, RANK or DENSE_RANK when ties are meaningful.",
  },
  {
    courseSlug: "sql",
    question: "Why can't you filter a window function in WHERE?",
    answer:
      "Window functions are evaluated after WHERE, GROUP BY and HAVING, so the value does not exist yet when WHERE runs. Wrap the query in a CTE or derived table and filter in the outer query.",
  },
  {
    courseSlug: "sql",
    question: "When would you use a correlated subquery instead of a join?",
    answer:
      "When the logic reads more clearly per row and the outer set is small — existence checks, or a single derived value per row. Be aware it is evaluated per outer row, so on large sets a join or window function is usually faster. EXISTS is preferable to COUNT(*) > 0 because it short-circuits on the first match.",
  },
  {
    courseSlug: "etl-testing",
    question: "Why do we need a staging table? Can't we load the target directly?",
    answer:
      "Staging gives you somewhere to land raw data and validate it before anything reaches the target. You can reject rows, clean and standardise, reconcile counts, and re-run the transform without re-extracting from the source system. Loading the target directly means reporting users can see half-loaded or invalid data, and a failure leaves you with no clean point to restart from.",
  },
  {
    courseSlug: "etl-testing",
    question: "What are the main types of ETL validation you would write?",
    answer:
      "Metadata validation (column names, datatypes, lengths, nullability), record count reconciliation across source, staging and target, duplicate checks on the business key, null and domain checks against the mapping document, column-level mapping and transformation checks, and MINUS in both directions to catch missing and unexpected rows. Metadata first — a datatype mismatch corrupts even perfect data.",
  },
  {
    courseSlug: "etl-testing",
    question: "Why run MINUS in both directions?",
    answer:
      "Source MINUS target finds rows that failed to load — missing data. Target MINUS source finds rows in the target the source never sent — usually a worse defect, caused by a duplicated load, a bad restart, or a stale row that should have been deleted. They are two separate defects with two different root causes.",
  },
  {
    courseSlug: "etl-testing",
    question: "The source has 22 rows and the target has 18. Is that a defect?",
    answer:
      "Not necessarily. It is a defect only if the gap is unexplained. Rows rejected for nulls in mandatory columns, duplicates on the business key, or orphan foreign keys are expected losses — but every single one must be traceable to a rule in the mapping document and ideally recorded in a reject table. Unexplained variance is the defect.",
  },
  {
    courseSlug: "etl-testing",
    question: "How do you test a transformation rule?",
    answer:
      "Read the rule from the mapping document, then write a query that independently recomputes the expected value from the source and compares it to the target. Never re-use the ETL's own logic to verify itself. Cover boundary cases explicitly: nulls, zero, negatives, maximum lengths, and both date formats if the source is inconsistent.",
  },
  {
    courseSlug: "etl-testing",
    question: "What is a reject table and what belongs in it?",
    answer:
      "A table that captures rows that failed validation, along with the reason and a timestamp. It keeps the good load moving while preserving the failures for analysis, and it turns 'we lost four rows' into 'four rows were rejected for a null business key at 02:14'. Without it, reconciliation gaps are unresolvable.",
  },
  {
    courseSlug: "etl-testing",
    question: "How would you test an incremental load?",
    answer:
      "Verify the change-detection mechanism first — the watermark column, CDC stream or hash. Then test three scenarios: a new record inserts, a changed record updates or versions correctly, and an unchanged record is not touched. Re-run the same batch twice and confirm the target is unchanged; idempotency is where incremental loads usually break.",
  },
  {
    courseSlug: "data-warehousing",
    question: "What is the grain of a fact table and why declare it first?",
    answer:
      "The grain is the business meaning of one row — for fact_sales here, one delivered order line. You declare it first because it determines which dimensions can attach and whether measures are additive. Mixing grains in one fact table causes double counting that no amount of query tuning will fix.",
  },
  {
    courseSlug: "data-warehousing",
    question: "Star schema or snowflake schema?",
    answer:
      "Star keeps each dimension denormalised in one table: fewer joins, simpler queries, more redundancy. Snowflake normalises dimensions into levels: less storage and easier maintenance of shared attributes, at the cost of extra joins per query. Most warehouses default to star for query performance and snowflake only where a hierarchy is genuinely shared or volatile.",
  },
  {
    courseSlug: "data-warehousing",
    question: "Why use surrogate keys instead of the source's natural key?",
    answer:
      "A surrogate key is warehouse-owned, so it survives source-system changes, reused or recycled natural keys, and integration of two sources with colliding ids. Critically, it is what makes SCD Type 2 possible — one customer needs several dimension rows, so the natural key cannot be the primary key.",
  },
  {
    courseSlug: "data-warehousing",
    question: "Walk me through what happens on an SCD Type 2 change.",
    answer:
      "Two statements. First, close the current row: set end_date to the day before the change and is_current to 0. Second, insert a new row with the new attribute values, start_date on the change date, end_date 9999-12-31, is_current 1, and a fresh surrogate key. Facts loaded before the change keep pointing at the old surrogate key, which is what makes historical reports stay correct.",
  },
  {
    courseSlug: "data-warehousing",
    question: "What is the difference between SCD Type 1, 2 and 3?",
    answer:
      "Type 1 overwrites the attribute and loses history — right for corrections, like a misspelled name. Type 2 versions the row and keeps full history — right when reports must reflect what was true at the time. Type 3 adds a previous-value column and keeps exactly one prior value — right when you only ever need to compare current against immediately previous.",
  },
  {
    courseSlug: "data-warehousing",
    question: "What is a factless fact table?",
    answer:
      "A fact table with foreign keys but no numeric measures. It records that an event or a relationship existed — attendance on a date, a promotion applying to a product. You count rows rather than sum a measure.",
  },
  {
    courseSlug: "data-warehousing",
    question: "Additive, semi-additive, non-additive — what's the distinction?",
    answer:
      "Additive measures can be summed across every dimension, like sales amount. Semi-additive measures can be summed across some dimensions but not time, like an account balance or inventory level. Non-additive measures cannot be summed at all, like a ratio or a unit price — you must recompute them from their additive components.",
  },
];

/* ---------------------------------------------------------------
   Lookups
   --------------------------------------------------------------- */

export function getLab(slug: string): Lab | undefined {
  return labs.find((lab) => lab.slug === slug);
}

export const labCount = labs.length;

export interface LabGroup {
  course: Course;
  labs: Lab[];
}

/**
 * Labs grouped by their course, in the catalogue's own order. Drives both the
 * sidebar rail and the hub page, so the playground's structure mirrors the
 * syllabus students already signed up for.
 */
export const labGroups: LabGroup[] = courses
  .map((course) => ({
    course,
    labs: labs.filter((lab) => lab.courseSlug === course.slug),
  }))
  .filter((group) => group.labs.length > 0);

/** Flat, sidebar-ordered slug list. Presentation mode pages through this. */
export const labOrder: string[] = labGroups.flatMap((group) =>
  group.labs.map((lab) => lab.slug),
);

export function adjacentLabs(slug: string): {
  prev: Lab | undefined;
  next: Lab | undefined;
} {
  const index = labOrder.indexOf(slug);
  if (index === -1) return { prev: undefined, next: undefined };
  return {
    prev: index > 0 ? getLab(labOrder[index - 1]) : undefined,
    next: index < labOrder.length - 1 ? getLab(labOrder[index + 1]) : undefined,
  };
}

/** Labs attached to a course, including the ones that only reference it. */
export function labsForCourse(courseSlug: string): Lab[] {
  return labs.filter(
    (lab) =>
      lab.courseSlug === courseSlug || (lab.alsoCovers?.includes(courseSlug) ?? false),
  );
}

/**
 * Guards the one thing types cannot: that every `topics` entry is a real line
 * from the referenced course's syllabus, and that every `courseSlug` resolves.
 *
 * Throws in development so a typo surfaces on the first page load. In
 * production it only warns — bad lab metadata should not take the site down.
 */
function assertLabTopics(): void {
  const problems: string[] = [];

  for (const lab of labs) {
    const course = courses.find((c) => c.slug === lab.courseSlug);
    if (!course) {
      problems.push(`Lab "${lab.slug}" references unknown course "${lab.courseSlug}".`);
      continue;
    }
    for (const topic of lab.topics) {
      if (!course.topics.includes(topic)) {
        problems.push(
          `Lab "${lab.slug}" claims topic "${topic}", which is not in the ${course.title} syllabus.`,
        );
      }
    }
    for (const other of lab.alsoCovers ?? []) {
      if (!courses.some((c) => c.slug === other)) {
        problems.push(`Lab "${lab.slug}" alsoCovers unknown course "${other}".`);
      }
    }
  }

  if (problems.length === 0) return;

  const message = `Playground lab metadata is out of sync with the course catalogue:\n- ${problems.join("\n- ")}`;
  if (process.env.NODE_ENV === "production") {
    console.warn(message);
  } else {
    throw new Error(message);
  }
}

assertLabTopics();
