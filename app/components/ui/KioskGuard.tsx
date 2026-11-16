"use client";

import type { ReactNode } from "react";

interface KioskGuardProps {
  children: ReactNode;
}

/**
 * ป้องกันเมนูคลิกขวา/กดนิ้วค้าง และกันการลากรูปเวลาเปิดใช้งานบนจอตู้ทัชสกรีน
 */
export function KioskGuard({ children }: KioskGuardProps) {
  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      className="min-h-dvh w-full flex flex-col"
    >
      {children}
    </div>
  );
}
