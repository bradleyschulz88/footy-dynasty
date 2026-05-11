import React from "react";
import { LEGACY_KEY } from "../lib/save.js";
import { SETUP_SS_KEY, SETUP_SS_KEY_LEGACY } from "../lib/setupConstants.js";

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(e) {
    return { error: e };
  }

  render() {
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
                onClick={() => this.setState({ error: null })}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-aaccent text-white"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={() => {
                  sessionStorage.removeItem(SETUP_SS_KEY_LEGACY);
                  sessionStorage.removeItem(SETUP_SS_KEY);
                  localStorage.removeItem(LEGACY_KEY);
                  this.setState({ error: null });
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
