// src/App.tsx
import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import "./App.css";

/* ----------------------- types ----------------------- */
// "testimonials" |
type SectionId = "home" | "about" |  "contact";

type NavigationProps = {
  activeSection: SectionId;
  onNavigate: (sectionId: SectionId) => void;
  onMeasured: (h: number) => void;
};

type FloatingElementProps = {
  children: ReactNode;
  delay?: number; // seconds
  duration?: number; // seconds
};

type PlatformBadgeProps = {
  icon: string;
  text: string;
  delay?: number;
};

/* -------------------- components --------------------- */

/** Renders children into <body> to escape stacking contexts */
function BodyPortal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

/** Top navigation (fixed overlay; reports height to parent) — portaled to <body> */
const Navigation = ({ activeSection, onNavigate, onMeasured }: NavigationProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);
  const navigate = useNavigate();

  // lock body scroll when sheet is open (simple + safe)
  useEffect(() => {
    if (isMenuOpen) {
      const prev = {
        overflow: document.body.style.overflow,
        position: document.body.style.position,
        width: document.body.style.width,
      };
      document.body.dataset._lockPrev = JSON.stringify(prev);
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      return () => {
        const saved = document.body.dataset._lockPrev;
        if (saved) {
          const v = JSON.parse(saved);
          document.body.style.overflow = v.overflow;
          document.body.style.position = v.position;
          document.body.style.width = v.width;
          delete document.body.dataset._lockPrev;
        } else {
          document.body.style.overflow = "";
          document.body.style.position = "";
          document.body.style.width = "";
        }
      };
    }
  }, [isMenuOpen]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Measure nav height and report to parent (to set --nav-h)
  useLayoutEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const measure = () => onMeasured(el.getBoundingClientRect().height);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("orientationchange", measure);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", measure);
      window.removeEventListener("resize", measure);
    };
  }, [onMeasured]);



  const navItems: { id: SectionId; label: string }[] = useMemo(
      () => [
        { id: "home", label: "Home" },
        { id: "about", label: "About" },
        // { id: "testimonials", label: "Reviews" },
        { id: "contact", label: "Contact" },
      ],
      []
  );

  const handleNavClick = (sectionId: SectionId) => {
    onNavigate(sectionId);
    setIsMenuOpen(false);
  };

  // Everything is inside a portal to escape any parent transforms/filters/etc.
  return (
      <BodyPortal>
        {/* HEADER */}
        <nav
            ref={navRef as any}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              // 2^31-1 is a common browser cap; keep it max.
              zIndex: 2147483647,
              WebkitTransform: "translateZ(0)", // ensure compositing
              transform: "translateZ(0)",
            }}
            className={[
              "pointer-events-auto border-b transition-all duration-300 backdrop-blur-md",
              isScrolled
                  ? "bg-white/90 dark:bg-slate-950/90 border-slate-200/70 dark:border-slate-800/70 shadow-md"
                  : "bg-white/70 dark:bg-slate-950/70 border-transparent",
            ].join(" ")}
            aria-label="Primary"
        >
          <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
            {/* Brand */}
            <button
                className="flex items-center gap-2 select-none"
                onClick={() => handleNavClick("home")}
                aria-label="Go to home"
            >
              <img src="/favicon.svg" alt="" className="h-6 w-6" />
              <span className="font-bold tracking-tight text-slate-900 dark:text-slate-100">
              GoutDeau
            </span>
            </button>

            {/* Desktop menu */}
            <div className="hidden md:flex items-center gap-2">
              {navItems.map((item) => (
                  <button
                      key={item.id}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${
                          activeSection === item.id
                              ? "text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800"
                              : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
                      onClick={() => handleNavClick(item.id)}
                  >
                    {item.label}
                  </button>
              ))}
              <button
                  onClick={() => navigate("/auth")}
                  className="ml-2 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors duration-200"
              >
                Login / Sign up
              </button>
            </div>

            {/* Mobile toggle */}
            <button
                className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-100 backdrop-blur-sm transition-colors duration-200"
                onClick={() => setIsMenuOpen(true)}
                aria-label="Open menu"
            >
              ☰
            </button>
          </div>
        </nav>

        {/* MOBILE OVERLAY (also portaled) */}
        {isMenuOpen &&
            createPortal(
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm md:hidden"
                    style={{ zIndex: 2147483646 }}
                    onClick={() => setIsMenuOpen(false)}
                    aria-hidden="true"
                />,
                document.body
            )}

        {/* MOBILE SHEET (also portaled) */}
        {createPortal(
            <div
                className={[
                  "fixed right-0 top-0 bottom-0 w-[76%] max-w-xs md:hidden",
                  "transform transition-transform duration-300 ease-out",
                  isMenuOpen ? "translate-x-0" : "translate-x-full",
                  "bg-slate-900 text-white shadow-2xl",
                  "p-6 space-y-3",
                  "pt-[calc(env(safe-area-inset-top)+16px)] pb-[calc(env(safe-area-inset-bottom)+16px)]",
                ].join(" ")}
                style={{ zIndex: 2147483647 }}
            >

              <div className="pb-10"></div>

              <button
                  className="absolute top-[env(safe-area-inset-top)] right-3 mt-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                  aria-label="Close menu"
              >
                ✕
              </button>

              <div className="mt-12 space-y-1">
                {[
                  { id: "home", label: "Home" },
                  { id: "about", label: "About" },
                  // { id: "testimonials", label: "Reviews" },
                  { id: "contact", label: "Contact" },
                ].map((item) => (
                    <button
                        key={item.id}
                        className={`block w-full text-left rounded-lg px-3 py-3 text-base transition-all duration-200
                ${
                            activeSection === (item.id as SectionId)
                                ? "font-semibold bg-white/10"
                                : "hover:bg-white/5"
                        }`}
                        onClick={() => {
                          onNavigate(item.id as SectionId);
                          setIsMenuOpen(false);
                        }}
                    >
                      {item.label}
                    </button>
                ))}
              </div>

              <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigate("/auth");
                  }}
                  className="mt-6 w-full inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors duration-200"
              >
                Login / Sign up
              </button>
            </div>,
            document.body
        )}
      </BodyPortal>
  );
};

