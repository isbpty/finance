import { createClient } from "npm:@supabase/supabase-js@2.39.8";
import nodemailer from "npm:nodemailer@6.9.9";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { config } = await req.json();
    
    // Enhanced validation with specific error messages
    if (!config) {
      throw new Error("No configuration provided");
    }

    const requiredFields = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass'];
    const missingFields = requiredFields.filter(field => !config[field]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required SMTP configuration: ${missingFields.join(', ')}`);
    }

    // Validate port number
    if (typeof config.smtp_port !== 'number' || config.smtp_port <= 0 || config.smtp_port > 65535) {
      throw new Error("Invalid SMTP port number");
    }

    // Get the authenticated user's email for testing
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError) {
      throw new Error(`Authentication error: ${authError.message}`);
    }

    if (!user || !user.email) {
      throw new Error("User email not found");
    }

    // Create SMTP transport with detailed error handling
    let transport;
    try {
      transport = nodemailer.createTransport({
        host: config.smtp_host,
        port: config.smtp_port,
        secure: config.encryption === "ssl",
        auth: {
          user: config.smtp_user,
          pass: config.smtp_pass,
        },
        tls: {
          rejectUnauthorized: false
        },
        // Add connection timeout
        connectionTimeout: 10000, // 10 seconds
        socketTimeout: 10000, // 10 seconds
      });
    } catch (error) {
      console.error("Failed to create SMTP transport:", error);
      throw new Error(`Failed to create SMTP connection: ${error.message}`);
    }

    console.log(`Attempting to connect to SMTP server: ${config.smtp_host}:${config.smtp_port}`);

    // Verify SMTP connection with timeout
    try {
      await Promise.race([
        transport.verify(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("SMTP connection timeout")), 10000)
        )
      ]);
      console.log("Successfully connected to SMTP server");
    } catch (error) {
      console.error("SMTP verification failed:", error);
      throw new Error(`Failed to connect to SMTP server: ${error.message}`);
    }

    const fromAddress = config.from_email || config.smtp_user;
    const fromName = config.from_name || "System Test";

    // Send test email with timeout
    try {
      const info = await Promise.race([
        transport.sendMail({
          from: `"${fromName}" <${fromAddress}>`,
          to: user.email,
          subject: "Test Email from Your Application",
          text: `
            This is a test email to verify your SMTP configuration.
            
            Configuration tested:
            - Server: ${config.smtp_host}:${config.smtp_port}
            - Encryption: ${config.encryption}
            - From: ${fromName} <${fromAddress}>
            
            If you received this email, your SMTP configuration is working correctly.
          `,
          html: `
            <h2>Test Email Configuration</h2>
            <p>This is a test email to verify your SMTP configuration.</p>
            
            <h3>Configuration tested:</h3>
            <ul>
              <li>Server: ${config.smtp_host}:${config.smtp_port}</li>
              <li>Encryption: ${config.encryption}</li>
              <li>From: ${fromName} &lt;${fromAddress}&gt;</li>
            </ul>
            
            <p>If you received this email, your SMTP configuration is working correctly.</p>
          `
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Timeout sending test email")), 30000)
        )
      ]);

      console.log("Test email sent successfully:", info);

      return new Response(
        JSON.stringify({ 
          message: "Test email sent successfully",
          details: {
            messageId: info.messageId,
            recipient: user.email,
            smtpServer: config.smtp_host,
            encryption: config.encryption
          }
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
      console.error("Failed to send test email:", error);
      throw new Error(`Failed to send test email: ${error.message}`);
    }
  } catch (error) {
    console.error("Error in test-email function:", error);

    // Ensure we return a structured error response
    const errorMessage = error.message || "Failed to send test email";
    const errorDetails = error.stack || "";
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: errorDetails
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