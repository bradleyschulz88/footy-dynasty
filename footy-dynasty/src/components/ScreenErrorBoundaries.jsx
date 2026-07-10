// Per-screen error boundaries
export const MatchDayErrorBoundary = ({ children }: { children: ReactNode }) => (
  <ScreenErrorBoundary screenName="MatchDay">{children}</ScreenErrorBoundary>
);

export const BoardErrorBoundary = ({ children }: { children: ReactNode }) => (
  <ScreenErrorBoundary screenName="Board">{children}</ScreenErrorBoundary>
);

export const SettingsErrorBoundary = ({ children }: { children: ReactNode }) => (
  <ScreenErrorBoundary screenName="Settings">{children}</ScreenErrorBoundary>
);
    }
    return this.props.children;
  }
}

// HOC for wrapping screen components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  screenName: string
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ScreenErrorBoundary screenName={screenName}>
        <Component {...props} />
      </ScreenErrorBoundary>
    );
  };
}

// Pre-configured boundaries for common screens
export const HubErrorBoundary = (props: { children: ReactNode }) => (
  <ScreenErrorBoundary screenName="Hub" {...props} />
);

export const SquadErrorBoundary = (props: { children: ReactNode }) => (
  <ScreenErrorBoundary screenName="Squad" {...props} />
);

export const ClubErrorBoundary = (props: { children: ReactNode }) => (
  <ScreenErrorBoundary screenName="Club" {...props} />
);

export const RecruitErrorBoundary = (props: { children: ReactNode }) => (
  <ScreenErrorBoundary screenName="Recruit" {...props} />
);

export const MatchDayErrorBoundary = (props: { children: ReactNode }) => (
  <ScreenErrorBoundary screenName="Match Day" {...props} />
);

export const BoardErrorBoundary = (props: { children: ReactNode }) => (
  <ScreenErrorBoundary screenName="Board" {...props} />
);

export const SettingsErrorBoundary = (props: { children: ReactNode }) => (
  <ScreenErrorBoundary screenName="Settings" {...props} />
);