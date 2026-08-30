# Hosting Movie-Tracker on Vercel

Vercel is the best platform to host a Next.js application like Movie Tracker. Since it's built by the same team that created Next.js, deployment is seamless and highly optimized.

Here is a step-by-step guide on how to deploy this project:

## Prerequisites

1. **GitHub Account**: Make sure all your code is pushed to a repository on your GitHub account.
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com/) (you can log in directly with your GitHub account).
3. **Database URL**: Since this project uses Prisma and an SQLite/Postgres database for user data/history, ensure you have your production database URL ready. (If using SQLite, remember that Vercel is serverless, so the local `dev.db` won't persist across deployments. You should switch to a hosted Postgres provider like Supabase or Neon for production).

## Step 1: Import the Project to Vercel

1. Log into your Vercel dashboard.
2. Click the **Add New...** button and select **Project**.
3. Under the "Import Git Repository" section, find your `movie-tracker` repository and click **Import**.

## Step 2: Configure Project Settings

Before clicking deploy, you need to configure a few environment variables.

1. **Framework Preset**: Vercel will automatically detect `Next.js`. Leave this as is.
2. **Root Directory**: Leave as `./` unless your Next.js app is inside a subfolder.
3. **Environment Variables**: Expand this section and add all the required `.env` variables from your local environment. You will likely need:
   - `DATABASE_URL` (Your production database string)
   - `NEXT_PUBLIC_TMDB_API_KEY` (Your TMDB API Key)
   - Any Auth Secret keys if you are using NextAuth or custom JWTs.

## Step 3: Deploy

1. Once the environment variables are added, click the **Deploy** button.
2. Vercel will now build your project. It runs `npm install`, then `npm run build`.
3. If there are any build errors, Vercel will display the logs. Since this is a Next.js App Router project, ensure there are no TypeScript errors in your production build.

## Step 4: Post-Deployment Database Setup (Important)

If you are using Prisma with a hosted database (like Neon or Supabase):
You need to ensure your database schema is pushed to the production database.
Since Vercel builds the app on ephemeral servers, the standard practice is to add a `postinstall` script to your `package.json` so Prisma generates the client during build:

```json
"scripts": {
  "postinstall": "prisma generate"
}
```

You can also push your schema to the production database by running this locally before or after deploy:
```bash
npx prisma db push
```

## Step 5: Live URL & Custom Domains

- Vercel will provide you with a live, secure `.vercel.app` URL (e.g., `https://movie-tracker-yourname.vercel.app`).
- You can add a custom domain by going to your project's **Settings > Domains** tab in the Vercel dashboard.

That's it! Every time you push a new commit to your `master` or `main` branch, Vercel will automatically build and deploy the changes.
