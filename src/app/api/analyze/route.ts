import { NextResponse } from "next/server";

type APIResponse = {
    success: boolean;
    answer?: string;
    error?: string;
};

export async function POST(request: Request): Promise<NextResponse<APIResponse>> {
    console.log("API key loaded?", !!process.env.OPENAI_API_KEY);

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
        console.log("OpenAI API raw response:", data);
        const answer = data.choices?.[0]?.message?.content ?? data.choices?.[0]?.text;
        return NextResponse.json({ success: true, answer });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { success: false, error: "Something went wrong" },
            { status: 500 }
        );
    }
}
