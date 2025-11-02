import { NextResponse } from "next/server";

type APIResponse = {
    success: boolean;
    answer?: string;
    error?: string;
};

export async function POST(request: Request): Promise<NextResponse<APIResponse>> {
    try {
        const { prompt } = await request.json();

        const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                "model": "gpt-4o-mini",
                "messages": [
                    { "role": "user", "content": prompt }
                ]
            }),
        });

        const data = await aiResponse.json();
        // console.log("OpenAI API raw response:", data);
        
        if (!aiResponse.ok || data.error) {
            console.error("OpenAI API error:", data.error);
            return NextResponse.json(
                { 
                    success: false, 
                    error: data.error?.message || `OpenAI API error: ${aiResponse.status}` 
                },
                { status: aiResponse.status }
            );
        }
        
        const answer = data.choices?.[0]?.message?.content ?? data.choices?.[0]?.text;
        
        if (!answer) {
            console.error("No answer in OpenAI response:", data);
            return NextResponse.json(
                { success: false, error: "No answer received from OpenAI" },
                { status: 500 }
            );
        }
        
        return NextResponse.json({ success: true, answer });
    } catch (error) {
        console.error("Exception in API route:", error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Something went wrong" },
            { status: 500 }
        );
    }
}
