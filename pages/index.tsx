import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

function IconChart() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18" />
      <path d="M7 16l4-4 4 4 4-8" />
    </svg>
  );
}

function IconLeaf() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

function IconShieldCheck() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

const STATS = [
  { value: "5", label: "Escolas parceiras no DF" },
  { value: "11 anos", label: "De experiência em cantinas escolares" },
  { value: "100%", label: "Cardápios por nutricionistas especializados" },
  { value: "GDF", label: "Cardápios alinhados às diretrizes oficiais" },
];

const FEATURES = [
  {
    Icon: IconLeaf,
    title: "Cardápio saudável e balanceado",
    desc: "Refeições elaboradas com ingredientes frescos e adequadas para cada faixa etária. A escola oferece nutrição de qualidade, e os pais sabem exatamente o que os filhos estão comendo.",
    iconBg: "bg-brand-green-subtle",
    iconColor: "text-brand-green",
  },
  {
    Icon: IconChart,
    title: "Controle de crédito para os pais",
    desc: "Adicione saldo, acompanhe o histórico de consumo e fique tranquilo sobre o que seu filho compra na cantina. Tudo registrado, sem surpresas no bolso.",
    iconBg: "bg-[var(--color-brand-teal-subtle)]",
    iconColor: "text-brand-teal",
  },
  {
    Icon: IconShieldCheck,
    title: "Gestão transparente para a escola",
    desc: "Diretores têm acesso a relatórios completos, fechamentos de caixa e controle financeiro da cantina em tempo real. Sem retrabalho, sem dúvidas.",
    iconBg: "bg-[var(--color-brand-orange-subtle)]",
    iconColor: "text-brand-orange",
  },
];

const GALLERY_IMAGES = [
  {
    src: "/cantina/bandejas_01.JPG",
    alt: "Aluno se servindo no buffet da cantina",
  },
  { src: "/cantina/bandejas_02.jpg", alt: "Macarrão preparado fresquinho" },
  { src: "/cantina/cozinha_01.JPG", alt: "Equipe de cozinha em ação" },
  { src: "/cantina/uvas_01.jpg", alt: "Lanche saudável com frutas" },
  {
    src: "/cantina/brigadeiro_01.jpg",
    alt: "Brigadeiros para eventos e aniversários",
  },
  {
    src: "/cantina/cozinha_02.JPG",
    alt: "Cozinha profissional da NutriGourmet",
  },
];

