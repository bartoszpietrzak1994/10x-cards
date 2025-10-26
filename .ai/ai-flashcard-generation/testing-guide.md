# AI Flashcards Generation - Testing Guide

## Overview
This document provides comprehensive testing guidance for the AI Flashcards Generation feature, covering manual testing scenarios, expected behaviors, and edge cases.

## Prerequisites
- Development server running (`npm run dev`)
- Backend API endpoints operational
- Supabase connection configured
- Default user ID set in `src/db/supabase.client.ts`

## Test Environment Setup
1. Start development server: `npm run dev`
2. Navigate to: `http://localhost:4321/flashcards/ai-generation`
3. Open browser DevTools to monitor network requests and console logs

---

## User Story US-002: Initiate AI Flashcards Generation

### Test Case 1.1: Input Validation - Too Short
**Steps:**
1. Navigate to AI generation page
2. Paste text with less than 1000 characters (e.g., 500 chars)
3. Observe character counter and submit button state

**Expected Results:**
- Character counter shows: `500 / 10000` in red/destructive color
- Helper text: "You need at least 500 more characters."
- Submit button is disabled
- No error on empty input (counter shows gray)

**Pass Criteria:** ✓ Button disabled, validation message clear

---

### Test Case 1.2: Input Validation - Too Long
**Steps:**
1. Paste text with more than 10000 characters (e.g., 12000 chars)
2. Observe character counter and submit button state

**Expected Results:**
- Character counter shows: `12000 / 10000` in red/destructive color
- Helper text: "Please reduce text by 2000 characters."
- Submit button is disabled

**Pass Criteria:** ✓ Button disabled, validation message clear

---

### Test Case 1.3: Input Validation - Valid Length
**Steps:**
1. Paste text between 1000-10000 characters (e.g., 2500 chars)
2. Observe character counter and submit button state

**Expected Results:**
- Character counter shows: `2500 / 10000` in green color
- Helper text: "Your text is ready for AI flashcard generation."
- Submit button is enabled and shows "Generate Flashcards"

**Pass Criteria:** ✓ Button enabled, positive feedback visible

---

### Test Case 1.4: Successful Submission
**Steps:**
1. Paste valid text (1000-10000 chars)
2. Click "Generate Flashcards" button
3. Observe UI changes

**Expected Results:**
- Button text changes to "Generating..."
- Button becomes disabled
- Form fields become disabled
- StatusBanner appears with:
  - Spinning icon (animated)
  - Title: "Processing"
  - Message: "AI is generating flashcards from your text. This may take a moment..."
- aria-live announcement for screen readers
- Network request: `POST /api/flashcards/ai-generation` with status 202
- Console log: No errors

**Pass Criteria:** ✓ UI feedback immediate, status clear, request successful

---

### Test Case 1.5: Submission Error - Network Failure
**Steps:**
1. Disable network in DevTools (or simulate API failure)
2. Submit valid text
3. Observe error handling

**Expected Results:**
- Error banner appears with descriptive message
- Form remains editable (user can retry)
- Status returns to "idle"
- No generation ID captured

**Pass Criteria:** ✓ Error message clear, retry possible

---

### Test Case 1.6: Submission Error - Validation Failure (Backend)
**Steps:**
1. Submit request that fails backend validation (e.g., by manually modifying request in DevTools)
2. Observe error handling

**Expected Results:**
- Error banner shows validation details from API
- Form remains editable
- User can correct input and retry

**Pass Criteria:** ✓ Backend validation errors surfaced to user

---

## Polling and Status Updates

### Test Case 2.1: Polling Behavior - Normal Flow
**Steps:**
1. Submit valid text successfully
2. Monitor network requests in DevTools
3. Wait for completion (or observe polling for ~30 seconds)

**Expected Results:**
- Polling starts immediately after successful submission
- Supabase queries execute every ~2 seconds:
  - `flashcards_ai_generation` table (metadata)
  - `ai_logs` table (log info)
  - `flashcards` table (proposals)
- Status remains "processing" until `response_time` is populated
- StatusBanner shows processing state with spinner
- No user interaction required during polling

**Pass Criteria:** ✓ Polling automatic, status updates reflect backend changes

---

### Test Case 2.2: Polling - Generation Completes
**Steps:**
1. Submit valid text
2. Wait for AI generation to complete (backend populates `response_time`)
3. Observe UI updates

