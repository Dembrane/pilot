# Frontend: Adding Translations

We use **Lingui** with **React JS** for handling translations. This document outlines the steps to add and manage translations within our project.

## Using Translations in JSX

To add translations within JSX, use the `<Trans>` component from Lingui. For example:

```jsx
import { Trans } from "@lingui/macro";

function MyComponent() {
  return (
    <div>
      <h1>
        <Trans>Upload in progress</Trans>
      </h1>
      <p>
        <Trans>Please do not close your browser</Trans>
      </p>
    </div>
  );
}
```

## Using Translations in Free Text

For free text translations, use the `t` function. For example:

```jsx
import { t } from "@lingui/macro";

const message = t`Upload in progress`;
const warning = t`Please do not close your browser`;

console.log(message, warning);
```

## Adding Translations

### Step 1: Extract Messages

Run the following command to extract messages from your code:

```bash
pnpm messages:extract
```

This will update all `.po` files in the `frontend/src/locales` directory with any new or modified messages.

### Step 2: Update Empty Translations

After extraction, you may find empty translations in the `.po` files. These appear as:

```po
msgid "Some text"
msgstr ""
```

For the English (en-US) file, the `msgstr` should be the same as the `msgid`. This is the default behavior of Lingui as English is our source language.

```po
msgid "Some text"
msgstr "Some text"
```

For other language files (de-DE, es-ES, fr-FR, nl-NL), you should either:
1. Leave the `msgstr` empty for proper translation later by language experts
2. Or provide appropriate translations in the target language

Note: The first empty `msgstr` in each `.po` file is the header and should remain empty.

### Step 3: Compile Messages

Run the following command to compile the messages:

```bash
pnpm messages:compile
```

### Step 4: Verify Translations

After adding the translations, you can verify them by running your React application and checking the translated messages in the UI.

## Commands Summary

- Extract messages: `pnpm messages:extract`
- Compile messages: `pnpm messages:compile`

By following these steps, you can ensure that your application is properly localized and supports multiple languages.
