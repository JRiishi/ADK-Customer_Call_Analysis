import React, { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Activity, Shield, Users, Zap, ArrowRight, BarChart3, Heart, Cpu, Globe } from 'lucide-react';
import heroBg from '../assets/hero-bg.png';

gsap.registerPlugin(ScrollTrigger);

const LandingPage = () => {
    const navigate = useNavigate();
    const heroRef = useRef(null);
    const horizontalSectionRef = useRef(null);
    const scrollContainerRef = useRef(null);

    const { scrollYProgress } = useScroll();
    const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

    useEffect(() => {
        // Hero Background Parallax & Zoom (Original Logic)
        gsap.to(".hero-bg-zoom", {
            scale: 1.2,
            rotate: 2,
            scrollTrigger: {
                trigger: heroRef.current,
                start: "top top",
                end: "bottom top",
                scrub: true
            }
        });

        // New Advanced Horizontal Scroll Logic
        const sections = gsap.utils.toArray(".feature-card");
        gsap.to(sections, {
            xPercent: -100 * (sections.length - 1),
            ease: "none",
            scrollTrigger: {
                trigger: horizontalSectionRef.current,
                pin: true,
                scrub: 1,
                snap: 1 / (sections.length - 1),
                end: () => "+=" + (horizontalSectionRef.current.offsetWidth * 2)
            }
        });

        // Card Inner Animation (New Logic)
        sections.forEach((card) => {
            gsap.fromTo(card.querySelector('.card-content'),
                { scale: 0.9, opacity: 0.5 },
                {
                    scale: 1,
                    opacity: 1,
                    scrollTrigger: {
                        trigger: card,
                        containerAnimation: gsap.getById("h-scroll"),
                        start: "left center",
                        end: "right center",
                        scrub: true
                    }
                }
            );
        });

        // Floating elements animation (Original Logic)
        gsap.to(".floating", {
            y: 20,
            duration: 2,
            repeat: -1,
            yoyo: true,
            ease: "power1.inOut",
            stagger: 0.2
        });

        return () => {
            ScrollTrigger.getAll().forEach(t => t.kill());
        };
    }, []);

    // NEW Features Data (The upgraded cards you liked)
    const features = [
        {
            step: "01",
            title: "Live Neural Intercept",
            subtitle: "Real-Time Processing",
            desc: "The AI listens alongside your agents, identifying friction points, sentiment shifts, and compliance risks the millisecond they happen.",
            icon: <Activity className="text-cyan-400" size={48} />,
            gradient: "from-cyan-900/40 to-blue-900/10",
            border: "border-cyan-500/20"
        },
        {
            step: "02",
            title: "Instant Guidance Engine",
            subtitle: "On-Call Nudges",
            desc: "Agents receive discreet, context-aware prompts. 'Slow down,' 'Show empathy,' or 'Offer the retention plan'—exactly when it matters.",
            icon: <Cpu className="text-sky-400" size={48} />,
            gradient: "from-sky-900/40 to-blue-900/10",
            border: "border-sky-500/20"
        },
        {
            step: "03",
            title: "Precision Auditing",
            subtitle: "100% Coverage",
            desc: "Human QA samples 2% of calls. Cognivista audits 100%. Every SOP checked, every risk flagged, every opportunity measured.",
            icon: <Shield className="text-emerald-400" size={48} />,
            gradient: "from-emerald-900/40 to-teal-900/10",
            border: "border-emerald-500/20"
        },
        {
            step: "04",
            title: "The Talent Feedback Loop",
            subtitle: "Manager-to-Agent",
            desc: "Performance data flows instantly to managers. One click nominates a top performer for rewards or enrolls a struggler in coaching.",
            icon: <Users className="text-amber-400" size={48} />,
            gradient: "from-amber-900/40 to-orange-900/10",
            border: "border-amber-500/20"
        },
        {
            step: "05",
            title: "Global Intelligence Hub",
            subtitle: "Executive View",
            desc: "See the pulse of your entire operation globally. Latency-free dashboards that turn conversation data into board-ready strategy.",
            icon: <Globe className="text-white" size={48} />,
            gradient: "from-gray-900 to-black",
            border: "border-white/20"
        }
    ];

    return (
        <div className="bg-[#050505] text-white min-h-screen overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200" ref={scrollContainerRef}>
            {/* Progress Bar */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-600 to-blue-600 origin-left z-[100]"
                style={{ scaleX: smoothProgress }}
            />

            {/* Navbar (Original Content, Cyan Styling) */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-8 py-6 flex justify-between items-center backdrop-blur-md bg-black/10 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-900/40">
                        <span className="font-black text-xl italic">C</span>
                    </div>
                    <span className="text-xl font-black tracking-tighter uppercase italic">Cognivista</span>
                </div>
                <div className="hidden md:flex items-center gap-10">
                    <a href="#features" className="text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-widest">Intelligence</a>
                    <a href="#workflow" className="text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-widest">Platform</a>
                    <button
                        onClick={() => navigate('/console')}
                        className="px-6 py-2.5 bg-white text-black font-black text-xs uppercase tracking-widest rounded-full hover:bg-cyan-50 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    >
                        Launch Console
                    </button>
                </div>
            </nav>

            {/* Hero Section (Original Content & Structure) */}
            <section ref={heroRef} className="relative h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
                {/* Background Image with Cinematic Overlay */}
                <div className="absolute inset-0 z-0">
                    <div className="hero-bg-zoom absolute inset-0 opacity-40">
                        <img src={heroBg} alt="Hero Backdrop" className="w-full h-full object-cover grayscale-[0.2]" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505]" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-[#050505]" />
                </div>

                <div className="relative z-10 max-w-5xl w-full text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    >
                        <span className="inline-block px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-black uppercase tracking-[0.3em] mb-8">
                            Next-Gen QA Intelligence
                        </span>
                        <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter mb-8 leading-[0.9] text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40">
                            EVERY WORD <br />
                            <span className="italic">MEASURED.</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-400 font-light max-w-2xl mx-auto mb-12 leading-relaxed">
                            Stop sampling calls. Start understanding them. Cognivista uses advanced AI to audit every conversation, nudging agents toward excellence in real-time.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="flex flex-col md:flex-row items-center justify-center gap-6"
                    >
                        <button
                            onClick={() => navigate('/console')}
                            className="group relative px-10 py-5 bg-cyan-600 rounded-2xl font-black text-sm uppercase tracking-widest overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(8,145,178,0.3)]"
                        >
                            <span className="relative z-10 flex items-center gap-3 text-white">
                                Start Your Transformation <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    </motion.div>
                </div>

                {/* Floating Info Panels (Original Logic) */}
                <div className="absolute bottom-12 left-12 hidden lg:block floating">
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl max-w-xs transition-all hover:bg-white/10">
                        <Heart className="text-red-400 mb-4" />
                        <h4 className="font-bold text-white mb-1">Sentiment-First</h4>
                        <p className="text-xs text-gray-400">Our models are trained on empathy, not just keywords.</p>
                    </div>
                </div>
                <div className="absolute top-1/3 right-12 hidden lg:block floating" style={{ transitionDelay: '0.2s' }}>
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl max-w-xs transition-all hover:bg-white/10">
                        <Zap className="text-yellow-400 mb-4" />
                        <h4 className="font-bold text-white mb-1">Zero Latency</h4>
                        <p className="text-xs text-gray-400">Insights delivered at the speed of conversation.</p>
                    </div>
                </div>
            </section>

            {/* Scrolling Features Section (NEW Advanced Cards) */}
            <section ref={horizontalSectionRef} id="features" className="relative h-screen flex flex-col justify-center bg-[#050505] overflow-hidden border-y border-white/5">
                {/* Background Grid */}
                <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '100px 100px' }}
                />

                <div className="flex px-[15vw] gap-[5vw]">
                    {features.map((feature, i) => (
                        <div key={i} className="feature-card flex-shrink-0 w-[80vw] md:w-[60vw] h-[60vh] relative group cursor-default">
                            {/* Advanced Card Design from Upgrade */}
                            <div className={`card-content h-full p-12 rounded-[2rem] border ${feature.border} bg-gradient-to-br ${feature.gradient} backdrop-blur-2xl flex flex-col justify-between transition-all duration-700 hover:shadow-[0_0_30px_rgba(0,0,0,0.2)] relative overflow-hidden`}>
                                {/* Inner Glow */}
                                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-white/5 rounded-full blur-[80px] group-hover:bg-white/10 transition-colors" />

                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-10">
                                        <div className="p-5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md shadow-2xl group-hover:scale-110 transition-transform duration-500">
                                            {feature.icon}
                                        </div>
                                        <span className="text-6xl font-black text-white/5 font-mono">{feature.step}</span>
                                    </div>

                                    <h4 className="text-cyan-400 font-bold tracking-widest text-xs uppercase mb-3">{feature.subtitle}</h4>
                                    <h3 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6 w-3/4 leading-tight">{feature.title}</h3>
                                </div>

                                <div className="relative z-10 border-t border-white/10 pt-8 mt-auto">
                                    <p className="text-xl text-gray-300 font-light leading-relaxed max-w-xl">
                                        {feature.desc}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="absolute bottom-10 left-10 flex items-center gap-4 opacity-50">
                    <div className="w-12 h-[2px] bg-white/20">
                        <div className="h-full bg-cyan-400 w-1/3 animate-scroll-loading" />
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-gray-500">Scroll to Explore</span>
                </div>
            </section>

            {/* Narrative Section - Zoom Storytelling (Original Content) */}
            <section id="workflow" className="py-40 px-6 relative overflow-hidden bg-[#050505]">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1 }}
                        className="space-y-12"
                    >
                        <div className="space-y-4">
                            <span className="text-cyan-400 font-black text-xs uppercase tracking-widest">Connective Intelligence</span>
                            <h2 className="text-5xl md:text-7xl font-black tracking-tight leading-tight text-white">
                                CONNECTED <br />
                                DASHBOARDS. <br />
                                <span className="text-gray-600 italic uppercase">Unified Goal.</span>
                            </h2>
                        </div>
                        <p className="text-xl text-gray-400 font-light leading-relaxed max-w-lg">
                            We've broken down corporate silos. From the agent on the front line to the executive in the boardroom, everyone is seeing the same live intelligence.
                        </p>

                        <div className="grid grid-cols-1 gap-8">
                            <div className="flex gap-6 items-start">
                                <div className="w-12 h-12 flex-shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-black italic text-gray-500">1</div>
                                <div>
                                    <h4 className="font-bold text-white mb-2">The Console</h4>
                                    <p className="text-sm text-gray-500 leading-relaxed">Agents receive real-time nudges and customer sentiment alerts during live calls.</p>
                                </div>
                            </div>
                            <div className="flex gap-6 items-start">
                                <div className="w-12 h-12 flex-shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-black italic text-gray-500">2</div>
                                <div>
                                    <h4 className="font-bold text-white mb-2">The Analysis</h4>
                                    <p className="text-sm text-gray-500 leading-relaxed">Post-call automated auditing grades conversations against SOPs in under 60 seconds.</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="relative rounded-[40px] overflow-hidden border border-white/10 shadow-2xl p-4 bg-white/5 backdrop-blur-3xl group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 relative p-8 bg-black/40 rounded-3xl border border-white/10">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex gap-2">
                                        <div className="w-2 h-2 rounded-full bg-red-400" />
                                        <div className="w-2 h-2 rounded-full bg-yellow-400" />
                                        <div className="w-2 h-2 rounded-full bg-green-400" />
                                    </div>
                                    <span className="text-[10px] text-gray-600 font-mono">LIVE_MONITOR_v4.2</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="h-4 bg-white/10 rounded-full w-3/4" />
                                    <div className="h-4 bg-white/10 rounded-full w-full" />
                                    <div className="h-4 bg-cyan-500/20 rounded-full w-1/2 border border-cyan-500/30">
                                        <div className="h-full bg-cyan-500 w-full animate-pulse opacity-50" />
                                    </div>
                                    <div className="h-4 bg-white/10 rounded-full w-2/3" />
                                </div>
                            </div>
                            <div className="p-8 bg-black/40 rounded-3xl border border-white/10 flex flex-col items-center justify-center text-center">
                                <BarChart3 className="text-blue-400 mb-4" size={32} />
                                <span className="text-2xl font-black text-white">99.2%</span>
                                <span className="text-[10px] text-gray-600 uppercase font-black mt-1">Accuracy</span>
                            </div>
                            <div className="p-8 bg-black/40 rounded-3xl border border-white/10 flex flex-col items-center justify-center text-center">
                                <Users className="text-emerald-400 mb-4" size={32} />
                                <span className="text-2xl font-black text-white">2.4k</span>
                                <span className="text-[10px] text-gray-600 uppercase font-black mt-1">Buddies</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Final CTA (Original Content with Cyan updates) */}
            <section className="py-60 px-6 text-center relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-600/5 rounded-full blur-[150px] pointer-events-none" />

                <div className="relative z-10 max-w-4xl mx-auto">
                    <h2 className="text-6xl md:text-8xl font-black tracking-tighter mb-12 text-white">
                        READY TO <br />
                        <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">OPTIMIZE?</span>
                    </h2>
                    <p className="text-xl text-gray-500 font-light mb-16 max-w-lg mx-auto leading-relaxed">
                        Join the future of customer intelligence. Experience Cognivista and transform your call center operations today.
                    </p>
                    <button
                        onClick={() => navigate('/console')}
                        className="group bg-white py-6 px-16 rounded-[24px] overflow-hidden relative shadow-2xl transition-all hover:scale-105 active:scale-95"
                    >
                        <span className="relative z-10 text-black font-black text-lg uppercase tracking-widest flex items-center gap-4">
                            Enter the Dashboard <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                        </span>
                    </button>

                    <div className="mt-40 flex flex-wrap justify-center gap-20 opacity-30 grayscale">
                        <div className="text-2xl font-black italic">TECH_CORP</div>
                        <div className="text-2xl font-black italic">GLOBAL_HUB</div>
                        <div className="text-2xl font-black italic">DATA_GEN</div>
                        <div className="text-2xl font-black italic">NEXUS_QA</div>
                    </div>
                </div>
            </section>

            {/* Footer (Original Content) */}
            <footer className="py-20 px-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10 bg-[#020202]">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center">
                        <span className="font-black italic text-sm">C</span>
                    </div>
                    <span className="text-lg font-black tracking-tighter uppercase italic">Cognivista</span>
                </div>
                <div className="text-gray-600 text-xs font-bold uppercase tracking-widest flex gap-10">
                    <span>© 2026 Cognivista AI</span>
                    <span>Privacy</span>
                    <span>Terms</span>
                    <span>Documentation</span>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
