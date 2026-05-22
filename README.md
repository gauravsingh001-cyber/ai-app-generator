# Config-Driven AI App Generator Platform

A highly dynamic, metadata-driven full-stack platform inspired by Base44 / Retool. This system generates a complete frontend UI, backend CRUD APIs, and database schema dynamically from a simple JSON configuration file. 

The application uses PostgreSQL `JSONB` via Prisma to enable migration-free schema adaptability. You can add, remove, and rename fields in the JSON config without dropping the database or writing new migrations.

## 🏗 Architecture

**JSON Config Layer** 
- `backend/src/config/appConfig.json` contains the definitions of entities, their fields, and localization strings.

**Backend (Node.js + Express + Prisma + Zod)**
- Reads the configuration on startup.
- Dynamically generates Zod validation schemas for all entities (`backend/src/engine/schemaBuilder.ts`).
- Provides dynamic CRUD endpoints (`POST /api/:entity`, `GET /api/:entity`, etc.) which validate incoming requests against the dynamic Zod schema.
- Stores records in a robust, migration-safe `DynamicRecord` table in PostgreSQL.

**Frontend (Next.js 14 App Router + Tailwind + Zustand)**
- Fetches the current configuration on initialization.
- Dynamically builds forms and tables (`DynamicForm.tsx`, `DynamicTable.tsx`) based on the requested entity.
- Fully supports i18next-based multi-language rendering natively extracted from the JSON config.

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL Server

### Backend Setup
1. Navigate to the `backend` directory.
2. Run `npm install`.
3. Create a `.env` file in the `backend` directory with:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/ai_app_generator?schema=public"
   JWT_SECRET="your_super_secret_key"
   PORT=4000
   ```
4. Run Prisma schema push to create the tables in your database:
   ```bash
   npx prisma db push
   ```
5. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the `frontend` directory.
2. Run `npm install`.
3. Create a `.env.local` file in the `frontend` directory with:
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:4000/api"
   ```
4. Start the frontend server:
   ```bash
   npm run dev
   ```

## 🎥 Core Features

1. **Config-Driven Architecture**: Change `appConfig.json` in the backend, and both the APIs and UI adapt immediately without code changes!
2. **Authentication**: Fully integrated JWT authentication. Data is user-scoped.
3. **CSV Import**: Import data matching your entity schemas dynamically from a CSV file.
4. **Multi-Language**: Automatically handles English and Hindi out of the box. Toggle language from the Navigation bar.

## 🌍 Deployment

### Vercel (Frontend)
1. Import the `frontend` directory to Vercel.
2. Add the `NEXT_PUBLIC_API_URL` pointing to your deployed Railway backend URL.
3. Deploy!

### Railway (Backend & Database)
1. Create a new PostgreSQL database in Railway.
2. Create an empty Railway service and deploy the `backend` folder.
3. Add environment variables: `DATABASE_URL` (from Railway Postgres), `JWT_SECRET`, and `PORT`.
4. Ensure the start command is `npx prisma db push && node dist/server.js` (you may need to add a build step `npx tsc` in your package.json).
