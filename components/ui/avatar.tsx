import * as React from "react"
import Image from "next/image"

import { cn } from "@/lib/utils"

function Avatar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar"
      className={cn(
        "relative flex size-10 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  )
}

type AvatarImageProps = Omit<
  React.ComponentProps<typeof Image>,
  "src" | "alt" | "width" | "height"
> & {
  src?: string
  alt?: string
  size?: number
}

function AvatarImage({
  src,
  alt = "",
  size = 40,
  className,
  ...props
}: AvatarImageProps) {
  if (!src) return null

  return (
    <Image
      data-slot="avatar-image"
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn("aspect-square h-full w-full rounded-full", className)}
      {...props}
    />
  )
}

function AvatarFallback({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-fallback"
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
