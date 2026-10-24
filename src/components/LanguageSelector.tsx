import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { usePreferences } from "@/contexts/PreferencesContext";

export function LanguageSelector({ className = "" }: { className?: string }) {
  const { language, setLanguage } = usePreferences();
  const currentLang = language || "en";

  const languages = [
    { code: "en", label: "English", native: "English" },
    { code: "hi", label: "Hindi", native: "हिन्दी" },
    { code: "mr", label: "Marathi", native: "मराठी" },
  ];

  const current = languages.find((l) => l.code === currentLang) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-9 gap-1.5 px-2.5 text-xs font-medium border border-border/40 hover:bg-muted/80 ${className}`}
          title="Change Language / भाषा बदलें"
        >
          <Globe className="h-4 w-4 text-primary shrink-0" />
          <span className="hidden sm:inline font-semibold">{current.native}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`flex items-center justify-between text-xs cursor-pointer py-1.5 ${
              currentLang === lang.code ? "font-bold text-primary bg-primary/10" : ""
            }`}
          >
            <span>{lang.native}</span>
            <span className="text-[10px] text-muted-foreground ml-1">({lang.label})</span>
            {currentLang === lang.code && <span className="text-primary font-bold">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