**Expected Results:**
- StatusBanner changes to:
  - Green checkmark icon
  - Title: "Generation Complete"
  - Message: "Flashcards have been generated successfully! Review and accept them below."
- AIGenerationMeta component appears with:
  - Request Time (formatted)
  - Response Time (formatted)
  - Duration (calculated, e.g., "15.32s")
  - Token Count (formatted with commas)
  - Generated Flashcards Count
  - Model name
- ProposalsList appears with generated flashcards
- Polling stops automatically
- "Refresh" button available in metadata section

**Pass Criteria:** ✓ Status clear, metadata visible, proposals displayed, polling stopped

---

### Test Case 2.3: Polling - Generation Fails
**Steps:**
1. Simulate backend failure (AI service error recorded in `ai_logs.error_info`)
2. Observe status updates

**Expected Results:**
- StatusBanner changes to:
  - Warning icon (red/destructive)
  - Title: "Generation Failed"
  - Message: "Failed to generate flashcards. Please try again or contact support."
- AIGenerationMeta shows error_info in red highlighted section
- Polling stops automatically
- User can start a new generation by submitting new text

**Pass Criteria:** ✓ Error status clear, error details visible

---

### Test Case 2.4: Polling - Timeout (45s)
**Steps:**
1. Submit valid text
2. If backend processing takes > 45 seconds, observe timeout behavior

**Expected Results:**
- Polling stops after 45 seconds
- Status changes to "completed"
- Error message: "Polling timeout. Use refresh to check status manually."
- Manual "Refresh" button remains available
- User can click refresh to check current status

**Pass Criteria:** ✓ Timeout handled gracefully, manual refresh available

---

### Test Case 2.5: Manual Refresh
**Steps:**
1. Wait for generation to complete (or timeout)
2. Click "Refresh" button in AIGenerationMeta component
3. Observe data updates

**Expected Results:**
- Network requests execute immediately (same Supabase queries as polling)
- Metadata updates if backend state changed
- Proposals list updates with any new flashcards
- No visual loading indicator (instant feedback)

**Pass Criteria:** ✓ Refresh works, data updates correctly

---

## User Story US-003: Review, Accept, Edit, and Reject Proposals

### Test Case 3.1: Proposals Display
**Steps:**
1. Complete a generation successfully with proposals
2. Observe ProposalsList component

**Expected Results:**
- Header shows: "Generated Flashcards (N)" where N = count
- Each ProposalCard displays:
  - Type badge (color-coded): "AI Generated", "AI Proposal", etc.
  - Flashcard ID in header
  - Front content with label
  - Back content with label (preserves whitespace/newlines)
  - Three action buttons: Accept, Edit, Delete
- Cards in chronological order (earliest first)

**Pass Criteria:** ✓ All proposals visible, layout clear, actions available

---

### Test Case 3.2: Empty Proposals State
**Steps:**
1. Submit text that results in no proposals (or manually clear proposals if possible)
2. Observe empty state

**Expected Results:**
- Icon displayed (document/file icon)
- Message: "No flashcards yet"
- Subtext: "Submit text above to generate flashcards with AI."

**Pass Criteria:** ✓ Empty state helpful, not confusing

---

### Test Case 3.3: Accept Proposal (No-op)
**Steps:**
1. Click "Accept" button on any proposal
2. Observe behavior

**Expected Results:**
- Console log: "Accepted proposal: {id}"
- Card remains in list (no visual change)
- No network request (no-op in current implementation)
- Other actions still available

**Pass Criteria:** ✓ Accept action acknowledged (may be placeholder for future features)

---

### Test Case 3.4: Edit Proposal - Enter Edit Mode
**Steps:**
1. Click "Edit" button on any proposal
2. Observe UI changes

**Expected Results:**
- ProposalCard enters edit mode
- Display changes to InlineEditor:
  - Front: Text input with current value
  - Back: Textarea (3 rows) with current value
  - Character counters: "X/200" for front, "Y/500" for back
  - Save button (enabled if valid)
  - Cancel button
- Action buttons (Accept, Edit, Delete) hidden during edit
- Border/background indicates edit mode (muted background)

**Pass Criteria:** ✓ Edit mode clear, inputs pre-filled, validation visible

---

### Test Case 3.5: Edit Proposal - Validation (Front)
**Steps:**
1. Enter edit mode
2. Clear front field (0 characters)
3. Observe validation

**Expected Results:**
- Error message: "Front is required"
- Save button disabled
- Character counter still visible

**Steps (continued):**
4. Type > 200 characters in front field
5. Observe validation

