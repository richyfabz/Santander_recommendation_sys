# chat_routes.py — HuggingFace chatbot inference + Brevo email summary
#
# This blueprint handles two responsibilities:
#   1. POST /api/v1/chat  — receives a message + conversation history,
#      sends it to Mistral-7B on HuggingFace, returns the reply
#   2. POST /api/v1/chat/summary — receives full conversation history,
#      generates a structured summary, emails it to the agent via Brevo

import os
import json
import logging
import requests
from datetime import datetime
from flask import Blueprint, request, jsonify

# Brevo (formerly Sendinblue) Python SDK for transactional email
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException

logger = logging.getLogger(__name__)

chat_bp = Blueprint('chat', __name__, url_prefix='/api/v1')

# ── HuggingFace configuration ─────────────────────────────────────────────────
# Mistral-7B-Instruct is the primary model — it follows system prompts
# reliably and produces coherent multi-turn conversation
HF_API_TOKEN  = os.getenv('HF_API_TOKEN')
PRIMARY_MODEL  = 'meta-llama/Llama-3.1-8B-Instruct'
FALLBACK_MODEL = 'meta-llama/Meta-Llama-3-8B-Instruct'
HF_BASE_URL    = 'https://router.huggingface.co/novita/v3/openai/chat/completions'

# ── Brevo configuration ───────────────────────────────────────────────────────
BREVO_API_KEY  = os.getenv('BREVO_API_KEY')
AGENT_EMAIL    = 'dammifabz@gmail.com'
SENDER_EMAIL   = 'noreply@recsys.demo'
SENDER_NAME    = 'RecSys Chatbot'

# ── System prompt ─────────────────────────────────────────────────────────────
# This is injected at the start of every conversation to give the model
# context about what it is and what products it knows about.
# Keeping it concise reduces token usage and improves response speed.
SYSTEM_PROMPT = """You are a helpful financial product advisor for Santander Bank.
You answer questions about the following banking products clearly and simply:

- Current Account: everyday account for payments and direct debits
- Savings Account: earn interest on money you set aside
- Credit Card: flexible payment line with monthly settlement
- Payroll Account: account that receives your salary with rewards
- Mortgage: long-term loan for buying property
- Pension Plan: long-term retirement savings with tax advantages
- Direct Debit: automate recurring bill payments
- Loans: personal or business lending
- Funds: managed investment portfolios
- Securities: equity and bond access
- e-Account: digital-first account, no branch visits needed
- Junior Account: designed for young customers under 18
- Pensions: long-term security and asset protection
- Short/Medium/Long-term Deposits: capital preservation at different horizons

Keep your answers short, friendly, and jargon-free.
If asked about something unrelated to banking, politely redirect.
Never provide specific interest rates or legal advice."""


def build_mistral_prompt(history, new_message):
    """
    Build a Mistral-format prompt string from conversation history.

    Mistral-7B-Instruct uses a specific prompt template:
      <s>[INST] system_message + user_message [/INST] assistant_reply </s>
      [INST] next_user_message [/INST]

    We prepend the system prompt to the first user message so the model
    understands its role from the very first turn.

    Args:
        history: list of {"role": "user"|"assistant", "content": "..."} dicts
        new_message: the latest user message string

    Returns:
        str: fully formatted prompt ready to send to HuggingFace
    """
    prompt = '<s>'

    # Inject system context into the first user turn
    first_user = True
    for msg in history:
        if msg['role'] == 'user':
            if first_user:
                # First message: prepend system prompt
                prompt += f"[INST] {SYSTEM_PROMPT}\n\n{msg['content']} [/INST]"
                first_user = False
            else:
                prompt += f"[INST] {msg['content']} [/INST]"
        elif msg['role'] == 'assistant':
            prompt += f" {msg['content']} </s>"

    # Add the new incoming message
    if first_user:
        # No history yet — first message in conversation
        prompt += f"[INST] {SYSTEM_PROMPT}\n\n{new_message} [/INST]"
    else:
        prompt += f"[INST] {new_message} [/INST]"

    return prompt


