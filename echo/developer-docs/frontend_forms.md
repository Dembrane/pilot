# Frontend Forms Style Guide and Documentation

## Overview
This guide outlines our standard patterns for building forms in React using React Hook Form, Mantine UI components, and our custom form elements.

## Core Technologies
- React Hook Form for form state management
- Mantine UI for base components
- Custom FormLabel component for dirty state indication
- useAutoSave hook for automatic form saving

## Basic Form Structure

### Form Setup
```typescript
const {
  control,
  handleSubmit,
  watch,
  formState: { dirtyFields },
  reset,
} = useForm<FormValues>({
  defaultValues: {
    field1: initialValue1,
    field2: initialValue2,
  },
  mode: "onBlur"
});
```

### Basic Form Layout
```tsx
<form onSubmit={handleSubmit(onSubmit)}>
  <Stack gap="3rem">
    <Stack gap="1.5rem">
      <Title order={3}>Section Title</Title>
      <Stack gap="2rem">
        {/* Form fields go here */}
      </Stack>
    </Stack>
  </Stack>
</form>
```

## Form Components

### Text Input
```tsx
<Controller
  name="fieldName"
  control={control}
  render={({ field }) => (
    <TextInput
      label={<FormLabel label={t`Label`} isDirty={dirtyFields.fieldName} />}
      description={t`Help text for the field`}
      {...field}
    />
  )}
/>
```

### Select Input
```tsx
<Controller
  name="language"
  control={control}
  render={({ field }) => (
    <NativeSelect
      label={<FormLabel label={t`Label`} isDirty={dirtyFields.language} />}
      description={t`Help text`}
      data={[
        { label: t`Option 1`, value: "opt1" },
        { label: t`Option 2`, value: "opt2" },
      ]}
      {...field}
    />
  )}
/>
```

### Checkbox
```tsx
<Controller
  name="checkboxField"
  control={control}
  render={({ field }) => (
    <Checkbox
      label={<FormLabel label={t`Label`} isDirty={dirtyFields.checkboxField} />}
      description={t`Help text`}
      checked={field.value}
      onChange={(e) => field.onChange(e.currentTarget.checked)}
    />
  )}
/>
```

## Auto-Save Implementation

### Setup Auto-Save
```tsx
const { dispatchAutoSave, triggerManualSave, isPendingSave, isSaving, isError } = useAutoSave({
  onSave: async (values: FormValues) => {
    // Save implementation
  },
});

// Watch for changes
useEffect(() => {
  const subscription = watch((values, { type }) => {
    if (type === "change" && values) {
      dispatchAutoSave(values as FormValues);
    }
  });

  return () => subscription.unsubscribe();
}, [watch, dispatchAutoSave]);
```

### Save Status Display
```tsx
<SaveStatus
  savedAt={lastSavedAt}
  isPendingSave={isPendingSave}
  isSaving={isSaving}
  isError={isError}
/>
```

## Form Sections and Organization

### Section Structure
```tsx
<Stack gap="1.5rem">
  <Title order={3}>Section Title</Title>
  <Stack gap="2rem">
    {/* Related form fields */}
  </Stack>
</Stack>

<Divider />  {/* Use dividers between sections */}
```

## Best Practices

1. **Field Organization**
   - Group related fields together in sections
   - Use consistent spacing (gap="2rem" between fields, gap="1.5rem" for section headers)
   - Add dividers between major sections

2. **Labels and Help Text**
   - Always use FormLabel component to show dirty state
   - Provide clear, concise labels
   - Add helpful description text when needed

3. **Validation**
   - Set form mode to "onBlur" for validation
   - Use React Hook Form's built-in validation when possible

4. **Internationalization**
   - Wrap all user-facing strings in t`` or <Trans> tags
   - Include translations for all form content

5. **Auto-Save**
   - Implement auto-save for better user experience
   - Show save status clearly to users
   - Provide manual save option as backup

## Advanced Patterns

### Custom Input Components
Create reusable custom input components for complex inputs:

```tsx
const CustomInput = ({
  value,
  onChange,
  isDirty
}: {
  value: string;
  onChange: (value: string) => void;
  isDirty: boolean;
}) => {
  return (
    <Stack gap="md">
      <TextInput
        className={isDirty ? "border-blue-500" : ""}
        label={<FormLabel label={t`Label`} isDirty={isDirty} />}
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
      />
    </Stack>
  );
};
```

### Rich Text Editors
For rich text content, use the MarkdownWYSIWYG component:

```tsx
<Stack gap="xs">
  <FormLabel
    label={t`Content`}
    isDirty={dirtyFields.content}
  />
  <InputDescription>
    <Trans>Help text</Trans>
  </InputDescription>
  <Controller
    name="content"
    control={control}
    render={({ field }) => (
      <MarkdownWYSIWYG
        markdown={field.value}
        onChange={field.onChange}
      />
    )}
  />
</Stack>
```

## Error Handling

1. **Form-Level Errors**
   - Display at the top of the form
   - Use error boundaries for unexpected errors

2. **Field-Level Errors**
   - Show inline with fields
   - Provide clear error messages
   - Use validation rules from React Hook Form

## Accessibility

1. Always include proper ARIA labels
2. Maintain keyboard navigation
3. Ensure proper contrast for error states
4. Use semantic HTML structure
5. Include proper focus indicators

## Performance Considerations

