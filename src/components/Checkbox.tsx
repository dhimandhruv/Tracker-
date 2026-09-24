"use client";

import type { ReactNode } from "react";

/**
 * One row of a `.checks` list. The markup mirrors the original HTML exactly,
 * because the CSS relies on the `input:checked + span` sibling selector.
 */
export default function Checkbox({
  checked,
  onToggle,
  children,
}: {
  checked: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <li>
      <label>
        <input type="checkbox" checked={checked} onChange={onToggle} />
        <span>{children}</span>
      </label>
    </li>
  );
}
