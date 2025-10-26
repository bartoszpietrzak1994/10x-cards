# UI Architecture for 10xCards

## 1. UI Structure Overview
The 10xCards UI is structured to offer an intuitive, minimal, and responsive experience that accommodates both manual and AI-driven flashcard creation. The interface relies on a dashboard layout with a fixed sidebar navigation that clearly separates core functionalities (manual flashcards, AI-generated flashcards, and account settings). Each view is designed to provide immediate feedback and enforce input validations.

## 2. View List

### a. Authentication Views
- **View Name:** Login / Registration
- **View Path:** `/auth`
- **Main Purpose:** Allow users to register and log in.
- **Key Information:** Email, password, and optional role assignment during registration; clear error messages for failed attempts.
- **Key View Components:** Input forms, validation alerts, submit buttons, and a top alert box displaying success/error messages.
- **UX, Accessibility, and Security Considerations:** Accessible form fields with proper ARIA labels, focus management, secure input handling, and inline validations.

### b. Dashboard - Flashcards Listing
- **View Name:** Flashcards Dashboard
- **View Path:** `/flashcards`
- **Main Purpose:** Provide an overview of the user’s flashcards (both manual and AI-generated).
- **Key Information:** List of flashcards with basic details like title/preview, creation date, and flashcard type.
- **Key View Components:** Card-based layouts, filter/sort options, pagination controls, and side summary panels.
- **UX, Accessibility, and Security Considerations:** Clear separation of flashcard categories, keyboard navigation, high-contrast text, and accessible alerts for empty states or errors.

### c. Flashcard Detail & Editing
- **View Name:** Flashcard Detail / Edit
- **View Path:** `/flashcards/{id}`
- **Main Purpose:** View, edit, or delete a specific flashcard.
- **Key Information:** Full details of the selected flashcard (front and back content), creation metadata, and editing options.
- **Key View Components:** Detailed card view, editable text areas, action buttons (save, delete), and real-time validation alerts.
- **UX, Accessibility, and Security Considerations:** Focus management on form inputs, error handling for invalid edits, and confirmation dialogs for deletion.

### d. AI Flashcards Generation
- **View Name:** AI Flashcards Generation
- **View Path:** `/flashcards/ai-generation`
- **Main Purpose:** Allow users to submit text for flashcard generation by AI and track the processing status.
- **Key Information:** Input text box for long text (with character count), status indicator (e.g., processing spinner, completed state), and log metadata on the generation process.
- **Key View Components:** Large text input form, submit button, loading spinner overlay, status messages, and a results display area for generated flashcards.
- **UX, Accessibility, and Security Considerations:** Input validation (character limits), clear error messaging for invalid input length, accessibility for loading states, and secure handling of submitted data.

### e. Account Settings
- **View Name:** User Account Settings
- **View Path:** `/account`
- **Main Purpose:** Allow users to view and update their personal details and account preferences.
- **Key Information:** Profile picture, username, email, and password change fields; notifications and other personalization options.
- **Key View Components:** Profile card, editable fields, file uploader for profile images, and form validation alerts.
- **UX, Accessibility, and Security Considerations:** Ensure sensitive data is handled securely, proper ARIA labeling for form elements, and keyboard navigable elements.

## 3. User Journey Map
1. **Entry Point:** The user starts with the authentication views (registration or login).
2. **Onboarding:** Upon successful login/registration, the user is directed to the Flashcards Dashboard.
3. **Flashcards Management:** From the dashboard, the user can: 
   - Create a new manual flashcard via a dedicated creation form.
   - Initiate an AI flashcard generation process by submitting text.
   - Click on any flashcard in the dashboard to view details and edit the flashcard.
4. **AI Generation Process:** When using AI generation, the user submits long text, sees a loading spinner, and eventually views the generated flashcards with options to accept, edit, or reject.
5. **Account Management:** At any point, the user can access the Account Settings to update personal details or review security settings.

## 4. Layout and Navigation Structure
- **Sidebar Navigation:** A fixed sidebar on the dashboard includes collapsible sections and distinct icons for:
  - Flashcards (manual and AI-generated categorized separately).
  - AI Generation.
  - Account Settings.
  - Quick access links (e.g., Home, Logout).
- **Top Alert Box:** Consistently located at the top across views for immediate user feedback on actions.
- **Responsive Design:** The layout supports dark/light themes and is fully responsive, ensuring accessibility across devices and screen sizes.

## 5. Key Components
- **Sidebar:** Provides primary navigation with collapsible menus and clear visual indicators.
- **Card Components:** Used for listing flashcards in a clean, minimal style; each card presents key flashcard information.
- **Form Components:** Standardized input fields with inline validations and focus management to support accessibility.
- **Alert & Spinner Components:** For real-time status updates, error messages, and loading indications during asynchronous operations.
- **Modal/Confirmation Dialogs:** For critical actions like deletions or sensitive changes, ensuring the user confirms the action.

