const { useState } = React;

const PriceIcon = ({ name, size = 20 }) => {
  const props = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  const paths = {
    arrow: <><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></>,
    bot: <><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><path d="M8 16h.01"/><path d="M16 16h.01"/></>,
    check: <path d="M20 6 9 17l-5-5"/>,
    chart: <><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    code: <><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></>,
    db: <><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></>,
    globe: <><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>,
    layers: <><path d="m12 2 10 5-10 5L2 7l10-5z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></>,
    lock: <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
    message: <><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></>,
    plug: <><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a6 6 0 0 1-12 0V8z"/></>,
    send: <><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>,
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
    spark: <><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    wallet: <><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></>,
  };
  return <svg {...props}>{paths[name] || null}</svg>;
};

const featureHelp = {
  "0% Markup Fees": "Pay Meta's official conversation charges directly, without extra platform markup added on top.",
  "500 Contacts": "Store and engage up to 500 active contacts in your RevSathi workspace.",
  "5,000 Contacts": "A larger contact limit for growing campaigns, lead nurture, and repeat customer messaging.",
  "10,000 Contacts": "Scale your WhatsApp database while keeping campaigns, inboxes, and automation organized.",
  "15,000 Contacts": "Designed for high-volume teams that need more subscriber capacity and operational support.",
  "2 Team Members": "Invite two users to manage chats, assign conversations, and collaborate from one shared inbox.",
  "5 Team Members": "Give sales, support, and operations room to work together without sharing one login.",
  "10 Team Members": "A stronger team limit for departments with dedicated agents, supervisors, and campaign owners.",
  "20 Team Members": "Bring larger teams into RevSathi with enough seats for support, sales, marketing, and managers.",
  "Number Coexistence": "Use your WhatsApp Business number with RevSathi while keeping direct access where supported.",
  "WhatsApp AI Agent": "An always-on assistant trained on your business content to answer FAQs, qualify leads, and hand off when needed.",
  "50,000 AI Message Tokens": "Monthly AI usage for smart replies, short automations, translations, and customer intent handling.",
  "Unlimited AI Message Tokens": "Use RevSathi AI heavily across sales and support flows without watching a token meter.",
  "Unlimited Message Credits": "Send unlimited messages inside allowed WhatsApp conversation windows; Meta conversation fees still apply.",
  "Unlimited Free Incoming Conversation": "Customer-initiated service conversations can be handled without RevSathi adding an incoming chat fee.",
  "Unlimited Chatbot Sessions": "Run as many customer bot journeys as you need for lead capture, support, reminders, and qualification.",
  "Bulk WhatsApp Messaging": "Broadcast approved WhatsApp templates to opted-in contacts for launches, reminders, offers, and updates.",
  "Multi Agent Shared Inbox": "Centralize incoming WhatsApp chats with assignment, status, history, and team collaboration.",
  "Drag & Drop Chatbot Builder": "Create no-code flows for FAQs, lead forms, reminders, routing, and follow-up sequences.",
  "Campaign Reporting": "Track sent, delivered, read, failed, replied, and conversion activity for every campaign.",
  "Automated Follow Up Bot": "Automatically nudge leads after delays, missed replies, abandoned carts, or pending appointments.",
  "Interactive User Input Collection Bot": "Collect clean customer details step by step inside WhatsApp and pass them to sheets, APIs, or your team.",
  "Messaging Template Management": "Create, organize, and send approved WhatsApp templates from one place.",
  "WhatsApp Chat Widget": "Add a website widget that opens WhatsApp conversations and routes them into your RevSathi inbox.",
  "Google Sheets Integration": "Sync leads, responses, and campaign activity into Google Sheets for reporting or operations.",
  "API Integration (Developer)": "Use developer APIs to connect RevSathi with custom systems, CRMs, and internal tools.",
  "Outgoing Webhooks": "Push events such as new leads, replies, and status updates to external apps in real time.",
  "Zapier Integration": "Connect RevSathi to thousands of apps through Zapier workflows.",
  "Pabbly Integration": "Automate actions with Pabbly Connect for CRM, lead routing, and follow-up tasks.",
  "Make Integration": "Build visual automation workflows with Make for multi-step business processes.",
  "N8N Integration": "Use n8n for flexible, technical workflow automation and custom orchestration.",
  "WooCommerce Integration": "Trigger WhatsApp updates for orders, abandoned carts, customer support, and post-purchase follow-ups.",
  "Shopify Integration": "Automate commerce conversations such as cart recovery, order updates, and product support.",
  "Includes all Starter features": "Everything in Starter is included before adding growth-level limits and automation.",
  "Includes all Growth features": "Everything in Growth is included, plus higher capacity, team access, and support.",
  "Omnichannel Inbox: WhatsApp": "Manage WhatsApp conversations from one operational inbox built for teams.",
  "Appointment Booking System": "Let customers book calls, visits, or appointments directly from a WhatsApp conversation.",
  "High Speed Broadcasting": "Send time-sensitive campaigns faster with improved broadcasting throughput.",
  "AI Intent Detection": "Detect whether a customer wants support, sales, pricing, appointment booking, complaint handling, or handoff.",
  "Roles and Permissions": "Control what admins, managers, and agents can see or change inside the workspace.",
  "Manager Monitoring": "Give managers visibility into live chats, agent response quality, and operational performance.",
  "Incoming Chat Translation": "Help agents understand inbound messages across languages so customers can write naturally.",
  "Webhook Integration": "Connect external systems using webhooks for custom workflows and real-time updates.",
  "Custom Webhook Listener": "Receive JSON payloads from your apps and trigger WhatsApp messages or automation from them.",
  "Remove \"Powered by RevSathi\"": "Keep the experience white-label so your brand remains the focus for customers.",
  "On-Call Support": "Get live support for important setup, campaign, or operational issues.",
  "More WhatsApp Numbers": "Add more WhatsApp numbers for departments, regions, brands, or high-volume operations.",
  "High Volume Subscribers": "Support larger subscriber operations and higher campaign volume with guided configuration.",
  "Dedicated Account Manager": "Work with a RevSathi specialist who understands your use case, rollout, and success metrics.",
  "Priority Support": "Get faster response handling for technical issues, launches, and production questions.",
  "Advanced AI Playbooks": "Use deeper AI flows for qualification, routing, order support, reminders, and conversion nudges.",
  "Quarterly Automation Review": "Review performance and improve campaigns, chatbot flows, and handoff rules as your business grows.",
};