def call_huggingface(prompt, model):
    headers = {
        'Authorization': f'Bearer {HF_API_TOKEN}',
        'Content-Type' : 'application/json',
    }
    payload = {
        'model': model,
        'messages': [
            {'role': 'system', 'content': SYSTEM_PROMPT},
            {'role': 'user',   'content': prompt},
        ],
        'max_tokens' : 300,
        'temperature': 0.7,
    }

    try:
        response = requests.post(HF_BASE_URL, headers=headers, json=payload, timeout=30)

        if response.status_code == 503:
            logger.warning(f"Model {model} loading")
            return None
        if response.status_code != 200:
            logger.error(f"HuggingFace error {response.status_code}: {response.text}")
            return None

        result = response.json()
        return result['choices'][0]['message']['content'].strip()

    except requests.exceptions.Timeout:
        logger.error(f"HuggingFace request timed out for model {model}")
        return None
    except Exception as e:
        logger.error(f"HuggingFace request failed: {e}")
        return None


def send_summary_email(conversation_history, user_name='Anonymous'):
    """
    Generate a structured conversation summary and send it to the agent
    via Brevo transactional email.

    The summary includes:
    - Customer name (if provided)
    - Timestamp
    - Full conversation transcript
    - Key products mentioned
    - Suggested follow-up actions

    Args:
        conversation_history: list of {"role", "content"} message dicts
        user_name: customer name from the onboarding form if available

    Returns:
        bool: True if email sent successfully, False otherwise
    """
    if not BREVO_API_KEY:
        logger.error("BREVO_API_KEY not set — cannot send email")
        return False

    # ── Build the conversation transcript ─────────────────────────────────────
    transcript_lines = []
    products_mentioned = set()

    # Track which products were discussed for the summary
    product_keywords = [
        'current account', 'savings account', 'credit card', 'mortgage',
        'pension', 'payroll', 'direct debit', 'loan', 'funds', 'securities',
        'deposit', 'e-account', 'junior account',
    ]

    for msg in conversation_history:
        role    = 'Customer' if msg['role'] == 'user' else 'Advisor'
        content = msg['content']
        transcript_lines.append(f"<b>{role}:</b> {content}<br/>")

        # Detect product mentions in both user and assistant messages
        content_lower = content.lower()
        for kw in product_keywords:
            if kw in content_lower:
                products_mentioned.add(kw.title())

    transcript_html = '<br/>'.join(transcript_lines)
    products_str    = ', '.join(sorted(products_mentioned)) or 'None detected'
    timestamp       = datetime.now().strftime('%d %B %Y at %H:%M')
    message_count   = len(conversation_history)

    # ── Build HTML email body ─────────────────────────────────────────────────
    html_content = f"""
    <html><body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">

      <div style="background: #d4295c; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 1.4rem;">
          RecSys New Chat Session Summary
        </h1>
        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 0.9rem;">
          A customer just ended a product advice session
        </p>
      </div>

      <div style="background: #f9f9f9; padding: 24px; border: 1px solid #eee;">

        <h2 style="color: #d4295c; font-size: 1rem; margin-top: 0;">
          Session Details
        </h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #666; width: 140px;">Customer</td>
            <td style="padding: 6px 0; font-weight: bold;">{user_name}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #666;">Date &amp; Time</td>
            <td style="padding: 6px 0; font-weight: bold;">{timestamp}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #666;">Messages</td>
            <td style="padding: 6px 0; font-weight: bold;">{message_count}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #666;">Products Discussed</td>
            <td style="padding: 6px 0; font-weight: bold;">{products_str}</td>
          </tr>
        </table>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;"/>

        <h2 style="color: #d4295c; font-size: 1rem;">Conversation Transcript</h2>
        <div style="background: white; border: 1px solid #eee; border-radius: 6px;
                    padding: 16px; line-height: 1.7; font-size: 0.9rem;">
          {transcript_html}
        </div>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;"/>

        <h2 style="color: #d4295c; font-size: 1rem;">Suggested Follow-up</h2>
        <p style="font-size: 0.88rem; color: #555;">
          Based on the products discussed ({products_str}), consider reaching
          out to this customer within 24 hours with a personalised offer or
          more detailed product information.
        </p>

        <div style="background: #fff3f7; border: 1px solid #f0c0d0;
                    border-radius: 6px; padding: 12px; margin-top: 16px;">
          <p style="margin: 0; font-size: 0.82rem; color: #888;">
            This summary was automatically generated by the RecSys chatbot.
            Customer data is anonymised for this demo.
          </p>
        </div>
      </div>

    </body></html>
    """

    # ── Send via Brevo SDK ────────────────────────────────────────────────────
    try:
        configuration         = sib_api_v3_sdk.Configuration()
        configuration.api_key = {'api-key': BREVO_API_KEY}

        api_instance = sib_api_v3_sdk.TransactionalEmailsApi(
            sib_api_v3_sdk.ApiClient(configuration)
        )

        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
            to      = [{'email': AGENT_EMAIL, 'name': 'RecSys Agent'}],
            sender  = {'email': SENDER_EMAIL, 'name': SENDER_NAME},
            subject = f'RecSys — Chat summary: {user_name} ({message_count} messages)',
            html_content = html_content,
        )

        api_instance.send_transac_email(send_smtp_email)
        logger.info(f"Summary email sent to {AGENT_EMAIL}")
        return True

    except ApiException as e:
        logger.error(f"Brevo API error: {e}")
        return False
    except Exception as e:
        logger.error(f"Email send failed: {e}")
        return False


