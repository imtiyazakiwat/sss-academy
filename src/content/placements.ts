/**
 * Placement testimonials — all 23 records carried over verbatim from the
 * legacy testimonials.php. Company names on the source site were published as
 * "MNC" (unnamed), so that is preserved rather than guessed at.
 *
 * The legacy site attached the same two stock avatar images to every record,
 * so photos are dropped in favour of typographic avatars.
 */

export interface Placement {
  slug: string;
  name: string;
  /** Annual package in lakhs per annum */
  packageLpa: number;
  company: string;
  /** City, when the source listed one */
  location: string | null;
  role: string;
  quote: string;
}

export const placements: Placement[] = [
  {
    slug: "vinayak-s",
    name: "Vinayak S",
    packageLpa: 13.0,
    company: "MNC",
    location: null,
    role: "Big Data Tester",
    quote:
      "I’m extremely happy with the training quality and mentorship provided by SSS Academy. From SQL basics to advanced ETL concepts, everything was taught clearly. I’m grateful for my MNC placement.",
  },
  {
    slug: "sannappa-j",
    name: "Sannappa J",
    packageLpa: 6.5,
    company: "MNC",
    location: null,
    role: "ETL Automation Tester",
    quote:
      "SSS Academy gave me the confidence to attend interviews and answer technical questions effectively. The placement team provided excellent support during my job search. Thank you for the support.",
  },
  {
    slug: "yasin-g",
    name: "Yasin G",
    packageLpa: 18.0,
    company: "MNC",
    location: null,
    role: "ETL Automation Tester",
    quote:
      "The course covered all important ETL concepts and real-time scenarios. It helped me get selected in an MNC. A great place to learn ETL Testing and prepare for IT careers.",
  },
  {
    slug: "rakesh-a",
    name: "Rakesh A",
    packageLpa: 11.0,
    company: "MNC",
    location: null,
    role: "ETL Automation Tester",
    quote:
      "A great place to learn ETL Testing and prepare for IT careers. The trainers explain concepts clearly and focus on real interview requirements.",
  },
  {
    slug: "rajendra-p",
    name: "Rajendra P",
    packageLpa: 13.0,
    company: "MNC",
    location: null,
    role: "ETL Automation Tester",
    quote:
      "Very professional training and excellent placement assistance. I would definitely recommend SSS Academy to aspiring ETL testers. The course covered all important ETL concepts and real-time scenarios. It helped me get selected in an MNC.",
  },
  {
    slug: "umesh-k",
    name: "Umesh K",
    packageLpa: 13.0,
    company: "MNC",
    location: null,
    role: "ETL Automation Tester",
    quote:
      "I improved my technical skills and interview skills significantly after joining SSS Academy. Happy to be placed in an MNC. Thank you SSS Academy for providing quality training and career guidance.",
  },
  {
    slug: "ajeetkumar-k",
    name: "Ajeetkumar K",
    packageLpa: 10.0,
    company: "MNC",
    location: null,
    role: "ETL Automation Tester",
    quote:
      "Thank you SSS Academy for the excellent ETL and SQL training. The practical assignments and interview preparation sessions were very beneficial. I’m happy to begin my professional journey with an MNC.",
  },
  {
    slug: "sangamesh-m",
    name: "Sangamesh M",
    packageLpa: 13.0,
    company: "MNC",
    location: null,
    role: "ETL Automation Tester",
    quote:
      "The faculty members are experienced and always ready to clear doubts. SSS Academy helped me improve my technical and communication skills significantly. I highly recommend SSS Academy for ETL training.",
  },
  {
    slug: "akash-r",
    name: "Akash R",
    packageLpa: 8.5,
    company: "MNC",
    location: null,
    role: "ETL Automation Tester",
    quote:
      "I gained both technical knowledge and confidence at SSS Academy. Thank you for guiding me toward my MNC placement. Happy with the training quality and placement assistance provided by SSS Academy.",
  },
  {
    slug: "sushant-m",
    name: "Sushant M",
    packageLpa: 18.0,
    company: "MNC",
    location: null,
    role: "ETL Automation Tester",
    quote:
      "The course content is well structured and easy to understand. I gained valuable knowledge and confidence through the training sessions at SSS Academy. I’m happy to share that I got placed in an MNC.",
  },
  {
    slug: "paras-l",
    name: "Paras L",
    packageLpa: 11.0,
    company: "MNC",
    location: null,
    role: "ETL Automation Tester",
    quote:
      "Very satisfied with the training quality and placement assistance. Thank you SSS Academy for helping me achieve my goal.",
  },
  {
    slug: "suhasini-s",
    name: "Suhasini S",
    packageLpa: 7.5,
    company: "MNC",
    location: null,
    role: "ETL Automation Tester",
    quote:
      "Excellent learning environment and dedicated trainers. Thank you for the placement support. The course content was practical and industry-oriented. It helped me get selected in an MNC.",
  },
  {
    slug: "vishwanath-s",
    name: "Vishwanath S",
    packageLpa: 12.0,
    company: "MNC",
    location: null,
    role: "ETL Automation Tester",
    quote:
      "Excellent faculty and practical sessions. I successfully got placed in an MNC after completing the course at SSS Academy. SSS Academy provided the right direction and support throughout my placement journey.",
  },
  {
    slug: "asif-d",
    name: "Asif D",
    packageLpa: 10.0,
    company: "MNC",
    location: null,
    role: "ETL Automation Tester",
    quote:
      "I’m thankful to SSS Academy for helping me improve my SQL and ETL skills and get selected in a reputed MNC.",
  },
  {
    slug: "soujanya-s",
    name: "Soujanya S",
    packageLpa: 7.0,
    company: "MNC",
    location: null,
    role: "ETL Automation Tester",
    quote:
      "One of the best institutes for ETL Testing training, SSS Academy provides industry-oriented ETL training. The mock interviews gave me the confidence to clear my MNC interview.",
  },
  {
    slug: "neha-g",
    name: "Neha G",
    packageLpa: 8.0,
    company: "MNC",
    location: null,
    role: "ETL Automation Tester",
    quote:
      "Very good learning environment and hands-on practice. SSS Academy played a major role in my MNC placement. The placement support and technical guidance were outstanding. I’m happy to have started my career through SSS Academy.",
  },
  {
    slug: "ganesh-p",
    name: "Ganesh P",
    packageLpa: 20.0,
    company: "MNC",
    location: null,
    role: "ETL Automation Tester",
    quote:
      "Very good learning environment and hands-on practice. SSS Academy played a major role in my MNC placement. Thank you SSS Academy for helping me build confidence and technical skills. Successfully placed in an MNC.",
  },
  {
    slug: "akarsh-p",
    name: "Akarsh P",
    packageLpa: 10.0,
    company: "MNC",
    location: "Bengaluru",
    role: "ETL Automation Tester",
    quote:
      "Best institute for ETL Testing and SQL. The trainers are very supportive and explain concepts clearly. I’m grateful to SSS Academy for helping me get selected in an MNC.",
  },
  {
    slug: "kajal-p",
    name: "Kajal P",
    packageLpa: 12.0,
    company: "MNC",
    location: null,
    role: "ETL Automation Tester",
    quote:
      "Academy provided excellent training and interview support. Happy to share that I got selected in an MNC. Thank you to the entire team of SSS ACADEMY",
  },
  {
    slug: "arpita-k",
    name: "Arpita K",
    packageLpa: 11.0,
    company: "MNC",
    location: null,
    role: "ETL Automation Tester",
    quote:
      "Happy to share that I got selected in an MNC after training at SSS Academy. Excellent ETL and SQL training with great placement support.",
  },
  {
    slug: "asavari-m",
    name: "Asavari M",
    packageLpa: 6.0,
    company: "MNC",
    location: "Pune",
    role: "ETL Automation Tester",
    quote:
      "SSS Academy played a key role in helping me achieve my goal of getting placed in an MNC. The training was practical, the faculty was very supportive, The placement guidance gave me the confidence to crack the interview. I truly appreciate the entire team's efforts and highly recommend SSS Academy to anyone looking to start a career in ETL Testing and IT.",
  },
  {
    slug: "mosin-k",
    name: "Mosin K",
    packageLpa: 5.5,
    company: "MNC",
    location: "Pune",
    role: "ETL Automation Tester",
    quote:
      "I'm happy to share that I got selected in an MNC after training at SSS Academy. The trainers are supportive, the ETL Testing and SQL training is excellent, and the interview preparation is very helpful. Thank you to the entire SSS Academy team for your guidance and placement support",
  },
  {
    slug: "aishwarya-s",
    name: "Aishwarya S",
    packageLpa: 8.3,
    company: "MNC",
    location: "Bengaluru",
    role: "ETL Automation Tester",
    quote:
      "The training was well structured and focused on real-time industry requirements. The faculty explained ETL Testing, SQL, Data Warehouse concepts, and interview preparation in a very practical way. The mock interviews, resume guidance, and placement support gave me the confidence to perform well during the selection process.",
  },
];

/** Sorted high-to-low — used where the package is the headline. */
export const placementsByPackage = [...placements].sort(
  (a, b) => b.packageLpa - a.packageLpa,
);

export const highestPackage = placementsByPackage[0].packageLpa;

export const averagePackage =
  Math.round(
    (placements.reduce((sum, p) => sum + p.packageLpa, 0) / placements.length) *
      10,
  ) / 10;

export const uniqueRoles = Array.from(
  new Set(placements.map((p) => p.role)),
);

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
