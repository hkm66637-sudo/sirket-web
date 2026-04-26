import React from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export default function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "resize-none",
        className
      )}
      {...props}
    />
  );
}
