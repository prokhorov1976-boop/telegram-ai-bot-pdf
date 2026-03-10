import { useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

const HERO_IMG = "https://cdn.poehali.dev/projects/318b8097-b373-4dc8-809c-5f80c68a2061/files/e0c5a755-e901-44d8-8458-d3116c92d4cf.jpg";
const ABOUT_IMG = "https://cdn.poehali.dev/projects/ce006d00-b7e7-4beb-a68f-96ef5ddf59a7/files/4f6b3b0f-502a-4a6d-8abe-608a5915ba27.jpg";
const WEDDING_IMG = "https://cdn.poehali.dev/projects/ce006d00-b7e7-4beb-a68f-96ef5ddf59a7/files/14292be8-e16b-447b-b8ec-18409d3ec2ed.jpg";

const formats = [
  {
    icon: "Heart",
    title: "Свадьбы",
    desc: "Тёплые, современные церемонии и вечер без банальных конкурсов. Каждая свадьба — это отдельная история.",
    tag: "камерные и большие",
  },
  {
    icon: "Trophy",
    title: "Премии и большие сцены",
    desc: "Работа с залом, таймингом и масштабом события. Умею держать внимание тысячи гостей.",
    tag: "гала-ивенты",
  },
  {
    icon: "Briefcase",
    title: "Бизнес-мероприятия",
    desc: "Форумы, конференции, закрытые клубы и презентации. Деловой стиль с живой атмосферой.",
    tag: "корпоративные",
  },
  {
    icon: "Sparkles",
    title: "Частные события",
    desc: "Юбилеи, вечеринки и особенные семейные даты. Интимная атмосфера, которую хочется повторить.",
    tag: "приватные",
  },
];

const strengths = [
  "Современный стиль ведения",
  "Лёгкий юмор и интеллигентная импровизация",
  "Опыт работы на больших сценах",
  "Внимание к каждому гостю",
  "Умение чувствовать атмосферу события",
];

const reviews = [
  {
    text: "Ника сделала нашу свадьбу невероятно живой и атмосферной. Гости до сих пор вспоминают этот вечер.",
    author: "Анна и Максим",
    event: "Свадьба · 2024",
  },
  {
    text: "Очень лёгкая, харизматичная и профессиональная ведущая. Зал был в руках с первой минуты.",
    author: "Дмитрий К.",
    event: "Бизнес-форум",
  },
  {
    text: "Никогда не думала, что корпоратив может быть настолько живым. Ника — это другой уровень.",
    author: "Елена В.",
    event: "Корпоративная премия",
  },
];

export default function Index() {
  const scrollObserverRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    scrollObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );

    const elements = document.querySelectorAll(
      ".animate-on-scroll, .animate-on-scroll-left, .animate-on-scroll-right"
    );
    elements.forEach((el) => scrollObserverRef.current?.observe(el));

    return () => scrollObserverRef.current?.disconnect();
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0a0a0a", color: "#ffffff" }}>

      {/* NAV */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 md:px-16 py-6"
        style={{ background: "linear-gradient(to bottom, rgba(10,10,10,0.92) 0%, transparent 100%)" }}
      >
        <span className="font-cormorant text-xl font-light tracking-[0.25em] text-white uppercase">
          Ника Старва
        </span>
        <div className="hidden md:flex items-center gap-10">
          <a href="#about" className="nav-link">О ведущей</a>
          <a href="#formats" className="nav-link">Форматы</a>
          <a href="#showreel" className="nav-link">Шоу-рилс</a>
          <a href="#reviews" className="nav-link">Отзывы</a>
          <a href="#contact" className="btn-gold text-[10px]">Связаться</a>
        </div>
        <button className="md:hidden" style={{ color: "#ffffff", background: "none", border: "none" }}>
          <Icon name="Menu" size={22} />
        </button>
      </nav>

      {/* HERO */}
      <section className="relative flex items-end overflow-hidden" style={{ height: "100vh", minHeight: "700px" }}>
        <div className="absolute inset-0">
          <img
            src={HERO_IMG}
            alt="Ника Старва на сцене"
            className="w-full h-full object-cover"
            style={{ objectPosition: "center top" }}
          />
          <div className="hero-overlay absolute inset-0" />
        </div>

        <div className="relative z-10 px-8 md:px-16 pb-20 md:pb-28 w-full">
          <div style={{ maxWidth: "900px" }}>
            <p
              className="font-montserrat animate-fade-in"
              style={{
                fontSize: "11px",
                letterSpacing: "0.4em",
                textTransform: "uppercase",
                color: "#c9a84c",
                marginBottom: "24px",
                animationDelay: "0.2s",
              }}
            >
              свадьбы &nbsp;•&nbsp; премии &nbsp;•&nbsp; бизнес-ивенты
            </p>
            <h1
              className="font-cormorant font-light animate-fade-in"
              style={{
                fontSize: "clamp(72px, 13vw, 200px)",
                lineHeight: "0.88",
                marginBottom: "24px",
                animationDelay: "0.4s",
              }}
            >
              Ника<br />
              <em className="gold-text not-italic">Старва</em>
            </h1>
            <p
              className="font-montserrat font-light animate-fade-in"
              style={{
                fontSize: "13px",
                letterSpacing: "0.35em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.55)",
                marginBottom: "8px",
                animationDelay: "0.6s",
              }}
            >
              ведущая мероприятий
            </p>
            <p
              className="font-cormorant italic animate-fade-in"
              style={{
                fontSize: "clamp(20px, 2.5vw, 28px)",
                color: "rgba(255,255,255,0.75)",
                marginTop: "20px",
                marginBottom: "40px",
                animationDelay: "0.8s",
              }}
            >
              Мероприятия, которые не хочется заканчивать.
            </p>
            <div className="flex flex-wrap gap-4 animate-fade-in" style={{ animationDelay: "1s" }}>
              <a href="#showreel" className="btn-gold">
                <Icon name="Play" size={14} />
                Смотреть шоу-рилс
              </a>
              <a href="#contact" className="btn-outline-gold">
                Связаться
              </a>
            </div>
          </div>
        </div>

        <div
          className="absolute z-10 animate-fade-in"
          style={{ bottom: "32px", right: "48px", animationDelay: "1.4s" }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <span
              className="font-montserrat"
              style={{
                fontSize: "9px",
                letterSpacing: "0.35em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.25)",
                writingMode: "vertical-rl",
              }}
            >
              Scroll
            </span>
            <div style={{ width: "1px", height: "60px", background: "linear-gradient(to bottom, transparent, rgba(201,168,76,0.5), transparent)" }} />
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" style={{ padding: "120px 64px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "96px", alignItems: "center" }}
          className="grid-cols-1 md:grid-cols-2">
          <div className="animate-on-scroll-right">
            <div style={{ position: "relative" }}>
              <img
                src={ABOUT_IMG}
                alt="Ника Старва"
                style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", objectPosition: "center top" }}
              />
              <div style={{ position: "absolute", bottom: "-24px", right: "-24px", width: "120px", height: "120px", border: "1px solid rgba(201,168,76,0.25)" }} />
              <div style={{ position: "absolute", top: "-20px", left: "-20px", width: "72px", height: "72px", border: "1px solid rgba(201,168,76,0.15)" }} />
            </div>
          </div>

          <div className="animate-on-scroll-left">
            <p className="font-montserrat" style={{ fontSize: "10px", letterSpacing: "0.4em", textTransform: "uppercase", color: "#c9a84c", marginBottom: "32px" }}>
              О ведущей
            </p>
            <h2 className="font-cormorant font-light" style={{ fontSize: "clamp(40px, 5vw, 64px)", lineHeight: "1.1", marginBottom: "32px" }}>
              Меня зовут<br />
              <em className="gold-text not-italic">Ника Старва.</em>
            </h2>
            <div className="font-montserrat font-light" style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", lineHeight: "1.9", display: "flex", flexDirection: "column", gap: "20px" }}>
              <p>Я ведущая мероприятий и блогер. Работаю со свадьбами, бизнес-событиями и премиями.</p>
              <p>Моя задача — не просто провести программу, а создать атмосферу, в которой гости чувствуют себя частью события.</p>
              <p>Лёгкий юмор, живое общение, импровизация и уважение к гостям — основа моего стиля.</p>
              <p style={{ color: "rgba(255,255,255,0.85)", fontWeight: "400" }}>
                Я одинаково органично работаю и на камерных свадьбах на 30 человек, и на больших сценах с сотнями гостей.
              </p>
            </div>

            <div style={{ marginTop: "48px", paddingTop: "40px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ display: "flex", gap: "48px" }}>
                {[["200+", "мероприятий"], ["7+", "лет опыта"], ["100%", "рекомендаций"]].map(([num, label]) => (
                  <div key={label}>
                    <p className="font-cormorant gold-text font-light" style={{ fontSize: "40px" }}>{num}</p>
                    <p className="font-montserrat" style={{ fontSize: "9px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginTop: "4px" }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FORMATS */}
      <section id="formats" style={{ padding: "120px 64px", backgroundColor: "#0d0d0d" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div className="text-center animate-on-scroll" style={{ marginBottom: "80px" }}>
            <p className="font-montserrat" style={{ fontSize: "10px", letterSpacing: "0.4em", textTransform: "uppercase", color: "#c9a84c", marginBottom: "24px" }}>
              Форматы
            </p>
            <h2 className="font-cormorant font-light" style={{ fontSize: "clamp(40px, 5vw, 64px)", lineHeight: "1.1" }}>
              Работаю с&nbsp;
              <em className="gold-text not-italic">любым событием</em>
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1px", background: "rgba(255,255,255,0.05)" }}
            className="grid-formats">
            {formats.map((f, i) => (
              <div
                key={i}
                className="card-hover animate-on-scroll"
                style={{
                  backgroundColor: "#0d0d0d",
                  padding: "56px",
                  border: "1px solid rgba(255,255,255,0.05)",
                  transitionDelay: `${i * 0.1}s`,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px" }}>
                  <div style={{ width: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(201,168,76,0.3)" }}>
                    <Icon name={f.icon} fallback="Sparkles" size={20} style={{ color: "#c9a84c" }} />
                  </div>
                  <span className="font-montserrat" style={{ fontSize: "9px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>
                    {f.tag}
                  </span>
                </div>
                <h3 className="font-cormorant font-light" style={{ fontSize: "30px", color: "#ffffff", marginBottom: "16px" }}>{f.title}</h3>
                <p className="font-montserrat font-light" style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", lineHeight: "1.8" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY ME */}
      <section style={{ padding: "120px 64px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "96px", alignItems: "center" }}>
          <div className="animate-on-scroll">
            <p className="font-montserrat" style={{ fontSize: "10px", letterSpacing: "0.4em", textTransform: "uppercase", color: "#c9a84c", marginBottom: "32px" }}>
              Почему выбирают
            </p>
            <h2 className="font-cormorant font-light" style={{ fontSize: "clamp(36px, 4vw, 56px)", lineHeight: "1.1", marginBottom: "56px" }}>
              Пять причин<br />
              <span style={{ color: "rgba(255,255,255,0.35)" }}>доверить событие</span>
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {strengths.map((item, i) => (
                <div
                  key={i}
                  className="animate-on-scroll"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "24px",
                    transitionDelay: `${i * 0.12}s`,
                  }}
                >
                  <span className="font-cormorant font-light" style={{ color: "rgba(201,168,76,0.35)", fontSize: "18px", flexShrink: 0, width: "24px" }}>
                    0{i + 1}
                  </span>
                  <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(255,255,255,0.07)" }} />
                  <p className="font-montserrat font-light" style={{ fontSize: "13px", color: "rgba(255,255,255,0.65)", textAlign: "right", maxWidth: "260px" }}>
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="animate-on-scroll-left">
            <div style={{ position: "relative", overflow: "hidden" }}>
              <img
                src={WEDDING_IMG}
                alt="Свадьба"
                style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover" }}
              />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,10,10,0.7) 0%, transparent 60%)" }} />
              <div style={{ position: "absolute", bottom: "32px", left: "32px", right: "32px" }}>
                <p className="font-cormorant italic" style={{ fontSize: "22px", color: "rgba(255,255,255,0.9)", lineHeight: "1.4" }}>
                  «Создаю атмосферу,<br />в которую хочется вернуться»
                </p>
                <div style={{ marginTop: "12px", width: "48px", height: "1px", backgroundColor: "rgba(201,168,76,0.6)" }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SHOWREEL */}
      <section id="showreel" style={{ padding: "120px 64px", backgroundColor: "#0d0d0d" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div className="text-center animate-on-scroll" style={{ marginBottom: "64px" }}>
            <p className="font-montserrat" style={{ fontSize: "10px", letterSpacing: "0.4em", textTransform: "uppercase", color: "#c9a84c", marginBottom: "24px" }}>
              Шоу-рилс
            </p>
            <h2 className="font-cormorant font-light" style={{ fontSize: "clamp(40px, 5vw, 64px)", lineHeight: "1.1", marginBottom: "24px" }}>
              Посмотрите, как<br />
              <em className="gold-text not-italic">проходят события</em>
            </h2>
            <p className="font-montserrat font-light" style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", maxWidth: "300px", margin: "0 auto" }}>
              Каждое мероприятие — это отдельная история.<br />
              Лучше один раз увидеть.
            </p>
          </div>

          <div className="animate-on-scroll" style={{ cursor: "pointer" }}>
            <div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "16/9",
                backgroundImage: `url(${HERO_IMG})`,
                backgroundSize: "cover",
                backgroundPosition: "center top",
                overflow: "hidden",
              }}
              className="group"
            >
              <div
                className="group-hover:opacity-40"
                style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.52)", transition: "opacity 0.4s ease" }}
              />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div
                  className="group-hover:scale-110"
                  style={{
                    width: "88px",
                    height: "88px",
                    borderRadius: "50%",
                    border: "1px solid rgba(201,168,76,0.55)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(201,168,76,0.1)",
                    transition: "transform 0.4s ease",
                  }}
                >
                  <Icon name="Play" size={26} style={{ color: "#c9a84c", marginLeft: "4px" }} />
                </div>
              </div>
              <div style={{ position: "absolute", bottom: "24px", left: "24px", display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#c9a84c" }} className="animate-pulse" />
                <span className="font-montserrat" style={{ fontSize: "10px", letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>
                  Шоу-рилс 2024
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section id="reviews" style={{ padding: "120px 64px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div className="text-center animate-on-scroll" style={{ marginBottom: "80px" }}>
            <p className="font-montserrat" style={{ fontSize: "10px", letterSpacing: "0.4em", textTransform: "uppercase", color: "#c9a84c", marginBottom: "24px" }}>
              Отзывы
            </p>
            <h2 className="font-cormorant font-light" style={{ fontSize: "clamp(40px, 5vw, 64px)", lineHeight: "1.1" }}>
              Что говорят<br />
              <em className="gold-text not-italic">гости</em>
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px", background: "rgba(255,255,255,0.05)" }}>
            {reviews.map((r, i) => (
              <div
                key={i}
                className="card-hover animate-on-scroll"
                style={{
                  backgroundColor: "#0a0a0a",
                  padding: "48px",
                  border: "1px solid rgba(255,255,255,0.05)",
                  transitionDelay: `${i * 0.15}s`,
                }}
              >
                <div className="quote-mark" style={{ marginBottom: "16px" }}>"</div>
                <p className="font-cormorant italic" style={{ fontSize: "20px", color: "rgba(255,255,255,0.75)", lineHeight: "1.6", marginBottom: "32px" }}>
                  {r.text}
                </p>
                <div style={{ paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                  <p className="font-montserrat" style={{ fontSize: "13px", fontWeight: 500, color: "rgba(255,255,255,0.85)" }}>{r.author}</p>
                  <p className="font-montserrat" style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(201,168,76,0.55)", marginTop: "4px" }}>
                    {r.event}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" style={{ padding: "120px 64px", backgroundColor: "#0d0d0d" }}>
        <div className="text-center animate-on-scroll" style={{ maxWidth: "700px", margin: "0 auto" }}>
          <p className="font-montserrat" style={{ fontSize: "10px", letterSpacing: "0.4em", textTransform: "uppercase", color: "#c9a84c", marginBottom: "32px" }}>
            Контакты
          </p>
          <h2 className="font-cormorant font-light" style={{ fontSize: "clamp(40px, 6vw, 86px)", lineHeight: "1", marginBottom: "32px" }}>
            Давайте создадим<br />
            <em className="gold-text not-italic">событие вместе.</em>
          </h2>
          <p className="font-montserrat font-light" style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", marginBottom: "56px", maxWidth: "260px", margin: "0 auto 56px" }}>
            Напишите мне, чтобы обсудить ваше мероприятие.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "16px", marginBottom: "64px" }}>
            <a href="https://t.me/nikastarva" className="btn-gold" style={{ minWidth: "180px", justifyContent: "center" }}>
              <Icon name="Send" size={14} />
              Telegram
            </a>
            <a href="https://wa.me/79000000000" className="btn-outline-gold" style={{ minWidth: "180px", justifyContent: "center" }}>
              <Icon name="MessageCircle" size={14} />
              WhatsApp
            </a>
            <a href="https://instagram.com/nikastarva" className="btn-outline-gold" style={{ minWidth: "180px", justifyContent: "center" }}>
              <Icon name="Instagram" size={14} />
              Instagram
            </a>
          </div>

          <div style={{ width: "100%", height: "1px", background: "linear-gradient(to right, transparent, rgba(201,168,76,0.3), transparent)" }} />
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: "40px 64px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <span className="font-cormorant font-light" style={{ fontSize: "16px", letterSpacing: "0.25em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>
          Ника Старва
        </span>
        <p className="font-montserrat" style={{ fontSize: "10px", letterSpacing: "0.3em", color: "rgba(255,255,255,0.18)", textTransform: "uppercase" }}>
          © 2024 · Ведущая мероприятий
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <a href="https://t.me/nikastarva" style={{ color: "rgba(255,255,255,0.25)", transition: "color 0.3s ease" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#c9a84c")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}>
            <Icon name="Send" size={16} />
          </a>
          <a href="https://instagram.com/nikastarva" style={{ color: "rgba(255,255,255,0.25)", transition: "color 0.3s ease" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#c9a84c")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}>
            <Icon name="Instagram" size={16} />
          </a>
        </div>
      </footer>

    </div>
  );
}