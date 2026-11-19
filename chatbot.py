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

<faq>
{FAQ_TEXT}
</faq>"""

client = AnthropicBedrock(aws_region=REGION)


def ask(question: str) -> str:
    response = client.messages.create(
        model=MODEL_ID,
        max_tokens=4000,
        system=SYSTEM_PROMPT,
        output_config={"effort": "low"},
        messages=[{"role": "user", "content": question}],
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