const NAV_LINKS = [
  ["Sobre", "#sobre"],
  ["Cardápio", "#cardapio"],
  ["Para escolas", "#escolas"],
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 64);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="min-h-screen bg-bg-page"
      style={{ fontFamily: "var(--font-primary)" }}
    >
      {/* ── Navbar ── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 bg-white border-b transition-shadow duration-200 ${
          scrolled
            ? "shadow-[0_1px_8px_rgba(0,0,0,0.08)] border-transparent"
            : "border-border"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="Nutrigourmet"
              width={140}
              height={79}
              priority
            />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="text-sm font-medium text-fg-2 transition-colors hover:text-brand-green"
              >
                {label}
              </a>
            ))}
          </nav>

          <a
            href="mailto:cantinanutrigourmet@gmail.com"
            className="bg-brand-green hover:bg-brand-green-hover text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            style={{ fontFamily: "var(--font-button)" }}
          >
            Fale conosco
          </a>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              "linear-gradient(135deg, #FFF7E6 0%, #FFF3DC 35%, #FDEFD0 60%, #EDF7EB 100%)",
          }}
        />

        {/* Blobs decorativos */}
        <div
          className="absolute -top-28 -right-24 w-115 h-115 rounded-full opacity-30 z-0 blur-2xl"
          style={{ background: "var(--color-accent-yellow)" }}
        />
        <div
          className="absolute top-1/3 -left-24 w-80 h-80 rounded-full opacity-20 z-0 blur-2xl"
          style={{ background: "var(--color-brand-orange)" }}
        />
        <div
          className="absolute -bottom-24 right-1/4 w-72 h-72 rounded-full opacity-20 z-0 blur-2xl"
          style={{ background: "var(--color-brand-green)" }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center w-full">
          <div>
            <p
              className="text-2xl mb-3"
              style={{
                fontFamily: "var(--font-tagline)",
                color: "var(--color-brand-orange)",
              }}
            >
              Alimentação escolar feita com amor e qualidade
            </p>
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-fg-1 leading-[1.1] mb-6">
              Nutrição que transforma a{" "}
              <span className="text-brand-green">vida escolar</span>
            </h1>
            <p
              className="text-lg text-fg-2 mb-10 leading-relaxed max-w-md"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Empresa familiar que cuida da alimentação escolar no DF com a
              mesma dedicação que temos em casa. Cardápios saudáveis, controle
              de crédito para os pais e gestão transparente para a diretoria —
              tudo com carinho e responsabilidade.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="#escolas"
                className="bg-brand-green hover:bg-brand-green-hover text-white font-semibold px-7 py-3.5 rounded-lg transition-colors text-sm"
                style={{ fontFamily: "var(--font-button)" }}
              >
                Saiba mais
              </a>
            </div>
          </div>

          <div className="relative hidden lg:flex justify-center items-center">
            <div
              className="absolute -inset-5 rounded-[2.5rem] opacity-40 z-0"
              style={{ background: "var(--color-accent-yellow)" }}
            />
            <div
              className="absolute -bottom-6 -left-6 w-28 h-28 rounded-2xl opacity-60 z-0"
              style={{ background: "var(--color-brand-green-subtle)" }}
            />
            <Image
              src="/cantina/refeicao_01.JPG"
              alt="Prato completo e nutritivo da NutriGourmet"
              width={560}
              height={560}
              priority
              className="relative z-10 w-full max-w-lg rounded-[1.75rem] object-cover shadow-[0_24px_64px_rgba(180,120,30,0.25)]"
            />
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p
                  className="text-3xl lg:text-4xl font-bold text-brand-green mb-1"
                  style={{ fontFamily: "var(--font-data)" }}
                >
                  {stat.value}
                </p>
                <p
                  className="text-sm text-fg-3"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="escolas" className="py-20 bg-gray-bg-section">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <p
              className="text-xs font-semibold uppercase tracking-[0.15em] mb-3 text-brand-green"
              style={{ fontFamily: "var(--font-button)" }}
            >
              Por que a Nutrigourmet
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold text-fg-1 mb-4">
              Tudo que sua escola precisa, em um só lugar
            </h2>
            <p
              className="text-fg-2 max-w-xl mx-auto leading-relaxed"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Escolha uma cantina que os pais confiam e a escola pode recomendar
              com orgulho.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map(({ Icon, title, desc, iconBg, iconColor }) => (
              <div
                key={title}
                className="bg-white rounded-xl p-8 border border-border"
              >
                <div
                  className={`${iconBg} ${iconColor} w-11 h-11 rounded-md flex items-center justify-center mb-5`}
                >
                  <Icon />
                </div>
                <h3 className="text-base font-semibold text-fg-1 mb-3">
                  {title}
                </h3>
                <p
                  className="text-sm text-fg-2 leading-relaxed"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Galeria ── */}
      <section id="cardapio" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <p
              className="text-xs font-semibold uppercase tracking-[0.15em] mb-3 text-brand-teal"
              style={{ fontFamily: "var(--font-button)" }}
            >
              Nossa culinária
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold text-fg-1 mb-4">
              Uma cantina que cuida da saúde
            </h2>
            <p
              className="text-fg-2 max-w-xl mx-auto leading-relaxed"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Refeições coloridas, nutritivas e preparadas com ingredientes
              frescos — criadas para desenvolver hábitos saudáveis desde a
              infância.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {GALLERY_IMAGES.map(({ src, alt }) => (
              <div key={src} className="overflow-hidden rounded-xl">
                <Image
                  src={src}
                  alt={alt}
                  width={600}
                  height={400}
                  className="w-full h-52 object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quote ── */}
      <section id="sobre" className="py-20 bg-brand-green-subtle">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <blockquote className="text-xl lg:text-2xl font-medium text-fg-1 leading-relaxed mb-6">
            &ldquo;Somos uma empresa familiar e a mesma atenção que temos com
            nossos filhos é a que levamos para cada aluno. Preparamos cada
            refeição com dedicação e responsabilidade, garantindo saúde, sabor e
            tranquilidade para os pais e gestores de escolas.&rdquo;
          </blockquote>
          <cite
            className="text-sm text-fg-3 not-italic"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Família Ribeiro — Fundadores da NutriGourmet
          </cite>
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        className="py-24"
        style={{
          background:
            "linear-gradient(135deg, var(--color-brand-green) 0%, var(--color-brand-teal) 100%)",
        }}
      >
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Pronto para transformar a cantina da sua escola?
          </h2>
          <p
            className="text-white/80 text-lg mb-10 max-w-xl mx-auto leading-relaxed"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Fale com nosso time e veja como a Nutrigourmet pode simplificar a
            gestão e melhorar a nutrição dos seus alunos.
          </p>
          <a
            href="mailto:cantinanutrigourmet@gmail.com"
            className="inline-block bg-white text-brand-green font-semibold px-8 py-4 rounded-lg hover:bg-brand-green-subtle transition-colors text-sm"
            style={{ fontFamily: "var(--font-button)" }}
          >
            Entrar em contato
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-fg-1 py-14">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
            <div>
              <div className="mb-4">
                <Image
                  src="/logo.png"
                  alt="Nutrigourmet"
                  width={130}
                  height={74}
                  className="brightness-0 invert"
                />
              </div>
              <p
                className="text-sm text-white/50 leading-relaxed max-w-xs"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Cantina escolar com gestão inteligente e foco em nutrição
                infantil.
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-4">
                Navegação
              </p>
              <ul className="space-y-2.5">
                {NAV_LINKS.map(([label, href]) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="text-sm text-white/50 hover:text-white transition-colors"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-4">
                Contato
              </p>
              <ul
                className="space-y-2.5 text-sm text-white/50"
                style={{ fontFamily: "var(--font-body)" }}
              >
                <li>cantinanutrigourmet@gmail.com</li>
                <li>@cantinanutrigourmet</li>
                <li>Brasília, DF — Brasil</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center">
            <p
              className="text-xs text-white/25"
              style={{ fontFamily: "var(--font-body)" }}
            >
              © {new Date().getFullYear()} Nutrigourmet. Todos os direitos
              reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
