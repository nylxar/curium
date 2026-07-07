import { LifeBuoy, Coffee, CreditCard, ExternalLink } from "lucide-react";

export function SupportPanel() {
  const OPTIONS = [
    {
      icon: Coffee,
      label: "Ko-fi",
      url: "https://ko-fi.com/nylxar",
      color: "#FF5E5B",
    },
    {
      icon: CreditCard,
      label: "PayPal",
      url: "https://www.paypal.com/ncp/payment/DUAR5EJ7A3RV8",
      color: "#003087",
    },
    {
      icon: CreditCard,
      label: "Gumroad",
      url: "https://nylxar.gumroad.com/coffee",
      color: "#FF90E8",
    },
  ];

  return (
    <>
      <div
        className="section"
        style={{ textAlign: "center", marginBottom: 24 }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            background: "var(--primary-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 12px",
          }}
        >
          <LifeBuoy size={24} style={{ color: "var(--primary)" }} />
        </div>
        <div className="section-title" style={{ marginBottom: 4 }}>
          Support Curium
        </div>
        <p
          style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}
        >
          If Curium saved you from another bloat, spyware, data-hungry,
          ad-filled QR tool, then consider supporting its development.
        </p>
      </div>
      <div className="link-list">
        {OPTIONS.map((opt, i) => (
          <a
            key={i}
            className="link-row"
            href={opt.url}
            target="_blank"
            rel="noreferrer"
          >
            <opt.icon size={16} style={{ color: opt.color }} />
            <span>{opt.label}</span>
            <ExternalLink
              size={14}
              style={{ marginLeft: "auto", opacity: 0.4 }}
            />
          </a>
        ))}
      </div>
      <p
        style={{
          fontSize: 11,
          color: "var(--text-faint)",
          textAlign: "center",
          marginTop: 24,
          lineHeight: 1.6,
        }}
      >
        Every contribution helps in introducing new features and customizations.
      </p>
    </>
  );
}
