// App.jsx — Main application sections
const { useState, useEffect, useRef } = React;

/* ============== ICON SET ============== */
const Icon = ({ name, size = 20 }) => {
  const props = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  const paths = {
    arrow: <><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></>,
    check: <path d="M20 6 9 17l-5-5"/>,
    plus: <><path d="M12 5v14"/><path d="M5 12h14"/></>,
    bot: <><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><path d="M8 16h.01"/><path d="M16 16h.01"/></>,
    bolt: <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>,
    chart: <><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
    moon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>,
    cart: <><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></>,
    headphones: <path d="M3 18v-6a9 9 0 0 1 18 0v6M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>,
    globe: <><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>,
    swap: <><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></>,
    db: <><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>,
    spark: <><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></>,
    code: <><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></>,
    lock: <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
    flame: <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>,
    sun: <><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></>,
    repeat: <><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></>,
    cpu: <><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/></>,
    rocket: <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2zM9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>,
    heart: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>,
    wallet: <><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></>,
  };
  return <svg {...props}>{paths[name] || null}</svg>;
};

/* ============== NAV ============== */
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`nav${scrolled ? ' scrolled' : ''}`}>
      <div className="container nav__inner">
        <a href="#" className="nav__brand">
          <span className="nav__brand-mark">
            <img src="assets/logo-white.png" alt="RevApex" style={{width:'100%',height:'100%',objectFit:'contain'}}/>
          </span>
          <span>RevApex<span className="ai">AI</span></span>
        </a>
        <div className="nav__links">
          <a href="#solution" className="nav__link">Product</a>
          <a href="#features" className="nav__link">Features</a>
          <a href="#usecases" className="nav__link">Use Cases</a>
          <a href="#pricing" className="nav__link">Pricing</a>
          <a href="#faq" className="nav__link">FAQ</a>
        </div>
        <div className="nav__cta">
          <a href="#" className="nav__cta-secondary">Sign in</a>
          <a href="https://swiy.co/demochat" target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">Book free demo <Icon name="arrow" size={16}/></a>
          <button className="nav__hamburger" aria-label="Menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ============== HERO ============== */
function Hero() {
  return (
    <section className="hero">
      <div className="hero__glow"></div>
      <div className="hero__grid-bg"></div>
      <div className="container hero__inner">
        <div>
          <div className="hero__badge">
            <span className="hero__badge-pill">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="white"><path d="M17.5 14.4c-.3-.2-1.7-.8-2-.9-.3-.1-.4-.1-.6.1l-.8 1c-.2.2-.3.2-.6.1-1-.4-1.8-1-2.6-1.7-.6-.6-1.1-1.2-1.5-1.9-.2-.3 0-.4.1-.5.2-.2.4-.4.5-.6.1-.2.2-.3.2-.5 0-.2-.7-1.6-.9-2.1-.2-.5-.5-.4-.6-.4h-.5c-.2 0-.5.1-.7.4-.3.3-1 1-1 2.4 0 1.4 1 2.8 1.1 3 .1.2 2 3.1 5 4.4 2.5 1 3 .8 3.5.7.5-.1 1.7-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.3-.6-.4z"/><path d="M22 12c0 5.5-4.5 10-10 10-1.7 0-3.4-.4-4.8-1.2L2 22l1.2-5.2C2.4 15.4 2 13.7 2 12 2 6.5 6.5 2 12 2s10 4.5 10 10z" stroke="white" strokeWidth="0" fill="none"/></svg>
              WhatsApp
            </span>
            <span>Official Business API Partner · Meta-verified</span>
          </div>

          <h1 className="hero__title">
            Always On.<br/>
            Always <span className="underline">Closing.</span><br/>
            <span className="accent">Your Business.</span>
          </h1>

          <p className="hero__sub">
            <strong>RevBot</strong> is the AI WhatsApp agent that captures leads, resolves queries
            and drives revenue — <strong>24/7, in 100+ languages</strong>, without a single manual
            follow-up. Live in 48 hours.
          </p>

          <div className="hero__ctas">
            <a href="https://swiy.co/demochat" target="_blank" rel="noopener noreferrer" className="btn btn-primary">Book a free demo <Icon name="arrow" size={16}/></a>
            <a href="#solution" className="btn btn-ghost-light">▶ &nbsp; Watch RevBot live</a>
          </div>

          <div className="hero__trust">
            <div className="hero__trust-item"><Icon name="check" size={16}/> No credit card</div>
            <div className="hero__trust-item"><Icon name="check" size={16}/> 14-day free trial</div>
            <div className="hero__trust-item"><Icon name="check" size={16}/> Live in 48 hrs</div>
          </div>
        </div>

        <div className="hero__visual">
          <PhoneMock/>
        </div>
      </div>
    </section>
  );
}

