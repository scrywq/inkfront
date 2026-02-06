import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionTitleProps {
  label?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionTitle({ 
  label, 
  title, 
  description, 
  align = "center",
  className 
}: SectionTitleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        "space-y-5",
        align === "center" && "text-center",
        className
      )}
    >
      {label && (
        <span className="inline-block px-4 py-1.5 text-xs font-medium tracking-wider uppercase rounded-full bg-white/[0.04] text-muted-foreground border border-white/[0.08]">
          {label}
        </span>
      )}
      <h2 className="heading-section text-balance">
        {title}
      </h2>
      {description && (
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
          {description}
        </p>
      )}
    </motion.div>
  );
}
