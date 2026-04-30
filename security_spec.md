# Security Specification

## Data Invariants
1. A **User** document must have a valid `uid`, `name`, `email`, and `role`.
2. A **Group** must be manageable only by Admins or assigned Teachers/Mentors.
3. **Tasks** can only be created by Teachers or Admins for a specific group.
4. **Submissions** can only be created by Students in the group the task belongs to.
5. **Logs** are read-only for Admins and write-only (create) upon system actions.

## The Dirty Dozen Payloads (Targeting Rejection)

- **Payload 1 (Identity Spoofing):** Non-admin user trying to change their own role to 'Admin'.
- **Payload 2 (Role Injection):** Creating a user with a non-existent role.
- **Payload 3 (Access Bypass):** Student trying to read another student's submission.
- **Payload 4 (Resource Poisoning):** Document ID with 1MB of junk characters.
- **Payload 5 (Illegal Update):** Student trying to change their own grade on a submission.
- **Payload 6 (Shadow Field):** Adding `isVerified: true` to a user profile update.
- **Payload 7 (Unsigned Write):** Writing to `/logs` without being authenticated.
- **Payload 8 (Malformed ID):** Document ID containing special characters like emoji.
- **Payload 9 (PII Leak):** Reading user emails without being owner or admin.
- **Payload 10 (State Shortcut):** Changing submission status from 'Submitted' to 'Graded' without a grade.
- **Payload 11 (Timestamp Poisoning):** Providing a future `createdAt` date from the client.
- **Payload 12 (Orphaned Group):** Creating a group with a non-existent `teacherId`.

## Test Runner (firestore.rules.test.ts)
```typescript
// Tests will be implemented to verify these denials
```
