/**
 * The playground's teaching database.
 *
 * One SQL script, executed against a fresh in-browser SQLite instance on load
 * and again on every Reset. Everything a lab needs is here, so a classroom can
 * always get back to a known state mid-demonstration.
 *
 * Three deliberate design choices:
 *
 * 1. `src_sales` is dirty on purpose — nulls, duplicates, untrimmed casing,
 *    two date formats, a comma in a number, a negative amount and an orphan
 *    customer id. Every defect maps to a check in the Validation Lab.
 * 2. `tgt_sales` is seeded as a *partially failed* load: two source rows are
 *    missing and one row exists that the source never sent. That makes MINUS
 *    validation meaningful before the pipeline has ever been run, and the ETL
 *    Pipeline lab then reloads it correctly.
 * 3. Derived tables (fact_sales, the dimensions, order amounts) are populated
 *    with INSERT…SELECT rather than literals, so the warehouse always agrees
 *    with its source and students can read the load logic itself.
 */

export const SEED_SQL = /* sql */ `
PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS customer;
DROP TABLE IF EXISTS product;
DROP TABLE IF EXISTS employee;
DROP TABLE IF EXISTS department;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS src_sales;
DROP TABLE IF EXISTS stg_sales;
DROP TABLE IF EXISTS tgt_sales;
DROP TABLE IF EXISTS fact_sales;
DROP TABLE IF EXISTS dim_customer;
DROP TABLE IF EXISTS dim_product;
DROP TABLE IF EXISTS dim_date;
DROP TABLE IF EXISTS dim_category;
DROP TABLE IF EXISTS dim_brand;
DROP TABLE IF EXISTS dim_customer_scd;
DROP TABLE IF EXISTS dim_customer_type1;
DROP TABLE IF EXISTS dim_customer_type3;

/* ============================================================
   Source systems (OLTP)
   ============================================================ */

CREATE TABLE customer (
  customer_id INTEGER PRIMARY KEY,
  customer_name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  segment TEXT NOT NULL,
  signup_date TEXT NOT NULL
);

INSERT INTO customer VALUES
  (1,  'Aarav Kulkarni',  'Belagavi',  'Karnataka',   'Retail',    '2023-02-11'),
  (2,  'Sneha Patil',     'Chikkodi',  'Karnataka',   'Retail',    '2023-04-02'),
  (3,  'Rohit Deshpande', 'Pune',      'Maharashtra', 'Corporate', '2022-11-19'),
  (4,  'Fatima Shaikh',   'Hubballi',  'Karnataka',   'Retail',    '2024-01-08'),
  (5,  'Vikram Naik',     'Mumbai',    'Maharashtra', 'Corporate', '2022-07-23'),
  (6,  'Anjali Rao',      'Bengaluru', 'Karnataka',   'Corporate', '2023-09-30'),
  (7,  'Imran Nadaf',     'Nipani',    'Karnataka',   'Retail',    '2024-03-14'),
  (8,  'Priya Joshi',     'Kolhapur',  'Maharashtra', 'Retail',    '2023-06-05'),
  (9,  'Sagar Hiremath',  'Belagavi',  'Karnataka',   'SMB',       '2024-05-21'),
  (10, 'Neha Kamat',      'Panaji',    'Goa',         'SMB',       '2023-12-01'),
  (11, 'Arjun Pawar',     'Sangli',    'Maharashtra', 'SMB',       '2024-02-17'),
  (12, 'Divya Shetty',    'Mangaluru', 'Karnataka',   'Corporate', '2022-09-09');

CREATE TABLE product (
  product_id INTEGER PRIMARY KEY,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT NOT NULL,
  unit_price REAL NOT NULL
);

INSERT INTO product VALUES
  (1,  'Laptop Pro 14',        'Computers',   'Northwind', 78000),
  (2,  'Laptop Air 13',        'Computers',   'Northwind', 62000),
  (3,  'Wireless Mouse',       'Accessories', 'Kestrel',    1200),
  (4,  'Mechanical Keyboard',  'Accessories', 'Kestrel',    4500),
  (5,  'Monitor 27 inch',      'Displays',    'Lumen',     21000),
  (6,  'Ultrawide 34 inch',    'Displays',    'Lumen',     46000),
  (7,  'USB-C Dock',           'Accessories', 'Kestrel',    8900),
  (8,  'Headset ANC',          'Audio',       'Verve',     15500),
  (9,  'Webcam 4K',            'Accessories', 'Verve',      7300),
  (10, 'Tablet 11',            'Computers',   'Northwind', 39000);

CREATE TABLE department (
  department_id INTEGER PRIMARY KEY,
  department_name TEXT NOT NULL,
  location TEXT NOT NULL
);

INSERT INTO department VALUES
  (10, 'Engineering', 'Bengaluru'),
  (20, 'Data',        'Belagavi'),
  (30, 'Quality',     'Chikkodi'),
  (40, 'Sales',       'Pune');

/* Harsh Vora has no department — the row that makes INNER vs LEFT JOIN visible. */
CREATE TABLE employee (
  employee_id INTEGER PRIMARY KEY,
  employee_name TEXT NOT NULL,
  department_id INTEGER REFERENCES department (department_id),
  role TEXT NOT NULL,
  salary REAL NOT NULL,
  hire_date TEXT NOT NULL
);

INSERT INTO employee VALUES
  (1, 'Kavya Bhat',      20,   'Data Engineer',       92000,  '2022-03-01'),
  (2, 'Sandeep Magadum', 30,   'ETL Tester',          68000,  '2023-01-16'),
  (3, 'Meera Kulkarni',  20,   'Analytics Engineer',  84000,  '2023-08-07'),
  (4, 'Tejas Patil',     10,   'Backend Developer',   105000, '2021-11-22'),
  (5, 'Ritu Salunkhe',   30,   'QA Automation',       72000,  '2024-02-05'),
  (6, 'Omkar Desai',     40,   'Account Manager',     61000,  '2022-06-13'),
  (7, 'Zoya Mulla',      10,   'Frontend Developer',  88000,  '2024-04-01'),
  (8, 'Harsh Vora',      NULL, 'Intern',              25000,  '2025-06-02');

CREATE TABLE orders (
  order_id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customer (customer_id),
  product_id INTEGER NOT NULL REFERENCES product (product_id),
  quantity INTEGER NOT NULL,
  amount REAL,
  order_date TEXT NOT NULL,
  status TEXT NOT NULL
);

INSERT INTO orders (order_id, customer_id, product_id, quantity, order_date, status) VALUES
  (1001, 1,  1,  1, '2025-01-07', 'Delivered'),
  (1002, 3,  5,  2, '2025-01-14', 'Delivered'),
  (1003, 2,  3,  3, '2025-01-22', 'Delivered'),
  (1004, 5,  2,  4, '2025-02-03', 'Delivered'),
  (1005, 6,  6,  1, '2025-02-11', 'Delivered'),
  (1006, 4,  4,  2, '2025-02-19', 'Cancelled'),
  (1007, 1,  7,  1, '2025-02-27', 'Delivered'),
  (1008, 8,  8,  2, '2025-03-05', 'Delivered'),
  (1009, 3,  1,  3, '2025-03-14', 'Delivered'),
  (1010, 7,  9,  1, '2025-03-21', 'Delivered'),
  (1011, 9,  3,  5, '2025-03-28', 'Delivered'),
  (1012, 5,  6,  2, '2025-04-04', 'Delivered'),
  (1013, 12, 1,  2, '2025-04-15', 'Delivered'),
  (1014, 10, 10, 1, '2025-04-23', 'Returned'),
  (1015, 2,  4,  1, '2025-05-02', 'Delivered'),
  (1016, 6,  5,  3, '2025-05-13', 'Delivered'),
  (1017, 11, 7,  2, '2025-05-21', 'Delivered'),
  (1018, 3,  8,  1, '2025-05-29', 'Delivered'),
  (1019, 1,  2,  1, '2025-06-06', 'Delivered'),
  (1020, 8,  3,  4, '2025-06-17', 'Delivered'),
  (1021, 12, 6,  1, '2025-06-25', 'Delivered'),
  (1022, 4,  9,  2, '2025-07-03', 'Delivered'),
  (1023, 5,  1,  5, '2025-07-11', 'Delivered'),
  (1024, 9,  4,  3, '2025-07-19', 'Cancelled'),
  (1025, 7,  10, 1, '2025-07-28', 'Delivered'),
  (1026, 6,  8,  2, '2025-08-08', 'Delivered'),
  (1027, 10, 5,  1, '2025-08-16', 'Delivered'),
  (1028, 11, 2,  2, '2025-08-26', 'Delivered'),
  (1029, 2,  7,  1, '2025-09-04', 'Delivered'),
  (1030, 12, 3,  6, '2025-09-12', 'Delivered');

/* Amount is derived, never typed in — the extended price can't drift from the
   price list this way, and the statement itself is a teachable correlated
   subquery. */
UPDATE orders
SET amount = quantity * (
  SELECT p.unit_price FROM product p WHERE p.product_id = orders.product_id
);

/* Denormalised regional sales — the flat table used for ranking and window
   function practice, where a join would only be noise. */
CREATE TABLE sales (
  sale_id INTEGER PRIMARY KEY,
  region TEXT NOT NULL,
  sales_rep TEXT NOT NULL,
  category TEXT NOT NULL,
  amount REAL NOT NULL,
  sale_date TEXT NOT NULL
);

INSERT INTO sales VALUES
  (1,  'North', 'Omkar Desai',   'Computers',   240000, '2025-01-18'),
  (2,  'North', 'Omkar Desai',   'Accessories',  36000, '2025-02-12'),
  (3,  'North', 'Rekha Jain',    'Computers',   186000, '2025-02-26'),
  (4,  'North', 'Rekha Jain',    'Displays',     92000, '2025-03-19'),
  (5,  'South', 'Nikhil Rao',    'Computers',   312000, '2025-01-25'),
  (6,  'South', 'Nikhil Rao',    'Audio',        46500, '2025-03-06'),
  (7,  'South', 'Asha Menon',    'Displays',    138000, '2025-02-09'),
  (8,  'South', 'Asha Menon',    'Accessories',  27400, '2025-04-02'),
  (9,  'West',  'Pooja Kadam',   'Computers',   195000, '2025-01-30'),
  (10, 'West',  'Pooja Kadam',   'Displays',     67000, '2025-03-24'),
  (11, 'West',  'Faisal Momin',  'Audio',        62000, '2025-04-11'),
  (12, 'West',  'Faisal Momin',  'Accessories',  18900, '2025-05-08'),
  (13, 'East',  'Sourav Das',    'Computers',   117000, '2025-02-20'),
  (14, 'East',  'Sourav Das',    'Displays',     46000, '2025-04-17'),
  (15, 'East',  'Ipsita Sahu',   'Accessories',  22800, '2025-05-15'),
  (16, 'East',  'Ipsita Sahu',   'Audio',        31000, '2025-06-04');

/* ============================================================
   ETL flow: source extract -> staging -> target
   ============================================================ */

/* Everything arrives as TEXT, exactly like a CSV or flat-file extract. The
   datatype mismatch against the typed target is the point of metadata
   validation. */
CREATE TABLE src_sales (
  src_id INTEGER PRIMARY KEY,
  cid TEXT,
  customer_name TEXT,
  product TEXT,
  amount TEXT,
  sale_date TEXT,
  load_ts TEXT
);

INSERT INTO src_sales VALUES
  (1,  '1',  'Aarav Kulkarni',    'Laptop Pro 14',       '78000',   '2025-01-07', '2025-09-15 02:00:00'),
  (2,  '3',  'ROHIT DESHPANDE',   'Monitor 27 inch',     '42000',   '2025-01-14', '2025-09-15 02:00:00'),
  (3,  '2',  '  sneha patil  ',   'Wireless Mouse',      '3600',    '2025/01/22', '2025-09-15 02:00:00'),
  (4,  '5',  'Vikram Naik',       'Laptop Air 13',       '248000',  '2025-02-03', '2025-09-15 02:00:00'),
  (5,  '6',  NULL,                'Ultrawide 34 inch',   '46000',   '2025-02-11', '2025-09-15 02:00:00'),
  (6,  '4',  'Fatima Shaikh',     'Mechanical Keyboard', '9000',    '2025-02-19', '2025-09-15 02:00:00'),
  (7,  '1',  'Aarav Kulkarni',    'USB-C Dock',          '8900',    '2025-02-27', '2025-09-15 02:00:00'),
  (8,  '8',  'Priya Joshi',       'Headset ANC',         '31000',   '2025-03-05', '2025-09-15 02:00:00'),
  (9,  '3',  'Rohit Deshpande',   'Laptop Pro 14',       '234000',  '2025-03-14', '2025-09-15 02:00:00'),
  (10, '7',  'Imran Nadaf',       'Webcam 4K',           '7300',    '2025-03-21', '2025-09-15 02:00:00'),
  (11, '9',  'Sagar Hiremath',    'Wireless Mouse',      '6000',    '2025-03-28', '2025-09-15 02:00:00'),
  (12, '5',  'Vikram Naik',       'Ultrawide 34 inch',   '92000',   '2025-04-04', '2025-09-15 02:00:00'),
  (13, '3',  'Rohit Deshpande',   'Laptop Pro 14',       '234000',  '2025-03-14', '2025-09-15 02:00:00'),
  (14, '12', 'Divya Shetty',      'Laptop Pro 14',       '156000',  '2025-04-15', '2025-09-15 02:00:00'),
  (15, '10', NULL,                'Tablet 11',           '39000',   '2025-04-23', '2025-09-15 02:00:00'),
  (16, '2',  'Sneha Patil',       'Mechanical Keyboard', NULL,      '2025-05-02', '2025-09-15 02:00:00'),
  (17, '6',  'Anjali Rao',        'Monitor 27 inch',     '63,000',  '2025-05-13', '2025-09-15 02:00:00'),
  (18, '11', 'Arjun Pawar',       'USB-C Dock',          '17800',   '2025-05-21', '2025-09-15 02:00:00'),
  (19, NULL, 'Unknown Walk-in',   'Wireless Mouse',      '1200',    '2025-05-24', '2025-09-15 02:00:00'),
  (20, '99', 'Ghost Account',     'Headset ANC',         '15500',   '2025-05-26', '2025-09-15 02:00:00'),
  (21, '4',  'Fatima Shaikh',     'Webcam 4K',           '-14600',  '2025-05-28', '2025-09-15 02:00:00'),
  (22, '11', 'Arjun Pawar',       'USB-C Dock',          '17800',   '2025-05-21', '2025-09-15 02:00:00');

/* Staging mirrors the target's types but holds no keys or constraints — a
   landing zone, cleared at the start of every run. */
CREATE TABLE stg_sales (
  cid INTEGER,
  customer_name TEXT,
  product TEXT,
  amount REAL,
  sale_date TEXT,
  reject_reason TEXT
);

CREATE TABLE tgt_sales (
  sale_id INTEGER PRIMARY KEY AUTOINCREMENT,
  cid INTEGER NOT NULL,
  customer_name TEXT NOT NULL,
  product TEXT NOT NULL,
  amount REAL NOT NULL,
  sale_date TEXT NOT NULL
);

/* A previous run that went wrong: rows 1-12 loaded, src_id 14 and 18 were
   dropped, and one row was loaded that the source never sent. */
INSERT INTO tgt_sales (cid, customer_name, product, amount, sale_date) VALUES
  (1,  'Aarav Kulkarni',  'Laptop Pro 14',       78000,  '2025-01-07'),
  (3,  'Rohit Deshpande', 'Monitor 27 inch',     42000,  '2025-01-14'),
  (2,  'Sneha Patil',     'Wireless Mouse',      3600,   '2025-01-22'),
  (5,  'Vikram Naik',     'Laptop Air 13',       248000, '2025-02-03'),
  (6,  'Anjali Rao',      'Ultrawide 34 inch',   46000,  '2025-02-11'),
  (4,  'Fatima Shaikh',   'Mechanical Keyboard', 9000,   '2025-02-19'),
  (1,  'Aarav Kulkarni',  'USB-C Dock',          8900,   '2025-02-27'),
  (8,  'Priya Joshi',     'Headset ANC',         31000,  '2025-03-05'),
  (3,  'Rohit Deshpande', 'Laptop Pro 14',       234000, '2025-03-14'),
  (7,  'Imran Nadaf',     'Webcam 4K',           7300,   '2025-03-21'),
  (9,  'Sagar Hiremath',  'Wireless Mouse',      6000,   '2025-03-28'),
  (5,  'Vikram Naik',     'Ultrawide 34 inch',   92000,  '2025-04-04'),
  (10, 'Neha Kamat',      'Tablet 11',           39000,  '2025-04-23'),
  (6,  'Anjali Rao',      'Monitor 27 inch',     63000,  '2025-05-13'),
  (4,  'Fatima Shaikh',   'Webcam 4K',           14600,  '2025-05-28'),
  (13, 'Phantom Customer','Laptop Air 13',       62000,  '2025-06-30');

/* ============================================================
   Warehouse: star schema
   ============================================================ */

CREATE TABLE dim_date (
  date_key INTEGER PRIMARY KEY,
  full_date TEXT NOT NULL,
  day_of_month INTEGER NOT NULL,
  month_number INTEGER NOT NULL,
  month_name TEXT NOT NULL,
  quarter TEXT NOT NULL,
  year_number INTEGER NOT NULL,
  is_weekend INTEGER NOT NULL
);

/* Generated rather than typed: 2025 in full, from a recursive CTE. */
INSERT INTO dim_date
WITH RECURSIVE seq (n) AS (
  SELECT 0
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 364
),
d AS (
  SELECT date('2025-01-01', n || ' day') AS full_date FROM seq
)
SELECT
  CAST(strftime('%Y%m%d', full_date) AS INTEGER),
  full_date,
  CAST(strftime('%d', full_date) AS INTEGER),
  CAST(strftime('%m', full_date) AS INTEGER),
  CASE CAST(strftime('%m', full_date) AS INTEGER)
    WHEN 1 THEN 'January'   WHEN 2 THEN 'February' WHEN 3 THEN 'March'
    WHEN 4 THEN 'April'     WHEN 5 THEN 'May'      WHEN 6 THEN 'June'
    WHEN 7 THEN 'July'      WHEN 8 THEN 'August'   WHEN 9 THEN 'September'
    WHEN 10 THEN 'October'  WHEN 11 THEN 'November' ELSE 'December'
  END,
  'Q' || ((CAST(strftime('%m', full_date) AS INTEGER) + 2) / 3),
  CAST(strftime('%Y', full_date) AS INTEGER),
  CASE WHEN strftime('%w', full_date) IN ('0', '6') THEN 1 ELSE 0 END
FROM d;

/* Snowflake extension: the two levels dim_product normalises out to. */
CREATE TABLE dim_category (
  category_key INTEGER PRIMARY KEY AUTOINCREMENT,
  category_name TEXT NOT NULL,
  category_group TEXT NOT NULL
);

INSERT INTO dim_category (category_name, category_group) VALUES
  ('Computers',   'Hardware'),
  ('Displays',    'Hardware'),
  ('Accessories', 'Peripherals'),
  ('Audio',       'Peripherals');

CREATE TABLE dim_brand (
  brand_key INTEGER PRIMARY KEY AUTOINCREMENT,
  brand_name TEXT NOT NULL,
  country TEXT NOT NULL
);

INSERT INTO dim_brand (brand_name, country) VALUES
  ('Northwind', 'India'),
  ('Kestrel',   'Taiwan'),
  ('Lumen',     'Korea'),
  ('Verve',     'India');

CREATE TABLE dim_customer (
  customer_key INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  customer_name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  segment TEXT NOT NULL
);

INSERT INTO dim_customer (customer_id, customer_name, city, state, segment)
SELECT customer_id, customer_name, city, state, segment
FROM customer
ORDER BY customer_id;

CREATE TABLE dim_product (
  product_key INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT NOT NULL,
  category_key INTEGER REFERENCES dim_category (category_key),
  brand_key INTEGER REFERENCES dim_brand (brand_key),
  unit_price REAL NOT NULL
);

INSERT INTO dim_product (product_id, product_name, category, brand, category_key, brand_key, unit_price)
SELECT
  p.product_id,
  p.product_name,
  p.category,
  p.brand,
  (SELECT c.category_key FROM dim_category c WHERE c.category_name = p.category),
  (SELECT b.brand_key FROM dim_brand b WHERE b.brand_name = p.brand),
  p.unit_price
FROM product p
ORDER BY p.product_id;

CREATE TABLE fact_sales (
  sales_key INTEGER PRIMARY KEY AUTOINCREMENT,
  date_key INTEGER NOT NULL REFERENCES dim_date (date_key),
  customer_key INTEGER NOT NULL REFERENCES dim_customer (customer_key),
  product_key INTEGER NOT NULL REFERENCES dim_product (product_key),
  order_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  amount REAL NOT NULL
);

/* The load every dimensional model does: replace natural keys with surrogate
   keys, keep only fulfilled orders. */
INSERT INTO fact_sales (date_key, customer_key, product_key, order_id, quantity, amount)
SELECT
  d.date_key,
  dc.customer_key,
  dp.product_key,
  o.order_id,
  o.quantity,
  o.amount
FROM orders o
JOIN dim_date d      ON d.full_date = o.order_date
JOIN dim_customer dc ON dc.customer_id = o.customer_id
JOIN dim_product dp  ON dp.product_id = o.product_id
WHERE o.status = 'Delivered'
ORDER BY o.order_id;

/* ============================================================
   Slowly changing dimensions
   ============================================================ */

/* Type 2: full history. Two customers already carry an expired version so the
   timeline has something to show before the student changes anything. */
CREATE TABLE dim_customer_scd (
  customer_key INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  customer_name TEXT NOT NULL,
  city TEXT NOT NULL,
  segment TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  is_current INTEGER NOT NULL,
  version INTEGER NOT NULL
);

INSERT INTO dim_customer_scd
  (customer_id, customer_name, city, segment, start_date, end_date, is_current, version)
VALUES
  (1,  'Aarav Kulkarni',  'Belagavi',  'Retail',    '2024-01-01', '9999-12-31', 1, 1),
  (2,  'Sneha Patil',     'Chikkodi',  'Retail',    '2024-01-01', '9999-12-31', 1, 1),
  (3,  'Rohit Deshpande', 'Pune',      'Corporate', '2024-01-01', '2025-03-31', 0, 1),
  (3,  'Rohit Deshpande', 'Bengaluru', 'Corporate', '2025-04-01', '9999-12-31', 1, 2),
  (4,  'Fatima Shaikh',   'Hubballi',  'Retail',    '2024-01-01', '9999-12-31', 1, 1),
  (5,  'Vikram Naik',     'Mumbai',    'Retail',    '2024-01-01', '2025-06-30', 0, 1),
  (5,  'Vikram Naik',     'Mumbai',    'Corporate', '2025-07-01', '9999-12-31', 1, 2),
  (6,  'Anjali Rao',      'Bengaluru', 'Corporate', '2024-01-01', '9999-12-31', 1, 1),
  (7,  'Imran Nadaf',     'Nipani',    'Retail',    '2024-01-01', '9999-12-31', 1, 1),
  (8,  'Priya Joshi',     'Kolhapur',  'Retail',    '2024-01-01', '9999-12-31', 1, 1),
  (9,  'Sagar Hiremath',  'Belagavi',  'SMB',       '2024-01-01', '9999-12-31', 1, 1),
  (10, 'Neha Kamat',      'Panaji',    'SMB',       '2024-01-01', '9999-12-31', 1, 1),
  (11, 'Arjun Pawar',     'Sangli',    'SMB',       '2024-01-01', '9999-12-31', 1, 1),
  (12, 'Divya Shetty',    'Mangaluru', 'Corporate', '2024-01-01', '9999-12-31', 1, 1);

/* Type 1: current value only, history overwritten and lost. */
CREATE TABLE dim_customer_type1 (
  customer_key INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  customer_name TEXT NOT NULL,
  city TEXT NOT NULL,
  segment TEXT NOT NULL,
  updated_on TEXT NOT NULL
);

INSERT INTO dim_customer_type1 (customer_key, customer_id, customer_name, city, segment, updated_on)
SELECT customer_id, customer_id, customer_name, city, segment, '2024-01-01'
FROM customer;

/* Type 3: one prior value kept in a parallel column. */
CREATE TABLE dim_customer_type3 (
  customer_key INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  customer_name TEXT NOT NULL,
  city TEXT NOT NULL,
  previous_city TEXT,
  segment TEXT NOT NULL,
  previous_segment TEXT,
  effective_date TEXT NOT NULL
);

INSERT INTO dim_customer_type3
  (customer_key, customer_id, customer_name, city, previous_city, segment, previous_segment, effective_date)
SELECT customer_id, customer_id, customer_name, city, NULL, segment, NULL, '2024-01-01'
FROM customer;
`;

