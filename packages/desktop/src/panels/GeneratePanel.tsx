import type { QRType } from "@curium/shared";
import type { FormState } from "../types";
import { QR_TYPES } from "../types";
import { URLPresets } from "../components/URLPresets";

export function GeneratePanel({
  activeType,
  setActiveType,
  forms,
  updateForm,
}: {
  activeType: QRType;
  setActiveType: (t: QRType) => void;
  forms: FormState;
  updateForm: <K extends keyof FormState>(
    type: K,
    partial: Partial<FormState[K]>,
  ) => void;
}) {
  return (
    <>
      <div className="section">
        <div className="section-title">QR Type</div>
        <div className="btn-row">
          {QR_TYPES.map((t) => (
            <button
              key={t.id}
              className={`btn ${activeType === t.id ? "btn-primary" : ""}`}
              onClick={() => setActiveType(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-title">Data</div>
        {activeType === "url" && (
          <>
            <URLPresets onSelect={(prefix) => updateForm("url", { url: prefix })} />
            <input
              className="input"
              placeholder="https://example.com"
              value={forms.url.url}
              onChange={(e) => updateForm("url", { url: e.target.value })}
            />
          </>
        )}
        {activeType === "text" && (
          <textarea
            className="input"
            placeholder="Enter any text..."
            value={forms.text.text}
            onChange={(e) => updateForm("text", { text: e.target.value })}
            rows={4}
          />
        )}
        {activeType === "email" && (
          <div className="input-group">
            <input
              className="input"
              placeholder="To"
              value={forms.email.to}
              onChange={(e) => updateForm("email", { to: e.target.value })}
            />
            <input
              className="input"
              placeholder="Subject"
              value={forms.email.subject}
              onChange={(e) => updateForm("email", { subject: e.target.value })}
            />
            <textarea
              className="input"
              placeholder="Body"
              value={forms.email.body}
              onChange={(e) => updateForm("email", { body: e.target.value })}
              rows={2}
            />
          </div>
        )}
        {activeType === "phone" && (
          <input
            className="input"
            placeholder="+1 234 567 890"
            value={forms.phone.phone}
            onChange={(e) => updateForm("phone", { phone: e.target.value })}
          />
        )}
        {activeType === "sms" && (
          <div className="input-group">
            <input
              className="input"
              placeholder="Phone"
              value={forms.sms.phone}
              onChange={(e) => updateForm("sms", { phone: e.target.value })}
            />
            <input
              className="input"
              placeholder="Message (optional)"
              value={forms.sms.message}
              onChange={(e) => updateForm("sms", { message: e.target.value })}
            />
          </div>
        )}
        {activeType === "wifi" && (
          <div className="input-group">
            <input
              className="input"
              placeholder="SSID"
              value={forms.wifi.ssid}
              onChange={(e) => updateForm("wifi", { ssid: e.target.value })}
            />
            <input
              className="input"
              placeholder="Password"
              value={forms.wifi.password}
              onChange={(e) => updateForm("wifi", { password: e.target.value })}
            />
            <div className="btn-row">
              {(["WPA", "WEP", "nopass"] as const).map((enc) => (
                <button
                  key={enc}
                  className={`btn ${forms.wifi.encryption === enc ? "btn-primary" : ""}`}
                  onClick={() => updateForm("wifi", { encryption: enc })}
                >
                  {enc === "nopass" ? "None" : enc}
                </button>
              ))}
            </div>
          </div>
        )}
        {activeType === "contact" && (
          <div className="input-group">
            <input
              className="input"
              placeholder="Name"
              value={forms.contact.name}
              onChange={(e) => updateForm("contact", { name: e.target.value })}
            />
            <input
              className="input"
              placeholder="Phone"
              value={forms.contact.phone}
              onChange={(e) => updateForm("contact", { phone: e.target.value })}
            />
            <input
              className="input"
              placeholder="Email"
              value={forms.contact.email}
              onChange={(e) => updateForm("contact", { email: e.target.value })}
            />
            <input
              className="input"
              placeholder="Organization"
              value={forms.contact.org}
              onChange={(e) => updateForm("contact", { org: e.target.value })}
            />
          </div>
        )}
        {activeType === "location" && (
          <div className="input-group">
            <input
              className="input"
              placeholder="Latitude"
              value={forms.location.lat}
              onChange={(e) => updateForm("location", { lat: e.target.value })}
            />
            <input
              className="input"
              placeholder="Longitude"
              value={forms.location.lng}
              onChange={(e) => updateForm("location", { lng: e.target.value })}
            />
            <input
              className="input"
              placeholder="Label (optional)"
              value={forms.location.label}
              onChange={(e) =>
                updateForm("location", { label: e.target.value })
              }
            />
          </div>
        )}
        {activeType === "event" && (
          <div className="input-group">
            <input
              className="input"
              placeholder="Event title"
              value={forms.event.title}
              onChange={(e) => updateForm("event", { title: e.target.value })}
            />
            <input
              className="input"
              placeholder="Location (optional)"
              value={forms.event.location}
              onChange={(e) => updateForm("event", { location: e.target.value })}
            />
            <input
              className="input"
              type="datetime-local"
              placeholder="Start"
              value={forms.event.start}
              onChange={(e) => updateForm("event", { start: e.target.value })}
            />
            <input
              className="input"
              type="datetime-local"
              placeholder="End"
              value={forms.event.end}
              onChange={(e) => updateForm("event", { end: e.target.value })}
            />
            <textarea
              className="input"
              placeholder="Description (optional)"
              value={forms.event.description}
              onChange={(e) => updateForm("event", { description: e.target.value })}
              rows={2}
            />
          </div>
        )}
        {activeType === "otpauth" && (
          <div className="input-group">
            <input
              className="input"
              placeholder="Issuer (e.g. Google)"
              value={forms.otpauth.issuer}
              onChange={(e) => updateForm("otpauth", { issuer: e.target.value })}
            />
            <input
              className="input"
              placeholder="Account (e.g. user@email.com)"
              value={forms.otpauth.account}
              onChange={(e) => updateForm("otpauth", { account: e.target.value })}
            />
            <input
              className="input"
              placeholder="Secret key (base32)"
              value={forms.otpauth.secret}
              onChange={(e) => updateForm("otpauth", { secret: e.target.value })}
            />
            <div className="btn-row">
              {(["SHA1", "SHA256", "SHA512"] as const).map((a) => (
                <button
                  key={a}
                  className={`btn ${forms.otpauth.algorithm === a ? "btn-primary" : ""}`}
                  onClick={() => updateForm("otpauth", { algorithm: a })}
                >
                  {a}
                </button>
              ))}
            </div>
            <div className="btn-row">
              {([6, 8] as const).map((d) => (
                <button
                  key={d}
                  className={`btn ${forms.otpauth.digits === d ? "btn-primary" : ""}`}
                  onClick={() => updateForm("otpauth", { digits: d })}
                >
                  {d} digits
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
