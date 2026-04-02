/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as billing from "../billing.js";
import type * as collector from "../collector.js";
import type * as crons from "../crons.js";
import type * as dashboard from "../dashboard.js";
import type * as email from "../email.js";
import type * as github from "../github.js";
import type * as http from "../http.js";
import type * as insightGenerator from "../insightGenerator.js";
import type * as notifications from "../notifications.js";
import type * as orchestrator from "../orchestrator.js";
import type * as plan from "../plan.js";
import type * as repos from "../repos.js";
import type * as scorer from "../scorer.js";
import type * as streakTracker from "../streakTracker.js";
import type * as taskGenerator from "../taskGenerator.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  billing: typeof billing;
  collector: typeof collector;
  crons: typeof crons;
  dashboard: typeof dashboard;
  email: typeof email;
  github: typeof github;
  http: typeof http;
  insightGenerator: typeof insightGenerator;
  notifications: typeof notifications;
  orchestrator: typeof orchestrator;
  plan: typeof plan;
  repos: typeof repos;
  scorer: typeof scorer;
  streakTracker: typeof streakTracker;
  taskGenerator: typeof taskGenerator;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
