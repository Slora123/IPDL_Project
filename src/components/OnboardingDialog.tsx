import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { usePreferences, PersonaType } from "@/contexts/PreferencesContext";
import { useI18n } from "@/contexts/I18nContext";

interface OnboardingDialogProps {
  open: boolean;
  onClose: () => void;
}

export const OnboardingDialog: React.FC<OnboardingDialogProps> = ({ open, onClose }) => {
  const { setLanguage, setPersona } = usePreferences();
  const { t } = useI18n();
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  const [selectedPersona, setSelectedPersona] = useState<PersonaType | "">("");

  const canContinue = useMemo(() => selectedLanguage && selectedPersona, [selectedLanguage, selectedPersona]);

  const handleContinue = () => {
    if (!canContinue) return;
    setLanguage(selectedLanguage);
    setPersona(selectedPersona as PersonaType);
    onClose();
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md bg-white text-black border-2 border-black/10 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-black">{t("app_title")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="language" className="text-black font-medium">{t("language")}</Label>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger id="language" className="bg-white border-gray-300 text-black">
                <SelectValue placeholder={t("language")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">हिंदी</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="persona" className="text-black font-medium">{t("persona")}</Label>
            <Select value={selectedPersona} onValueChange={(v) => setSelectedPersona(v as PersonaType)}>
              <SelectTrigger id="persona" className="bg-white border-gray-300 text-black">
                <SelectValue placeholder={t("persona")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">{t("student")}</SelectItem>
                <SelectItem value="business">{t("business")}</SelectItem>
                <SelectItem value="common">{t("common")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="default" onClick={handleContinue} disabled={!canContinue}>
            {t("continue")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};


