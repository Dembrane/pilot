import React, { useEffect, useState, useRef } from "react";
import { ActionIcon, Tooltip } from "@mantine/core";
import { IconDeviceFloppy, IconPencil } from "@tabler/icons-react";
import { useDebouncedCallback } from "@mantine/hooks";

interface EditableTextBoxProps {
  value: string;
  onChange: (value: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

const EditableTextBox = ({
  value = "",
  onChange,
  disabled = false,
  placeholder = "Enter text",
}: EditableTextBoxProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value ?? "");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const debouncedSave = useDebouncedCallback(() => {
    saveChanges(localValue);
  }, 300);

  const saveChanges = async (newValue: string) => {
    try {
      await onChange(newValue.trim());
      setError(null);
    } catch (err) {
      setError("Failed to save changes. Please try again.");
    }
  };

  const handleChange = (e: React.ChangeEvent) => {
    // @ts-ignore
    const newValue = e.target.value;
    setLocalValue(newValue);
  };

  const handleBlur = () => {
    setIsEditing(false);
    saveChanges(localValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    }
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  return (
    <div
      className="flex items-center justify-start"
      role="group"
      aria-label="Editable text"
    >
      <input
        ref={inputRef}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        className="mr-2 min-w-[100px] px-2 focus:border-primary-400 focus:ring-primary-400"
        aria-label="Editable text input"
      />
      <Tooltip label={isEditing ? "Save changes" : "Edit text"}>
        <ActionIcon
          onClick={() => setIsEditing(!isEditing)}
          aria-label={isEditing ? "Save changes" : "Edit text"}
          variant="transparent"
        >
          {isEditing ? (
            <IconDeviceFloppy aria-hidden="true" color="gray" />
          ) : (
            <IconPencil aria-hidden="true" color="gray" />
          )}
        </ActionIcon>
      </Tooltip>
      {error && (
        <p className="mt-1 text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default EditableTextBox;
