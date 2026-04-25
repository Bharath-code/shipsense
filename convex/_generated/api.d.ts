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
import type * as diagnostics from "../diagnostics.js";
import type * as email from "../email.js";
import type * as emailLeads from "../emailLeads.js";
import type * as emailNurture from "../emailNurture.js";
import type * as foundingMembers from "../foundingMembers.js";
import type * as github from "../github.js";
import type * as healthGrade from "../healthGrade.js";
import type * as http from "../http.js";
import type * as insightGenerator from "../insightGenerator.js";
import type * as investorReport from "../investorReport.js";
import type * as issueClassification from "../issueClassification.js";
import type * as issueReplyDraft from "../issueReplyDraft.js";
import type * as migrations from "../migrations.js";
import type * as notifications from "../notifications.js";
import type * as npmRegistry from "../npmRegistry.js";
import type * as orchestrator from "../orchestrator.js";
import type * as plan from "../plan.js";
import type * as readmeAnalyzer from "../readmeAnalyzer.js";
import type * as repos from "../repos.js";
import type * as scorer from "../scorer.js";
import type * as settings from "../settings.js";
import type * as sharePrompts from "../sharePrompts.js";
import type * as streakTracker from "../streakTracker.js";
import type * as taskGenerator from "../taskGenerator.js";
import type * as todayView from "../todayView.js";
import type * as trafficIntelligence from "../trafficIntelligence.js";
import type * as users from "../users.js";
import type * as watchlist from "../watchlist.js";

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
  diagnostics: typeof diagnostics;
  email: typeof email;
  emailLeads: typeof emailLeads;
  emailNurture: typeof emailNurture;
  foundingMembers: typeof foundingMembers;
  github: typeof github;
  healthGrade: typeof healthGrade;
  http: typeof http;
  insightGenerator: typeof insightGenerator;
  investorReport: typeof investorReport;
  issueClassification: typeof issueClassification;
  issueReplyDraft: typeof issueReplyDraft;
  migrations: typeof migrations;
  notifications: typeof notifications;
  npmRegistry: typeof npmRegistry;
  orchestrator: typeof orchestrator;
  plan: typeof plan;
  readmeAnalyzer: typeof readmeAnalyzer;
  repos: typeof repos;
  scorer: typeof scorer;
  settings: typeof settings;
  sharePrompts: typeof sharePrompts;
  streakTracker: typeof streakTracker;
  taskGenerator: typeof taskGenerator;
  todayView: typeof todayView;
  trafficIntelligence: typeof trafficIntelligence;
  users: typeof users;
  watchlist: typeof watchlist;
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
