import * as React from "react"

/** Mengikuti media query CSS. Di server selalu false. */
export function useMediaQuery(query: string) {
  return React.useSyncExternalStore(
    (callback) => {
      const mql = window.matchMedia(query)
      mql.addEventListener("change", callback)
      return () => mql.removeEventListener("change", callback)
    },
    () => window.matchMedia(query).matches,
    () => false
  )
}
