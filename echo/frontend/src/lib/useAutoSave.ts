import { useState } from "react";

const AUTOSAVE_DEBOUNCE_TIME = 1000;

export const useAutoSave = <T>({
  onSave,
}: {
  onSave: (data: T) => Promise<void>;
}) => {
  console.log("[useAutoSave] Initializing hook");
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [isPendingSave, setIsPendingSave] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isError, setIsError] = useState(false);

  const triggerSave = async (formData: T) => {
    console.log("[useAutoSave] Triggering save:", formData);
    setIsError(false);
    setIsSaving(true);

    try {
      await onSave(formData);
      console.log("[useAutoSave] Save successful");
      setIsPendingSave(false);
    } catch (e) {
      console.error("[useAutoSave] Save failed:", e);
      setIsError(true);
    } finally {
      setIsSaving(false);
    }
  };

  const dispatchAutoSave = (formData: T) => {
    console.log(
      "[useAutoSave] Dispatching autosave, debounce:",
      AUTOSAVE_DEBOUNCE_TIME,
    );
    clearTimeout(autoSaveTimer || undefined);
    setIsPendingSave(true);

    const timer = setTimeout(
      () => triggerSave(formData),
      AUTOSAVE_DEBOUNCE_TIME,
    );
    setAutoSaveTimer(timer);
  };

  const triggerManualSave = async (formData: T) => {
    console.log("[useAutoSave] Manual save triggered");
    clearTimeout(autoSaveTimer || undefined);
    setIsPendingSave(true);
    await triggerSave(formData);
  };

  return {
    dispatchAutoSave,
    triggerManualSave,
    isPendingSave,
    isSaving,
    isError,
  };
};