/** Simple appear-once animation wrapper */
const FloatingElement = ({ children, delay = 0, duration = 3 }: FloatingElementProps) => {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setIsVisible(true), delay * 1000);
    return () => window.clearTimeout(t);
  }, [delay]);
  return (
      <div
          className={`floating-element ${isVisible ? "visible" : ""}`}
          style={{
            animationDuration: `${duration}s`,
            animationDelay: `${delay}s`,
            transform: isVisible ? undefined : "translateY(8px)",
          }}
      >
        {children}
      </div>
  );
};

const PlatformBadge = ({ icon, text, delay }: PlatformBadgeProps) => (
    <FloatingElement delay={delay}>
      <div className="platform-badge">
        <span className="badge-icon">{icon}</span>
        <span className="badge-text">{text}</span>
      </div>
    </FloatingElement>
);

/* -------------------- hooks --------------------- */

// replace useScrollSpy with this
const useActiveSectionObserver = (sectionIds: SectionId[]) => {
  const [active, setActive] = useState<SectionId>("home");

  useEffect(() => {
    const getNavHeight = () => {
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue("--nav-height")
        .trim();
      const n = parseFloat(raw || "64");
      return Number.isFinite(n) ? n : 64;
    };

    const navH = getNavHeight();

    // Negative top rootMargin shifts the observer down by the header height,
    // so a section is “active” when its content is visible below the navbar.
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry with the largest intersection ratio
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target?.id && sectionIds.includes(visible.target.id as SectionId)) {
          setActive(visible.target.id as SectionId);
        } else {
          // Edge cases: above first or below last — clamp to nearest
          const tops = sectionIds
            .map(id => {
              const el = document.getElementById(id);
              return { id, top: el ? el.getBoundingClientRect().top : Number.POSITIVE_INFINITY };
            })
            .filter(x => x.top !== Number.POSITIVE_INFINITY)
            .sort((a, b) => a.top - b.top);

          if (tops.length) {
            if (tops[0].top > 0) setActive(tops[0].id);                             // above first
            else if (tops[tops.length - 1].top < -window.innerHeight / 2)           // scrolled past last
              setActive(tops[tops.length - 1].id);
          }
        }
      },
      {
        root: null,
        rootMargin: `-${navH + 8}px 0px 0px 0px`,  // account for fixed header + tiny bias
        threshold: [0.25, 0.5, 0.75],              // stable across layouts/animations
      }
    );

    // Observe all sections
    const els = sectionIds
      .map(id => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);

    els.forEach(el => observer.observe(el));

    // Also re-run when the nav height changes (e.g., responsive)
    const onResize = () => {
      observer.disconnect();
      // Let the effect re-run on next tick by forcing a micro change
      requestAnimationFrame(() => {
        const ev = new Event("force-reinit");
        window.dispatchEvent(ev);
      });
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      observer.disconnect();
    };
  }, [sectionIds]);

  return active;
};

