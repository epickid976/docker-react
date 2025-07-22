import React, { useState, useEffect } from 'react';

const FloatingElement = ({ children, delay = 0, duration = 3 }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), delay * 1000);
        return () => clearTimeout(timer);
    }, [delay]);

    return (
        <div
            className={`floating-element ${isVisible ? 'visible' : ''}`}
            style={{
                animationDuration: `${duration}s`,
                animationDelay: `${delay}s`
            }}
        >
            {children}
        </div>
    );
};

const PlatformBadge = ({ icon, text, delay }) => (
    <FloatingElement delay={delay}>
        <div className="platform-badge">
            <span className="badge-icon">{icon}</span>
            <span className="badge-text">{text}</span>
        </div>
    </FloatingElement>
);

export default function App() {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div className="app-container">
            {/* Animated background elements */}
            <div className="bg-elements">
                <div className="bg-circle bg-circle-1"></div>
                <div className="bg-circle bg-circle-2"></div>
                <div className="bg-circle bg-circle-3"></div>
            </div>

            <div className="main-content">
                {/* Logo and Title */}
                <FloatingElement delay={0.5}>
                    <div className="logo-section">
                        <div className="logo">🐾</div>
                        <h1 className="title">EchoPath</h1>
                    </div>
                </FloatingElement>

                {/* Tagline */}
                <FloatingElement delay={1}>
                    <p className="tagline">
                        Learning language through <span className="highlight">play & friendship</span>
                    </p>
                </FloatingElement>

                {/* Description */}
                <FloatingElement delay={1.2}>
                    <p className="description">
                        An immersive learning companion that helps children with autism build communication skills alongside their favorite virtual pet.
                    </p>
                </FloatingElement>

                {/* Features */}
                <FloatingElement delay={1.8}>
                    <div className="features">
                        <div className="feature">
                            <div className="feature-icon">🎯</div>
                            <span>Personalized Lessons</span>
                        </div>
                        <div className="feature">
                            <div className="feature-icon">📊</div>
                            <span>Progress Tracking</span>
                        </div>
                        <div className="feature">
                            <div className="feature-icon">🎮</div>
                            <span>Interactive Learning</span>
                        </div>
                    </div>
                </FloatingElement>

                {/* CTA Button */}
                <FloatingElement delay={2.2}>
                    <button
                        className={`cta-button ${isHovered ? 'hovered' : ''}`}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        onClick={() => {
                            const button = document.querySelector('.cta-button');
                            button.style.transform = 'scale(1.1)';
                            setTimeout(() => {
                                button.style.transform = 'scale(1)';
                                alert("🚀 Coming soon to Vision Pro, iOS, and Web!");
                            }, 150);
                        }}
                    >
                        <span className="button-text">Begin the Journey</span>
                        <span className="button-icon">✨</span>
                    </button>
                </FloatingElement>

                {/* Platform Badges */}
                <FloatingElement delay={2.5}>
                    <div className="platform-badges">
                        <PlatformBadge icon="🥽" text="Vision Pro" />
                        <PlatformBadge icon="📱" text="iOS" />
                        <PlatformBadge icon="🌐" text="Web App" />
                    </div>
                </FloatingElement>

                {/* Footer */}
                <FloatingElement delay={2.8}>
                    <div className="footer-note">
                        <span>Built for therapists, daycares, and families</span>
                    </div>
                </FloatingElement>
            </div>

            <style jsx>{`
                @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@300;400;500;600;700&display=swap');

                * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }

                .app-container {
                    min-height: 100vh;
                    width: 100vw;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    position: relative;
                    overflow-x: hidden;
                    font-family: 'Fredoka', sans-serif;
                    color: white;
                }

                @media (prefers-color-scheme: dark) {
                    .app-container {
                        background: linear-gradient(135deg, #2d1b69 0%, #11998e 100%);
                    }
                }

                .bg-elements {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 1;
                }

                .bg-circle {
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.1);
                    animation: float 6s ease-in-out infinite;
                }

                .bg-circle-1 { width: 200px; height: 200px; top: 10%; left: -50px; animation-delay: 0s; }
                .bg-circle-2 { width: 150px; height: 150px; top: 70%; right: -30px; animation-delay: 2s; }
                .bg-circle-3 { width: 100px; height: 100px; top: 40%; left: 80%; animation-delay: 4s; }

                .main-content {
                    position: relative;
                    z-index: 10;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    padding: max(24px, env(safe-area-inset-top)) 24px max(24px, env(safe-area-inset-bottom));
                    text-align: center;
                }

                .floating-element {
                    opacity: 0;
                    transform: translateY(30px);
                    transition: all 0.8s ease;
                }

                .floating-element.visible {
                    opacity: 1;
                    transform: translateY(0);
                }

                .logo-section {
                    margin-bottom: 2rem;
                }

                .logo {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                    animation: bounce 2s infinite;
                }

                .title {
                    font-size: clamp(2.5rem, 8vw, 4rem);
                    font-weight: 700;
                    background: linear-gradient(45deg, #fff, #f0f9ff);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .tagline {
                    font-size: clamp(1.2rem, 4vw, 1.5rem);
                    margin-bottom: 1.5rem;
                    font-weight: 400;
                }

                .highlight {
                    background: linear-gradient(45deg, #fbbf24, #f59e0b);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    font-weight: 600;
                }

                .description {
                    font-size: clamp(1rem, 3vw, 1.1rem);
                    max-width: 600px;
                    line-height: 1.6;
                    margin-bottom: 3rem;
                    opacity: 0.9;
                }

                .features {
                    display: flex;
                    gap: 2rem;
                    margin-bottom: 3rem;
                    flex-wrap: wrap;
                    justify-content: center;
                }

                .feature {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    background: rgba(255, 255, 255, 0.15);
                    backdrop-filter: blur(10px);
                    padding: 1.5rem 1rem;
                    border-radius: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    min-width: 140px;
                    transition: transform 0.3s ease;
                }

                .feature:hover {
                    transform: translateY(-5px);
                }

                .feature-icon {
                    font-size: 2rem;
                }

                .cta-button {
                    background: linear-gradient(135deg, #ff6b6b, #ff8e53);
                    border: none;
                    padding: 1rem 3rem;
                    border-radius: 50px;
                    color: white;
                    font-family: 'Fredoka', sans-serif;
                    font-size: 1.1rem;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    transition: all 0.3s ease;
                    box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
                    margin-bottom: 1.5rem;
                }

                .cta-button:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 12px 35px rgba(255, 107, 107, 0.6);
                }

                .cta-button.hovered::before {
                    left: 100%;
                }

                .button-icon {
                    animation: sparkle 1.5s infinite;
                }

                .platform-badges {
                    display: flex;
                    gap: 0.75rem;
                    justify-content: center;
                    flex-wrap: wrap;
                    margin-top: 0.5rem;
                    margin-bottom: 1rem;
                }

                .platform-badge {
                    background: rgba(255, 255, 255, 0.15);
                    backdrop-filter: blur(10px);
                    padding: 6px 12px;
                    border-radius: 30px;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.85rem;
                    font-weight: 500;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }

                .footer-note {
                    font-size: 0.9rem;
                    opacity: 0.8;
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-20px); }
                }

                @keyframes bounce {
                    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-10px); }
                    60% { transform: translateY(-5px); }
                }

                @keyframes sparkle {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.2); }
                }
            `}</style>
        </div>
    );
}