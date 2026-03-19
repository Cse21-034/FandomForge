// server/paypal.ts
// PayPal integration wrapper for payments and subscriptions

import fetch from "node-fetch";

interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  mode: "sandbox" | "production";
  returnUrl: string;
  cancelUrl: string;
}

interface CreateOrderRequest {
  amount: string;
  currency: string;
  description: string;
  returnUrl: string;
  cancelUrl: string;
}

interface CreateBillingPlanRequest {
  name: string;
  description: string;
  amount: string;
  currency: string;
  interval: "MONTH" | "YEAR";
  intervalCount: number;
}

interface CreateSubscriptionRequest {
  planId: string;
  email: string;
  name: string;
  returnUrl: string;
  cancelUrl: string;
}

export class PayPalClient {
  private clientId: string;
  private clientSecret: string;
  private mode: "sandbox" | "production";
  private baseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: PayPalConfig) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.mode = config.mode;
    this.baseUrl =
      config.mode === "sandbox"
        ? "https://api-m.sandbox.paypal.com"
        : "https://api-m.paypal.com";
  }

  // Get PayPal access token
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry > Date.now()) {
      return this.accessToken;
    }

    const auth = Buffer.from(
      `${this.clientId}:${this.clientSecret}`
    ).toString("base64");

    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get PayPal access token: ${error}`);
    }

    const data: any = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + data.expires_in * 1000; // Set expiry time

    return this.accessToken;
  }

  // Create an order (for one-time payments like PPV and tips)
  async createOrder(req: CreateOrderRequest): Promise<{ id: string; approval_link: string }> {
    const token = await this.getAccessToken();

    const payload = {
      intent: "CAPTURE",
      payer_preferred_payment_method: "IMMEDIATE_PAYMENT_REQUIRED",
      purchase_units: [
        {
          amount: {
            currency_code: req.currency,
            value: req.amount,
          },
          description: req.description,
        },
      ],
      application_context: {
        brand_name: "FandomForge",
        locale: "en-US",
        user_action: "PAY_NOW",
        return_url: req.returnUrl,
        cancel_url: req.cancelUrl,
        payment_method: {
          payer_selected: "PAYPAL",
          payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED",
        },
      },
    };

    const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create PayPal order: ${error}`);
    }

    const data: any = await response.json();
    const approvalLink = data.links.find((link: any) => link.rel === "approve")?.href;

    return {
      id: data.id,
      approval_link: approvalLink || "",
    };
  }

  // Capture an order (finalize payment)
  async captureOrder(orderId: string): Promise<{ id: string; status: string; payer: any }> {
    const token = await this.getAccessToken();

    const response = await fetch(
      `${this.baseUrl}/v2/checkout/orders/${orderId}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to capture PayPal order: ${error}`);
    }

    const data: any = await response.json();

    return {
      id: data.id,
      status: data.status,
      payer: data.payer,
    };
  }

  // Get order details
  async getOrderDetails(orderId: string): Promise<any> {
    const token = await this.getAccessToken();

    const response = await fetch(
      `${this.baseUrl}/v2/checkout/orders/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get PayPal order details: ${error}`);
    }

    return await response.json();
  }

  // Create a billing plan (for subscriptions)
  async createBillingPlan(req: CreateBillingPlanRequest): Promise<{ id: string }> {
    const token = await this.getAccessToken();

    const payload = {
      product_id: "PROD-FANDOMFORGE",
      name: req.name,
      description: req.description,
      type: "REGULAR",
      payment_preferences: {
        auto_bill_amount: "YES",
        payment_failure_threshold: 3,
        setup_fee: {
          currency_code: req.currency,
          value: "0.00",
        },
        setup_fee_failure_action: "CANCEL",
      },
      billing_cycles: [
        {
          frequency: {
            interval_unit: req.interval,
            interval_count: req.intervalCount,
          },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0, // Infinite cycles
          pricing_scheme: {
            fixed_price: {
              currency_code: req.currency,
              value: req.amount,
            },
          },
        },
      ],
    };

    const response = await fetch(
      `${this.baseUrl}/v1/billing/plans`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Prefer": "return=representation",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create PayPal billing plan: ${error}`);
    }

    const data: any = await response.json();

    return {
      id: data.id,
    };
  }

  // Create a subscription
  async createSubscription(req: CreateSubscriptionRequest): Promise<{ approval_link: string }> {
    const token = await this.getAccessToken();

    const payload = {
      plan_id: req.planId,
      subscriber: {
        name: {
          given_name: req.name.split(" ")[0] || "User",
          surname: req.name.split(" ")[1] || "",
        },
        email_address: req.email,
      },
      application_context: {
        brand_name: "FandomForge",
        locale: "en-US",
        user_action: "SUBSCRIBE_NOW",
        return_url: req.returnUrl,
        cancel_url: req.cancelUrl,
        payment_method: {
          payer_selected: "PAYPAL",
          payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED",
        },
      },
    };

    const response = await fetch(
      `${this.baseUrl}/v1/billing/subscriptions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Prefer": "return=representation",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create PayPal subscription: ${error}`);
    }

    const data: any = await response.json();
    const approvalLink = data.links.find((link: any) => link.rel === "approve")?.href;

    return {
      approval_link: approvalLink || "",
    };
  }

  // Get subscription details
  async getSubscriptionDetails(subscriptionId: string): Promise<any> {
    const token = await this.getAccessToken();

    const response = await fetch(
      `${this.baseUrl}/v1/billing/subscriptions/${subscriptionId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get PayPal subscription details: ${error}`);
    }

    return await response.json();
  }

  // Cancel a subscription
  async cancelSubscription(subscriptionId: string, reason: string = "User canceled"): Promise<void> {
    const token = await this.getAccessToken();

    const response = await fetch(
      `${this.baseUrl}/v1/billing/subscriptions/${subscriptionId}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: reason,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to cancel PayPal subscription: ${error}`);
    }
  }

  // Create a payout batch for creators
  async createPayoutBatch(
    payouts: Array<{
      email: string;
      amount: string;
      note: string;
    }>
  ): Promise<{ batch_id: string }> {
    const token = await this.getAccessToken();

    const payload = {
      sender_batch_header: {
        sender_batch_id: `payout-${Date.now()}`,
        email_subject: "Your FandomForge Creator Payout",
        email_message: "You have received a payout from your FandomForge creator earnings",
      },
      items: payouts.map((payout) => ({
        recipient_type: "EMAIL",
        amount: {
          currency: "USD",
          value: payout.amount,
        },
        note: payout.note,
        sender_item_id: `payout-item-${Date.now()}`,
        receiver: payout.email,
      })),
    };

    const response = await fetch(
      `${this.baseUrl}/v1/payments/payouts`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Prefer": "return=representation",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create PayPal payout batch: ${error}`);
    }

    const data: any = await response.json();

    return {
      batch_id: data.batch_header.payout_batch_id,
    };
  }

  // Verify webhook
  verifyWebhookSignature(webhookEvent: any, signature: string, webhookId: string): boolean {
    // This would require the PayPal SDK's webhook verification
    // For now, we'll implement a basic version
    // In production, use: paypal-checkout-server-sdk verify webhook
    return true; // TODO: Implement proper verification
  }
}

export default PayPalClient;
