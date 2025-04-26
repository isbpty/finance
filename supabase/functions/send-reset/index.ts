import { createClient } from "npm:@supabase/supabase-js@2.39.8";
import nodemailer from "npm:nodemailer@6.9.9";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { email, token } = await req.json();
    
    if (!email || !token) {
      throw new Error("Missing required parameters");
    }

    // Get mail config from system settings
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: configData, error: configError } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'mail_config')
      .single();

    if (configError || !configData?.value) {
      throw new Error("Failed to load mail configuration");
    }

    const config = configData.value;

    // Create SMTP transport
    const transport = nodemailer.createTransport({
      host: config.smtp_host,
      port: config.smtp_port,
      secure: config.encryption === "ssl",
      auth: {
        user: config.smtp_user,
        pass: config.smtp_pass,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const fromAddress = config.from_email || config.smtp_user;
    const fromName = config.from_name || "System Notifications";
    const baseUrl = Deno.env.get("PUBLIC_URL") || "http://localhost:5173";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    // Send reset email
    const info = await transport.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: email,
      subject: "Reset your password",
      text: `Click this link to reset your password: ${resetUrl}`,
      html: `
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password:</p>
        <p><a href="${resetUrl}">Reset Password</a></p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    });

    return new Response(
      JSON.stringify({
        success: true,
        messageId: info.messageId
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error sending reset email:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 500,
      }
    );
  }
});