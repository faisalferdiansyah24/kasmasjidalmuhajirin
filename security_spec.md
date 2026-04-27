# Security Specification - Masjid Al-Muhajirin Cash Management

## 1. Data Invariants
- A transaction must have a type (income/expense).
- Amount must be positive.
- Every transaction record must be linked to the creator's UID.
- Only admins can create/update/delete transactions and categories.
- Any authenticated user can read transactions (to promote transparency).

## 2. The "Dirty Dozen" Payloads (Malicious Attempts)
1. **Identity Spoofing**: Attempt to create a transaction with `createdBy` set to another user's UID.
2. **Resource Poisoning**: Use a 1MB string as a category name.
3. **Price Manipulation**: Create a transaction with a negative amount.
4. **State Shortcutting**: Manually set `createdAt` to a future date instead of server timestamp.
5. **Unauthorized Access**: A non-authenticated user trying to read any collection.
6. **Role Escalation**: A user trying to update their own role in `users` collection.
7. **Phantom Transactions**: Updating `amount` but leaving `updatedAt` old.
8. **Shadow Data**: Adding a field `isVerified: true` to a transaction payload.
9. **Deletion Theft**: Deleting a transaction as a non-admin.
10. **ID Poisoning**: Using `/transactions/../../../etc/passwd` as an ID.
11. **PII Leak**: Reading `users` collection without being an owner or admin.
12. **orphaned Write**: Creating a transaction for a non-existent category.

## 3. Test Runner (Draft)
- `PERMISSION_DENIED` for any payload above.