/* ------------------------- Page ------------------------ */

export default function App() {
  // , "testimonials"
  const sectionIds: SectionId[] = ["home", "about", "contact"];
const activeSection = useActiveSectionObserver(sectionIds);

  const handleNavigate = useCallback((sectionId: SectionId) => {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Keep a CSS var of the header height so sections can offset scroll & spacing.
  const [navHeight, setNavHeight] = useState<number>(64);
  useLayoutEffect(() => {
    document.documentElement.style.setProperty('--nav-height', `${navHeight}px`);
  }, [navHeight]);

  const navigate = useNavigate();

  return (
      <div className="min-h-dvh">
        {/* Fixed navbar - always visible and overlaying content (via portal) */}
        <Navigation
            activeSection={activeSection}
            onNavigate={handleNavigate}
            onMeasured={setNavHeight}
        />

        {/* background UNDER everything */}
        <div className="fixed inset-0 -z-10 bg-gradient-to-b from-indigo-200/30 via-transparent to-indigo-400/20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950" />

        {/* Top spacer so first section isn't under the fixed nav */}
        <div >
          {/* Home */}
          <section
              id="home"
              className="section hero-section"
              style={{ scrollMarginTop: "calc(var(--nav-height, 64px) + 16px)" }}
          >
            <div className="main-content">
              <FloatingElement delay={0.5}>
                <div className="logo-section">
                  <div className="logo text-center"><img src="/favicon.svg" alt="" style={{ width: '1em', height: '1em' }} /></div>
                  <h1 className="title text-center">GoutDeau</h1>
                </div>
              </FloatingElement>

              <FloatingElement delay={1}>
                <p className="tagline text-center">
                  Hydration tracking has never been <span className="highlight">more fun</span>
                </p>
              </FloatingElement>

              <FloatingElement delay={1.2}>
                <p className="description text-center">
                  A water tracking app that gamifies health and the importance of drinking water. Track your daily hydration, earn achievements, and build healthy habits with GoutDeau - your personal water companion.
                </p>
              </FloatingElement>

              <FloatingElement delay={1.8}>
                <div className="features">
                  <div className="feature">
                    <div className="feature-icon">🎯</div>
                    <span>Hit your goals!</span>
                  </div>
                  <div className="feature">
                    <div className="feature-icon">📊</div>
                    <span>Track your progress</span>
                  </div>
                  <div className="feature">
                    <div className="feature-icon">🎮</div>
                    <span>Gamify it!</span>
                  </div>
                </div>
              </FloatingElement>

              <FloatingElement delay={2.2}>
                <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
                  <button
                      className="cta-button"
                      onClick={() => navigate("/auth")}
                      aria-label="Begin the Journey with EchoPath"
                  >
                    <span className="button-text">Start Your Journey</span>
                    <span className="button-icon">✨</span>
                  </button>
                </div>
              </FloatingElement>

              <FloatingElement delay={2.5}>
                <div className="platform-badges">
                  <PlatformBadge icon="💻" text="Desktop (Coming Soon)" />
                  <PlatformBadge icon="📱" text=" Mobile" />
                  <PlatformBadge icon="🌐" text=" Web" />
                </div>
              </FloatingElement>
            </div>
          </section>

          {/* About */}
          <section
              id="about"
              className="section content-section"
              style={{scrollMarginTop: "calc(var(--nav-height, 64px) + 16px)"}}
          >
            <div className="section-content">
              <FloatingElement delay={0.3}>
                <h2>About GoutDeau</h2>
              </FloatingElement>
              <FloatingElement delay={0.6}>
                <p>
                  GoutDeau transforms water tracking into an engaging, gamified experience that motivates you to stay hydrated. 
                  Track your daily water intake, unlock achievements, and build lasting healthy habits with our intuitive 
                  and beautiful interface designed for both web and mobile platforms.
                </p>
              </FloatingElement>
              <FloatingElement delay={0.9}>
                <div className="about-features">
                  <div className="about-feature">
                    <div className="about-icon">🏆</div>
                    <h3>Gamified Tracking</h3>
                    <p>Earn achievements and unlock rewards as you build healthy hydration habits</p>
                  </div>
                  <div className="about-feature">
                    <div className="about-icon">📊</div>
                    <h3>Smart Analytics</h3>
                    <p>Track your progress with detailed insights and personalized recommendations</p>
                  </div>
                  <div className="about-feature">
                    <div className="about-icon">📱</div>
                    <h3>Cross-Platform</h3>
                    <p>Available on Web, iOS & Android</p>
                  </div>
                </div>
              </FloatingElement>
            </div>
          </section>

          {/*/!* Testimonials *!/*/}
          {/*<section*/}
          {/*    id="testimonials"*/}
          {/*    className="section content-section"*/}
          {/*    style={{ scrollMarginTop: "calc(var(--nav-h, 64px) + 16px)" }}*/}
          {/*>*/}
          {/*  <div className="section-content">*/}
          {/*    <FloatingElement delay={0.3}>*/}
          {/*      <h2>What Parents Say</h2>*/}
          {/*    </FloatingElement>*/}
          {/*    <FloatingElement delay={0.6}>*/}
          {/*      <p>Families trust EchoPath to support their child's communication journey.</p>*/}
          {/*    </FloatingElement>*/}
          {/*    <FloatingElement delay={0.9}>*/}
          {/*      <div className="testimonials-preview">*/}
          {/*        <div className="testimonial">*/}
          {/*          <p>"EchoPath has been a game-changer for us."</p>*/}
          {/*          <span>- Sarah, Parent</span>*/}
          {/*        </div>*/}
          {/*        <div className="testimonial">*/}
          {/*          <p>"I can finally see progress clearly."</p>*/}
          {/*          <span>- Dr. Martinez, SLP</span>*/}
          {/*        </div>*/}
          {/*        <div className="testimonial">*/}
          {/*          <p>"Learning feels like play!"</p>*/}
          {/*          <span>- Mike, Father of two</span>*/}
          {/*        </div>*/}
          {/*      </div>*/}
          {/*    </FloatingElement>*/}
          {/*  </div>*/}
          {/*</section>*/}

          {/* Contact */}
          <section
              id="contact"
              className="section content-section"
              style={{scrollMarginTop: "calc(var(--nav-height, 64px) + 16px)"}}
          >
            <div className="section-content">
              <FloatingElement delay={0.3}>
                <h2>Get in Touch</h2>
              </FloatingElement>
              <FloatingElement delay={0.6}>
                <p>Ready to start your child's communication journey? We're here to help.</p>
              </FloatingElement>
              <FloatingElement delay={0.9}>
                <div className="contact-info">
                  <div className="contact-item">
                    <div className="contact-icon">📧</div>
                    <span>epickid976@gmail.com</span>
                  </div>
                  <div className="contact-item">
                    <div className="contact-icon">💬</div>
                    <span>Schedule a demo call (Coming Soon)</span>
                  </div>
                  <div className="contact-item">
                    <div className="contact-icon">📚</div>
                    <span>Access our resource library (Coming Soon)</span>
                  </div>
                </div>
              </FloatingElement>
            </div>
          </section>

          <footer className="footer pb-[calc(env(safe-area-inset-bottom)+24px)]">
            <FloatingElement delay={0.3}>
            <div className="footer-note">
                <span>Built for people who want results</span>
              </div>
            </FloatingElement>
          </footer>
        </div>
      </div>
  );
}