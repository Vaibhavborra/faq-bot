# Trailhead FAQ Bot

A serverless customer-help chatbot that answers questions using only a store's FAQ, powered by Claude on Amazon Bedrock.

**Live URL:** https://nhtkjglp7thihtwvxwcqkyzw6e0ntxxe.lambda-url.us-east-1.on.aws/

## Architecture

```
 Browser
    |  GET  -> chat page (index.html)
    |  POST -> {"question": "..."}
    v
 Lambda Function URL (public HTTPS endpoint)
    v
 AWS Lambda  "faq-bot"  (Python 3.13)
    |  runs as IAM role "faq-bot-role"
    |  temporary credentials issued by STS
    |
    +----------------------------> Amazon Bedrock
    |                               Claude Sonnet 4.6
    |                               (system prompt = faq.txt)
    v
 CloudWatch Logs  (/aws/lambda/faq-bot)
```

## Files

| File | Purpose |
|---|---|
| `faq.txt` | The only knowledge the bot is allowed to use |
| `chatbot.py` | Builds the system prompt and calls Claude on Bedrock; also a terminal chat loop |
| `lambda_function.py` | Lambda handler: GET serves the page, POST answers a question |
| `index.html` | Minimal chat UI |

## Resume bullets

- Built and deployed a serverless FAQ chatbot on AWS (Lambda, Function URLs, IAM, CloudWatch) that uses Claude Sonnet 4.6 on Amazon Bedrock to answer customer questions strictly from a curated knowledge base, refusing anything not covered.
- Secured the service with a least-privilege IAM execution role using short-lived STS credentials (no stored API keys), packaged Linux dependencies for Lambda, and set cost guardrails with AWS Budgets.

## How it works in 5 sentences

1. A visitor opens the Lambda Function URL, and the Lambda function returns a simple chat web page.
2. When they ask a question, the page sends it back to the same URL as a POST request.
3. The Lambda function, running under an IAM role that gets temporary credentials from STS, calls Claude on Amazon Bedrock.
4. Claude receives the whole FAQ in its system prompt with strict instructions to answer only from it, and to say it doesn't know otherwise.
5. The answer is returned to the browser as JSON, and every request is logged to CloudWatch so I can debug problems.

## Note on the model

The original plan targeted Claude Sonnet 5.5 via the Bedrock Mantle endpoint, but Claude 5.x models are not yet enabled for this AWS account ("not available for this account"). The bot therefore uses `us.anthropic.claude-sonnet-4-6` through the standard Bedrock Runtime API (`AnthropicBedrock` client), and the Lambda role has an inline policy `invoke-claude-sonnet-4-6` allowing `bedrock:InvokeModel` on that model only. To switch models later, set the `MODEL_ID` environment variable on the Lambda.
