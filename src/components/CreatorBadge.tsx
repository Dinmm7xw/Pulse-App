import React from 'react';

const CREATOR_GIF = 'https://i.gifer.com/DU8.gif';
const CREATOR_USERNAME = 'dplus01';

interface CreatorBadgeProps {
  username?: string;
  size?: number;
  style?: React.CSSProperties;
}

// Returns true if this username is the platform creator
export const isCreator = (username?: string) =>
  username?.toLowerCase() === CREATOR_USERNAME;

// A small animated badge shown next to the creator's name
export const CreatorBadge: React.FC<CreatorBadgeProps> = ({ username, size = 20, style }) => {
  if (!isCreator(username)) return null;
  return (
    <img
      src={CREATOR_GIF}
      alt="Creator"
      title="DPLUS01 — Создатель Pulse"
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        display: 'inline-block',
        verticalAlign: 'middle',
        marginLeft: 4,
        flexShrink: 0,
        ...style,
      }}
    />
  );
};