**Expected Results:**
- Error message: "Front must not exceed 200 characters"
- Save button disabled
- Character counter shows "201/200" or similar

**Pass Criteria:** ✓ Validation real-time, messages clear, save blocked

---

### Test Case 3.6: Edit Proposal - Validation (Back)
**Steps:**
1. Enter edit mode
2. Clear back field (0 characters)
3. Observe validation

**Expected Results:**
- Error message: "Back is required"
- Save button disabled

**Steps (continued):**
4. Type > 500 characters in back field
5. Observe validation

**Expected Results:**
- Error message: "Back must not exceed 500 characters"
- Save button disabled

**Pass Criteria:** ✓ Validation real-time, messages clear, save blocked

---

### Test Case 3.7: Edit Proposal - Save Valid Changes
**Steps:**
1. Enter edit mode
2. Modify front and/or back (keep within limits)
3. Click "Save" button
4. Observe behavior

**Expected Results:**
- Network request: `PUT /api/flashcards/{id}` with JSON body `{ front, back }`
- Response: 200 OK with updated flashcard
- ProposalCard exits edit mode
- Display mode shows updated content
- Type badge changes to "AI Edited" (if backend updates type)
- Card remains in list at same position

**Pass Criteria:** ✓ Save successful, content updated, edit mode exited

---

### Test Case 3.8: Edit Proposal - Save Failure
**Steps:**
1. Enter edit mode
2. Modify content
3. Simulate API failure (network error or 500 response)
4. Click "Save"
5. Observe error handling

**Expected Results:**
- Error message appears inline: "Failed to save changes"
- Card remains in edit mode
- User can retry or cancel
- Original content preserved in display mode

**Pass Criteria:** ✓ Error handled gracefully, retry possible

---

### Test Case 3.9: Edit Proposal - Cancel Changes
**Steps:**
1. Enter edit mode
2. Modify front and/or back
3. Click "Cancel" button
4. Observe behavior

**Expected Results:**
- ProposalCard exits edit mode immediately
- Display mode shows original content (changes discarded)
- No network request
- Action buttons (Accept, Edit, Delete) visible again

**Pass Criteria:** ✓ Cancel immediate, changes reverted, no save

---

### Test Case 3.10: Delete Proposal - Confirmation
**Steps:**
1. Click "Delete" button on any proposal
2. Observe confirmation dialog

**Expected Results:**
- Browser confirmation dialog appears
- Message: "Are you sure you want to delete this flashcard? This action cannot be undone."
- Options: OK / Cancel

**Pass Criteria:** ✓ Confirmation required, message clear

---

### Test Case 3.11: Delete Proposal - Confirm Deletion
**Steps:**
1. Click "Delete" button
2. Click "OK" in confirmation dialog
3. Observe behavior

**Expected Results:**
- Network request: `DELETE /api/flashcards/{id}`
- Response: 200 OK
- Card removed from list immediately (optimistic update)
- List count decreases: "Generated Flashcards (N-1)"
- If last card deleted, empty state appears

**Pass Criteria:** ✓ Delete successful, card removed, count updated

---

### Test Case 3.12: Delete Proposal - Cancel Deletion
**Steps:**
1. Click "Delete" button
2. Click "Cancel" in confirmation dialog
3. Observe behavior

**Expected Results:**
- No network request
- Card remains in list
- No changes to UI

**Pass Criteria:** ✓ Cancellation respected, no action taken

---

### Test Case 3.13: Delete Proposal - API Failure
**Steps:**
1. Click "Delete" button
2. Confirm deletion
3. Simulate API failure (network error or 500 response)
4. Observe error handling

**Expected Results:**
- Alert dialog: "Failed to delete flashcard. Please try again."
- Card remains in list
- User can retry deletion

**Pass Criteria:** ✓ Error handled, card preserved, retry possible

---

### Test Case 3.14: Multiple Proposals - Independent Actions
**Steps:**
1. Generate flashcards with multiple proposals (e.g., 5)
2. Edit one card (enter edit mode)
3. Observe other cards

**Expected Results:**
- Only selected card in edit mode
- Other cards remain in display mode with actions available
- User can cancel edit and edit different card
- Each card's state independent

**Pass Criteria:** ✓ Cards isolated, no interference between edits

---

## Edge Cases and Error Handling

### Test Case 4.1: Page Refresh During Polling
**Steps:**
1. Submit generation request (status: processing)
2. Refresh browser page (F5 or CMD+R)
3. Observe behavior

