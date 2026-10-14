import type Stripe from "stripe";
import { createPrintifyOrder } from "@/lib/printify";
import { shippingFromMetadata, splitRecipientName } from "@/lib/shipping";
import { getStripe } from "@/lib/stripe";

function orderLines(session: Stripe.Checkout.Session, listed: Stripe.ApiList<Stripe.LineItem>) {
  const lines = [];
  for (const item of listed.data) {
    const product = item.price?.product;
    if (!product || typeof product === "string" || product.deleted) continue;
    const productId = product.metadata.printify_product_id;
    const variantId = Number(product.metadata.printify_variant_id);
    const quantity = item.quantity ?? 0;
    if (!productId || !Number.isInteger(variantId) || variantId <= 0 || quantity < 1) {
      throw new Error(`Checkout session ${session.id} is missing a Printify line item`);
    }
    lines.push({ product_id: productId, variant_id: variantId, quantity });
  }
  if (lines.length === 0) {
    throw new Error(`Checkout session ${session.id} has no Printify line items`);
  }
  return lines;
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: "Webhook is not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "Missing signature" }, { status: 400 });
  }

  const payload = await request.text();
  let event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    console.error(
      "Stripe webhook signature failed",
      error instanceof Error ? error.message : "unknown",
    );
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    console.log(session);
    try {
      const shipping = shippingFromMetadata(session.metadata);
      const email = session.customer_details?.email ?? session.customer_email;
      if (!shipping || !email) {
        throw new Error(`Checkout session ${session.id} is missing a shipping address or email`);
      }
      const { first_name, last_name } = splitRecipientName(shipping.name);
      const phone = session.customer_details?.phone ?? undefined;
      const listed = await getStripe().checkout.sessions.listLineItems(session.id, {
        limit: 100,
        expand: ["data.price.product"],
      });
      const orderId = await createPrintifyOrder({
        externalId: session.id,
        lineItems: orderLines(session, listed),
        addressTo: {
          first_name,
          last_name,
          email,
          ...(phone ? { phone } : {}),
          country: shipping.country,
          region: shipping.region,
          address1: shipping.address1,
          city: shipping.city,
          zip: shipping.zip,
        },
      });
      console.log("Printify order created", orderId || session.id);
    } catch (error) {
      console.error("Printify order failed", error instanceof Error ? error.message : "unknown");
      return Response.json({ error: "Order creation failed" }, { status: 500 });
    }
  }

  return Response.json({ received: true });
}
