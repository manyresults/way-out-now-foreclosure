import { Facebook, Instagram, MapPin, Phone } from "lucide-react";

const SITE = "https://wayoutnow.com";
const PHONE_DISPLAY = "215-999-7208";

const quickLinks = [
  { label: "Home", href: `${SITE}/` },
  { label: "About us", href: `${SITE}/about/` },
  { label: "Solutions", href: `${SITE}/solutions/` },
  { label: "Resources", href: `${SITE}/these-foreclosure-resources-should-be-more-well-known/` },
];

const legalLinks = [
  { label: "Privacy Policy", href: `${SITE}/privacy-policy/` },
  { label: "Terms of Use", href: `${SITE}/terms-of-use/` },
  { label: "Accessibility", href: `${SITE}/terms-of-use#accessibility` },
  { label: "Disclaimer", href: `${SITE}/terms-of-use#accessibility` },
];

const linkClass = "text-white/85 transition-colors hover:text-primary focus-visible:text-primary focus-visible:outline-none focus-visible:underline";
const headingClass = "mb-4 text-lg font-semibold text-white";

// Mirrors the footer on wayoutnow.com so the quiz feels like part of the same site.
export function SiteFooter() {
  // "Contact us" has no destination on wayoutnow.com; send people to the booking calendar, else the phone.
  const contactHref = process.env.NEXT_PUBLIC_BOOKING_URL || `tel:${PHONE_DISPLAY}`;

  return (
    <footer className="relative z-10 mt-auto bg-[hsl(0_0%_9%)] text-sm text-white/85">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid gap-10 sm:grid-cols-2 md:gap-12 lg:grid-cols-[1fr_1fr_.75fr_1.5fr]">
          <div className="space-y-3">
            <p className="flex items-center gap-3">
              <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>Serving Pennsylvania</span>
            </p>
            <p className="flex items-center gap-3">
              <Phone className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <a href={`tel:${PHONE_DISPLAY}`} className={linkClass}>{PHONE_DISPLAY}</a>
            </p>
            <div className="flex gap-3 pt-2">
              <a
                href="https://www.facebook.com/wayoutnowsolutions"
                aria-label="Facebook"
                className="rounded-full bg-white p-2 text-[hsl(0_0%_9%)] transition-colors hover:bg-primary hover:text-white"
              >
                <Facebook className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="https://www.instagram.com/wayoutnowsolutions"
                aria-label="Instagram"
                className="rounded-full bg-white p-2 text-[hsl(0_0%_9%)] transition-colors hover:bg-primary hover:text-white"
              >
                <Instagram className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          <nav aria-label="Quick links">
            <h2 className={headingClass}>Quick links</h2>
            <ul className="space-y-2.5">
              {quickLinks.map((l) => (
                <li key={l.label}><a href={l.href} className={linkClass}>{l.label}</a></li>
              ))}
              <li><a href={contactHref} className={linkClass}>Contact us</a></li>
            </ul>
          </nav>

          <nav aria-label="Legal">
            <h2 className={headingClass}>Legal</h2>
            <ul className="space-y-2.5">
              {legalLinks.map((l) => (
                <li key={l.label}><a href={l.href} className={linkClass}>{l.label}</a></li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className={headingClass}>About</h2>
            <p className="mb-4 leading-relaxed">
              <a href={`${SITE}/about/`} className={linkClass}>
                Way Out Now provides real estate guidance, property evaluation, and connection to professional resources to help property owners explore available options. We may connect you with licensed agents, investors, contractors, or other professionals.
              </a>
            </p>
            <p className="text-white/70">&copy; 2026 Way Out Now Solutions - Wisps of Night Properties LLC</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