# ── Endpoint 1: Chat message ──────────────────────────────────────────────────
@chat_bp.route('/chat', methods=['POST'])
def chat():
    """
    Receive a user message and conversation history, query Mistral-7B,
    and return the assistant reply.

    Request body:
    {
      "message": "What is a pension plan?",
      "history": [
        {"role": "user",      "content": "..."},
        {"role": "assistant", "content": "..."}
      ],
      "context": "optional — recommended products from the search page"
    }

    Response:
    {
      "status": "success",
      "reply": "A pension plan is...",
      "model_used": "mistralai/Mistral-7B-Instruct-v0.2"
    }
    """
    data        = request.get_json() or {}
    message     = data.get('message', '').strip()
    history     = data.get('history', [])
    context     = data.get('context', '')

    if not message:
        return jsonify({
            'status' : 'error',
            'message': 'No message provided.',
        }), 400

    # Optionally append product context to the message
    # This lets the chatbot know which products were just recommended
    enriched_message = message
    if context:
        enriched_message = f"{message}\n\n[Context: {context}]"

    # Build the formatted prompt from history + new message
    prompt = enriched_message

    # Try primary model first, fall back to Zephyr if it fails
    reply      = call_huggingface(prompt, PRIMARY_MODEL)
    model_used = PRIMARY_MODEL

    if reply is None:
        logger.info("Primary model failed — trying fallback model")
        reply      = call_huggingface(prompt, FALLBACK_MODEL)
        model_used = FALLBACK_MODEL

    # If both models fail, return a helpful static fallback
    # so the UI never shows a broken state
    if reply is None:
        reply = (
            "I'm having a little trouble connecting right now. "
            "Please try again in a moment, or explore our products "
            "directly on the Recommend page."
        )
        model_used = 'fallback'

    return jsonify({
        'status'    : 'success',
        'reply'     : reply,
        'model_used': model_used,
    }), 200


# ── Endpoint 2: End chat + send summary email ─────────────────────────────────
@chat_bp.route('/chat/summary', methods=['POST'])
def chat_summary():
    """
    Called when the user clicks 'End Chat'.
    Sends a structured conversation summary email to the agent.

    Request body:
    {
      "history": [...],
      "user_name": "Fred"   (optional — from onboarding form)
    }

    Response:
    {
      "status": "success",
      "message": "Summary sent to agent."
    }
    """
    data      = request.get_json() or {}
    history   = data.get('history', [])
    user_name = data.get('user_name', 'Anonymous')

    if not history:
        return jsonify({
            'status' : 'error',
            'message': 'No conversation history to summarise.',
        }), 400

    success = send_summary_email(history, user_name)

    if success:
        return jsonify({
            'status' : 'success',
            'message': f'Summary sent to agent at {AGENT_EMAIL}.',
        }), 200
    else:
        return jsonify({
            'status' : 'error',
            'message': 'Could not send summary email. Check server logs.',
        }), 500