/* ============== MARQUEE ============== */
function Marquee() {
  const logos = ["NORTHWIND", "ATLAS &Co.", "PRISMA", "Klaria", "VANTA RETAIL", "lumen", "ORBITPAY", "FabricCo"];
  return (
    <div className="marquee">
      <div className="container">
        <div className="marquee__label">Trusted by 800+ growth-stage businesses across India & SEA</div>
        <div className="marquee__track">
          {logos.map(l => <div className="marquee__logo" key={l}>{l}</div>)}
        </div>
      </div>
    </div>
  );
}

/* ============== PAIN ============== */
function Pain() {
  const pains = [
    { icon: "moon", t: "Queries pile up after 6 PM", d: "Customers ask, no one responds. By morning, they've bought from a competitor that replied in 3 minutes." },
    { icon: "headphones", t: "Sales team buried in repeat questions", d: "“What's your price?” “Do you ship to…?” Your top reps are answering the same 10 questions instead of closing deals." },
    { icon: "calendar", t: "Appointments missed, no reminders", d: "30–40% no-show rates because nobody's sending the WhatsApp nudge the night before. Empty chairs = empty pipeline." },
    { icon: "cart", t: "Carts abandoned, revenue lost", d: "70% of carts are abandoned. Without an instant follow-up, that revenue is gone — forever." },
  ];
  return (
    <section className="pain" id="pain">
      <div className="container">
        <div className="pain__top">
          <div className="pain__cost"><Icon name="flame" size={14}/> The hidden cost of slow replies</div>
          <h2 className="section__title">
            Every minute you don't reply, <br/>
            <span className="strike">a customer waits.</span> A customer leaves.
          </h2>
          <p className="section__sub">
            Indian businesses lose an average of <strong>32% of inbound leads</strong> to delayed responses.
            Email sits unread. Phones ring out. WhatsApp is where buyers actually are — and they expect answers in seconds.
          </p>
        </div>

        <div className="pain__grid">
          {pains.map((p, i) => (
            <div className="pain__card" key={i}>
              <div className="pain__card-icon"><Icon name={p.icon} size={22}/></div>
              <div>
                <h3>{p.t}</h3>
                <p>{p.d}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="pain__cost-card">
          <div>
            <div className="label">Industry benchmark · Harvard Business Review</div>
            <h3>Reply within 5 minutes and you're <span style={{color:'#7DA2FB'}}>21× more likely</span> to convert.</h3>
            <p>The average WhatsApp business response time today is 42 hours. RevBot replies in 3–7 seconds — every single time, day or night.</p>
          </div>
          <div className="pain__cost-stat">
            <div className="num">42 hrs</div>
            <div className="unit">avg. industry reply time vs. <b style={{color:'#25D366'}}>4.2 sec</b> for RevBot</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============== SOLUTION ARROW ============== */
function Arrow() {
  return (
    <div className="solution-arrow" id="solution">
      <div className="solution-arrow__line"></div>
      <div className="solution-arrow__icon">
        <span style={{display:'inline-flex', transform:'rotate(90deg)'}}>
          <Icon name="arrow" size={22}/>
        </span>
      </div>
    </div>
  );
}

/* ============== HOW IT WORKS ============== */
function How() {
  const steps = [
    { n: "01", icon: "swap", t: "Connect WhatsApp", d: "Plug in your Official WhatsApp Business number. Meta-verified, no IT team required." },
    { n: "02", icon: "db", t: "Train on your business", d: "Upload your FAQs, catalog & policies. RevBot learns your brand voice in minutes." },
    { n: "03", icon: "bot", t: "Go live in 48 hours", d: "RevBot starts answering — capturing leads, qualifying buyers, booking demos automatically." },
    { n: "04", icon: "chart", t: "Watch revenue grow", d: "Real-time analytics. CRM sync. Smart human handoff for the 13% of cases that need it." },
  ];
  return (
    <section className="how" id="how">
      <div className="container">
        <div className="section__head">
          <div className="eyebrow-chip"><Icon name="rocket" size={12}/> 48-hour onboarding</div>
          <h2 className="section__title">From <span className="accent">zero to closing deals</span><br/>in less time than a sales call.</h2>
          <p className="section__sub">No code. No 6-month integrations. No agency fees. Just plug it in and watch your inbox close itself.</p>
        </div>

        <div className="how__grid">
          {steps.map(s => (
            <div className="how__step" key={s.n}>
              <div className="how__step-icon"><Icon name={s.icon} size={22}/></div>
              <div className="how__step-num">STEP {s.n}</div>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============== FEATURES (bento) ============== */
function Features() {
  return (
    <section className="features" id="features">
      <div className="container">
        <div className="section__head">
          <div className="eyebrow-chip"><Icon name="spark" size={12}/> Everything inside RevBot</div>
          <h2 className="section__title" style={{color:'white'}}>One agent. Every job<br/>your support team hates.</h2>
          <p className="section__sub">Built on the Official WhatsApp Business API and tuned for Indian buyer behavior. No bot-feel. No hallucinations. Just calm, on-brand replies that close.</p>
        </div>

        <div className="features__grid">
          <div className="features__card features__card--lg">
            <div className="features__card-icon"><Icon name="bot" size={22}/></div>
            <h3>AI that actually understands your business</h3>
            <p>Trained on your catalog, policies and FAQs. Speaks 100+ languages including Hindi, Tamil, Telugu, Kannada and Bengali — switching mid-conversation if your customer does.</p>
            <div className="features__card-mock">
              <div className="mini-chat">
                <div className="mini-chat__bubble mini-chat__bubble--in">क्या आप EMI option देते हैं?</div>
                <div className="mini-chat__bubble mini-chat__bubble--out">हाँ! 3, 6 और 9 महीने की EMI available है — 0% interest with HDFC ✓</div>
              </div>
            </div>
          </div>

          <div className="features__card">
            <div className="features__card-icon"><Icon name="bolt" size={22}/></div>
            <h3>3–7 second replies</h3>
            <p>While competitors take 42 hours, you take 4 seconds. Every time.</p>
          </div>

          <div className="features__card">
            <div className="features__card-icon"><Icon name="users" size={22}/></div>
            <h3>Smart human handoff</h3>
            <p>13% of conversations need a human. RevBot routes them with full context — no “please repeat your issue.”</p>
          </div>

          <div className="features__card">
            <div className="features__card-icon"><Icon name="chart" size={22}/></div>
            <h3>Real-time analytics</h3>
            <div className="mini-chart">
              {[28,42,38,55,49,68,61,74,82,78,90,86].map((h,i) => (
                <div className="mini-chart__bar" key={i} style={{height: `${h}%`}}/>
              ))}
            </div>
          </div>

          <div className="features__card">
            <div className="features__card-icon"><Icon name="repeat" size={22}/></div>
            <h3>CRM-native</h3>
            <p>Two-way sync with HubSpot, Salesforce, Zoho & 30+ tools.</p>
            <div className="mini-integrations">
              <div className="mini-integrations__item" style={{color:'#FF7A59'}}>H</div>
              <div className="mini-integrations__item" style={{color:'#00A1E0'}}>S</div>
              <div className="mini-integrations__item" style={{color:'#E54D2E'}}>Z</div>
              <div className="mini-integrations__item">+30</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============== METRICS ============== */
function Metrics() {
  const stats = [
    { n: "98", u: "%", l: "WhatsApp open rate vs. email's 20%" },
    { n: "3", u: "×", l: "More leads captured vs. email & SMS" },
    { n: "87", u: "%", l: "of queries auto-resolved with no human" },
    { n: "340", u: "%", l: "Average first-year ROI" },
  ];
  return (
    <section className="metrics">
      <div className="container">
        <div className="section__head">
          <div className="eyebrow-chip"><Icon name="chart" size={12}/> Proof, in numbers</div>
          <h2 className="section__title">The math is on your side.</h2>
        </div>
        <div className="metrics__grid">
          {stats.map((s, i) => (
            <div className="metrics__cell" key={i}>
              <div className="metrics__num">{s.n}<span className="unit">{s.u}</span></div>
              <div className="metrics__label">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============== USE CASES ============== */
function UseCases() {
  const [active, setActive] = useState(0);
  const cases = [
    {
      tab: "E-commerce", icon: "cart",
      h: "Recover 23% more abandoned carts — automatically.",
      p: "RevBot detects an abandoned cart in your Shopify or WooCommerce store, sends a friendly WhatsApp nudge with the exact product and a one-click checkout link.",
      bullets: [
        "Cart abandonment recovery in 15 min, 1 hr, 24 hr cadences",
        "Order status, tracking & returns — fully automated",
        "Personalised product recommendations from your catalog",
        "Auto-broadcast to opted-in buyers (sales, drops, restocks)",
      ],
      results: [{n:"23%", l:"More carts recovered"}, {n:"4.2s", l:"Avg. response"}, {n:"₹38L", l:"Recovered/month"}],
    },
    {
      tab: "Real Estate", icon: "shield",
      h: "Qualify 100% of leads before your agent calls.",
      p: "Every Facebook, Instagram & Housing.com lead gets an instant WhatsApp message. RevBot qualifies budget, location, BHK, timeline — only hot leads reach your agents.",
      bullets: [
        "Instant lead qualification in your buyer's language",
        "Site-visit scheduling with calendar sync",
        "Brochure & floor-plan delivery on demand",
        "Smart re-engagement of cold leads",
      ],
      results: [{n:"3.4×", l:"More site visits"}, {n:"68%", l:"Lower CAC"}, {n:"24/7", l:"Lead capture"}],
    },
    {
      tab: "Healthcare", icon: "heart",
      h: "Cut no-shows by 70% with smart reminders.",
      p: "Appointment reminders 24h, 2h and 30min before. Easy reschedule, prescription refills, and post-visit follow-ups — fully HIPAA-aware.",
      bullets: [
        "Automated 3-touch appointment reminders",
        "One-tap reschedule & cancel",
        "Lab-report delivery & prescription refills",
        "Post-visit feedback collection",
      ],
      results: [{n:"70%", l:"Fewer no-shows"}, {n:"4.8/5", l:"Patient CSAT"}, {n:"22 min", l:"Saved per patient"}],
    },
    {
      tab: "Education", icon: "users",
      h: "Convert 3× more enrolments from cold leads.",
      p: "From course enquiry to enrolled student in one chat. RevBot answers fees, eligibility, demo class booking — and pings you only when payment is ready.",
      bullets: [
        "Multilingual course enquiry handling",
        "Demo class booking & reminders",
        "Application status & document collection",
        "Fee-payment reminders & receipts",
      ],
      results: [{n:"3×", l:"More enrolments"}, {n:"42%", l:"Drop-off recovered"}, {n:"6 langs", l:"Native support"}],
    },
    {
      tab: "Fintech", icon: "wallet",
      h: "Onboard customers in WhatsApp, not on a clunky portal.",
      p: "KYC reminders, application status, EMI nudges, dispute resolution — all in the channel your customers actually open.",
      bullets: [
        "KYC document collection in-chat",
        "Loan & application status updates",
        "EMI reminders & one-tap pay links",
        "Compliant dispute & complaint flows",
      ],
      results: [{n:"58%", l:"Faster KYC"}, {n:"31%", l:"Lower NPA"}, {n:"99.9%", l:"Uptime"}],
    },
  ];
  const c = cases[active];

  return (
    <section className="usecases" id="usecases">
      <div className="container">
        <div className="section__head">
          <div className="eyebrow-chip"><Icon name="star" size={12}/> Built for your industry</div>
          <h2 className="section__title">Same RevBot. <span className="accent">Five revenue engines.</span></h2>
          <p className="section__sub">Pre-built playbooks for the industries we work with most. Every flow is editable in plain English.</p>
        </div>

        <div className="usecases__tabs">
          {cases.map((cc, i) => (
            <button key={i} className={`usecases__tab${active===i?' active':''}`} onClick={() => setActive(i)}>
              <Icon name={cc.icon} size={14}/> {cc.tab}
            </button>
          ))}
        </div>

        <div className="usecases__panel" key={active}>
          <div className="usecases__panel-content">
            <h3>{c.h}</h3>
            <p>{c.p}</p>
            <ul className="usecases__bullets">
              {c.bullets.map((b, i) => <li key={i}><Icon name="check" size={18}/> <span>{b}</span></li>)}
            </ul>
            <div className="usecases__results">
              {c.results.map((r,i) => (
                <div key={i}><div className="num">{r.n}</div><div className="lbl">{r.l}</div></div>
              ))}
            </div>
          </div>
          <div className="usecases__panel-visual">
            <UsecasePreview kind={c.tab}/>
          </div>
        </div>
      </div>
    </section>
  );
}

/* preview chat for active use case */
function UsecasePreview({ kind }) {
  const previews = {
    "E-commerce": [
      { from: 'in', t: "Hi, I left a kurta in my cart yesterday — still available?" },
      { from: 'out', t: "Yes! Your Indigo Block-print Kurta (M) is still ₹2,499. Free delivery if you check out today 🎁" },
      { from: 'out', t: "Tap below to complete payment in 30 seconds 👇", btn: "Complete order →" },
    ],
    "Real Estate": [
      { from: 'in', t: "Saw your 3BHK listing in Indiranagar — what's the price?" },
      { from: 'out', t: "₹2.4 Cr, 1,820 sqft, fully furnished. May I ask your budget & timeline?" },
      { from: 'in', t: "Budget around 2.5cr, ready to buy in 30 days" },
      { from: 'out', t: "Perfect fit. Booking site visit Sunday 11 AM — confirmed ✓", btn: "View brochure →" },
    ],
    "Healthcare": [
      { from: 'out', t: "Hi Priya, reminder: appointment tomorrow at 10:30 AM with Dr. Mehta. Reply 1 to confirm, 2 to reschedule." },
      { from: 'in', t: "1" },
      { from: 'out', t: "Confirmed ✓ See you tomorrow. Bring previous reports if any." },
    ],
    "Education": [
      { from: 'in', t: "Tell me about the Data Science course please" },
      { from: 'out', t: "12 weeks, ₹49,000 (EMI from ₹4,200/mo). Live classes + placement support. Want a free demo class on Saturday?" },
      { from: 'in', t: "Yes please" },
      { from: 'out', t: "Booked for Sat 11 AM. Joining link sent ✓", btn: "Add to calendar →" },
    ],
    "Fintech": [
      { from: 'in', t: "What's the status on my loan application?" },
      { from: 'out', t: "Approved ✓ ₹5L disbursed to your HDFC ••4521 today at 2:14 PM. EMI starts 5 May." },
      { from: 'out', t: "Tap below to download your sanction letter.", btn: "Download letter →" },
    ],
  };
  const list = previews[kind] || previews["E-commerce"];
  return (
    <div className="usecase-preview">
      <div className="usecase-preview__head">
        <div className="usecase-preview__avatar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2L2 7l1.5 2.5L12 6l8.5 3.5L22 7zM12 8.5L4 12v6l8 4 8-4v-6z"/></svg>
        </div>
        <div>
          <div className="usecase-preview__name">RevApex AI</div>
          <div className="usecase-preview__status">● online</div>
        </div>
      </div>
      <div className="usecase-preview__body">
        {list.map((m, i) => (
          <div key={i} className={`usecase-preview__bubble usecase-preview__bubble--${m.from}`} style={{animationDelay: `${i*120}ms`}}>
            {m.t}
            {m.btn && <button className="usecase-preview__cta">{m.btn}</button>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============== INTEGRATIONS ============== */
function Integrations() {
  const items = [
    { name: "Shopify", c: "#95BF47", l: "S" },
    { name: "HubSpot", c: "#FF7A59", l: "H" },
    { name: "Salesforce", c: "#00A1E0", l: "✦" },
    { name: "Zoho", c: "#E54D2E", l: "Z" },
    { name: "WooCommerce", c: "#7F54B3", l: "W" },
    { name: "Razorpay", c: "#0F1E3A", l: "R" },
    { name: "Stripe", c: "#635BFF", l: "S" },
    { name: "Google Sheets", c: "#0F9D58", l: "G" },
    { name: "Calendly", c: "#006BFF", l: "C" },
    { name: "Notion", c: "#1A1A1A", l: "N" },
    { name: "Slack", c: "#4A154B", l: "#" },
    { name: "Zapier", c: "#FF4A00", l: "Z" },
  ];
  return (
    <section className="integrations">
      <div className="container">
        <div className="section__head">
          <div className="eyebrow-chip"><Icon name="cpu" size={12}/> Integrations</div>
          <h2 className="section__title">Plays nicely with the stack you already use.</h2>
          <p className="section__sub">30+ native integrations and a Zapier bridge to thousands more. Two-way sync. Real-time webhooks. No spreadsheets to babysit.</p>
        </div>
        <div className="integrations__grid">
          {items.map((it, i) => (
            <div className="integrations__cell" key={i}>
              <div className="logo" style={{background: it.c}}>{it.l}</div>
              <div className="name">{it.name}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============== TESTIMONIALS ============== */
function Testimonials() {
  const items = [
    {
      q: "We replaced 4 chat tools and 2 BPO seats with RevBot. CSAT went up. Cost went down. Our founder asked why we didn't do this 18 months ago.",
      n: "Aarav Mehta", t: "Head of Growth, Northwind Apparel",
      avatar: "AM", color: "#2C66F5",
      metric: { n: "4.2×", l: "Pipeline / mo" },
    },
    {
      q: "Site visits booked at 11 PM. Hindi enquiries answered in Hindi. Hot leads pinged to me with full context. RevBot is genuinely my best agent.",
      n: "Priya Nair", t: "Sales Director, Atlas Realty",
      avatar: "PN", color: "#0EA472",
      metric: { n: "3.4×", l: "Site visits" },
    },
    {
      q: "We went from 38% no-shows to under 10% in six weeks. Zero workflow changes for our reception staff. It just works.",
      n: "Dr. Rohan Iyer", t: "COO, MediCare Network",
      avatar: "RI", color: "#F59E0B",
      metric: { n: "70%", l: "Less no-shows" },
    },
  ];
  return (
    <section className="testimonials">
      <div className="container">
        <div className="section__head">
          <div className="eyebrow-chip"><Icon name="heart" size={12}/> What customers say</div>
          <h2 className="section__title">800+ teams. <span className="accent">Zero buyer's remorse.</span></h2>
        </div>
        <div className="testimonials__grid">
          {items.map((t, i) => (
            <div className="testimonial" key={i}>
              <div className="testimonial__stars">
                {[1,2,3,4,5].map(s => <Icon name="star" size={16} key={s}/>)}
              </div>
              <p className="testimonial__quote">"{t.q}"</p>
              <div className="testimonial__person">
                <div className="testimonial__avatar" style={{background: t.color}}>{t.avatar}</div>
                <div>
                  <div className="testimonial__name">{t.n}</div>
                  <div className="testimonial__title">{t.t}</div>
                </div>
                <div className="testimonial__metric">
                  <div className="n">{t.metric.n}</div>
                  <div className="l">{t.metric.l}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============== PRICING ============== */
function Pricing() {
  const tiers = [
    {
      name: "Starter", price: "4,999", note: "/mo",
      feat: [
        "Up to 1,000 conversations/mo",
        "1 WhatsApp Business number",
        "AI replies + smart handoff",
        "Basic analytics",
        "Email support",
      ],
      cta: "Start free trial", featured: false,
    },
    {
      name: "Growth", price: "14,999", note: "/mo",
      feat: [
        "Up to 10,000 conversations/mo",
        "3 WhatsApp numbers",
        "Multi-language (100+)",
        "CRM integrations + webhooks",
        "Advanced analytics & A/B",
        "Priority support",
      ],
      cta: "Start free trial", featured: true, badge: "Most popular",
    },
    {
      name: "Enterprise", price: "Custom", note: "",
      feat: [
        "Unlimited conversations",
        "Unlimited numbers & teams",
        "Dedicated AI training",
        "SSO, SOC-2, on-prem options",
        "Custom SLAs & success manager",
        "24/7 white-glove support",
      ],
      cta: "Talk to sales", featured: false,
    },
  ];
  return (
    <section className="pricing" id="pricing">
      <div className="container">
        <div className="section__head">
          <div className="eyebrow-chip"><Icon name="wallet" size={12}/> Pricing</div>
          <h2 className="section__title">Pays for itself <span className="accent">in week one.</span></h2>
          <p className="section__sub">Average customer ROI: 340% in year one. 14-day free trial on every plan, no credit card required.</p>
        </div>

        <div className="pricing__grid">
          {tiers.map((t, i) => (
            <div className={`pricing__card${t.featured?' pricing__card--featured':''}`} key={i}>
              {t.badge && <div className="pricing__badge">{t.badge}</div>}
              <h3>{t.name}</h3>
              <div className="pricing__price">
                {t.price !== "Custom" && <span className="pre">₹</span>}{t.price}
                {t.note && <span className="suf">{t.note}</span>}
              </div>
              <ul className="pricing__feat">
                {t.feat.map((f, j) => <li key={j}><Icon name="check" size={16}/> <span>{f}</span></li>)}
              </ul>
              <a href="https://swiy.co/demochat" target="_blank" rel="noopener noreferrer" className={`btn ${t.featured ? 'btn-primary' : 'btn-outline-dark'}`} style={{justifyContent:'center'}}>{t.cta}</a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============== FAQ ============== */
function FAQ() {
  const items = [
    { q: "Is this the official WhatsApp Business API?", a: "Yes. RevApex is a verified Meta Business Solution Provider. You get the official green-tick API — no risk of bans, full delivery guarantees, and access to all WhatsApp Business features." },
    { q: "How long does it take to go live?", a: "48 hours from contract sign. Our onboarding team handles your WhatsApp Business verification, AI training on your content, integrations, and a guided rehearsal before you go live." },
    { q: "Will the AI hallucinate or say something wrong?", a: "No. RevBot only answers from sources you approve — your catalog, FAQs, policies. If a question is outside its scope, it asks for clarification or routes to a human. We've shipped over 12 million conversations with under 0.3% escalation due to error." },
    { q: "Which languages do you support?", a: "100+ including Hindi, Bengali, Tamil, Telugu, Marathi, Kannada, Malayalam, Gujarati, Punjabi, Urdu, English and most major international languages. RevBot detects the customer's language automatically and responds in kind." },
    { q: "What about data privacy?", a: "All data is hosted in India (AWS Mumbai), encrypted at rest and in transit. SOC-2 Type II, GDPR, DPDP Act compliant. You own your data and can export or delete it anytime." },
    { q: "Can a human take over a conversation?", a: "Yes — and seamlessly. RevBot routes to your team in our shared inbox or your existing CRM with full conversation context. Your reps see the buyer, the products discussed, and the suggested next reply." },
  ];
  return (
    <section className="faq" id="faq">
      <div className="container">
        <div className="section__head">
          <div className="eyebrow-chip"><Icon name="shield" size={12}/> FAQ</div>
          <h2 className="section__title">Questions, answered.</h2>
        </div>
        <div className="faq__list">
          {items.map((it, i) => (
            <details className="faq__item" key={i}>
              <summary className="faq__q">
                <span>{it.q}</span>
                <span className="faq__q-icon"><Icon name="plus" size={14}/></span>
              </summary>
              <div className="faq__a">{it.a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============== CTA ============== */
function CTA() {
  return (
    <section className="cta" id="cta">
      <div className="container cta__inner">
        <div className="eyebrow-chip" style={{background:'rgba(44,102,245,0.15)', color:'#7DA2FB'}}>
          <Icon name="rocket" size={12}/> Let's automate your business on WhatsApp
        </div>
        <h2 className="cta__title">Stop losing leads to <br/>slow replies. Start today.</h2>
        <p className="cta__sub">Book a 20-minute demo. We'll show you RevBot live, on your industry, with your FAQs. Live in 48 hours or it's free.</p>
        <div className="cta__ctas">
          <a href="https://swiy.co/demochat" target="_blank" rel="noopener noreferrer" className="btn btn-primary">Book your free demo <Icon name="arrow" size={16}/></a>
          <a href="#" className="btn btn-wa"><svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.5 14.4c-.3-.2-1.7-.8-2-.9-.3-.1-.4-.1-.6.1l-.8 1c-.2.2-.3.2-.6.1-1-.4-1.8-1-2.6-1.7-.6-.6-1.1-1.2-1.5-1.9-.2-.3 0-.4.1-.5.2-.2.4-.4.5-.6.1-.2.2-.3.2-.5 0-.2-.7-1.6-.9-2.1-.2-.5-.5-.4-.6-.4h-.5c-.2 0-.5.1-.7.4-.3.3-1 1-1 2.4 0 1.4 1 2.8 1.1 3 .1.2 2 3.1 5 4.4 2.5 1 3 .8 3.5.7.5-.1 1.7-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.3-.6-.4z"/></svg> WhatsApp us now</a>
        </div>
        <div className="cta__trust">
          <span><Icon name="check" size={14}/> 14-day free trial</span>
          <span><Icon name="check" size={14}/> Live in 48 hours</span>
          <span><Icon name="check" size={14}/> Cancel anytime</span>
          <span><Icon name="check" size={14}/> SOC-2 + DPDP compliant</span>
        </div>
      </div>
    </section>
  );
}

/* ============== FOOTER ============== */
function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div>
            <div className="footer__brand">
              <span className="nav__brand-mark" style={{width:32, height:32}}>
                <img src="assets/logo-white.png" alt="RevApex" style={{width:'100%',height:'100%',objectFit:'contain'}}/>
              </span>
              <span>RevApex<span className="ai">AI</span></span>
            </div>
            <p className="footer__about">The AI WhatsApp agent built to close deals — not just answer tickets. Trusted by 800+ growth-stage businesses across India & SEA.</p>
            <div className="footer__contact">
              <div><a href="mailto:info@revapex.ai">info@revapex.ai</a></div>
              <div><a href="tel:+916362141843">+91 63621 41843</a></div>
              <div>MIG-303, 4th Floor, Kalinga Vihar,<br/>Patrapada, Bhubaneswar — 751019</div>
            </div>
          </div>
          <div className="footer__col">
            <h4>Product</h4>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#usecases">Use cases</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#">Integrations</a></li>
              <li><a href="#">Changelog</a></li>
            </ul>
          </div>
          <div className="footer__col">
            <h4>Industries</h4>
            <ul>
              <li><a href="#usecases">E-commerce</a></li>
              <li><a href="#usecases">Real estate</a></li>
              <li><a href="#usecases">Healthcare</a></li>
              <li><a href="#usecases">Education</a></li>
              <li><a href="#usecases">Fintech</a></li>
            </ul>
          </div>
          <div className="footer__col">
            <h4>Company</h4>
            <ul>
              <li><a href="#">About</a></li>
              <li><a href="#">Customers</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>
          <div className="footer__col">
            <h4>Resources</h4>
            <ul>
              <li><a href="#">Help center</a></li>
              <li><a href="#">API docs</a></li>
              <li><a href="#">WhatsApp guide</a></li>
              <li><a href="#">Trust & security</a></li>
              <li><a href="#">Status</a></li>
            </ul>
          </div>
        </div>
        <div className="footer__bottom">
          <div>© 2026 RevApex AI · gorevapex.com · Official WhatsApp Business API Partner</div>
          <div className="footer__legal">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">DPDP</a>
            <a href="#">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ============== FAB ============== */
function FAB() {
  return (
    <a href="#cta" className="fab-wa" aria-label="Chat on WhatsApp">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M17.5 14.4c-.3-.2-1.7-.8-2-.9-.3-.1-.4-.1-.6.1l-.8 1c-.2.2-.3.2-.6.1-1-.4-1.8-1-2.6-1.7-.6-.6-1.1-1.2-1.5-1.9-.2-.3 0-.4.1-.5.2-.2.4-.4.5-.6.1-.2.2-.3.2-.5 0-.2-.7-1.6-.9-2.1-.2-.5-.5-.4-.6-.4h-.5c-.2 0-.5.1-.7.4-.3.3-1 1-1 2.4 0 1.4 1 2.8 1.1 3 .1.2 2 3.1 5 4.4 2.5 1 3 .8 3.5.7.5-.1 1.7-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.3-.6-.4z M22 12c0 5.5-4.5 10-10 10-1.7 0-3.4-.4-4.8-1.2L2 22l1.2-5.2C2.4 15.4 2 13.7 2 12 2 6.5 6.5 2 12 2s10 4.5 10 10z" stroke="white" strokeWidth="0"/></svg>
    </a>
  );
}

/* ============== APP ============== */
function App() {
  return (
    <>
      <Nav/>
      <Hero/>
      <Marquee/>
      <Pain/>
      <Arrow/>
      <How/>
      <Features/>
      <Metrics/>
      <UseCases/>
      <Integrations/>
      <Testimonials/>
      <Pricing/>
      <FAQ/>
      <CTA/>
      <Footer/>
      <FAB/>
    </>
  );
}

window.App = App;
