import { useState } from 'react';
import type { PlayerView } from '@/domain';
import { Card } from '@/ui';
import styles from './RoleCard.module.scss';

export interface RoleCardProps {
  role: PlayerView['me']['role'];
}

/** The role is only mounted while held, so it never sits in the DOM for a neighbour to glimpse. */
export function RoleCard({ role }: RoleCardProps) {
  const [revealed, setRevealed] = useState(false);
  const show = () => setRevealed(true);
  const hide = () => setRevealed(false);

  if (!role) {
    return <Card tone="raised">Waiting for the Game Master to give you a role.</Card>;
  }

  return (
    <button
      type="button"
      className={styles.card}
      aria-pressed={revealed}
      onPointerDown={show}
      onPointerUp={hide}
      onPointerLeave={hide}
      onPointerCancel={hide}
      onBlur={hide}
      onKeyDown={(event) => (event.key === ' ' || event.key === 'Enter') && show()}
      onKeyUp={hide}
      onContextMenu={(event) => event.preventDefault()}
    >
      {revealed ? (
        <>
          <span className={styles.name}>{role.name}</span>
          <span className={styles.description}>{role.description}</span>
        </>
      ) : (
        <span className={styles.hint}>Hold to reveal your role</span>
      )}
    </button>
  );
}