export interface TableMeta {
  name: string;
  note: string;
}

export interface TableGroup {
  label: string;
  hint: string;
  tables: TableMeta[];
}

/**
 * Drives the Live Database Explorer. Grouped the way the data actually flows,
 * so the sidebar itself teaches the architecture.
 */
export const TABLE_GROUPS: TableGroup[] = [
  {
    label: "Source systems",
    hint: "Normalised OLTP tables — where the business writes its data",
    tables: [
      { name: "customer", note: "12 customers with city, state and segment" },
      { name: "product", note: "10 products with category, brand and price" },
      { name: "orders", note: "30 orders; amount derived from the price list" },
      { name: "employee", note: "8 employees; one has no department" },
      { name: "department", note: "4 departments" },
      { name: "sales", note: "Flat regional sales — for ranking and windows" },
    ],
  },
  {
    label: "ETL flow",
    hint: "Extract lands in src, is cleaned in stg, and is published to tgt",
    tables: [
      { name: "src_sales", note: "Raw extract, all TEXT, deliberately dirty" },
      { name: "stg_sales", note: "Staging landing zone, cleared each run" },
      { name: "tgt_sales", note: "Target table — seeded with a failed load" },
    ],
  },
  {
    label: "Warehouse — star schema",
    hint: "One fact table surrounded by conformed dimensions",
    tables: [
      { name: "fact_sales", note: "Grain: one row per delivered order line" },
      { name: "dim_customer", note: "Customer dimension with surrogate key" },
      { name: "dim_product", note: "Product dimension with surrogate key" },
      { name: "dim_date", note: "365 rows covering all of 2025" },
    ],
  },
  {
    label: "Snowflake extension",
    hint: "The levels dim_product normalises out to when you snowflake it",
    tables: [
      { name: "dim_category", note: "Category level with its parent group" },
      { name: "dim_brand", note: "Brand level with country of origin" },
    ],
  },
  {
    label: "Slowly changing dimensions",
    hint: "The same customer dimension, modelled three different ways",
    tables: [
      { name: "dim_customer_scd", note: "Type 2 — full version history" },
      { name: "dim_customer_type1", note: "Type 1 — overwrite, no history" },
      { name: "dim_customer_type3", note: "Type 3 — one previous value kept" },
    ],
  },
];

/** Flat list of every seeded table, used for editor autocomplete. */
export const ALL_TABLES: string[] = TABLE_GROUPS.flatMap((group) =>
  group.tables.map((table) => table.name),
);
