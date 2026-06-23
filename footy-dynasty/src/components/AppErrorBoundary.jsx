import React from "react";
import { AlertTriangle } from "lucide-react";
import { LEGACY_KEY } from "../lib/save.js";
import { SETUP_SS_KEY, SETUP_SS_KEY_LEGACY } from "../lib/setupConstants.js";

function isChunkLoadError(e) {
  const msg = e?.message || '';
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('Loading chunk') ||
    msg.includes('Loading CSS chunk')
  );
}

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, reloading: false };
  }

  static getDerivedStateFromError(e) {
    // Chunk-load errors mean a stale SW is serving old hashes after a new
    // deployment. A hard reload fetches fresh chunks and clears the cache.
    if (isChunkLoadError(e)) {
      window.location.reload();
      return { error: e, reloading: true };
    }
    return { error: e, reloading: false };
  }

  render() {
    if (this.state.reloading) {
      return (
        <div className="dirA min-h-screen flex items-center justify-center p-8">
          <div className="max-w-lg w-full rounded-2xl p-6 panel text-center">
            <div className="text-3xl mb-3">🔄</div>
            <div className="font-display text-xl text-atext mb-1">Update available</div>
            <div className="text-sm text-atext-dim">Reloading to apply the latest version…</div>
          </div>
        </div>
      );
    }

    if (this.state.error) {
      return (
        <div className="dirA min-h-screen flex items-center justify-center p-8"
          style={{ background: "var(--A-bg)" }}>
          <div className="max-w-lg w-full">
            {/* Icon + heading */}
            <div className="flex flex-col items-center text-center mb-6">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{
                  background: "color-mix(in srgb, var(--A-neg) 12%, var(--A-panel))",
                  border: "1px solid color-mix(in srgb, var(--A-neg) 30%, var(--A-line))",
                  boxShadow: "0 4px 20px color-mix(in srgb, var(--A-neg) 15%, transparent)",
                }}
              >
                <AlertTriangle className="w-8 h-8" style={{ color: "var(--A-neg)" }} />
              </div>
              <h1 className="font-display text-3xl tracking-wide" style={{ color: "var(--A-neg)" }}>
                Something went wrong
              </h1>
              <p className="text-sm mt-2" style={{ color: "var(--A-text-dim)" }}>
                An unexpected error occurred. You can try again or start fresh — your saves are safe.
              </p>
            </div>

            {/* Error detail (collapsible-style) */}
            <div
              className="rounded-xl p-4 mb-6 overflow-auto max-h-40"
              style={{ background: "var(--A-panel-2)", border: "1px solid var(--A-line)" }}
            >
              <div className="text-[10px] font-mono font-bold uppercase tracking-widest mb-2" style={{ color: "var(--A-neg)" }}>
                Error details
              </div>
              <pre className="text-xs font-mono whitespace-pre-wrap break-all" style={{ color: "var(--A-text-dim)" }}>
                {this.state.error?.message}
                {this.state.error?.stack ? `\n\n${this.state.error.stack}` : ""}
              </pre>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => this.setState({ error: null, reloading: false })}
                className="flex-1 py-3 px-5 rounded-xl font-display text-base tracking-widest transition-all"
                style={{
                  background: "linear-gradient(135deg, var(--A-accent), var(--A-accent-2))",
                  color: "var(--fd-on-accent, #fff)",
                  boxShadow: "0 4px 16px color-mix(in srgb, var(--A-accent) 30%, transparent)",
                }}
              >
                Try again
              </button>
              <button
                type="button"
                onClick={() => {
                  sessionStorage.removeItem(SETUP_SS_KEY_LEGACY);
                  sessionStorage.removeItem(SETUP_SS_KEY);
                  localStorage.removeItem(LEGACY_KEY);
                  this.setState({ error: null, reloading: false });
                }}
                className="flex-1 py-3 px-5 rounded-xl font-semibold text-sm transition-all"
                style={{
                  background: "color-mix(in srgb, var(--A-neg) 10%, var(--A-panel))",
                  border: "1px solid color-mix(in srgb, var(--A-neg) 35%, var(--A-line))",
                  color: "var(--A-neg)",
                }}
              >
                Start new game
              </button>
            </div>

            <p className="text-center text-[10px] font-mono uppercase tracking-widest mt-4" style={{ color: "var(--A-text-mute)" }}>
              Footy Dynasty · Error Recovery
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
