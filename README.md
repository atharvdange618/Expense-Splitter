# Expense Splitter API

A expense splitting API (yet to be)built with a NestJS-inspired modular architecture. Split bills fairly among groups using multiple strategies (equal, percentage, or exact amounts), track balances, and settle debts with confirmation workflows.

## Quick Start

```bash
# Install dependencies
bun install

# Set up environment
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

# Run migrationss
bun run db:migrate

# Start server
bun run dev
```

Server runs at `http://localhost:3000`

## Features

- **Multi-Strategy Splits**: Equal, percentage-based, or exact amount splitting
- **Group Management**: Create groups, manage members, track shared expenses
- **Balance Tracking**: Real-time calculation of who owes whom
- **Settlement Workflows**: Record payments with payee confirmation
- **JWT Authentication**: Secure token-based auth with bcrypt password hashing
- **Type-Safe Validation**: Runtime validation using ArkType schemas
- **Audit Trail**: Immutable expense records with historical split data

## Tech Stack

| Layer           | Technology           | Purpose                              |
| --------------- | -------------------- | ------------------------------------ |
| Runtime         | Node.js + TypeScript | Type-safe JavaScript execution       |
| Framework       | Express.js           | Minimalist web framework             |
| Validation      | ArkType 2.0          | Runtime type validation              |
| ORM             | Prisma 6.x           | Type-safe database client            |
| Database        | PostgreSQL           | Relational data with ACID guarantees |
| Auth            | JWT + bcryptjs       | Stateless authentication             |
| Package Manager | Bun                  | Fast dependency management           |

## Documentation

| Document                                 | Description                                   |
| ---------------------------------------- | --------------------------------------------- |
| **[Setup Guide](docs/SETUP.md)**         | Installation, configuration, and deployment   |
| **[API Reference](docs/API.md)**         | Complete endpoint documentation with examples |
| **[Database Design](docs/DATABASE.md)**  | Schema diagram and entity relationships       |
| **[Architecture](docs/ARCHITECTURE.md)** | Design decisions and tradeoffs                |

## Project Structure

```
src/
├── config/
│   ├── env.ts                 # Environment validation
│   └── prisma.ts              # Prisma client singleton
├── modules/                    # Feature modules (NestJS-inspired)
│   ├── auth/
│   │   ├── auth.schema.ts     # RegisterSchema, LoginSchema (ArkType)
│   │   ├── auth.service.ts    # Authentication business logic
│   │   ├── auth.controller.ts # Route handlers
│   │   └── auth.routes.ts     # Route definitions
│   ├── users/
│   │   ├── user.schema.ts     # UpdateProfileSchema
│   │   ├── user.service.ts    # User management logic
│   │   ├── user.controller.ts
│   │   └── user.routes.ts
│   ├── groups/
│   │   ├── group.schema.ts    # CreateGroupSchema, AddMemberSchema
│   │   ├── group.service.ts   # Group & membership logic
│   │   ├── group.controller.ts
│   │   └── group.routes.ts
│   ├── expenses/
│   │   ├── expense.schema.ts  # CreateExpenseSchema (split validation)
│   │   ├── expense.service.ts # Expense & balance calculation
│   │   ├── expense.controller.ts
│   │   └── expense.routes.ts
│   ├── splits/
│   │   └── splits.util.ts     # Pure split calculation functions
│   └── settlements/
│       ├── settlement.schema.ts # CreateSettlementSchema
│       ├── settlement.service.ts # Payment recording logic
│       ├── settlement.controller.ts
│       └── settlement.routes.ts
├── shared/
│   ├── middleware/
│   │   ├── auth.middleware.ts  # JWT verification middleware
│   │   └── error.middleware.ts # Global error handler
│   ├── utils/
│   │   ├── response.ts         # Standardized API responses
│   │   └── jwt.ts              # Token sign/verify helpers
│   └── types/
│       └── index.ts            # Shared TypeScript types
├── app.ts                      # Express app + route registration
└── server.ts                   # Application bootstrap
```

## API Endpoints

### Core Resources

**Authentication** → Register, Login
**Users** → Profile management, Search
**Groups** → Create, List, Add/Remove members
**Expenses** → Track with EQUAL/PERCENTAGE/EXACT splits
**Balances** → Calculate who owes whom
**Settlements** → Record payments with confirmation

See **[API Reference](docs/API.md)** for complete endpoint documentation with examples.

## Usage Example

```bash
# 1. Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","password":"password123"}'

# 2. Create group (with token from registration)
curl -X POST http://localhost:3000/api/groups \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"Weekend Trip"}'

# 3. Add expense with equal split
curl -X POST http://localhost:3000/api/groups/GROUP_ID/expenses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title":"Dinner","totalAmount":900,"paidById":"USER_ID","split":{"type":"EQUAL"}}'

# 4. Check balances
curl http://localhost:3000/api/groups/GROUP_ID/balances \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Common Scenarios

### Scenario 1: Trip with 3 Friends

1. Create group: `POST /api/groups` → `{ name: "Goa Trip" }`
2. Add friends: `POST /api/groups/:id/members` (x2)
3. Add hotel expense: `POST /api/groups/:id/expenses` (PERCENTAGE: 40/30/30)
4. Add food expense: `POST /api/groups/:id/expenses` (EQUAL split)
5. Check balances: `GET /api/groups/:id/balances`
6. Settle up: `POST /api/settlements` → `PATCH /api/settlements/:id/confirm`

### Scenario 2: Roommates with Recurring Expenses

1. Create group: "Apartment 4B"
2. Add monthly rent: `EXACT` split (different shares based on room size)
3. Add utilities: `EQUAL` split
4. Add groceries: `EXACT` split (based on actual consumption)
5. Monthly settlement workflow at end of month

---

## Future Enhancements

- **Recurring Expenses**: Auto-create monthly bills
- **Multi-Currency**: Support for different currencies with exchange rates
- **Receipt Upload**: Image storage with S3/Cloudinary
- **Split Simplification**: Optimize payments (e.g., if A→B $50 and B→A $30, simplify to A→B $20)
- **Group Invites**: Email invitations with signup flow
- **Expense Categories**: Tag expenses (Food, Transport, Entertainment)
- **Export Reports**: PDF/CSV export of group expenses
- **WebSocket Notifications**: Real-time updates when expenses are added/settled

---

## Author

[Atharv Dange](https://x.com/atharvdangedev)

Built with ☕(Ice Tea) and TypeScript

## Testing

All 19 endpoints have been manually tested. See [SETUP.md](docs/SETUP.md) for test commands and examples.

## Future Enhancements (if i wanted to build this out further, because this was supposed to be a test project for ArkType but i got carried away building a full API instead)

- **Recurring Expenses**: Auto-create monthly bills
- **Multi-Currency**: Support for different currencies with exchange rates
- **Receipt Upload**: Image storage with S3/Cloudinary
- **Split Simplification**: Optimize payments to minimize transactions
- **Expense Categories**: Tag expenses (Food, Transport, Entertainment)
- **Export Reports**: PDF/CSV export of group expenses
- **WebSocket Notifications**: Real-time updates

## Contributing

Contributions are welcome! Please read the architecture docs first to understand design decisions.

---

## License

[MIT](/LICENSE)
