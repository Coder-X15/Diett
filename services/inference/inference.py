#! /usr/bin/env python3
import base64
from io import BytesIO
import os
import onnxruntime as ort  # for inference
import numpy as np
from PIL import Image
import sys
import asyncio
import requests
import dotenv

from supabase import acreate_client, Client

dotenv.load_dotenv()

inference_model = ort.InferenceSession(
    os.getenv("MODEL_PATH", "./model.onnx")
)
classes = open(os.getenv("CLASSES_PATH", "./classes.txt")).read().strip().split(",")

print("Inference model loaded successfully.", flush=True)

WEBHOOK_URL = os.getenv(
    "WEBHOOK_URL",
    "http://diett-apiserver:8080/webhook/inference_result",
)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")


async def main() -> None:
    client: Client = await acreate_client(SUPABASE_URL, SUPABASE_KEY)
    print("Supabase client created successfully.", flush=True)

    seen_structure = {"printed": False}

    def on_broadcast(message):
        """
        Depending on supabase-py version, `message` may be either:
          - the payload directly
          - or an object containing `event` and `payload`
        We’ll handle both by looking for `payload` keys first.
        """
        nonlocal seen_structure

        # Try to normalize:
        # If message has a 'payload' field, use it; otherwise treat message as payload.
        payload = message.get("payload") if isinstance(message, dict) and "payload" in message else message

        if not seen_structure["printed"]:
            print("✅ Received broadcast (first payload):", flush=True)
            print(payload, flush=True)
            seen_structure["printed"] = True
            print("----- end payload -----", flush=True)

        # ---- Adjust these extraction paths if the printed structure differs ----
        # For realtime.broadcast_changes, a common shape is payload["payload"]["record"]
        record = None

        if isinstance(payload, dict):
            # Common: payload["payload"]["record"]
            record = payload.get("payload", {}).get("record")

            # Alternative guess: payload["record"]
            if record is None:
                record = payload.get("record")

        if not record:
            print("⚠️ Could not find record in broadcast payload, skipping.", flush=True)
            return

        try:
            image_data = record["image_url"]
            user_id = record["user_id"]
            job_id = record["id"]
        except KeyError:
            print("⚠️ Missing expected keys in record. record keys:", list(record.keys()), flush=True)
            return

        print("Received inference request:", {
            "job_id": job_id,
            "user_id": user_id,
            "image": image_data
        })

        # Download image bytes correctly
        try:
            resp = requests.get(image_data, timeout=30)
            resp.raise_for_status()
            image = Image.open(BytesIO(resp.content)).convert("RGB")
        except Exception as e:
            print("❌ Failed to download/open image:", e, flush=True)
            return

        image = image.resize((224, 224))
        image_array = np.array(image).astype(np.float32) / 255.0
        image_array = np.transpose(image_array, (2, 0, 1))
        image_array = np.expand_dims(image_array, axis=0)

        # Run inference
        inputs = {inference_model.get_inputs()[0].name: image_array}
        outputs = inference_model.run(None, inputs)
        predicted_class_index = int(np.argmax(outputs[0]))
        predicted_class_name = classes[predicted_class_index]

        print(f"Predicted class for user {user_id}: {predicted_class_name}", flush=True)
        
        try:
            print(f"Sending webhook to {WEBHOOK_URL}...", flush=True)
            res = requests.post(
                WEBHOOK_URL,
                json={"id": job_id, "identified_food_name": predicted_class_name},
                timeout=10,
            )
            print(f"Webhook response: {res.status_code} {res.text}", flush=True)
        except Exception as e:
            print(f"❌ Failed to send webhook: {e}", flush=True)

    # Subscribe to Broadcast topic (not postgres_changes)
    channel = client.channel(
        "food_identification",
        params={"config": {"private": True}},
    )

    # Listen for INSERT events from broadcast_changes trigger
    await channel.on_broadcast("INSERT", on_broadcast).subscribe()

    while True:
        await asyncio.sleep(1)


if __name__ == "__main__":
    asyncio.run(main())