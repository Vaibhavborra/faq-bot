"""A tiny FAQ chatbot: Claude on Amazon Bedrock answers only from faq.txt."""
import os
from pathlib import Path

from anthropic import AnthropicBedrock

MODEL_ID = os.environ.get("MODEL_ID", "us.anthropic.claude-sonnet-4-6")
REGION = os.environ.get("AWS_REGION", "us-east-1")

FAQ_TEXT = (Path(__file__).parent / "faq.txt").read_text()

SYSTEM_PROMPT = f"""You are the customer help assistant for Trailhead Outfitters.
Answer the customer's question using ONLY the FAQ below.
If the FAQ does not contain the answer, reply exactly:
"Sorry, I don't have that information. Please contact customer service."
Never guess or invent prices, dates, or policies. Keep answers to 1-3 sentences.
Earlier messages in the conversation are context for follow-up questions
(e.g. "how much is that?"); still answer only from the FAQ.

<faq>
{FAQ_TEXT}
</faq>"""

client = AnthropicBedrock(aws_region=REGION)


def ask(question: str, history: list[dict] | None = None) -> str:
    """Answer a question. `history` is earlier turns: [{"role": "user"|"assistant", "content": str}]."""
    messages = []
    for turn in (history or [])[-10:]:
        role, content = turn.get("role"), str(turn.get("content", "")).strip()[:1000]
        if role not in ("user", "assistant") or not content:
            continue
        if not messages and role != "user":
            continue  # conversation must start with the user
        if messages and messages[-1]["role"] == role:
            messages[-1]["content"] += "\n" + content
        else:
            messages.append({"role": role, "content": content})
    if messages and messages[-1]["role"] == "user":
        messages.pop()  # keep strict user/assistant alternation before the new question
    messages.append({"role": "user", "content": question})
    response = client.messages.create(
        model=MODEL_ID,
        max_tokens=4000,
        system=SYSTEM_PROMPT,
        output_config={"effort": "low"},
        messages=messages,
    )
    if response.stop_reason == "refusal":
        return "Sorry, I can't help with that request."
    return "".join(block.text for block in response.content if block.type == "text").strip()


if __name__ == "__main__":
    print(f"FAQ chatbot using {MODEL_ID} in {REGION}. Type 'quit' to exit.\n")
    while True:
        question = input("You: ").strip()
        if question.lower() in {"quit", "exit", ""}:
            break
        print("Bot:", ask(question), "\n")
