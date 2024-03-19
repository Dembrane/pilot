import { Icons } from "@/icons";
import { ActionIcon, Group, Tooltip } from "@mantine/core";
import { IconDeviceFloppy } from "@tabler/icons-react";
import React, { useEffect, useState } from "react";

type EditableTextBoxProps = {
  initialEditable?: boolean;
  initialValue: string;
  disabled?: boolean;
  onSave: (value: string) => void;
};

const EditableTextBox: React.FC<EditableTextBoxProps> = ({
  initialValue,
  initialEditable,
  disabled,
  onSave,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(initialEditable ?? false);
  const [value, setValue] = useState<string>(initialValue);
  const ref = React.useRef<HTMLInputElement>(null);

  const toggleEdit = () => setIsEditing(!isEditing);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setValue(e.target.value);

  const handleSave = () => {
    setValue(value.trim());
    onSave(value.trim());
    toggleEdit();
  };

  useEffect(() => {
    if (isEditing) {
      ref.current?.focus();
    }
  }, [isEditing]);

  return (
    <Group>
      {isEditing && !disabled ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <input
            ref={ref}
            className="px-2 focus:ring-primary-400 focus:border-primary-400"
            type="text"
            value={value}
            onChange={handleChange}
            onBlur={handleSave}
            aria-label="Editable text box"
            autoFocus
          />
        </form>
      ) : (
        <span aria-label="Text value">{value}</span>
      )}
      <Tooltip label={isEditing ? "Save changes" : "Edit text"}>
        <ActionIcon
          onClick={isEditing ? handleSave : toggleEdit}
          aria-label={isEditing ? "Save changes" : "Edit text"}
          variant="transparent"
        >
          {isEditing ? <IconDeviceFloppy color="#000" /> : <Icons.Pencil />}
        </ActionIcon>
      </Tooltip>
    </Group>
  );
};

export default EditableTextBox;
