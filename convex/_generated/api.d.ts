/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as anomalies from "../anomalies.js";
import type * as auth from "../auth.js";
import type * as billing from "../billing.js";
import type * as collector from "../collector.js";
import type * as crons from "../crons.js";
import type * as dailyDigests from "../dailyDigests.js";
import type * as dashboard from "../dashboard.js";
import type * as dependencies from "../dependencies.js";
import type * as email from "../email.js";
import type * as foundingMembers from "../foundingMembers.js";
import type * as github from "../github.js";
import type * as http from "../http.js";
import type * as insightGenerator from "../insightGenerator.js";
import type * as migrations from "../migrations.js";
import type * as notifications from "../notifications.js";
import type * as npmRegistry from "../npmRegistry.js";
import type * as orchestrator from "../orchestrator.js";
import type * as plan from "../plan.js";
import type * as readmeAnalyzer from "../readmeAnalyzer.js";
import type * as repos from "../repos.js";
import type * as scorer from "../scorer.js";
import type * as sharePrompts from "../sharePrompts.js";
import type * as streakTracker from "../streakTracker.js";
import type * as taskGenerator from "../taskGenerator.js";
import type * as trafficIntelligence from "../trafficIntelligence.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  anomalies: typeof anomalies;
  auth: typeof auth;
  billing: typeof billing;
  collector: typeof collector;
  crons: typeof crons;
  dailyDigests: typeof dailyDigests;
  dashboard: typeof dashboard;
  dependencies: typeof dependencies;
  email: typeof email;
  foundingMembers: typeof foundingMembers;
  github: typeof github;
  http: typeof http;
  insightGenerator: typeof insightGenerator;
  migrations: typeof migrations;
  notifications: typeof notifications;
  npmRegistry: typeof npmRegistry;
  orchestrator: typeof orchestrator;
  plan: typeof plan;
  readmeAnalyzer: typeof readmeAnalyzer;
  repos: typeof repos;
  scorer: typeof scorer;
  sharePrompts: typeof sharePrompts;
  streakTracker: typeof streakTracker;
  taskGenerator: typeof taskGenerator;
  trafficIntelligence: typeof trafficIntelligence;
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