const plans = [
  {
    name: "Starter",
    price: 5,
    badge: "Best to start",
    contacts: "500 Contacts",
    highlight: "For small teams launching official WhatsApp automation with AI and broadcasts.",
    featured: false,
    features: [
      "0% Markup Fees", "500 Contacts", "2 Team Members", "Number Coexistence", "WhatsApp AI Agent",
      "50,000 AI Message Tokens", "Unlimited Message Credits", "Unlimited Free Incoming Conversation",
      "Unlimited Chatbot Sessions", "Bulk WhatsApp Messaging", "Multi Agent Shared Inbox",
      "Drag & Drop Chatbot Builder", "Campaign Reporting", "Automated Follow Up Bot",
      "Interactive User Input Collection Bot", "Messaging Template Management", "WhatsApp Chat Widget",
      "Google Sheets Integration", "API Integration (Developer)", "Outgoing Webhooks", "Zapier Integration",
      "Pabbly Integration", "Make Integration", "N8N Integration", "WooCommerce Integration", "Shopify Integration",
    ],
  },
  {
    name: "Growth",
    price: 15,
    badge: "Most popular",
    contacts: "5,000 Contacts",
    highlight: "For growing businesses that need more contacts, appointment flows, AI routing, and support.",
    featured: true,
    features: [
      "Includes all Starter features", "5,000 Contacts", "5 Team Members", "Omnichannel Inbox: WhatsApp",
      "Appointment Booking System", "High Speed Broadcasting", "Unlimited AI Message Tokens",
      "AI Intent Detection", "Roles and Permissions", "Manager Monitoring", "Incoming Chat Translation",
      "Webhook Integration", "Custom Webhook Listener", "Remove \"Powered by RevSathi\"", "On-Call Support",
    ],
  },
  {
    name: "Scale",
    price: 25,
    badge: "High volume",
    contacts: "10,000 Contacts",
    highlight: "For teams scaling campaigns, automations, inbox operations, and AI-led conversion.",
    featured: false,
    features: [
      "Includes all Growth features", "10,000 Contacts", "10 Team Members", "More WhatsApp Numbers",
      "Advanced AI Playbooks", "High Speed Broadcasting", "Roles and Permissions", "Manager Monitoring",
      "Quarterly Automation Review", "Priority Support",
    ],
  },
  {
    name: "Enterprise",
    price: null,
    badge: "Custom rollout",
    contacts: "15,000 Contacts",
    highlight: "For larger teams that need more numbers, higher subscriber volume, and guided success.",
    featured: false,
    features: [
      "Includes all Growth features", "15,000 Contacts", "20 Team Members", "More WhatsApp Numbers",
      "High Volume Subscribers", "Dedicated Account Manager", "Priority Support",
    ],
  },
];

