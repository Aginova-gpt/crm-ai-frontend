// src/components/StatusCard/StatusCard.tsx
'use client';

import React from 'react';
import styles from './StatusCard.module.css';

type StatusCardProps = {
  title: string;
  value: number | string;
  total?: number | string;
  icon?: React.ReactNode;        // pass <svg/> or any React node
  href?: string;                 // optional: make the card clickable
  gradient?: [string, string];   // optional: override gradient [from, to]
  className?: string;            // optional: extra classes
  selected?: boolean;            // optional: selected state
};

export default function StatusCard({
  title,
  value,
  total,
  icon,
  href,
  gradient = ['#7FC6FF', '#4EA7FF'],
  className = '',
  selected = false,
}: StatusCardProps) {
  const Card = (
    <div
    className={`${styles.card} ${className} ${selected ? styles.selected : ''}`}
      style={{
        backgroundImage: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
      }}
      role="group"
      aria-label={title}
    >
      <div className={styles.iconWrap} aria-hidden>
        {icon ?? <span className={styles.defaultIcon}>📦</span>}
      </div>
      <div className={styles.title}>{title}</div>
      <div className={styles.metric}>
        {value}
        {total !== undefined ? <span className={styles.total}>/{total}</span> : null}
      </div>
    </div>
  );

  return href ? (
    <a href={href} className={styles.linkWrapper} aria-label={title}>
      {Card}
    </a>
  ) : (
    Card
  );
}