**Expected Results:**
- State resets (no persistence implemented)
- Form empty, status: "idle"
- User can submit new generation
- Previous generation still exists in database (backend preserves)

**Pass Criteria:** ✓ No crash, state reset gracefully

---

### Test Case 4.2: Multiple Rapid Submissions
**Steps:**
1. Submit valid text
2. Immediately refresh page
3. Submit different valid text
4. Observe behavior

**Expected Results:**
- Each submission creates new generation record (backend)
- UI only tracks most recent submission
- No conflicts or race conditions
- Previous generations not shown (no listing feature yet)

**Pass Criteria:** ✓ Each submission independent, no errors

---

### Test Case 4.3: Component Unmount During Polling
**Steps:**
1. Submit generation request (status: processing)
2. Navigate away from page (e.g., back button or manual URL change)
3. Check DevTools console for errors

**Expected Results:**
- Polling interval cleared on unmount
- No memory leaks
- No console errors about updating unmounted component

**Pass Criteria:** ✓ Clean unmount, no errors

---

### Test Case 4.4: Very Long Text (Max 10000)
**Steps:**
1. Paste exactly 10000 characters
2. Submit
3. Observe behavior

**Expected Results:**
- Validation passes (10000 = max, inclusive)
- Submission successful
- Generation processes normally

**Pass Criteria:** ✓ Boundary value handled correctly

---

### Test Case 4.5: Very Short Text (Min 1000)
**Steps:**
1. Paste exactly 1000 characters
2. Submit
3. Observe behavior

**Expected Results:**
- Validation passes (1000 = min, inclusive)
- Submission successful
- Generation processes normally

**Pass Criteria:** ✓ Boundary value handled correctly

---

### Test Case 4.6: Special Characters in Content
**Steps:**
1. Paste text with special characters: `<script>`, `"quotes"`, `'apostrophes'`, newlines, tabs
2. Submit and wait for proposals
3. Edit proposal with special characters in front/back
4. Save
5. Observe rendering

**Expected Results:**
- All special characters preserved
- No XSS vulnerabilities (React escapes by default)
- Newlines in back field displayed correctly (whitespace-pre-wrap)
- Quotes/apostrophes handled correctly in inputs

**Pass Criteria:** ✓ Special chars safe, preserved, displayed correctly

---

### Test Case 4.7: Concurrent Edits (User Error)
**Steps:**
1. Enter edit mode on Card A
2. Switch to edit mode on Card B (by canceling A and editing B)
3. Observe behavior

**Expected Results:**
- Only one card in edit mode at a time (by design)
- Canceling A exits edit, editing B enters edit
- No conflicts

**Pass Criteria:** ✓ One edit at a time enforced

---

### Test Case 4.8: Network Reconnection
**Steps:**
1. Submit generation (status: processing)
2. Disable network
3. Wait for polling to fail silently
4. Re-enable network
5. Click "Refresh" button

**Expected Results:**
- Polling continues to fail silently during network outage (no user error)
- Manual refresh after reconnection succeeds
- Data updates correctly

**Pass Criteria:** ✓ Network failures silent, manual recovery works

---

## Accessibility Testing

### Test Case 5.1: Keyboard Navigation
**Steps:**
1. Navigate page using only Tab key
2. Activate buttons using Enter/Space

**Expected Results:**
- All interactive elements focusable: textarea, buttons
- Focus order logical: form → status → metadata → proposals
- Focus visible (ring/outline on focused elements)
- All actions keyboard-accessible

**Pass Criteria:** ✓ Full keyboard navigation

---

### Test Case 5.2: Screen Reader Announcements
**Steps:**
1. Enable screen reader (VoiceOver, NVDA, JAWS)
2. Submit generation
3. Observe announcements

**Expected Results:**
- Form labels read correctly: "Input Text"
- Character counter announced (aria-live)
- Status changes announced: "Processing", "Generation Complete"
- Error messages announced
- Button labels clear: "Generate Flashcards", "Accept", "Edit", "Delete"

**Pass Criteria:** ✓ Status updates announced, labels clear

---

### Test Case 5.3: ARIA Attributes
**Steps:**
1. Inspect DOM in DevTools
2. Verify ARIA attributes

**Expected Results:**
- `role="alert"` on StatusBanner and Alert components
- `aria-live="polite"` on status updates
- `aria-describedby` on textarea (links to counter/helper)
- `aria-describedby` on edit inputs (links to helpers/errors)
- `aria-hidden="true"` on decorative icons
- `aria-label` on Refresh button