function PricingNav() {
  return (
    <nav className="nav scrolled">
      <div className="container nav__inner">
        <a href="index.html" className="nav__brand">
          <span className="nav__brand-mark">
            <img src="assets/white-rev-logo-icon.png" alt="RevApex" style={{width:'100%',height:'100%',objectFit:'contain'}}/>
          </span>
          <span>Rev<span className="ai">Sathi</span></span>
        </a>
        <div className="nav__links">
          <a href="index.html#solution" className="nav__link">Product</a>
          <a href="index.html#features" className="nav__link">Features</a>
          <a href="index.html#usecases" className="nav__link">Use Cases</a>
          <a href="pricing.html" className="nav__link">Pricing</a>
          <a href="index.html#faq" className="nav__link">FAQ</a>
        </div>
        <div className="nav__cta">
          <a href="https://app.revsathi.com/auth" target="_blank" rel="noopener noreferrer" className="nav__cta-secondary">Sign in</a>
          <a href="https://www.app.revsathi.com/signup" target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">Start for FREE <PriceIcon name="arrow" size={16}/></a>
        </div>
      </div>
    </nav>
  );
}

function PlanCard({ plan, billing }) {
  const annual = billing === "annual";
  const monthlyPrice = plan.price == null ? null : plan.price * (annual ? 0.85 : 1);
  const annualTotal = plan.price == null ? null : plan.price * 12 * 0.85;

  return (
    <article className={`rp-plan${plan.featured ? " rp-plan--featured" : ""}`}>
      <div className="rp-plan__badge">{plan.badge}</div>
      <div className="rp-plan__top">
        <div>
          <h2>{plan.name}</h2>
          <p>{plan.highlight}</p>
        </div>
        <div className="rp-plan__contacts">{plan.contacts}</div>
      </div>
      <div className="rp-plan__price">
        {monthlyPrice == null ? (
          <><span className="rp-plan__custom">Custom</span><span> /mo</span></>
        ) : (
          <><span>$</span>{monthlyPrice.toFixed(monthlyPrice % 1 ? 2 : 0)}<span> /mo</span></>
        )}
      </div>
      <div className="rp-plan__note">
        {annualTotal == null ? "Flexible pricing for larger teams and subscriber needs." : annual ? `Billed annually at $${annualTotal.toFixed(0)}. You save 15%.` : "Monthly billing. Switch to annual to save 15%."}
      </div>
      <a href="https://www.app.revsathi.com/signup" target="_blank" rel="noopener noreferrer" className={`btn ${plan.featured ? "btn-primary" : "btn-outline-dark"}`}>Get Started <PriceIcon name="arrow" size={16}/></a>
      <div className="rp-plan__features">
        {plan.features.map((feature) => (
          <details key={feature} className="rp-feature">
            <summary><PriceIcon name="check" size={15}/><span>{feature}</span></summary>
            <p>{featureHelp[feature] || "Included in this plan to help your team run WhatsApp conversations more efficiently."}</p>
          </details>
        ))}
      </div>
    </article>
  );
}

