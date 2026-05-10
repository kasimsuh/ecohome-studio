import Image from "next/image";
import Link from "next/link";
import type { ComponentProps } from "react";

import siteIcon from "@/app/public/images/icon.png";
import { cn } from "@/lib/utils";

type SiteBrandProps = {
  href: ComponentProps<typeof Link>["href"];
  subtitle?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  className?: string;
  showSubtitle?: boolean;
};

export function SiteBrand({
  href,
  subtitle = "Sustainable home concept lab",
  titleClassName,
  subtitleClassName,
  className,
  showSubtitle = true
}: SiteBrandProps) {
  return (
    <Link href={href} className={cn("block", className)}>
      <div className="flex items-start gap-3">
        <Image
          src={siteIcon}
          alt=""
          aria-hidden="true"
          width={64}
          height={64}
          className="h-[3em] w-[3em] shrink-0 object-contain"
          priority
        />
        <div className="min-w-0">
          <p
            className={cn(
              "font-tech text-inherit font-semibold uppercase tracking-[0.22em] text-[color:var(--accent)]",
              titleClassName
            )}
          >
            EcoHome Studio
          </p>
          {showSubtitle ? (
            <p className={cn("text-sm text-[color:var(--muted)]", subtitleClassName)}>
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
