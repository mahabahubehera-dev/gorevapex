// PhoneMock.jsx — animated WhatsApp chat mockup for hero
const { useState, useEffect, useRef } = React;

function PhoneMock() {
  const [visible, setVisible] = useState(0);
  const [typing, setTyping] = useState(false);

  const messages = [
    { from: 'in', text: "Hi! Do you have the navy blue jacket in size M?", time: "9:41 PM", delay: 400 },
    { from: 'typing', delay: 1000 },
    { from: 'out', text: "Hi Sarah! 👋 Yes — we have the Navy Performance Jacket in Medium, ₹4,299. In stock at 3 stores.", time: "9:41 PM", delay: 800 },
    { from: 'out', kind: 'card', delay: 600 },
    { from: 'in', text: "Can I get it delivered tomorrow?", time: "9:42 PM", delay: 1200 },
    { from: 'typing', delay: 800 },
    { from: 'out', text: "Yes! Order before 11 PM for next-day delivery to 560001. Want me to reserve it?", time: "9:42 PM", delay: 800 },
    { from: 'out', kind: 'buttons', delay: 600 },
  ];

  useEffect(() => {
    let cancelled = false;
    let i = 0;
    function tick() {
      if (cancelled) return;
      if (i >= messages.length) {
        setTimeout(() => { if (!cancelled) { setVisible(0); i = 0; tick(); } }, 4000);
        return;
      }
      const m = messages[i];
      setTimeout(() => {
        if (cancelled) return;
        if (m.from === 'typing') {
          setTyping(true);
          setTimeout(() => { setTyping(false); i++; tick(); }, 900);
        } else {
          setVisible(v => v + 1);
          i++;
          tick();
        }
      }, m.delay);
    }
    tick();
    return () => { cancelled = true; };
  }, []);

  const shown = messages.slice(0, visible);

  return (
    <div className="phone">
      <div className="phone__frame">
        <div className="phone__notch"></div>

        {/* WA header */}
        <div className="phone__header">
          <button className="phone__back" aria-label="Back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div className="phone__avatar">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M12 2L2 7l1.5 2.5L12 6l8.5 3.5L22 7zM12 8.5L4 12v6l8 4 8-4v-6z"/>
            </svg>
          </div>
          <div className="phone__title">
            <div className="phone__name">RevApex AI <span className="phone__verified">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#2C66F5"><path d="M9 12l2 2 4-4M12 2L4 5v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V5l-8-3z"/></svg>
            </span></div>
            <div className="phone__status">{typing ? <span className="phone__typing">typing…</span> : "online"}</div>
          </div>
          <div className="phone__actions">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 7l-7 5 7 5V7zM14 5H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"/></svg>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </div>
        </div>

        {/* Chat */}
        <div className="phone__chat">
          {shown.map((m, idx) => {
            if (m.kind === 'card') {
              return (
                <div className="phone__bubble phone__bubble--out phone__bubble--card" key={idx}>
                  <div className="phone__product">
                    <div className="phone__product-img">
                      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#2C66F5" strokeWidth="1.5">
                        <path d="M3 7h18l-2 12H5L3 7z M9 7V5a3 3 0 0 1 6 0v2"/>
                      </svg>
                    </div>
                    <div className="phone__product-meta">
                      <div className="phone__product-name">Navy Performance Jacket</div>
                      <div className="phone__product-price">₹4,299 <span>· Size M</span></div>
                      <div className="phone__product-stock">● In stock — 3 stores</div>
                    </div>
                  </div>
                  <div className="phone__time">9:41 PM <span className="phone__check">✓✓</span></div>
                </div>
              );
            }
            if (m.kind === 'buttons') {
              return (
                <div className="phone__bubble phone__bubble--out phone__bubble--buttons" key={idx}>
                  <div className="phone__quickreplies">
                    <button>Yes, reserve it</button>
                    <button>Buy now</button>
                    <button>See more options</button>
                  </div>
                  <div className="phone__time">9:42 PM <span className="phone__check">✓✓</span></div>
                </div>
              );
            }
            return (
              <div className={`phone__bubble phone__bubble--${m.from}`} key={idx}>
                <div className="phone__bubble-text">{m.text}</div>
                <div className="phone__time">{m.time}{m.from === 'out' && <span className="phone__check">✓✓</span>}</div>
              </div>
            );
          })}
          {typing && (
            <div className="phone__bubble phone__bubble--out phone__bubble--typing">
              <span></span><span></span><span></span>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="phone__input">
          <div className="phone__input-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5c6c75" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg>
            <span>Type a message</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5c6c75" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5c6c75" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          </div>
          <button className="phone__mic" aria-label="Voice message">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z"/></svg>
          </button>
        </div>
      </div>

      {/* Floating notification */}
      <div className="phone__notif phone__notif--1">
        <div className="phone__notif-dot"></div>
        <div>
          <div className="phone__notif-title">Lead captured</div>
          <div className="phone__notif-sub">+₹4,299 in pipeline</div>
        </div>
      </div>
      <div className="phone__notif phone__notif--2">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2C66F5" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
        <div>
          <div className="phone__notif-title">Avg. response</div>
          <div className="phone__notif-sub"><b>4.2s</b> · 24/7</div>
        </div>
      </div>
    </div>
  );
}

window.PhoneMock = PhoneMock;
