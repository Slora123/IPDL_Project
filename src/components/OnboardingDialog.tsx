import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useI18n } from "@/contexts/I18nContext";

interface OnboardingDialogProps {
  open: boolean;
  onClose: () => void;
}

export const OnboardingDialog: React.FC<OnboardingDialogProps> = ({ open, onClose }) => {
  const { setLanguage, setName, setBusinessName, setPhone } = usePreferences();
  const { t } = useI18n();
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  const [inputName, setInputName] = useState<string>("");
  const [inputBusiness, setInputBusiness] = useState<string>("");
  const [inputPhone, setInputPhone] = useState<string>("");

  const canContinue = useMemo(() => Boolean(selectedLanguage && inputName && inputBusiness && inputPhone), [selectedLanguage, inputName, inputBusiness, inputPhone]);

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    setLanguage(lang);
  };

  const handleContinue = () => {
    if (!canContinue) return;
    setLanguage(selectedLanguage);
    setName(inputName);
    setBusinessName(inputBusiness);
    setPhone(inputPhone);
    onClose();
  };

  return (
    <Dialog open={open}>
      <DialogContent 
        className="sm:max-w-md bg-white text-black border-2 border-black/10 shadow-xl"
        hideCloseButton
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-black">{t("app_title", "common", "Trackify")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="onboard-name" className="text-black font-medium">{t("name", "settings", "Name")}</Label>
            <Input id="onboard-name" className="bg-white border-gray-300 text-black" value={inputName} onChange={(e) => setInputName(e.target.value)} placeholder="Your Name" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="onboard-business" className="text-black font-medium">{t("business_name", "settings", "Business Name")}</Label>
            <Input id="onboard-business" className="bg-white border-gray-300 text-black" value={inputBusiness} onChange={(e) => setInputBusiness(e.target.value)} placeholder="Your Business Name" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="onboard-phone" className="text-black font-medium">{t("phone", "settings", "Phone Number")}</Label>
            <Input id="onboard-phone" className="bg-white border-gray-300 text-black" value={inputPhone} onChange={(e) => setInputPhone(e.target.value)} placeholder="Your Phone Number" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="onboard-language" className="text-black font-medium">{t("language", "common", "Language")}</Label>
            <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
              <SelectTrigger id="onboard-language" className="bg-white border-gray-300 text-black">
                <SelectValue placeholder={t("language", "common", "Language")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">हिंदी (Hindi)</SelectItem>
                <SelectItem value="mr">मराठी (Marathi)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="default" onClick={handleContinue} disabled={!canContinue}>
            {t("continue", "common", "Continue")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
