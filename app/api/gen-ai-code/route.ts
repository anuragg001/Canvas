import { CREDIT_COST_PER_GENERATION } from "@/lib/constants";
import { db } from "@/lib/prisma";
import { FileData, Message } from "@/types/workspace";
import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";
// import { aj } from "@/lib/arcjet";  
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEN_AI_KEY! });

function trimHistory(messages: Message[]): Message[] {
    if (messages.length <= 10) {
        return messages;
    }
    return [messages[0], ...messages.slice(-8)];
}

function buildContents(messages: Message[], fileData: FileData | null) {
    const trimmed = trimHistory(messages);

    return trimmed.map((msg, idx) => {
        const role = msg.role === "assistant" ? "modal" : "user";

        if (msg.role === "user") {
            const parts: object[] = [];

            let text = msg.content;

            // what this is doing is if the user has attached an image, we want to include the image URL in the prompt that we send to the gen AI model. This way, the model can use the image as context when generating the app. The text that we are building will include a note about the attached image and its URL, followed by the original user message content. This allows the gen AI model to understand that there is an image associated with the user's message and to use that information when generating the app.
            if (msg.imageUrl) {
                text = `[The user has attached ans image. Use this URL directly in the genrated app where  relavant (as img src, background-image, etc.): ${msg.imageUrl} ]\n\n ${text}`;
            }

            // what this is doing is if this is the last message in the trimmed history and there is file data available, we want to include the file data in the prompt that we send to the gen AI model. This way, the model can use the file data as context when generating the app. The text that we are building will include a note about the current project files and their contents, followed by the original user message content. This allows the gen AI model to understand that there are project files associated with the user's message and to use that information when generating the app.
            const isLast = idx === trimmed.length - 1;
            if (isLast && fileData) {
                text +=
                    "n\nCurrent project files for context:\n" +
                    JSON.stringify(fileData, null, 2);
            }


            parts.push({ text });
            return { role, parts };


        }
        return { role, parts: [{ text: msg.content }] }
    })
}

function extractThoughtLabel(text:string):string | null {
    //Try to grab **bold heading** at the start

    const boldMatch = text.match(/\*\*([^*]{4,60})\*\*/);
    if(boldMatch){
        return boldMatch[1].trim();
    }

    //fall back to first sentence (up to first , or \n) , capped at 60 chars
    const sentence = text.split(/[\n,.]/)[0].trim();

    if(sentence.length >= 8  && sentence.length<=80){
        return sentence;
    }
    return null;
}

function sseEvent(type:string , payload:object):string{
    return `data: ${JSON.stringify({type, ...(payload as object) })}\n\n`;
}

async function validateDependencies(
    deps: Record<string,string>
):Promise<Record<string,string>>{
    const valid : Record<string,string> = {};

    await Promise.all(
        Object.entries(deps).map(async ([pkg,version])=>{
            try{
                const res = await fetch(`https://registry.npmjs.org/${pkg}/latest`,{
                    signal : AbortSignal.timeout(1500)
                });
                if(res.ok){
                    valid[pkg] = version;
                }
            }catch(error){
                // silently ignore hallucinated packages
            }
        })
    )
    return valid;
}

const SYSTEM_PROMPT = `You are an expert React developer. Your job is to generate complete, working React applications based on user prompts.

RULES:
1. Always respond with a valid JSON object — no markdown fences, no extra text.
2. The JSON must match this exact shape:
{
  "assistantMessage": "<brief explanation of what you built/changed>",
  "title": "<short 2-4 word title for the app, e.g. 'Todo List App'>",
  "files": {
    "/App.js": { "code": "<full file content>" },
    "/components/SomeComponent.js": { "code": "<full file content>" }
  },
  "dependencies": {
    "some-package": "latest"
  }
}
3. Use React (functional components + hooks). Do NOT use TypeScript in generated files.
4. Use Tailwind CSS for all styling. Do not use CSS modules or inline styles unless absolutely necessary.
5. The entry point must always be /App.js and must export a default component.
6. All imports must reference files you include in "files" or packages in "dependencies".
7. Do not include react, react-dom, or tailwindcss in "dependencies" — they are always available.
8. When modifying existing code, include ALL files (both changed and unchanged) in "files".
9. Keep code clean, readable, and production-quality.
10. If the user attaches an image, use it as a design reference and match the layout/style as closely as possible.`;







