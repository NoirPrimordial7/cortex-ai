import { Component, type ReactNode } from "react";

/** Keep navigation and sign-out available if a route chunk cannot load. */
export class RouteBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section className="state" role="alert">
        <h2>This view could not load.</h2>
        <p>Check your connection, then reload the workspace.</p>
        <button
          className="button primary"
          onClick={() => window.location.reload()}
        >
          Reload workspace
        </button>
      </section>
    );
  }
}
