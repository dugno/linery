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
    document.body.className = className;
    document.body.id = id || "";

    return () => {
      document.body.className = previous;
      document.body.id = previousId;
    };
  }, [className, id]);

  return null;
}
