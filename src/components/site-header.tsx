import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * MotherDuck-branded top bar. Pulls brand cues from
 * https://motherduck.com/product/app-developers/ — warm accent blue,
 * dark offset-shadow CTA, uppercase mono wordmark — while staying inside
 * the template's shadcn/Tailwind dark theme.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <Link
          href="/"
          aria-label="MotherDuck × Vercel home"
          className="group flex items-center gap-3 font-mono text-sm"
        >
          <Image
            src="/icon.svg"
            alt=""
            width={28}
            height={28}
            priority
            className="shrink-0"
          />
          <span className="flex items-baseline gap-2 tracking-[0.04em]">
            <span className="font-semibold">MOTHERDUCK</span>
            <span className="text-muted-foreground hidden sm:inline">×</span>
            <span className="text-muted-foreground hidden font-semibold sm:inline">
              VERCEL
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <a
            href="https://github.com/motherduckdb/nextjs-motherduck-pg-quickstart"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-mono text-xs uppercase tracking-wider transition-colors"
          >
            Repo
            <ArrowUpRight aria-hidden="true" className="size-3.5" />
          </a>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="font-mono text-xs uppercase tracking-wider"
          >
            <a
              href="https://motherduck.com/docs/integrations/web-development/vercel/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Docs
            </a>
          </Button>
        </nav>
      </div>
    </header>
  );
}
