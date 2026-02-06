---
name: performance-optimization
description: >
  Use this skill when asked to improve app speed, reduce load times, optimize rendering,
  or debug slow backend queries. Triggers on: slow, laggy, optimization, latency, core web vitals.
---

# Performance Optimization Guide

## 1. Frontend Performance (Core Web Vitals)

### 1.1 LCP (Largest Contentful Paint)
- **Image Optimization**: Use `next/image` with `priority` for the LCP element (hero image).
- **Font Optimization**: Use `next/font` to eliminate layout shifts and reduce fetch time.
- **Server Side Rendering (SSR)**: Ensure critical content is in the initial HTML document.

### 1.2 INP (Interaction to Next Paint)
- **Yield to Main Thread**: Break up long tasks using `setTimeout` or `scheduler.yield()`.
- **React Optimizations**:
    - `useMemo` / `useCallback` for expensive computations.
    - `React.memo` (cautiously) for list items.
    - **Virtualization**: Use `react-window` for long lists (> 50 items).

### 1.3 CLS (Cumulative Layout Shift)
- **Dimension Attributes**: Always set `width` and `height` on images/videos.
- **Skeleton Loaders**: Reserve space for dynamic content before it loads.

## 2. Bundling Strategy

- **Code Splitting**: Use `next/dynamic` or `React.lazy` for:
    - Modals / Dialogs.
    - Below-the-fold heavy components (charts, maps).
    - Route-based splitting (automatic in Next.js).
- **Tree Shaking**: Ensure you are using named imports from libraries (e.g., `import { Button } from 'lib'` instead of default full import).

## 3. Backend Performance

### 3.1 Caching Hierarchy
1.  **Request Cache (Memoization)**: De-dupe identical requests within a single API call.
2.  **Data Cache (Redis/In-memory)**: Cache expensive DB query results (e.g., user profile, config).
3.  **CDN Cache**: Cache static assets and public API responses at the edge.

### 3.2 Database Optimization
- **N+1 Problem**: Use `Promise.all` or DataLoaders to batch queries.
- **Selectivity**: Only select fields you need (`.select('id, name')`), never `SELECT *`.
- **Indexing**: Ensure all foreign keys and query filters are indexed.

## 4. Network Performance

- **Prefetching**: Prefetch data on hover (React Query / Next.js `Link`).
- **Parallelization**: Don't `await` sequentially if tasks are independent.

```typescript
// BAD
const user = await getUser();
const posts = await getPosts();

// GOOD
const [user, posts] = await Promise.all([getUser(), getPosts()]);
```

## 5. Optimization Workflow

1.  **Measure**: Use Lighthouse, Web Vitals extension, or `performance.now()`.
2.  **Identify**: Find the bottleneck (Network? CPU? DB?).
3.  **Optimize**: Apply specific fix.
4.  **Verify**: Re-measure to confirm improvement.
