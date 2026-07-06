import { X as XIcon, Check } from "lucide-react";

export function AboutPanel() {
  const PROBLEMS = [
    "Most QR tools inject tracking parameters into your codes",
    "They log every scan — time, location, device, referrer",
    "They sell this data to advertisers, or worse, leak it",
    "They lock basic features behind paywalls and subscriptions",
    "They require accounts for basic features like saving or customizing",
  ];
  const DIFFERENCES = [
    "Zero network requests — not even a ping",
    "No accounts, no sign-ups, no email collection",
    "No analytics, no telemetry, no crash reporting",
    "Full customization offline — colors, shapes, logos, eyes, etc.",
    "Open source — anyone can audit the code",
  ];

  return (
    <>
      <div className="section">
        <div className="section-title">What is this</div>
        <p
          style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.8 }}
        >
          Curium is a QR code generator, customizer, and scanner. It runs
          entirely on your device. No servers. No accounts. No cloud. Your QR
          codes, your data, your rules.
        </p>
      </div>
      <div className="section">
        <div className="section-title">Why it exists</div>
        <p
          style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.8 }}
        >
          Every QR code generator on the internet does the same thing: they let
          you create a code, then they track you, log your data, or serve you
          ads. Most of them are free because you are the product.
        </p>
        <p
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            lineHeight: 1.8,
            marginTop: 12,
          }}
        >
          Curium exists because a QR code is a simple thing. It does not need a
          server. It does not need your location. It does not need to phone
          home. It is math — and math works offline.
        </p>
      </div>
      <div className="section">
        <div className="section-title">The problem</div>
        <div className="point-list">
          {PROBLEMS.map((p, i) => (
            <div key={i} className="point-row">
              <XIcon size={14} className="point-icon-error" />
              <span className="point-text">{p}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="section">
        <div className="section-title">What Curium does differently</div>
        <div className="point-list">
          {DIFFERENCES.map((d, i) => (
            <div key={i} className="point-row">
              <Check size={14} className="point-icon-success" />
              <span className="point-text">{d}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="section">
        <div className="section-title">
          Against capitalism for simple things
        </div>
        <p
          style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.8 }}
        >
          A QR code is a 35-year-old standard. It is public domain math. The
          idea that companies can charge you for generating a QR code — or
          worse, track you for doing it — is absurd.
        </p>
        <p
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            lineHeight: 1.8,
            marginTop: 12,
          }}
        >
          Curium rejects the idea that every digital tool must be a SaaS
          product. Some things should just work. Some things should be free.
          Some things should respect your privacy by default, not as a premium
          feature.
        </p>
      </div>
      <div className="section">
        <div className="section-title">The future</div>
        <p
          style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.8 }}
        >
          Curium is not just an app. It is a statement. Every feature we ship
          proves that a tool can be powerful, beautiful, and free — without
          compromising your privacy.
        </p>
        <p
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            lineHeight: 1.8,
            marginTop: 12,
          }}
        >
          We are building the definitive QR tool. Not the one that makes the
          most money. The one that makes all others unnecessary.
        </p>
      </div>
    </>
  );
}
