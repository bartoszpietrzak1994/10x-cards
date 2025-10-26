# QA Checklist - AI Flashcards Generation

## Pre-Testing Setup
- [ ] Development server running (`npm run dev`)
- [ ] Supabase configured with correct URL and anon key
- [ ] Database migrations applied (flashcards_ai_generation, ai_logs, flashcards tables exist)
- [ ] Backend API endpoints accessible
- [ ] Browser DevTools open for monitoring

## User Story US-002: Initiate AI Generation

### Input Validation
- [ ] Empty input: Submit button disabled, neutral color counter
- [ ] < 1000 chars: Submit disabled, red counter, error message shows needed chars
- [ ] > 10000 chars: Submit disabled, red counter, error message shows excess chars
- [ ] 1000-10000 chars: Submit enabled, green counter, success message
- [ ] Exactly 1000 chars: Submit enabled (boundary test)
- [ ] Exactly 10000 chars: Submit enabled (boundary test)
- [ ] Character counter updates in real-time while typing

### Form Submission
- [ ] Valid text submission shows "Generating..." button text
- [ ] Form becomes disabled during submission
- [ ] StatusBanner appears with "Processing" and spinner
- [ ] Network request: POST /api/flashcards/ai-generation returns 202
- [ ] generation_id captured from response
- [ ] Polling starts automatically after submission
- [ ] No console errors during submission

### Error Handling
- [ ] Network error: Error banner shown, form re-enabled, can retry
- [ ] API error (400): Validation errors displayed from backend
- [ ] API error (500): Generic error message, can retry
- [ ] Error messages user-friendly and actionable

## Polling and Status

### Polling Behavior
- [ ] Polling starts immediately after successful submission
- [ ] Polls every ~2 seconds (check Network tab timing)
- [ ] Queries flashcards_ai_generation table
- [ ] Queries ai_logs table
- [ ] Queries flashcards table
- [ ] Polling continues while status = "processing"
- [ ] Polling stops when status = "completed" or "failed"
- [ ] Polling stops after 45 second timeout
- [ ] No duplicate simultaneous polls

### Status Updates - Completed
- [ ] StatusBanner changes to "Generation Complete" with checkmark
- [ ] AIGenerationMeta component appears
- [ ] Request time displayed and formatted
- [ ] Response time displayed and formatted
- [ ] Duration calculated correctly
- [ ] Token count displayed with formatting
- [ ] Generated flashcards count displayed
- [ ] Model name displayed (if available)
- [ ] Refresh button available

### Status Updates - Failed
- [ ] StatusBanner changes to "Generation Failed" with warning icon
- [ ] Error information displayed in metadata (if available)
- [ ] Polling stopped
- [ ] User can start new generation

### Manual Refresh
- [ ] Refresh button visible after completion/timeout
- [ ] Clicking refresh re-fetches all data
- [ ] Metadata updates if backend changed
- [ ] Proposals list updates if new flashcards added

## User Story US-003: Review, Accept, Edit, Reject

### Proposals Display
- [ ] ProposalsList appears after generation starts
- [ ] Header shows correct count: "Generated Flashcards (N)"
- [ ] Empty state shown when no proposals
- [ ] Each card shows type badge with correct color
- [ ] Each card shows flashcard ID
- [ ] Front content displayed correctly
- [ ] Back content displayed correctly (preserves whitespace)
- [ ] Cards in chronological order (earliest first)

### Accept Action
- [ ] Accept button visible and clickable
- [ ] Clicking accept logs to console (no-op)
- [ ] Card remains in list after accept
- [ ] No network request made

### Edit Mode - Entry
- [ ] Clicking Edit enters edit mode
- [ ] InlineEditor replaces display mode
- [ ] Front input pre-filled with current value
- [ ] Back textarea pre-filled with current value
- [ ] Character counters show current/max
- [ ] Save and Cancel buttons visible
- [ ] Accept/Edit/Delete buttons hidden during edit
- [ ] Visual distinction (background/border) for edit mode

### Edit Mode - Validation
- [ ] Front empty: Error shown, save disabled
- [ ] Front > 200 chars: Error shown, save disabled
- [ ] Back empty: Error shown, save disabled
- [ ] Back > 500 chars: Error shown, save disabled
- [ ] Valid changes: No errors, save enabled
- [ ] Character counters update in real-time
- [ ] Multiple validation errors shown simultaneously

### Edit Mode - Save
- [ ] Save button enabled only when valid
- [ ] Clicking save makes PUT request to /api/flashcards/{id}
- [ ] Request body contains updated front and back
- [ ] Success: Edit mode exits, display shows new content
- [ ] Success: Type badge updates to "AI Edited" (if backend updates)
- [ ] Success: Card stays at same position in list
- [ ] Failure: Error shown inline, edit mode persists, can retry

### Edit Mode - Cancel
- [ ] Clicking Cancel exits edit mode immediately
- [ ] Display mode shows original content (changes discarded)
- [ ] No network request made
- [ ] Action buttons visible again

