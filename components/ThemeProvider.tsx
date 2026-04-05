'use client';

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// 복잡한 내부 경로 대신, React.ComponentProps를 이용해 자동으로 타입을 추론합니다.
export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}