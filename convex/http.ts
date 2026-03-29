import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

// Mount Convex Auth routes (handles GitHub OAuth callback)
auth.addHttpRoutes(http);

// DodoPayments webhook endpoint
http.route({
  path: "/webhooks/dodo",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.text();
    const signature = request.headers.get("webhook-signature") ?? "";

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(body);
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const eventType = payload.type as string;

    // Handle subscription lifecycle events
    if (
      eventType === "subscription.active" ||
      eventType === "subscription.renewed"
    ) {
      const data = payload.data as Record<string, unknown>;
      const customerId = data.customer_id as string;
      const subscriptionId = data.subscription_id as string;
      const productId = data.product_id as string;

      await ctx.runMutation(internal.billing.activateSubscription, {
        customerId,
        subscriptionId,
        productId,
      });
    } else if (
      eventType === "subscription.cancelled" ||
      eventType === "subscription.expired" ||
      eventType === "subscription.failed"
    ) {
      const data = payload.data as Record<string, unknown>;
      const customerId = data.customer_id as string;

      await ctx.runMutation(internal.billing.cancelSubscription, {
        customerId,
      });
    } else if (eventType === "subscription.plan_changed") {
      const data = payload.data as Record<string, unknown>;
      const customerId = data.customer_id as string;
      const productId = data.product_id as string;

      await ctx.runMutation(internal.billing.changePlan, {
        customerId,
        productId,
      });
    }

    return new Response("OK", { status: 200 });
  }),
});

export default http;
