// Simple static privacy policy screen
export default function PrivacyScreen({ onBack }) {
  return (
    <div style={{ background: 'var(--A-bg)', minHeight: '100dvh', color: 'var(--A-text)' }}
      className="flex flex-col">
      <div className="flex items-center gap-3 px-4 py-4 border-b"
        style={{ borderColor: 'var(--A-line)' }}>
        <button onClick={onBack} className="text-sm px-3 py-1.5 rounded-lg"
          style={{ background: 'var(--A-panel)', color: 'var(--A-text-mute)' }}>
          ← Back
        </button>
        <h1 className="text-lg font-bold" style={{ color: 'var(--A-text)' }}>Privacy Policy</h1>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-6 max-w-2xl mx-auto w-full space-y-6 text-sm leading-relaxed"
        style={{ color: 'var(--A-text-mute)' }}>
        <p className="text-xs" style={{ color: 'var(--A-text-dim)' }}>Last updated: June 2026</p>

        <section>
          <h2 className="font-semibold mb-2" style={{ color: 'var(--A-text)' }}>What data we collect</h2>
          <p>Footy Dynasty stores your game saves locally on your device using browser localStorage. No personal information is collected or transmitted to our servers.</p>
          <p className="mt-2">We use <strong>Plausible Analytics</strong> — a privacy-friendly, cookie-free analytics tool — to understand how many people visit the site and which pages are popular. Plausible does not track individual users, does not use cookies, and is fully GDPR compliant. No personal data is collected.</p>
        </section>

        <section>
          <h2 className="font-semibold mb-2" style={{ color: 'var(--A-text)' }}>Your game data</h2>
          <p>All game saves are stored in your browser's localStorage under the key prefix <code className="text-xs px-1 py-0.5 rounded" style={{ background: 'var(--A-panel)' }}>footy-dynasty-</code>. This data never leaves your device. You can export, import, and delete your saves at any time from the Settings screen.</p>
        </section>

        <section>
          <h2 className="font-semibold mb-2" style={{ color: 'var(--A-text)' }}>Cookies</h2>
          <p>This site does not use cookies. Plausible Analytics is cookieless by design.</p>
        </section>

        <section>
          <h2 className="font-semibold mb-2" style={{ color: 'var(--A-text)' }}>Third-party services</h2>
          <p>We use Google Fonts for typography. Fonts are loaded from fonts.googleapis.com, which may collect anonymous usage data per Google's privacy policy.</p>
          <p className="mt-2">We use Plausible Analytics (plausible.io). See their <span style={{ color: 'var(--A-accent)' }}>privacy policy</span> for details.</p>
        </section>

        <section>
          <h2 className="font-semibold mb-2" style={{ color: 'var(--A-text)' }}>Contact</h2>
          <p>For privacy questions, contact: <span style={{ color: 'var(--A-accent)' }}>[YOUR EMAIL]</span></p>
        </section>

        <p className="text-xs pt-4 border-t" style={{ borderColor: 'var(--A-line)', color: 'var(--A-text-dim)' }}>
          This is a free, hobby project. No warranty is provided. Game saves are your responsibility to back up via the export feature.
        </p>
      </div>
    </div>
  );
}
