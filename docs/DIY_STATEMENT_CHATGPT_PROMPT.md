# DIY ChatGPT prompt — statement → Cash Prophet setup

## Product behaviour

During Getting started (per business):

1. Ask for a **meaningful monthly amount** (default £200).
2. **Copy prompt** injects that value — user does not edit the prompt.
3. User pastes into their own ChatGPT + uploads that business’s transaction log (CSV preferred; 2+ years ideal).
4. They type the returned tables into Cash Prophet (including Reserve Planner items they choose to keep).

Most customers = one business. Multi-business = repeat.

Source of truth for the live prompt text: `src/content/diyStatementPrompt.ts`.

This prompt must stay **generic** — any UK bank, any sector, any payees.

## Internal testing notes

Cold-test on more than one business. Fail the run if:

- Day columns contain ranges (must be one number)
- A large ~quarterly same-amount payment is only in Not imported
- Items clearly under the monthly threshold appear in Monthly
- Weak / sparse items are forced into Monthly without a clear every-month history

Do not put specific test-business payee names into the copy-paste prompt.