### Delete Action - Confirmation
- [ ] Clicking Delete shows browser confirmation dialog
- [ ] Confirmation message clear and warns about permanence
- [ ] Cancel in dialog: No action, card remains

### Delete Action - Execution
- [ ] Confirm in dialog: DELETE request to /api/flashcards/{id}
- [ ] Success: Card removed from list immediately
- [ ] Success: Count decreases in header
- [ ] Success: Empty state shown if last card deleted
- [ ] Failure: Alert shown, card remains, can retry

### Multiple Cards
- [ ] Can edit different cards independently
- [ ] Editing one card doesn't affect others
- [ ] Can edit, save, then edit different card
- [ ] Can delete multiple cards in sequence
- [ ] Actions work correctly on first, middle, and last cards

## Edge Cases

### Component Lifecycle
- [ ] Page refresh during polling: State resets gracefully
- [ ] Navigate away during polling: No console errors, polling cleaned up
- [ ] Multiple submissions: Each creates new generation
- [ ] Polling timeout: Message shown, manual refresh works

### Content Edge Cases
- [ ] Special characters in input text: Handled correctly
- [ ] Special characters in proposals: Displayed safely (no XSS)
- [ ] Very long words: Don't break layout
- [ ] Newlines in back field: Preserved and displayed
- [ ] Empty proposals list: Empty state shown

## Accessibility

### Keyboard Navigation
- [ ] Can tab through all interactive elements
- [ ] Focus order logical: form → status → metadata → proposals
- [ ] Focus visible on all focusable elements
- [ ] Can activate buttons with Enter/Space
- [ ] Can edit inputs with keyboard only
- [ ] No keyboard traps

### Screen Reader
- [ ] Form labels announced correctly
- [ ] Character counter changes announced (aria-live)
- [ ] Status changes announced (aria-live="polite")
- [ ] Error messages announced
- [ ] Button purposes clear
- [ ] Card structure semantic (dl/dt/dd)

### ARIA Attributes
- [ ] role="alert" on Alert components
- [ ] aria-live on dynamic content
- [ ] aria-describedby on form inputs
- [ ] aria-hidden on decorative icons
- [ ] aria-label on icon-only buttons

## Performance

### Rendering
- [ ] Initial page load < 2s
- [ ] Form input responsive (no lag while typing)
- [ ] Character counter updates smoothly
- [ ] Status updates without flicker
- [ ] Proposals list renders quickly (10+ cards)
- [ ] Edit mode transitions instant

### Network
- [ ] POST request completes < 1s (database insert)
- [ ] Polling queries efficient (< 500ms each)
- [ ] No redundant network requests
- [ ] Proper caching headers (if applicable)

## Responsive Design

### Mobile (375px)
- [ ] Form usable and readable
- [ ] Textarea adequate size
- [ ] Buttons large enough to tap
- [ ] Cards stack vertically
- [ ] Metadata grid: 1 column
- [ ] No horizontal scroll
- [ ] All actions accessible

### Tablet (768px)
- [ ] Layout adapts appropriately
- [ ] Metadata grid: 2 columns
- [ ] Cards properly sized
- [ ] All features accessible

### Desktop (1280px+)
- [ ] Max-width container (max-w-4xl) centers content
- [ ] Metadata grid: 2 columns
- [ ] Cards comfortable width
- [ ] Proper spacing and padding

## Browser Compatibility

### Chrome/Edge (Chromium)
- [ ] All features work
- [ ] No console errors
- [ ] Styling correct
- [ ] Animations smooth

### Firefox
- [ ] All features work
- [ ] No console errors
- [ ] Styling correct
- [ ] Animations smooth

### Safari (macOS)
- [ ] All features work
- [ ] No console errors
- [ ] Styling correct
- [ ] Animations smooth

## Code Quality

### Console Output
- [ ] No errors in normal operation
- [ ] No warnings about React updates
- [ ] No warnings about missing keys
- [ ] No warnings about deprecated APIs
- [ ] Intentional console.logs only (can be removed for production)

### Linting
- [ ] No ESLint errors
- [ ] No TypeScript errors
- [ ] All imports resolve correctly
- [ ] No unused variables/imports

## Regression Tests (After Changes)

- [ ] Re-run all validation tests
- [ ] Re-run all submission tests
- [ ] Re-run all polling tests
- [ ] Re-run all CRUD tests (accept/edit/delete)
- [ ] Re-run accessibility tests
- [ ] Check for new console errors
- [ ] Verify linting still passes

## Sign-Off

**Tested By:** _______________  
**Date:** _______________  
**Environment:** _______________  
**Result:** ☐ Pass ☐ Fail ☐ Pass with Minor Issues  

**Notes:**
_______________________________________________________________
_______________________________________________________________
_______________________________________________________________

**Issues Found:**
_______________________________________________________________
_______________________________________________________________
_______________________________________________________________

**Recommendation:** ☐ Ready for Deployment ☐ Needs Fixes ☐ Needs Discussion

