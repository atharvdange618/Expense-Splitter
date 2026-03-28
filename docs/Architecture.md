# Architecture Decisions

This document explains key architectural decisions made in the Expense Splitter API and their tradeoffs.

## 1. NestJS-Inspired Module Structure (Without NestJS)

**Decision**: Organize code into feature modules (auth, users, groups, etc.) with each module containing its own schema, service, controller, and routes.

**Why**:

- **Clear Separation of Concerns**: Each module encapsulates related functionality
- **Easy Navigation**: Locate all code for a feature in one directory
- **Scalable for Teams**: Multiple developers can work on different modules
- **Testable in Isolation**: Mock dependencies at module boundaries
- **Domain-Driven Design**: Aligns code organization with business domains

**Tradeoff**: More boilerplate than a flat file structure. Requires discipline to maintain boundaries. Worth it for production systems that will grow over time.

**Module Structure:**

```
modules/
├── auth/           # Authentication & token management
├── users/          # User profile management
├── groups/         # Group CRUD & membership
├── expenses/       # Expense tracking & balance calculation
├── splits/         # Pure split calculation logic
└── settlements/    # Payment recording & confirmation
```

---

## 2. ArkType Over Zod

**Decision**: Use [ArkType](https://arktype.io/) for runtime validation instead of Zod.

**Why**:

- **10x Faster Runtime Performance**: Benchmarks show significant speed gains
- **Concise Syntax**: More readable schema definitions with type inference
- **Smaller Bundle Size**: Less JavaScript shipped to production
- **TypeScript-First Design**: Better integration with TypeScript

**Example Comparison:**

```typescript
// Zod
const UserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  age: z.number().int().positive(),
});

// ArkType (more concise)
const UserSchema = type({
  name: "string>=2",
  email: "email",
  age: "number>=1",
});
```

**Tradeoff**: Smaller ecosystem than Zod (fewer third-party integrations). Community support is growing but not as mature. Performance gains are significant for high-throughput APIs.

---

## 3. Separate ExpenseSplit Table

**Decision**: Store resolved split amounts in a dedicated `ExpenseSplit` table rather than embedding them in the `Expense.splitInput` JSON field.

**Why**:

- **Queryable**: Can efficiently query "all expenses where user X owes money" using SQL
- **Normalized**: Follows Third Normal Form (3NF) database design principles
- **Settlement Tracking**: `isSettled` flag per user enables granular payment status
- **Balance Calculation**: SQL aggregations over `ExpenseSplit` are orders of magnitude faster than JSON parsing
- **Future-Proof**: Easy to add fields like `settledAt`, `settledBy`, `paymentMethod` later

**Tradeoff**: Additional JOIN required when fetching expense details. This is acceptable because:

- Prisma's `include` syntax makes this trivial
- Database query planners optimize JOINs efficiently
- Query performance for balance calculation far outweighs the JOIN cost

**Alternative Considered**: Storing splits in JSON array within `Expense` table. Rejected due to:

- No indexing on JSON fields in PostgreSQL (without GIN indexes)
- Complex queries for balance calculation
- Difficult to update individual split records

---

## 4. JSON Field for splitInput

**Decision**: Store original split configuration in a JSON field (`Expense.splitInput`) alongside normalized `ExpenseSplit` records.

**Why**:

- **Auditability**: Preserves original user intent (e.g., "40/30/30 percentage split")
- **Recalculation**: Can replay split logic if calculation rules change
- **Debugging**: Easy to see what the user actually entered vs. what was calculated
- **Compliance**: Financial audit requirements often mandate original input preservation

**Tradeoff**: Data duplication between `splitInput` (original) and `ExpenseSplit` (computed). This is acceptable because:

- `splitInput` is write-once, read-rarely
- Storage is cheap; query performance and auditability are expensive
- Provides valuable context for dispute resolution

---

## 5. Pure Functions for Split Calculation

**Decision**: Extract split logic into pure utility functions (`splits.util.ts`) separate from services.

**Why**:

- **Testability**: Easy to unit test without mocking database or HTTP layer
- **Reusability**: Split logic decoupled from Prisma, Express, JWT, etc.
- **Predictability**: No side effects; same input always produces same output
- **Composability**: Can use in CLI tools, background jobs, or other contexts

**Implementation:**

```typescript
// Pure function - no dependencies
export function calculateSplits(
  totalAmount: number,
  splitType: SplitType,
  members: string[],
  config?: {
    shares?: Record<string, number>;
    amounts?: Record<string, number>;
  },
): Record<string, number> {
  // Deterministic calculation
}
```

**Tradeoff**: None-this is a standard best practice for business logic.

---

## 6. Cascade Deletes with Prisma

**Decision**: Use `onDelete: Cascade` for parent-child relationships (Group→Expense, Expense→ExpenseSplit).

**Why**:

- **Data Integrity**: Prevents orphaned records automatically
- **Simplifies API Logic**: No manual cleanup needed in application code
- **Database-Level Enforcement**: Works even if application code is bypassed
- **Transaction Safety**: Deletes all related records atomically

**Example:**

```prisma
model Expense {
  splits ExpenseSplit[]
  group  Group @relation(fields: [groupId], references: [id], onDelete: Cascade)
}
```

**Tradeoff**: Less control over deletion flow. If you need:

- **Soft Deletes**: Mark records as deleted instead of removing them
- **Retention Policies**: Keep expenses for X days after group deletion
- **Audit Trail**: Preserve historical data even after user deletion

...then cascades won't work. You'd need application-level logic with `deletedAt` timestamps.

**When We Don't Use Cascade:** `User` relationships. Deleting a user should be a rare, explicit operation with proper data migration (reassign expenses, anonymize data, etc.).

---

## 7. Two-Step Settlement Confirmation

**Decision**: Settlements require both payer creation and payee confirmation.

**Why**:

- **Fraud Prevention**: Payee must acknowledge receipt (can't fake payments)
- **Dispute Resolution**: `PENDING` status allows reversal if amount is wrong
- **Trust Building**: Both parties have immutable audit trail
- **Industry Standard**: Matches real-world payment flows (Venmo, PayPal have similar models)

**Workflow:**

1. User A records: "I paid User B $100"
2. System creates Settlement with `status: PENDING`
3. User B confirms: "Yes, I received $100"
4. System updates `status: CONFIRMED`

**Tradeoff**: More API calls and complexity vs. instant settlement. The added trust and accuracy are worth it for financial applications.

**Alternative Considered**: Instant settlement. Rejected because:

- Payer could claim payment without actual transfer
- No recourse for disputes
- Doesn't match real-world payment verification

---

## 8. Decimal Type for Currency

**Decision**: Use `Decimal(10, 2)` instead of `float` or `double` for all monetary values.

**Why**:

- **Precision**: Avoids floating-point errors (e.g., `0.1 + 0.2 = 0.30000000000000004`)
- **GAAP Compliance**: Generally Accepted Accounting Principles require exact decimal representation
- **Consistency**: All calculations automatically round to 2 decimal places
- **Industry Standard**: Every financial system uses decimal types

**Example Problem with Floats:**

```javascript
// JavaScript float arithmetic
0.1 + 0.2 === 0.3; // false! (returns 0.30000000000000004)

// With Decimal
new Decimal(0.1).plus(0.2).equals(0.3); // true
```

**Tradeoff**: Slightly more complex to work with than `number` type. Prisma returns `Decimal` objects that need `.toString()` or `.toNumber()` conversion. Essential for financial accuracy.

---

## 9. CUID Over UUID

**Decision**: Use CUID (Collision-resistant Unique IDs) for primary keys instead of UUIDv4.

**Why**:

- **Sortable**: CUIDs are chronologically sortable (unlike random UUIDs)
- **More Compact**: Shorter than UUIDs (25 chars vs 36)
- **Better Indexing**: Sorted IDs improve B-tree index performance
- **Prisma Native**: Generated by Prisma with `@default(cuid())`

**Format Comparison:**

```
UUID:  123e4567-e89b-12d3-a456-426614174000 (36 chars)
CUID:  ckmx6z43f0000wxkv8n1g0qkl        (25 chars)
```

**Tradeoff**: Not RFC-standard like UUIDs. Some external systems may expect UUID format. CUIDs are well-supported within the Node.js ecosystem.

**Alternative Considered**: Auto-incrementing integers. Rejected due to:

- Exposes record count to external users
- Not suitable for distributed systems
- Predictable IDs enable enumeration attacks

---

## 10. Stateless JWT Authentication

**Decision**: Store no session data on the server; all auth state in JWT tokens.

**Why**:

- **Horizontal Scalability**: No shared session store needed (Redis, database)
- **Simplicity**: No session cleanup, expiration management, or distributed locking
- **Cost-Effective**: No Redis/Memcached infrastructure required

**Token Structure:**

```javascript
{
  userId: "ckmx6z43f0000wxkv8n1g0qkl",
  email: "user@example.com",
  iat: 1640000000,
  exp: 1640604800  // 7 days later
}
```

**Tradeoff**: Cannot invalidate tokens before expiration. This means:

- Logout doesn't truly log out until token expires
- Compromised tokens remain valid until expiration
- No "logout all devices" functionality

**Production Solutions:**

- **Refresh Token Rotation**: Short-lived access tokens (15 min) + long-lived refresh tokens
- **Token Blacklist**: Redis set of revoked tokens (defeats stateless purpose)
- **Token Versioning**: Add `tokenVersion` to User model; increment on password change

For this MVP, we accept the tradeoff. Production systems should implement refresh token rotation.

---

## Conclusion

Every architectural decision is a tradeoff. This document provides context for future maintainers to understand:

- **What** decisions were made
- **Why** they were made
- **When** to reconsider them
