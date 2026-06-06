'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const cycles = ['light', 'dark', 'system'];
  const current = cycles.indexOf(theme || 'system');
  const next = cycles[(current + 1) % cycles.length];

  const icons = {
    light: <Sun className="w-4 h-4" />,
    dark: <Moon className="w-4 h-4" />,
    system: <Monitor className="w-4 h-4" />,
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(next)}
      title={`Switch to ${next} mode`}
    >
      {icons[theme as keyof typeof icons] || <Monitor className="w-4 h-4" />}
    </Button>
  );
}