function PricingPage() {
  const [billing, setBilling] = useState("monthly");
  const categories = [
    { icon: "wallet", title: "Zero markup promise", text: "RevSathi keeps platform pricing transparent. You pay your plan plus official WhatsApp costs, without hidden conversation commission." },
    { icon: "bot", title: "AI that works inside WhatsApp", text: "Use AI for replies, lead qualification, intent detection, translations, handoff summaries, and follow-up sequences." },
    { icon: "plug", title: "Built for your stack", text: "Connect Google Sheets, APIs, webhooks, Zapier, Pabbly, Make, n8n, WooCommerce, and Shopify." },
  ];

  const comparison = [
    ["Contact limit", "500", "5,000", "10,000", "15,000"],
    ["Team members", "2", "5", "10", "20"],
    ["AI tokens", "50,000", "Unlimited", "Unlimited", "Custom volume"],
    ["WhatsApp numbers", "1", "1", "Multiple", "More numbers"],
    ["Branding removal", "-", "Included", "Included", "Included"],
    ["Support", "Standard", "On-call", "Priority", "Dedicated manager"],
  ];

  return (
    <>
      <PricingNav/>
      <main className="rp-page">
        <section className="rp-hero">
          <div className="container rp-hero__inner">
            <div className="rp-hero__copy">
              <div className="rp-kicker"><PriceIcon name="shield" size={14}/> Fair, transparent WhatsApp pricing</div>
              <h1>Zero markup fees. Serious WhatsApp automation. Simple RevSathi plans.</h1>
              <p>Choose the contact limit and team capacity you need today. Every plan is built around official WhatsApp automation, AI conversations, shared inbox workflows, broadcasts, chatbot flows, and integrations that help customers understand value quickly.</p>
              <div className="rp-hero__actions">
                <a href="#plans" className="btn btn-primary">View Plans <PriceIcon name="arrow" size={16}/></a>
                <a href="https://swiy.co/demochat" target="_blank" rel="noopener noreferrer" className="btn btn-ghost-light">Watch Demo</a>
              </div>
            </div>
            <div className="rp-hero__panel">
              <div className="rp-save-card">
                <div className="rp-save-card__label">Annual savings</div>
                <div className="rp-save-card__num">15%</div>
                <p>Pick annual billing to reduce your monthly equivalent price while keeping the same features.</p>
              </div>
              <div className="rp-metric-grid">
                <div><strong>0%</strong><span>Markup fees</span></div>
                <div><strong>24/7</strong><span>AI replies</span></div>
                <div><strong>500-15k</strong><span>Contacts</span></div>
                <div><strong>10+</strong><span>Integrations</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="rp-trust">
          <div className="container rp-trust__grid">
            {categories.map((item) => (
              <div className="rp-trust__item" key={item.title}>
                <div><PriceIcon name={item.icon} size={20}/></div>
                <h2>{item.title}</h2>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rp-plans" id="plans">
          <div className="container">
            <div className="rp-section-head">
              <div>
                <div className="rp-kicker"><PriceIcon name="layers" size={14}/> Plans</div>
                <h2>Pick the plan that matches your contact volume.</h2>
                <p>All paid plans include the core RevSathi platform: official WhatsApp automation, inbox, broadcasts, templates, chatbot builder, AI workflows, and integrations.</p>
              </div>
              <div className="rp-billing" role="group" aria-label="Billing period">
                <button className={billing === "monthly" ? "active" : ""} onClick={() => setBilling("monthly")}>Monthly</button>
                <button className={billing === "annual" ? "active" : ""} onClick={() => setBilling("annual")}>Annual <span>Save 15%</span></button>
              </div>
            </div>
            <div className="rp-plan-grid">
              {plans.map((plan) => <PlanCard key={plan.name} plan={plan} billing={billing}/>)}
            </div>
          </div>
        </section>

        <section className="rp-compare">
          <div className="container">
            <div className="rp-section-head rp-section-head--compact">
              <div>
                <div className="rp-kicker"><PriceIcon name="chart" size={14}/> Compare</div>
                <h2>Plan limits at a glance.</h2>
              </div>
            </div>
            <div className="rp-table-wrap">
              <div className="rp-table" role="table" aria-label="RevSathi pricing comparison">
                <div className="rp-row rp-row--head" role="row">
                  <div role="columnheader">Feature</div>
                  <div role="columnheader">Starter</div>
                  <div role="columnheader">Growth</div>
                  <div role="columnheader">Scale</div>
                  <div role="columnheader">Enterprise</div>
                </div>
                {comparison.map((row) => (
                  <div className="rp-row" role="row" key={row[0]}>
                    {row.map((cell, index) => <div role="cell" key={index}>{cell}</div>)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rp-final">
          <div className="container rp-final__inner">
            <div>
              <div className="rp-kicker"><PriceIcon name="clock" size={14}/> Ready when you are</div>
              <h2>Launch WhatsApp AI automation without hidden fees or confusing add-ons.</h2>
              <p>RevSathi gives your team one place for AI replies, campaigns, templates, shared inbox work, follow-ups, integrations, and reporting.</p>
            </div>
            <a href="https://www.app.revsathi.com/signup" target="_blank" rel="noopener noreferrer" className="btn btn-primary">Start for FREE <PriceIcon name="arrow" size={16}/></a>
          </div>
        </section>
      </main>
    </>
  );
}

window.PricingPage = PricingPage;
