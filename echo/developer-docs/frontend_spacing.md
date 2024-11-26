# Page Layout Style Guide

## Stack & Spacing Hierarchy
1. Major Sections (between components/sections):
   - gap="3rem"
   - Typically separated by Dividers

2. Section Header to Content:
   - gap="1.5rem"
   - Used between a Title and its related content

3. Form Inputs/Elements:
   - gap="2rem"
   - Used between individual form fields/inputs

4. Related Elements (tight coupling):
   - gap="xs" (0.5rem)
   - Used for label-description pairs
   - Used for closely related content

## Page Padding
Standard page padding should be:
- Left padding (pl): "2rem"
- Right padding (pr): "2rem"
- Top padding (pt): "4rem"
- Bottom padding (pb): "4rem"

## Implementation Example
```tsx
<Stack gap="3rem" className="relative" px="2rem" pt="4rem" pb="4rem">
  {/* Major Section */}
  <Stack gap="1.5rem">
    <Title order={2}>Section Title</Title>
    <Stack gap="2rem">
      {/* Form inputs or content */}
      <TextInput {...props} />
      <Select {...props} />
      
      {/* Tightly coupled content */}
      <Stack gap="xs">
        <Text>Label</Text>
        <InputDescription>Description</InputDescription>
      </Stack>
    </Stack>
  </Stack>

  <Divider />

  {/* Next Major Section */}
  <Stack gap="1.5rem">
    <Title order={2}>Next Section</Title>
    <Stack gap="2rem">
      {/* Content */}
    </Stack>
  </Stack>
</Stack>
```

## Common Patterns
1. Page Structure:
   ```tsx
   <Stack gap="3rem" px="2rem" pt="4rem" pb="4rem">
     <PageContent />
   </Stack>
   ```

2. Section Structure:
   ```tsx
   <Stack gap="1.5rem">
     <Title order={2}>Section Title</Title>
     <ContentArea />
   </Stack>
   ```

3. Form Structure:
   ```tsx
   <Stack gap="2rem">
     <Input1 />
     <Input2 />
     <Input3 />
   </Stack>
   ```

4. Related Content:
   ```tsx
   <Stack gap="xs">
     <Label />
     <Description />
   </Stack>
   ```

## Notes
- Use Divider components between major sections
- Maintain consistent Title hierarchy (example: order={2} for section titles, order={3} for subsections)
- Keep padding consistent across all main page containers using `px="2rem" pt="4rem" pb="4rem"`
- Use Mantine Stack components to maintain consistent spacing
- Also, importantly check if there is any parent container with padding/margin that could affect the spacing and remove it if needed to maintain consistency
- Add `pb="4rem"` to the outermost Stack component to maintain consistent bottom spacing at the end of page content