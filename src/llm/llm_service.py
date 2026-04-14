from __future__ import annotations

import json
import os

from cerebras.cloud.sdk import Cerebras


CEREBRAS_MODEL = os.getenv("CEREBRAS_MODEL", "qwen-3-235b-a22b-instruct-2507")


def ask_llm(context: dict, question: str) -> str:
    """
    Sends the context and question to a LLM API and returns the answer.
    """
    prompt = json.dumps(
        {
            "instructions": (
                "Answer the question using only the provided database context from VisionGuard. "
                "Prefer concrete facts from segments, alerts, and run metadata. "
                "If the answer is not supported by the logs, say that it is not available in the database context."
            ),
            "context": context,
            "question": question,
        },
        indent=2,
        ensure_ascii=True,
        default=str,
    )

    client = Cerebras()
    chat_completion = client.chat.completions.create(
        model=CEREBRAS_MODEL,
        max_tokens=512,
        messages=[
            {
                "role": "system",
                "content": "You are a helpful assistant for video event analysis. Use the database context exactly as provided.",
            },
            {"role": "user", "content": prompt},
        ],
    )
    return chat_completion.choices[0].message.content.strip()
