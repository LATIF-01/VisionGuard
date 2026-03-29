import os
import requests


OLLAMA_ENDPOINT = os.getenv("OLLAMA_ENDPOINT", "http://localhost:11434/v1/chat/completions")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "phi3")


def ask_llm(context: dict, question: str) -> str:
    """
    Sends the context and question to a local Ollama LLM API and returns the answer.
    """
    prompt = f"Context: {context}\n\nQuestion: {question}\n\nAnswer:"
    data = {
        "model": OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": "You are a helpful assistant for video event analysis."},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 512
    }
    response = requests.post(OLLAMA_ENDPOINT, json=data, timeout=60)
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"].strip()
