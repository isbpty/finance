import { createClient } from "npm:@supabase/supabase-js@2.39.8";
import nodemailer from "npm:nodemailer@6.9.9";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const SMTP_TIMEOUT = 10000; // 10 seconds
const EMAIL_TIMEOUT = 30000; // 30 seconds
const FETCH_TIMEOUT = 5000; // 5 seconds

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204, // No content for OPTIONS
      headers: corsHeaders,
    });
  }

  // Ensure the request is a POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  try {
    // Add request timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), EMAIL_TIMEOUT);

    try {
      const { type, email, token } = await req.json();
      
      if (!email || !type || !token) {
        throw new Error("Missing required parameters");
      }

      // Get mail config from system settings with timeout
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Missing Supabase configuration");
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      // Add timeout to Supabase fetch
      const fetchConfigPromise = supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'mail_config')
        .single();

      const configTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Config fetch timeout")), FETCH_TIMEOUT);
      });

      const { data: configData, error: configError } = await Promise.race([
        fetchConfigPromise,
        configTimeoutPromise
      ]);

      if (configError) {
        console.error("Error fetching mail configuration:", configError);
        throw new Error("Failed to load mail configuration");
      }

      if (!configData?.value) {
        throw new Error("Mail configuration not found");
      }

      const config = configData.value;

      // Validate required SMTP configuration
      const requiredFields = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass'];
      const missingFields = requiredFields.filter(field => !config[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required SMTP configuration: ${missingFields.join(', ')}`);
      }

      // Create SMTP transport with improved error handling and timeouts
      const transport = nodemailer.createTransport({
        host: config.smtp_host,
        port: parseInt(config.smtp_port, 10),
        secure: config.encryption === "ssl",
        auth: {
          user: config.smtp_user,
          pass: config.smtp_pass,
        },
        tls: {
          rejectUnauthorized: false,
          minVersion: "TLSv1.2"
        },
        connectionTimeout: SMTP_TIMEOUT,
        greetingTimeout: SMTP_TIMEOUT,
        socketTimeout: SMTP_TIMEOUT,
      });

      // Verify SMTP connection with timeout
      try {
        const verifyPromise = transport.verify();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("SMTP verification timeout")), SMTP_TIMEOUT);
        });
        
        await Promise.race([verifyPromise, timeoutPromise]);
      } catch (verifyError) {
        console.error("SMTP connection verification failed:", verifyError);
        throw new Error(`Failed to connect to SMTP server: ${verifyError.message}`);
      }

      const fromAddress = config.from_email || config.smtp_user;
      const fromName = config.from_name || "System Notifications";

      let subject = '';
      let text = '';
      let html = '';

      // Get base URL from environment or request origin with fallback
      const baseUrl = Deno.env.get("PUBLIC_URL") || 
                     req.headers.get("Origin") || 
                     "http://localhost:5173";

      if (type === 'CONFIRM_EMAIL') {
        subject = 'Confirm your email address';
        const confirmUrl = `${baseUrl}/confirm-email?token=${token}`;
        text = `Please confirm your email address by clicking this link: ${confirmUrl}`;
        html = `
          <h2>Welcome!</h2>
          <p>Please confirm your email address by clicking the link below:</p>
          <p><a href="${confirmUrl}">Confirm Email Address</a></p>
        `;
      } else if (type === 'RESET_PASSWORD') {
        subject = 'Reset your password';
        const resetUrl = `${baseUrl}/reset-password?token=${token}`;
        text = `Click this link to reset your password: ${resetUrl}`;
        html = `
          <h2>Password Reset Request</h2>
          <p>Click the link below to reset your password:</p>
          <p><a href="${resetUrl}">Reset Password</a></p>
          <p>If you didn't request this, please ignore this email.</p>
        `;
      } else {
        throw new Error("Invalid email type");
      }

      // Send email with timeout
      try {
        const sendPromise = transport.sendMail({
          from: `"${fromName}" <${fromAddress}>`,
          to: email,
          subject,
          text,
          html
        });

        const info = await Promise.race([
          sendPromise,
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Send email timeout")), SMTP_TIMEOUT);
          })
        ]);

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
      } catch (sendError) {
        console.error("Failed to send email:", sendError);
        throw new Error(`Failed to send email: ${sendError.message}`);
      }
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.error("Error in send-email function:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack,
        timestamp: new Date().toISOString()
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