import os
from sarvamai import SarvamAI

client = SarvamAI(api_subscription_key=os.environ["SARVAM_API_KEY"])

with open("nlp/samples/hindi_fixed.wav", "rb") as f:
    result = client.speech_to_text.transcribe(
        file=f,
        model="saaras:v2.5",
        language_code="hi-IN"
    )

print(result.transcript)
