import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { usePreferences, PersonaType } from "@/contexts/PreferencesContext";
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
          <DialogTitle className="text-2xl font-bold text-center text-black">{t("app_title")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-black font-medium">Name</Label>
            <Input id="name" className="bg-white border-gray-300 text-black" value={inputName} onChange={(e) => setInputName(e.target.value)} placeholder="Your Name" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="business" className="text-black font-medium">Business Name</Label>
            <Input id="business" className="bg-white border-gray-300 text-black" value={inputBusiness} onChange={(e) => setInputBusiness(e.target.value)} placeholder="Your Business Name" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone" className="text-black font-medium">Phone Number</Label>
            <Input id="phone" className="bg-white border-gray-300 text-black" value={inputPhone} onChange={(e) => setInputPhone(e.target.value)} placeholder="Your Phone Number" />
          </div>
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


