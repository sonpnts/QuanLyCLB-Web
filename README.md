# QuanLyCLB Web Admin Template

This project is a Materio-based admin dashboard built on the Next.js App Router, Material UI (MUI) and Tailwind CSS. It ships with mocked data, reusable layouts and widgets so you can quickly scaffold an internal tool or club-management dashboard and then adapt it to real APIs and business rules.

## Project Architecture at a Glance

The source code lives in the `src` folder and is split into layers that separate routing, page UIs, reusable components, theming and state.

| Layer | Path | Description |
| --- | --- | --- |
| **Routing & App Shell** | `src/app` | Next.js App Router entry points, global styles and the root layout that wires translations, theme mode detection and HTML scaffolding. |
| **Layouts** | `src/@layouts` | Page chrome (navigation bars, footers, vertical/horizontal layouts) that wrap the views. |
| **Feature Views (UI)** | `src/views` | Actual page implementations grouped by domain (dashboards, apps, tables, charts, auth, etc.). Components here compose reusable widgets and fetch data through server actions or APIs. |
| **Shared Components** | `src/components` and `src/@core/components` | Reusable building blocks. `@core` hosts design-system level atoms/molecules while `components` contains higher-level widgets used across multiple views. |
| **State & Data Layer (Logic)** | `src/redux-store`, `src/contexts`, `src/hooks`, `src/app/server/actions.ts` | Redux slices, React Context providers, custom hooks and server actions that encapsulate business logic and data access. |
| **Configuration** | `src/configs`, `src/@core/theme`, `tailwind.config.ts`, `next.config.ts` | Theme tokens, i18n setup, global configuration and build-time tweaks. |
| **Mock Data** | `src/fake-db` | Static JSON-like modules that emulate backend responses for dashboards, apps and widgets. Replace with live APIs when you integrate real data. |
| **Utilities** | `src/utils`, `src/@core/utils`, `src/libs` | Helper functions, third-party wrapper components (charts, auth) and shared TypeScript types. |
| **Static Assets** | `public`, `src/assets` | Images, icons, fonts and generated icon CSS.

### Routing Flow

1. `src/app/[lang]/layout.tsx` is the root layout that reads headers, resolves the active language and theme mode, and wraps every page with the translation and color scheme providers.【F:src/app/[lang]/layout.tsx†L1-L49】
2. Each route renders a view component from `src/views/...`, usually composed under a layout from `src/@layouts`.
3. Data for the views is injected through server actions located in `src/app/server/actions.ts`. By default they return the mock databases under `src/fake-db` so that the project works without a backend.【F:src/app/server/actions.ts†L1-L50】

## Customising the Template

Use the separation of concerns above to target the right folder when you customise the dashboard:

- **Change navigation and page shells:** edit or create layouts under `src/@layouts`. Navigation menus (for example sidebar configuration) live in `src/@menu` and are consumed by the layout components.
- **Update theme, typography or palettes:** tweak the tokens and CSS variables under `src/@core/theme`, `src/@core/styles` and `src/app/globals.css`. Tailwind utility adjustments belong in `tailwind.config.ts`.
- **Translate or localise content:** adjust locale files in `src/configs/i18n` and, if needed, extend the translation HOC in `src/hocs/TranslationWrapper.tsx`.
- **Add new pages or widgets:** create a folder under `src/views` and export a component. Register the new route by adding the corresponding file in `src/app/[lang]/(route-group)/page.tsx` or by updating existing route segments.
- **Centralise business logic:** place reusable state in `src/redux-store` (Redux Toolkit slices) or React contexts in `src/contexts`. Keep data-fetching logic in server actions or dedicated hooks so that views stay focused on presentation.
- **Replace mock data with real APIs:** either update the server actions to call your API, or create new data-access modules in `src/libs`/`src/utils` and import them inside the views.

## Example: Loading Data from an External API

Many views already show how to swap the fake database with live requests. For instance, the billing plan page currently pulls from `getPricingData` and `getInvoiceData`, which simply proxy the mock data. The file includes commented code that uses the Fetch API once you supply an `API_URL` env variable.【F:src/views/pages/account-settings/billing-plans/index.tsx†L1-L49】 Below is a concrete workflow to connect it to your backend:

1. **Expose environment variables:** create or edit `.env.local` and add `API_URL=https://your-api.example.com`. Restart the dev server so Next.js reloads the value.
2. **Switch the server action to fetch:** in `src/app/server/actions.ts`, replace the `getPricingData` and `getInvoiceData` implementations with real network calls. You can follow the commented pattern from the view:

   ```ts
   export const getPricingData = async () => {
     const res = await fetch(`${process.env.API_URL}/pages/pricing`, { cache: 'no-store' })
     if (!res.ok) throw new Error('Failed to fetch pricing')
     return res.json()
   }
   ```

   Use `cache: 'no-store'` for always-fresh data or `next: { revalidate: 60 }` to enable ISR.
3. **Call the server action from your view:** the billing plan page already awaits the server actions, so once they return live data the UI automatically reflects it. For client components, create a custom hook in `src/hooks` that calls your REST/GraphQL client and handles loading/error states.
4. **Share types and transformers:** if the API response shape differs from the mock data, define DTO interfaces under `src/types` or `src/@core/types` and map the API payload to the component props before rendering.

This pattern applies to any page that currently reads from `src/fake-db`: move the data-fetching logic into a server action (for SSR) or a hook (for client-side fetching) and keep the view component purely presentational.

## Running the Project

```bash
pnpm install
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) and choose a locale route such as `/en`. Update or add pages under `src/app` and `src/views`, then refresh to see your customisations.
