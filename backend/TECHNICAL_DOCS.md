# MindNest Technical Documentation

## 1. Technology Stack

### Frontend
*   **Framework:** React Native (Expo)
*   **Language:** JavaScript
*   **Key Libraries:**
    *   `axios`: For API communication.
    *   `react-native-safe-area-context`: For handling notch and safe areas.
    *   `@expo/vector-icons`: For UI icons.

### Backend
*   **Framework:** FastAPI (Python)
*   **Server:** Uvicorn (ASGI Server)
*   **Database:** Supabase (PostgreSQL with `pgvector` extension)
*   **AI/LLM:** Google Gemini (`gemini-2.5-flash`)
*   **Embeddings:** Google Gemini (`text-embedding-004`)

---

## 2. Architecture Overview

MindNest operates as a Retrieval-Augmented Generation (RAG) system designed to provide mental health support.

1.  **User Input:** The user sends a message via the React Native app.
2.  **Language Detection:** The backend detects if the message is in English or Thai.
3.  **Severity Classification:** The LLM classifies the message severity (LOW, MODERATE, HIGH, CRISIS).
4.  **Vectorization:** The user's message is converted into a vector embedding.
5.  **Retrieval (RAG):** The system searches the Supabase database for the most relevant mental health techniques matching the user's embedding.
6.  **Context Assembly:** Relevant techniques and crisis resources (if applicable) are bundled into a context.
7.  **Response Generation:** The LLM generates a supportive response based on the user's message, severity, and retrieved context.
8.  **Structured Output:** The response is returned as JSON containing the text, techniques, crisis resources, and uplifting quotes (for crisis situations).

---

## 3. RAG & Vectorization Deep Dive

### Vectorization (Embeddings)
*   **Model:** `models/text-embedding-004` (Google Gemini)
*   **Process:**
    *   Every mental health technique in the database has a pre-calculated vector embedding representing its semantic meaning.
    *   When a user sends a message, it is passed to the `genai.embed_content` function.
    *   This function returns a high-dimensional vector (list of floats) capturing the "intent" and "feeling" of the user's text.

### Retrieval-Augmented Generation (RAG) Workflow
The core of MindNest's intelligence lies in how it retrieves relevant information *before* generating an answer.

1.  **Query Embedding:**
    *   User: *"I feel so anxious and can't breathe."*
    *   System: Generates vector `[0.12, -0.45, 0.88, ...]`

2.  **Similarity Search (Supabase `pgvector`):**
    *   The system executes a Remote Procedure Call (`rpc`) to Supabase named `match_techniques`.
    *   It compares the user's vector against all stored technique vectors using **Cosine Similarity**.
    *   **Filters:**
        *   `filter_language`: Matches the detected language (English or Thai).
        *   `match_threshold`: Only returns results with a similarity score above `0.35`.
        *   `match_count`: Returns the top 5 most relevant techniques.

3.  **Context Injection:**
    *   The retrieved techniques (e.g., "Box Breathing", "5-4-3-2-1 Grounding") are formatted into a text block.
    *   **Prompt Construction:**
        ```text
        User Message: "I feel so anxious..."
        Detected Severity: MODERATE
        Relevant Techniques Context:
        - Technique: Box Breathing
          Description: ...
          Instructions: ...
        
        System Instruction: You are a supportive companion. Use the context to help...
        ```

4.  **Generation:**
    *   The `gemini-2.5-flash` model receives this enriched prompt.
    *   It generates a response that *specifically* references the retrieved techniques (e.g., "I hear you. Try the Box Breathing technique I found for you...").

---

## 4. Key Backend Components

### `app/services/embeddings.py`
*   **Function:** `generate_embedding(text)`
*   **Purpose:** Calls Google's API to turn text into vectors.

### `app/services/retrieval.py`
*   **Function:** `search_techniques(embedding, language)`
*   **Purpose:** Performs the vector similarity search in Supabase.
*   **Function:** `get_crisis_resources(language)`
*   **Purpose:** Fetches emergency contacts, prioritizing 24/7 services.

### `app/services/llm.py`
*   **Function:** `classify_severity(message)`
*   **Purpose:** Uses a lightweight LLM call to categorize distress level.
*   **Function:** `generate_response(...)`
*   **Purpose:** The main "brain". Orchestrates the final response generation with strict safety guidelines and JSON formatting.
*   **Safety:** Includes fallback logic for Crisis situations if the LLM fails.

### `app/routers/chat.py`
*   **Endpoint:** `POST /chat`
*   **Purpose:** The central controller that ties all the services together (Language -> Severity -> Embedding -> Retrieval -> Generation).