export async function POST(request: NextRequest) {
    const { userId: clerkId } = await auth();
    //just renaming to clerkid
    if (!clerkId) {
        return Response.json({ error: "Unauthorized" }, { status: 401 })
    }


    const body = await request.json();
    const { workspaceId, userId, messages, fileData } = body as {
        workspaceId: string | null;
        userId: string;
        messages: Message[];
        fileData: FileData | null;
    };

    if (!messages?.length) {
        return Response.json({ message: "No messages provided" }, { status: 400 })
    }

    // arcjet reate limiting  prompt injection sensitve info
    // const lastUserMessage = 
    // [...messages].reverse().find((m)=> m.role === "user")?.content ?? "";

    // const decision = await aj.protect(request,{
    //     requested: 1,
    //     userId: clerkId,
    //     detectPromptInjectionMessage: lastUserMessage, 
    // })
    // if(decision.isDenied()){
    //     // returns the reason type as the message - ratelimit, bot , promptInjection, etc
    //     return Response.json({
    //         message: decision.reason?.type ?? "Request denied by Arcjet"
    //     },{
    //         status: 429
    //     })
    // }


    //if user exist on our db 
    const user = await db.user.findUnique({
        where: {
            // id: userId,
            clerkId
        },
        select: {
            id: true,
            credits: true
        }
    });

    if (!user) {
        return Response.json({ message: "user Not Found" }, { status: 404 });
    }
    if (user.credits < CREDIT_COST_PER_GENERATION) {
        return Response.json({ message: "Not enough credits" }, { status: 403 })
    }

    // about TextEncoder -> interface enables you to encode a JavaScript string using UTF-8.
    const encoder = new TextEncoder();

    //about readable stream -> The ReadableStream interface of the Streams API represents a readable stream of data. A stream represents a sequence of data that is being received over time. The ReadableStream interface provides methods for reading from the stream, as well as controlling the flow of data.
    //here use for data coming from gemini
    const stream = new ReadableStream({
        async start(controller) {
            const enqueue = (chunk: string) =>
                controller.enqueue(encoder.encode(chunk));

            try {
                const contents = buildContents(messages, fileData);

                const geminiStream = await ai.models.generateContentStream({
                    model: "gemini-2.5-flash",
                    contents,
                    config: {
                        systemInstruction: SYSTEM_PROMPT,
                        temperature: 0.7,
                        responseMimeType: "application/json",
                        thinkingConfig: {
                            includeThoughts: true,
                        },
                    },
                });

                let accumulated = ""; // collect the actual JSON output chunks
                let lastEmitTime = 0; // used to  throttle thought->status emisson

                for await (const chunk of geminiStream) {
                    const parts = chunk.candidates?.[0]?.content?.parts ?? [];

                    for (const part of parts) {
                        if (!part.text) continue;

                        if (part.thought) {
                            // thought chunks are gemini's internal reasoning - verbose and freequent
                            // we throttle  to one status update per 600ms and extract just the 
                            // bold heading or first  sentence  so the ui stays clean

                            const now = Date.now();
                            if (now - lastEmitTime > 600) {
                                const label = extractThoughtLabel(part.text);

                                if (label) {
                                    enqueue(sseEvent("status", { messsage: label }))
                                    lastEmitTime = now;
                                }
                            }
                        }else{
                            //Non thought  parts are the actual JSON output - accumulate them 
                            accumulated += part.text;
                        }
                    }
                    
                }
                // Parse JSON 
                // if the gemini returns malformed JSON  we abort here without deducting  a credit 
                // this is "no charge on AI failure " gurantee
                let parsed: {
                    assistantMessage: string;
                    title?: string;
                    files: Record<string, {code : string}>;
                    dependencies: Record<string, string>;

                };

                try{
                    parsed = JSON.parse(accumulated);
                }catch(error){
                    enqueue(
                        sseEvent("error",{
                            message: "Ai returned malformed JSON. Please try again.",
                        })
                    )
                    controller.close();
                    return; 
                }

                const {
                    assistantMessage,
                    title:aiTitle,
                    files,
                    dependencies
                } = parsed;

                if(!files || typeof files !== "object"){
                    enqueue(
                        sseEvent("error",{
                            message: "Ai returned invalid files object. Please try again.",
                        })
                    )
                    controller.close();
                    return ;
                }

                // validate npm package 
                // GEmini sometimes hallucinates pacakge names that don't exist on npm
                // we hit the npm registry for each dep and silently drop any fakes
                // real packages pass through unchanged

                enqueue(sseEvent("status",{message:"Validating packages..."}));

                const validatedDeps = await validateDependencies(dependencies ?? {});
                const newFileData: FileData = {
                    files,
                    dependencies: validatedDeps,
                    title:aiTitle,
                }


                // upsert workspace + deduct credit  (single txn)
                // atomic : if either the db write  or the credit deduction fails
                // neihter happens - user never loses a credit for a failed generation
                // workspaceId is null on first genration -> create, string -> update.

                enqueue(sseEvent("status",{message:"Saving to workspace..."}));

                const lastUserMsg = messages[messages.length - 1];
                const updatedMessages: Message[] = [
                    ...messages,
                    {role: "assistant",content: assistantMessage},
                ];


                const workspace = await db.$transaction(async (tx)=>{

                
                    const ws = workspaceId
                    ? await  tx.workspace.update({
                        where: {id: workspaceId},
                        data:{
                            messages: updatedMessages as never,
                            fileData: newFileData as never,
                        },
                    })
                    :await  tx.workspace.create({
                        data:{
                            userId,
                            // Use ai generated title if available, otherwise fallback to first 80
                            //chars of the user' prompt

                            title: aiTitle ?? lastUserMsg.content.slice(0,80),
                            messages: updatedMessages as never,
                            fileData: newFileData as never,
                        }
                    })
                    await tx.user.update({
                       where:{ id: userId},
                       data:{
                           credits: { decrement: CREDIT_COST_PER_GENERATION }
                       }
                   })
                   return ws;
            },{timeout: 20000});




                // Re-fetch updated credit balance to return accurate value to the client
                // The client updates its local credits state from this - no page refres needed

                const updatedUser = await db.user.findUnique({
                    where:{id:userId},
                    select:{credits:true}
                })


                // Final done event
                // cllient recieves this, updates sandpack with new files.
                // adds the assistant message to the chat history updates the credits badge

                enqueue(
                    sseEvent("done",{
                        workspaceId: workspace.id,
                        assistantMessage,
                        fileData: newFileData,
                        creditsRemaining:
                        updatedUser?.credits ?? user.credits - CREDIT_COST_PER_GENERATION, // fallback in case user record is not found, should never happen
                    })
                )
            } catch (error) {
                console.error("Error in generation stream:", error);
                enqueue(
                    sseEvent("error",{
                        message: "An error occurred during generation. Please try again.",
                    })
                )
            }finally {
                // always close the stream when done or on error
                controller.close();
            }
        }
    }); 

    return new Response(stream, {
        headers:{
            "Content-Type":"text/event-stream",
            "Cache-Control":"no-cache",
            Connection:"keep-alive",
        }
    })
}

// vercel fluids to increase the serveless function timeout from the default 10s to 60s for this endpoint, as gen AI generation can sometimes take longer than 10s. This is set in the vercel.json file with the "functions" config.

export const runtime = "nodejs";
export const maxDuration = 300;