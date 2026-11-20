# Trailhead Assistant: a serverless FAQ chatbot

A customer-help chatbot that answers questions using only a store's FAQ. It's built on Claude (Amazon Bedrock), Amazon Cognito and an Amplify UI frontend, and runs entirely on one AWS Lambda.

**Live:** https://nhtkjglp7thihtwvxwcqkyzw6e0ntxxe.lambda-url.us-east-1.on.aws/

## Features

- **Landing page** explaining the assistant, with Register / Sign in.
- **Accounts with Amazon Cognito User Pools**: email + password sign-up, email verification code, password reset. Built with the Amplify UI `Authenticator`.
- **Admin approval**: once a new user confirms their email, the admin gets an email with **Approve / Deny** buttons. Only approved users can sign in. Denying also signs the user out everywhere.
- **Stay signed in**: refresh tokens last 10 years, so approved users effectively stay logged in on their device.
- **Chat UI** built with Amplify UI's `AIConversation`: welcome card, suggested prompts, topic sidebar, at-a-glance facts, and follow-up questions with conversation context.
- **Grounded answers**: Claude only answers from `faq.txt` and says so when it doesn't know.

## Architecture

```
 Browser (React + Amplify UI)
    |  sign up / sign in (SRP) ----------------------> Amazon Cognito User Pool
    |                                                   |  PostConfirmation trigger -> email admin (SES)
    |                                                   |  PreAuthentication trigger -> allow only approved users
    |  GET pages, POST /api/ask (Bearer access token)   v
    v                                               AWS Lambda "faq-bot" (Python 3.13)
 Lambda Function URL  ---------------------------->   |  runs as IAM role "faq-bot-role" (temporary STS credentials)
                                                      |-- validates the token with Cognito GetUser
                                                      |-- Amazon Bedrock: Claude Sonnet 4.6 (system prompt = faq.txt)
                                                      |-- Amazon SES: approval emails with signed Approve/Deny links
                                                      '-- CloudWatch Logs (/aws/lambda/faq-bot)
```

The approval state lives on the Cognito user as `custom:approval` (`approved` / `denied`; unset means pending). The web app client can't write that attribute, so users can't approve themselves.

## Project layout

| Path | Purpose |
|---|---|
| `faq.txt` | The only knowledge the bot is allowed to use |
| `chatbot.py` | Builds the system prompt and calls Claude on Bedrock (with conversation history) |
| `lambda_function.py` | Serves the web app, the chat API, admin approval endpoints and the Cognito triggers |
| `frontend/` | React + Vite + Amplify UI app (`npm run build` outputs to `web/`) |
| `deploy.sh` | Builds the frontend, packages the Lambda and deploys it |

## AWS resources

| Resource | Name |
|---|---|
| Lambda + Function URL | `faq-bot` |
| IAM role | `faq-bot-role`: inline policies `invoke-claude-sonnet-4-6` and `cognito-and-email` |
| Cognito user pool / app client | `faq-bot-users` (`us-east-1_KDliM9vNW`) / `faq-bot-web` |
| SES identity | the admin email (sender and recipient of approval emails) |
| Budget | `monthly-10` ($10/month alerts) |

Lambda environment variables: `USER_POOL_ID`, `ADMIN_EMAIL`, `PUBLIC_URL`, `SECRET_KEY` (signs the approval links), optional `MODEL_ID`.

## Resume bullets

- Built and deployed a serverless customer-support chatbot on AWS (Lambda, Function URLs, Bedrock, Cognito, SES, IAM, CloudWatch) that uses Claude to answer questions strictly from a curated knowledge base, with conversation context for follow-ups.
- Implemented an invite-only account system with Amazon Cognito User Pools and Lambda triggers: email-verified sign-up, admin approval via HMAC-signed email links, server-side token validation and instant revocation. Built the frontend in React with AWS Amplify UI (Authenticator, AIConversation).

## How it works in 5 sentences

1. Visitors land on a React page built with Amplify UI and register with their name, email and password through Amazon Cognito, which emails them a verification code.
2. When they confirm, a Cognito trigger runs my Lambda, which emails me Approve and Deny buttons; those buttons are links signed with a secret so nobody else can forge them.
3. Approving sets a `custom:approval` attribute on the Cognito user, and a pre-sign-in trigger blocks anyone who isn't approved.
4. Once signed in, the chat page sends each question with the user's Cognito access token to the Lambda, which verifies the token and checks approval before calling Claude on Amazon Bedrock with the FAQ as its only source.
5. Everything runs on a single Lambda behind a Function URL with a least-privilege IAM role, logs go to CloudWatch, and a budget alert guards against surprise costs.

## Deploying changes

```bash
./deploy.sh
```

## Note on the model

The original plan targeted Claude Sonnet 5.5, but Claude 5.x models aren't enabled for this AWS account yet, so the bot uses `us.anthropic.claude-sonnet-4-6`. Set the Lambda's `MODEL_ID` environment variable to switch models later.
