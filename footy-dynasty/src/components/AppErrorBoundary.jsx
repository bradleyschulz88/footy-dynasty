import React from "react";
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
        <div className="dirA min-h-screen flex items-center justify-center p-8">
          <div className="max-w-lg w-full rounded-2xl p-6 panel">
            <div className="text-3xl mb-3">💥</div>
            <div className="font-display text-2xl text-aneg mb-2">Something went wrong</div>
            <pre
              className="text-xs text-atext-dim rounded-lg p-3 overflow-auto max-h-48 mb-4"
              style={{ background: "var(--A-panel-2)", border: "1px solid var(--A-line)" }}
            >
              {this.state.error?.message}
              {"\n"}
              {this.state.error?.stack}
            </pre>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => this.setState({ error: null, reloading: false })}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-aaccent"
                style={{ color: "var(--fd-on-accent, #0A0D0C)" }}
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
                className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-[#dc2626] hover:opacity-90"
              >
                Start new game
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
