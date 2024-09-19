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
yarn messages:extract
```

This will update the `locales/nl.po` file with any new or modified messages.

### Step 2: Add Dutch Translations

Open the `locales/nl.po` file and add the Dutch translations for the extracted messages. For example:

```po
msgid "Upload in progress"
msgstr "Upload bezig"

msgid "Please do not close your browser"
msgstr "Sluit uw browser alstublieft niet"
```

### Step 3: Compile Messages

Run the following command to compile the messages and add the Dutch version to `locales/nl.ts`:

```bash
yarn messages:compile
```

### Step 4: Verify Translations

After adding the translations, you can verify them by running your React application and checking the translated messages in the UI.

## Commands Summary

- Extract messages: `yarn messages:extract`
- Compile messages: `yarn messages:compile`

By following these steps, you can ensure that your application is properly localized and supports multiple languages.
