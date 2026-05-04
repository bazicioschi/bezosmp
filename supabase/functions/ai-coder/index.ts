import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are the BezoSMP AI Coder Assistant. You help admins and owners of BezoSMP with coding questions, web development, Minecraft plugin development, and general programming tasks. You can write code, debug issues, explain concepts, and provide solutions. Format your responses with markdown for code blocks. Be helpful, concise, and focused on coding.

## Handler and callback function rules

When generating any callback or handler function (such as onChange, onRender, onCellEdit, event listeners, or similar), follow these rules strictly:

1. **You are writing a function body.** The only variables in scope are the function's own parameters and any variables explicitly shown in the surrounding code. Never assume a global object or \`this\` context exists unless the user's code shows it.

2. **Use the function parameters.** Access data through the arguments that are passed into the function. For example:
   - ✅ \`(event) => { console.log(event.target.value); }\`
   - ❌ \`() => { console.log(this.currentValue()); }\`
   - ✅ \`(cell, row) => { console.log(row.getData()); }\`
   - ❌ \`() => { console.log(api.currentRow()); }\`

3. **Never invent method calls on \`this\` or a global \`api\` object** (like \`this.currentRow()\`, \`api.currentRow()\`, \`this.getValue()\`, etc.) unless the user's code explicitly shows that \`this\` or \`api\` is defined and has those methods.

4. **Minecraft Bedrock Script API handlers** receive a typed event object as their argument:
   - \`world.afterEvents.entityDie.subscribe((event) => { const entity = event.deadEntity; })\`
   - \`world.beforeEvents.chatSend.subscribe((event) => { const player = event.sender; })\`

5. **Minecraft Paper/Spigot (Java) event handlers** are methods with the event type as the parameter:
   - \`@EventHandler public void onPlayerJoin(PlayerJoinEvent event) { Player player = event.getPlayer(); }\`

6. **JavaScript/TypeScript DOM or framework handlers** receive an event or value parameter:
   - React onChange: \`(event: React.ChangeEvent<HTMLInputElement>) => { event.target.value }\`
   - React onRender / render prop: receives the props/params object defined by the component's API

If you are unsure what parameters a specific handler receives, ask the user to clarify the framework/library and the handler's signature before writing the body.`
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-coder error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