1. Use React Hook Form for efficient form state management
2. Implement debounced auto-save
3. Lazy load complex components
4. Optimize re-renders using proper memoization

# Additional Form Patterns

## Live Preview Pattern

### Preview Toggle
```tsx
const [showPreview, setShowPreview] = useState(true);

<Button
  variant="subtle"
  onClick={() => setShowPreview(!showPreview)}
  leftSection={showPreview ? <IconEyeOff size={16} /> : <IconEye size={16} />}
>
  <Trans>{showPreview ? "Hide Preview" : "Show Preview"}</Trans>
</Button>
```

### Resizable Preview Panel
```tsx
<Resizable
  size={{ width: previewWidth, height: previewHeight }}
  minWidth={300}
  maxWidth={500}
  minHeight="70vh"
  maxHeight="100vh"
  onResizeStop={(_e, _direction, _ref, d) => {
    setPreviewWidth(previewWidth + d.width);
    setPreviewHeight(previewHeight + d.height);
  }}
  enable={{
    left: true,
    bottom: true,
    right: false,
    bottomLeft: false,
    bottomRight: false,
    top: false,
    topLeft: false,
    topRight: false,
  }}
  handleStyles={{
    left: {
      width: "8px",
      left: "-4px",
      cursor: "col-resize",
    },
    bottom: {
      height: "8px",
      bottom: "-4px",
      cursor: "row-resize",
    },
  }}
  handleClasses={{
    left: "hover:bg-blue-500/20",
    bottom: "hover:bg-blue-500/20",
  }}
>
  {/* Preview content */}
</Resizable>
```

## Complex Input Components

### Tag-like Input (ProperNounInput)
A specialized input component that handles comma-separated values and displays them as removable pills:

```tsx
const ProperNounInput = ({
  value,
  onChange,
  isDirty,
}: {
  value: string;
  onChange: (value: string) => void;
  isDirty: boolean;
}) => {
  const [nouns, setNouns] = useState<string[]>([]);
  const [nounInput, setNounInput] = useState("");

  // Convert comma-separated string to array
  useEffect(() => {
    setNouns(
      value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
    );
  }, [value]);

  // Handle adding new items
  const handleAddNoun = () => {
    if (nounInput.trim()) {
      const newNouns = [
        ...nouns,
        ...nounInput
          .split(",")
          .map((noun) => noun.trim())
          .filter(Boolean),
      ];
      const uniqueNouns = Array.from(new Set(newNouns));
      setNouns(uniqueNouns);
      onChange(uniqueNouns.join(", "));
      setNounInput("");
    }
  };

  return (
    <Stack gap="md">
      <TextInput
        className={isDirty ? "border-blue-500" : ""}
        value={nounInput}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleAddNoun();
          }
        }}
      />
      <Group gap="xs">
        {nouns.map((noun, index) => (
          <Pill
            key={index}
            withRemoveButton
            onRemove={() => handleRemoveNoun(noun)}
          >
            {noun}
          </Pill>
        ))}
      </Group>
    </Stack>
  );
};
```

## Layout Patterns

### Two-Column Layout with Preview
```tsx
<div className="relative flex h-auto flex-col gap-8 lg:flex-row lg:justify-start">
  <div className="max-w-[800px] flex-1">
    {/* Form content */}
  </div>
  
  {showPreview && (
    <div className="relative">
      <div className="sticky top-4 min-h-[60vh]">
        {/* Preview content */}
      </div>
    </div>
  )}
</div>
```

### Section Headers with Save Status
```tsx
<Group justify="space-between">
  <Group>
    <Title order={2}>
      <Trans>Section Title</Trans>
    </Title>
    <SaveStatus
      savedAt={lastSavedAt}
      isPendingSave={isPendingSave}
      isSaving={isSaving}
      isError={isError}
    />
  </Group>
  {/* Additional actions */}
</Group>
```

## Form Section Organization

### Consistent Section Structure
```tsx
<Stack gap="3rem">
  <Stack gap="1.5rem">
    <Title order={3}>
      <Trans>Section Title</Trans>
    </Title>
    <Stack gap="2rem">
      {/* Form fields */}
    </Stack>
  </Stack>
  <Divider />
  {/* Next section */}
</Stack>
```

## Preview Refresh Mechanism
```tsx
const [previewKey, setPreviewKey] = useState(0);

const refreshPreview = () => {
  setPreviewKey((prev) => prev + 1);
};

// Usage in iframe
<iframe
  key={previewKey}
  src={link}
  className="h-full w-full flex-1 bg-white"
  title="Portal Preview"
/>
```

## Best Practices Updates

1. **Preview Patterns**
   - Implement resizable preview panels when needed
   - Provide refresh mechanism for previews
   - Use sticky positioning for preview panels
   - Include preview toggle controls

2. **Complex Inputs**
   - Break down complex inputs into reusable components
   - Handle multiple input methods (Enter key, comma-separation)
   - Implement proper state management for derived values
   - Include visual feedback for dirty state

3. **Layout Considerations**
   - Use responsive layouts (mobile-first approach)
   - Implement proper spacing hierarchy
   - Consider preview panels in layout design
   - Use sticky positioning where appropriate

4. **Component Organization**
   - Group related controls together
   - Maintain consistent spacing patterns
   - Use dividers to separate logical sections
   - Include proper section headers with status indicators