**Pass Criteria:** ✓ ARIA correct, semantics strong

---

## Performance Testing

### Test Case 6.1: Large Proposals List (10+ Cards)
**Steps:**
1. Generate flashcards with 10+ proposals (or simulate)
2. Scroll through list
3. Edit multiple cards

**Expected Results:**
- List renders smoothly
- No lag during scroll
- Edit mode transitions instant
- No unnecessary re-renders (check React DevTools Profiler if available)

**Pass Criteria:** ✓ Performance acceptable

---

### Test Case 6.2: Rapid Input Changes
**Steps:**
1. Paste/type rapidly in textarea (input text)
2. Observe character counter updates

**Expected Results:**
- Counter updates smoothly (useMemo optimization)
- No lag or stuttering
- Validation updates real-time

**Pass Criteria:** ✓ Input responsive

---

## Browser Compatibility

### Test Case 7.1: Cross-Browser Testing
**Browsers to Test:**
- Chrome/Edge (Chromium)
- Firefox
- Safari (macOS/iOS)

**Expected Results:**
- Layout consistent across browsers
- All features functional
- No console errors
- Tailwind 4 styles render correctly

**Pass Criteria:** ✓ Works in all major browsers

---

### Test Case 7.2: Responsive Design
**Viewports to Test:**
- Mobile: 375px (iPhone SE)
- Tablet: 768px (iPad)
- Desktop: 1280px+

**Expected Results:**
- Form usable on all viewports
- Metadata grid: 1 column (mobile), 2 columns (desktop)
- Cards stack properly on mobile
- Buttons accessible (not too small)
- No horizontal scroll

**Pass Criteria:** ✓ Responsive, usable on all sizes

---

## Regression Testing Checklist

After any code changes, verify:
- [ ] Input validation (min/max characters)
- [ ] Form submission (success + error paths)
- [ ] Polling starts and stops correctly
- [ ] Status banner updates (processing → completed/failed)
- [ ] Metadata displays correctly
- [ ] Proposals list renders
- [ ] Accept action works (no-op logged)
- [ ] Edit mode entry/exit
- [ ] Edit validation (front/back limits)
- [ ] Edit save (success + error)
- [ ] Edit cancel (discard changes)
- [ ] Delete confirmation + execution
- [ ] Empty state when no proposals
- [ ] Manual refresh works
- [ ] No console errors
- [ ] Accessibility (keyboard, screen reader)

---

## Known Limitations

1. **No Authentication**: Uses `DEFAULT_USER_ID` for development
2. **No Generation History**: Only shows current/most recent generation
3. **No Pagination**: All proposals loaded at once (acceptable for MVP)
4. **Accept is No-op**: Backend doesn't require explicit accept action yet
5. **No Offline Support**: Requires network connection
6. **No State Persistence**: Page refresh loses current state
7. **No Optimistic UI for Edit**: Waits for server response before updating display

---

## Success Criteria Summary

The AI Flashcards Generation feature is considered **ready for release** when:

✅ All input validation works correctly (1000-10000 chars)  
✅ Submission initiates generation successfully (202 response)  
✅ Polling updates status automatically (processing → completed/failed)  
✅ Metadata displays all available fields correctly  
✅ Proposals list shows all generated flashcards  
✅ Edit mode allows valid updates (1-200 front, 1-500 back)  
✅ Delete removes flashcards with confirmation  
✅ Error handling graceful for all API failures  
✅ Accessibility standards met (keyboard nav, ARIA, screen readers)  
✅ No console errors in normal operation  
✅ Performance acceptable for 10+ proposals  
✅ Responsive design works on mobile/tablet/desktop  
✅ Cross-browser compatible (Chrome, Firefox, Safari)  

---

## Bug Report Template

When reporting bugs, include:

**Description:** Brief description of the issue

**Steps to Reproduce:**
1. Step one
2. Step two
3. ...

**Expected Result:** What should happen

**Actual Result:** What actually happened

**Environment:**
- Browser: (Chrome 120, Firefox 121, Safari 17, etc.)
- Viewport: (Desktop 1920x1080, Mobile 375x667, etc.)
- Network: (Good, Slow 3G, Offline, etc.)

**Console Errors:** (Copy/paste any errors from DevTools)

**Screenshots:** (If applicable)

**Additional Context:** (Any other relevant information)

---

## End of Testing Guide

