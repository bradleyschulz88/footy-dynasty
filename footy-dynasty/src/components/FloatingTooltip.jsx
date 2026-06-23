import { useState } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
} from '@floating-ui/react';

export default function FloatingTooltip({ content, children, placement = 'top' }) {
  const [open, setOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement,
    whileElementsMounted: autoUpdate,
    middleware: [offset(6), flip(), shift({ padding: 8 })],
  });

  const hover   = useHover(context,  { move: false });
  const focus   = useFocus(context);
  const dismiss = useDismiss(context);
  const role    = useRole(context,   { role: 'tooltip' });

  const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus, dismiss, role]);

  if (!content) return children;

  return (
    <>
      <span ref={refs.setReference} {...getReferenceProps()} style={{ cursor: 'default' }}>
        {children}
      </span>
      {open && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            {...getFloatingProps()}
            className="rounded-lg px-2.5 py-1.5 text-[11px] leading-snug shadow-xl pointer-events-none"
            style={{
              ...floatingStyles,
              zIndex: 9999,
              maxWidth: 220,
              background: 'var(--A-panel)',
              border: '1px solid var(--A-line)',
              color: 'var(--A-text)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
            }}
          >
            {content}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
