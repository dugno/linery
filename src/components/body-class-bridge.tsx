"use client";

import { useEffect } from "react";

type BodyClassBridgeProps = {
  className: string;
  id?: string;
};

export default function BodyClassBridge({ className, id }: BodyClassBridgeProps) {
  useEffect(() => {
    const previous = document.body.className;
    const previousId = document.body.id;
    const storefrontClasses = new Set([...(className || "").split(/\s+/).filter(Boolean), "mirror-page"]);
    document.body.className = [...storefrontClasses].join(" ");
    document.body.id = id || "";

    return () => {
      document.body.className = previous;
      document.body.id = previousId;
    };
  }, [className, id]);

  return null;
}
