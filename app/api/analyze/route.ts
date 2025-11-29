// app/api/analyze/route.ts
import { model } from "@/lib/gemini";
import { NextResponse } from "next/server";
import dns from "node:dns";
import { z } from "zod";

// 1. FORCE IPv4 (Fixes the "fetch failed" error)
dns.setDefaultResultOrder("ipv4first");

// Define the schema for validation
const BillDataSchema = z.object({
  billing_period: z.string(),
  billing_days: z.number().optional(),
  total_amount_due: z.number(),
  currency: z.string(),
  total_usage_kwh: z.number(),
  payment_due_date: z.string(),
  breakdown_charges: z.array(
    z.object({
      description: z.string(),
      amount: z.number(),
    })
  ),
  // New Fields
  average_daily_usage: z.number().nullable().optional(),
  average_monthly_usage: z.number().nullable().optional(),
  generation_cost: z.number().nullable().optional(),
  green_incentive: z.number().nullable().optional(),
  usage_history: z.array(
    z.object({
      month: z.string(),
      usage_kwh: z.number(),
    })
  ).nullable().optional(),
});

export async function POST(req: Request) {
  try {
    // 2. CHECK API KEY (Optional double-check, though lib/gemini handles it too)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    // 3. USE SHARED MODEL FROM LIB
    // const model = ... (imported from @/lib/gemini)

    const prompt = `
      Analyze this electric bill PDF. Extract data into raw JSON.
      
      Required keys: 
      - billing_period (string): The date range of the bill.
      - billing_days (number): The number of days in this billing period.
      - total_amount_due (number)
      - currency (string)
      - total_usage_kwh (number)
      - payment_due_date (string)
      - breakdown_charges (array of {description, amount})
      
      Optional keys (Try your best to find or calculate these):
      - average_daily_usage (number): Average kWh per day. IF NOT FOUND, CALCULATE IT: total_usage_kwh / billing_days.
      - average_monthly_usage (number): Average kWh per month. IF NOT FOUND AND billing_days is between 28-32, USE total_usage_kwh.
      - generation_cost (number): Total cost related to generation/supply. Look for "Supply Charges", "Generation Charges", "Energy Charges", or "Cost of Electricity".
      - green_incentive (number): Any credits or incentives for green energy. Look for "Solar Credit", "Renewable Incentive", "Export Credit". Return positive number.
      - usage_history (array of {month: string, usage_kwh: number}): Extract up to 6 months of historical usage data if a chart or table is present. Month should be short name (e.g., "Jan", "Feb").

      Ensure 'total_amount_due', 'total_usage_kwh', and amounts in 'breakdown_charges' are numbers.
      Do not use Markdown. Return ONLY the JSON object.
    `;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: "application/pdf" } },
    ]);

    const responseText = result.response.text();

    // 4. CLEANUP RESPONSE
    let cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const firstBrace = cleanedText.indexOf("{");
    const lastBrace = cleanedText.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
    }

    // 5. PARSE AND VALIDATE
    let parsedData;
    try {
      parsedData = JSON.parse(cleanedText);
    } catch (e) {
      console.error("JSON Parse Error:", e);
      console.error("Raw Text:", responseText);
      return NextResponse.json(
        { error: "Failed to parse AI response as JSON", details: responseText },
        { status: 500 }
      );
    }

    const validationResult = BillDataSchema.safeParse(parsedData);

    if (!validationResult.success) {
      console.error("Validation Error:", validationResult.error);
      return NextResponse.json(
        { error: "Data validation failed", details: validationResult.error.format() },
        { status: 500 }
      );
    }

    return NextResponse.json(validationResult.data);

  } catch (error: any) {
    console.error("Server Error Details:", error);
    return NextResponse.json(
      { error: "Analysis failed", details: error.message },
      { status: 500 }
    );
  }
}